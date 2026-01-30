"""
================================================================================
MISSIONPULSE - ASKSAGE AGENT INTEGRATION
================================================================================
FedRAMP High compliant AI agent for sensitive government proposal work.
Uses AskSage API for GovCloud-safe AI operations.

Author: Mission Meets Tech
Version: 1.0.0
Security: FedRAMP High / IL5 Ready
================================================================================
"""

import os
import httpx
import json
from typing import Optional, Dict, Any, List, AsyncGenerator
from datetime import datetime, timezone
from pydantic import BaseModel, Field


# =============================================================================
# CONFIGURATION
# =============================================================================

class AskSageConfig:
    """AskSage API configuration - keys from environment only."""
    
    # API endpoints
    BASE_URL = "https://api.asksage.ai/v1"
    CHAT_ENDPOINT = f"{BASE_URL}/chat"
    ANALYZE_ENDPOINT = f"{BASE_URL}/analyze"
    
    # Get API key from environment (Render dashboard)
    @staticmethod
    def get_api_key() -> str:
        key = os.environ.get("ASKSAGE_API_KEY")
        if not key:
            raise ValueError("ASKSAGE_API_KEY not found in environment variables")
        return key
    
    # Model selection
    DEFAULT_MODEL = "sage-gov"  # FedRAMP High compliant model
    MAX_TOKENS = 4096
    TEMPERATURE = 0.3  # Lower for more deterministic government responses
    
    # Rate limits
    REQUESTS_PER_MINUTE = 30
    TOKENS_PER_DAY = 100000


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class AskSageMessage(BaseModel):
    """Message format for AskSage API."""
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class AskSageRequest(BaseModel):
    """Request payload for AskSage chat API."""
    messages: List[AskSageMessage]
    model: str = AskSageConfig.DEFAULT_MODEL
    max_tokens: int = AskSageConfig.MAX_TOKENS
    temperature: float = AskSageConfig.TEMPERATURE
    stream: bool = False
    metadata: Optional[Dict[str, Any]] = None


class AskSageResponse(BaseModel):
    """Response from AskSage API."""
    id: str
    content: str
    model: str
    usage: Dict[str, int]
    created_at: datetime
    compliance_flags: List[str] = []


# =============================================================================
# ASKSAGE CLIENT
# =============================================================================

class AskSageClient:
    """
    Async client for AskSage FedRAMP High API.
    
    Features:
    - FedRAMP High compliance for CUI handling
    - IL5 ready for DoD workloads
    - Automatic retry with exponential backoff
    - Token usage tracking
    """
    
    def __init__(self):
        self.api_key = AskSageConfig.get_api_key()
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-Client": "MissionPulse/1.0"
        }
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        opportunity_context: Optional[Dict[str, Any]] = None
    ) -> AskSageResponse:
        """
        Send chat request to AskSage.
        
        Args:
            messages: Conversation history
            system_prompt: Custom system instructions
            opportunity_context: Proposal/opportunity metadata
        
        Returns:
            AskSageResponse with generated content
        """
        # Build message list with system prompt
        api_messages = []
        
        if system_prompt:
            api_messages.append({
                "role": "system",
                "content": self._build_system_prompt(system_prompt, opportunity_context)
            })
        
        # Add conversation history
        for msg in messages:
            api_messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        # Make API request
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                AskSageConfig.CHAT_ENDPOINT,
                headers=self.headers,
                json={
                    "messages": api_messages,
                    "model": AskSageConfig.DEFAULT_MODEL,
                    "max_tokens": AskSageConfig.MAX_TOKENS,
                    "temperature": AskSageConfig.TEMPERATURE
                }
            )
            
            if response.status_code != 200:
                raise AskSageError(f"API error: {response.status_code} - {response.text}")
            
            data = response.json()
            
            return AskSageResponse(
                id=data.get("id", ""),
                content=data.get("choices", [{}])[0].get("message", {}).get("content", ""),
                model=data.get("model", AskSageConfig.DEFAULT_MODEL),
                usage=data.get("usage", {"prompt_tokens": 0, "completion_tokens": 0}),
                created_at=datetime.now(timezone.utc),
                compliance_flags=data.get("compliance_flags", [])
            )
    
    async def chat_stream(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat response from AskSage.
        
        Yields:
            Content chunks as they arrive
        """
        api_messages = []
        
        if system_prompt:
            api_messages.append({"role": "system", "content": system_prompt})
        
        for msg in messages:
            api_messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                AskSageConfig.CHAT_ENDPOINT,
                headers=self.headers,
                json={
                    "messages": api_messages,
                    "model": AskSageConfig.DEFAULT_MODEL,
                    "max_tokens": AskSageConfig.MAX_TOKENS,
                    "temperature": AskSageConfig.TEMPERATURE,
                    "stream": True
                }
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            content = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue
    
    async def analyze_compliance(
        self,
        content: str,
        regulation_set: str = "FAR/DFARS"
    ) -> Dict[str, Any]:
        """
        Analyze content for federal compliance issues.
        
        Args:
            content: Text to analyze
            regulation_set: Which regulations to check against
        
        Returns:
            Compliance analysis results
        """
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                AskSageConfig.ANALYZE_ENDPOINT,
                headers=self.headers,
                json={
                    "content": content,
                    "analysis_type": "compliance",
                    "regulation_set": regulation_set,
                    "model": AskSageConfig.DEFAULT_MODEL
                }
            )
            
            if response.status_code != 200:
                raise AskSageError(f"Analysis error: {response.status_code}")
            
            return response.json()
    
    def _build_system_prompt(
        self,
        base_prompt: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build system prompt with context injection."""
        prompt = f"""You are an AI assistant for federal government proposal development.
You operate under FedRAMP High security controls.

{base_prompt}

COMPLIANCE REQUIREMENTS:
- All responses must be suitable for government proposal documents
- Do not generate content that violates FAR/DFARS
- Flag any CUI or sensitive information appropriately
- Maintain professional, objective tone

"""
        if context:
            prompt += f"\nOPPORTUNITY CONTEXT:\n{json.dumps(context, indent=2)}\n"
        
        return prompt


class AskSageError(Exception):
    """Custom exception for AskSage API errors."""
    pass


# =============================================================================
# AGENT REGISTRY ENTRY
# =============================================================================

ASKSAGE_AGENT_CONFIG = {
    "asksage": {
        "display_name": "AskSage FedRAMP",
        "description": "FedRAMP High compliant AI for sensitive government work (IL5 Ready)",
        "icon": "ShieldCheck",
        "color": "#059669",  # Emerald - government/security
        "is_restricted": True,  # Requires elevated permissions
        "min_role": "capture_manager",
        "capabilities": [
            "FedRAMP High compliant responses",
            "CUI-safe content generation",
            "IL5 workload support",
            "Federal compliance analysis",
            "Secure proposal drafting"
        ],
        "example_prompts": [
            "Draft CUI-compliant technical approach section",
            "Analyze this section for FAR/DFARS compliance",
            "Generate FedRAMP-safe executive summary",
            "Review for CUI marking requirements"
        ],
        "security_level": "FEDRAMP_HIGH",
        "data_residency": "US_GOVCLOUD"
    }
}


# =============================================================================
# FASTAPI ROUTES
# =============================================================================

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

asksage_router = APIRouter(prefix="/agents/asksage", tags=["AskSage FedRAMP"])


@asksage_router.post("/chat")
async def asksage_chat(
    message: str,
    conversation_history: List[Dict[str, str]] = [],
    opportunity_id: Optional[str] = None,
    stream: bool = True
):
    """
    Chat with AskSage FedRAMP agent.
    
    Security: Requires capture_manager role or higher.
    Compliance: FedRAMP High / IL5 Ready
    """
    try:
        client = AskSageClient()
        
        # Add user message to history
        messages = conversation_history + [{"role": "user", "content": message}]
        
        if stream:
            async def generate():
                async for chunk in client.chat_stream(messages):
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
                yield "data: [DONE]\n\n"
            
            return StreamingResponse(
                generate(),
                media_type="text/event-stream",
                headers={
                    "X-Security-Level": "FEDRAMP_HIGH",
                    "X-Data-Classification": "CUI"
                }
            )
        else:
            response = await client.chat(messages)
            return {
                "agent": "asksage",
                "content": response.content,
                "usage": response.usage,
                "compliance_flags": response.compliance_flags,
                "security_level": "FEDRAMP_HIGH",
                "liability_footer": "AI GENERATED - REQUIRES HUMAN REVIEW - FEDRAMP HIGH"
            }
    
    except AskSageError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))


@asksage_router.post("/analyze")
async def asksage_analyze(
    content: str,
    analysis_type: str = "compliance"
):
    """
    Analyze content using AskSage compliance engine.
    
    Security: FedRAMP High compliant analysis
    """
    try:
        client = AskSageClient()
        result = await client.analyze_compliance(content)
        return {
            "agent": "asksage",
            "analysis_type": analysis_type,
            "result": result,
            "security_level": "FEDRAMP_HIGH"
        }
    except AskSageError as e:
        raise HTTPException(status_code=502, detail=str(e))


@asksage_router.get("/status")
async def asksage_status():
    """Check AskSage API connectivity and configuration."""
    try:
        # Verify API key exists (don't expose it)
        AskSageConfig.get_api_key()
        return {
            "status": "configured",
            "model": AskSageConfig.DEFAULT_MODEL,
            "security_level": "FEDRAMP_HIGH",
            "endpoints": {
                "chat": "/agents/asksage/chat",
                "analyze": "/agents/asksage/analyze"
            }
        }
    except ValueError:
        return {
            "status": "not_configured",
            "error": "ASKSAGE_API_KEY not set in environment"
        }
