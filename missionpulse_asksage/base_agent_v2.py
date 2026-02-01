"""
================================================================================
BASE AGENT - AskSage Integration (v2.0)
================================================================================
Abstract foundation for all MissionPulse AI agents using AskSage FedRAMP
infrastructure with intelligent model routing for cost optimization.

MIGRATION NOTES (from v1.0):
- Replaced: anthropic.Anthropic → asksage_client.AskSageClient
- Added: QueryClassifier for intelligent model routing
- Added: CUI detection and automatic model upgrade
- Retained: All RBAC, confidence scoring, and playbook features

Author: Mission Meets Tech
Version: 2.0.0
Security: NIST 800-53 Rev 5 CHECKED
Encryption: FIPS 140-2 COMPLIANT (via AskSage infrastructure)
================================================================================
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import (
    AsyncGenerator,
    Optional,
    List,
    Dict,
    Any,
    Callable,
    TypeVar,
    Generic
)
import asyncio
import json
import logging
import uuid
import time

# AskSage integration (replaces Anthropic SDK)
from .asksage_client import (
    AskSageClient,
    AskSageResponse,
    AskSageConfig,
    get_asksage_client
)
from .query_classifier import (
    QueryClassifier,
    ClassificationResult,
    get_classifier
)
from .model_config import (
    MODEL_REGISTRY,
    ModelTier,
    get_model
)

logger = logging.getLogger(__name__)


class ConfidenceLevel(str, Enum):
    """Confidence scoring thresholds per MissionPulse spec."""
    HIGH = "high"      # ≥85% - Green
    MEDIUM = "medium"  # 70-84% - Amber
    LOW = "low"        # <70% - Red


class AgentType(str, Enum):
    """Registry of all available agent types."""
    CAPTURE = "capture"
    STRATEGY = "strategy"
    COMPLIANCE = "compliance"
    WRITER = "writer"
    PRICING = "pricing"
    BLACKHAT = "blackhat"
    CONTRACTS = "contracts"
    ORALS = "orals"


@dataclass
class AgentConfig:
    """Configuration for agent initialization."""
    agent_type: AgentType
    
    # Model settings (used as defaults, classifier may override)
    default_model: str = "gpt-4o"
    max_tokens: int = 4096
    temperature: float = 0.7
    
    # Smart routing settings
    enable_smart_routing: bool = True
    force_cui_models: bool = False
    
    # RBAC settings
    allowed_roles: List[str] = field(default_factory=lambda: ["executive"])
    is_restricted: bool = False  # True for blackhat, pricing
    
    # Playbook settings
    enable_playbook: bool = True
    max_playbook_examples: int = 3
    
    # Cost tracking
    track_tokens: bool = True
    
    # Output settings
    include_citations: bool = True
    include_confidence: bool = True
    include_routing_metadata: bool = False  # Show which model was used
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_type": self.agent_type.value,
            "default_model": self.default_model,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "enable_smart_routing": self.enable_smart_routing,
            "force_cui_models": self.force_cui_models,
            "allowed_roles": self.allowed_roles,
            "is_restricted": self.is_restricted,
            "enable_playbook": self.enable_playbook,
            "max_playbook_examples": self.max_playbook_examples,
            "track_tokens": self.track_tokens,
            "include_citations": self.include_citations,
            "include_confidence": self.include_confidence
        }


@dataclass
class Citation:
    """Evidence citation with source tracking."""
    source: str
    text: str
    relevance: float
    page_or_section: Optional[str] = None
    url: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "source": self.source,
            "text": self.text,
            "relevance": self.relevance,
            "page_or_section": self.page_or_section,
            "url": self.url
        }


@dataclass
class AgentResponse:
    """Structured response from any AI agent."""
    id: str
    agent_type: AgentType
    content: str
    
    # Confidence scoring
    confidence_score: float
    confidence_level: ConfidenceLevel
    confidence_factors: List[str] = field(default_factory=list)
    
    # Token usage & cost
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    estimated_cost: float = 0.0
    
    # Model routing info
    model_used: str = ""
    model_tier: str = ""
    routing_reason: str = ""
    cui_detected: bool = False
    
    # Citations
    citations: List[Citation] = field(default_factory=list)
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    processing_time_ms: int = 0
    
    # Playbook context
    playbook_examples_used: List[str] = field(default_factory=list)
    
    # Required disclaimer
    disclaimer: str = "AI GENERATED - REQUIRES HUMAN REVIEW"
    
    @classmethod
    def calculate_confidence_level(cls, score: float) -> ConfidenceLevel:
        """Determine confidence level from score."""
        if score >= 0.85:
            return ConfidenceLevel.HIGH
        elif score >= 0.70:
            return ConfidenceLevel.MEDIUM
        else:
            return ConfidenceLevel.LOW
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "agent_type": self.agent_type.value,
            "content": self.content,
            "confidence_score": self.confidence_score,
            "confidence_level": self.confidence_level.value,
            "confidence_factors": self.confidence_factors,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "total_tokens": self.total_tokens,
            "estimated_cost": self.estimated_cost,
            "model_used": self.model_used,
            "model_tier": self.model_tier,
            "routing_reason": self.routing_reason,
            "cui_detected": self.cui_detected,
            "citations": [c.to_dict() for c in self.citations],
            "created_at": self.created_at.isoformat(),
            "processing_time_ms": self.processing_time_ms,
            "playbook_examples_used": self.playbook_examples_used,
            "disclaimer": self.disclaimer
        }
    
    def format_for_display(self, show_routing: bool = False) -> str:
        """Format response with confidence indicator and disclaimer."""
        # Confidence badge
        if self.confidence_level == ConfidenceLevel.HIGH:
            badge = "🟢 High Confidence"
        elif self.confidence_level == ConfidenceLevel.MEDIUM:
            badge = "🟡 Medium Confidence"
        else:
            badge = "🔴 Low Confidence"
        
        # Build output
        output = f"{self.content}\n\n---\n\n"
        output += f"**{badge}** ({self.confidence_score:.0%})\n\n"
        
        # Routing info (optional, for debugging/transparency)
        if show_routing:
            output += f"*Model: {self.model_used} ({self.model_tier}) | "
            output += f"Cost: ${self.estimated_cost:.4f}*\n\n"
        
        # Add citations if present
        if self.citations:
            output += "**Sources:**\n"
            for i, cite in enumerate(self.citations, 1):
                output += f"{i}. {cite.source}"
                if cite.page_or_section:
                    output += f" ({cite.page_or_section})"
                output += "\n"
            output += "\n"
        
        # Always end with disclaimer
        output += f"*{self.disclaimer}*"
        
        return output


class BaseAgent(ABC):
    """
    Abstract base class for all MissionPulse AI agents.
    
    v2.0 Features:
    - AskSage API integration (FedRAMP High / IL5 ready)
    - Intelligent model routing for cost optimization
    - CUI detection and automatic model upgrade
    - Streaming response support
    - RBAC enforcement
    - Confidence scoring
    - Token cost tracking
    - Playbook injection
    - Mandatory human review disclaimers
    """
    
    # Class-level constants
    DISCLAIMER = "AI GENERATED - REQUIRES HUMAN REVIEW"
    
    def __init__(
        self,
        config: AgentConfig,
        asksage_client: Optional[AskSageClient] = None,
        playbook_engine: Optional[Any] = None,
        token_tracker: Optional[Any] = None
    ):
        """
        Initialize the base agent.
        
        Args:
            config: Agent configuration
            asksage_client: AskSage client (creates from env if not provided)
            playbook_engine: Optional PlaybookEngine instance
            token_tracker: Optional TokenTracker instance
        """
        self.config = config
        self.playbook_engine = playbook_engine
        self.token_tracker = token_tracker
        
        # Initialize AskSage client
        self.client = asksage_client or get_asksage_client()
        
        # Initialize classifier for smart routing
        self.classifier = get_classifier(force_cui_models=config.force_cui_models)
        
        logger.info(f"Agent {config.agent_type.value} initialized with smart routing")
    
    @property
    def agent_name(self) -> str:
        """Human-readable agent name."""
        names = {
            AgentType.CAPTURE: "Capture Intelligence",
            AgentType.STRATEGY: "Strategy Advisor",
            AgentType.COMPLIANCE: "Compliance Guardian",
            AgentType.WRITER: "Proposal Writer",
            AgentType.PRICING: "Pricing Analyst",
            AgentType.BLACKHAT: "Competitive Intel",
            AgentType.CONTRACTS: "Contracts Advisor",
            AgentType.ORALS: "Orals Coach"
        }
        return names.get(self.config.agent_type, "AI Agent")
    
    @abstractmethod
    def get_system_prompt(self) -> str:
        """
        Return the system prompt for this agent.
        Must be implemented by each specialized agent.
        """
        pass
    
    @abstractmethod
    def calculate_confidence(
        self,
        response_text: str,
        context: Optional[Dict[str, Any]] = None
    ) -> tuple[float, List[str]]:
        """
        Calculate confidence score and factors for response.
        Must be implemented by each specialized agent.
        
        Returns:
            Tuple of (confidence_score, list_of_factors)
        """
        pass
    
    def check_access(self, user_role: str) -> bool:
        """Check if user role has access to this agent."""
        # Role hierarchy
        role_levels = {
            "admin": 100,
            "executive": 90,
            "ceo": 90,
            "coo": 85,
            "capture_manager": 70,
            "cap": 70,
            "proposal_manager": 60,
            "pm": 60,
            "author": 40,
            "sa": 40,
            "fin": 40,
            "con": 40,
            "del": 40,
            "qa": 40,
            "reviewer": 30,
            "consultant": 20,
            "partner": 10,
            "viewer": 5
        }
        
        user_level = role_levels.get(user_role.lower(), 0)
        
        # Check against allowed roles
        min_required = min(
            role_levels.get(role.lower(), 100) 
            for role in self.config.allowed_roles
        )
        
        return user_level >= min_required
    
    def _build_full_prompt(
        self,
        user_message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> tuple[str, List[str]]:
        """
        Build complete system prompt with playbook injection.
        
        Returns:
            Tuple of (full_system_prompt, playbook_example_ids_used)
        """
        base_prompt = self.get_system_prompt()
        playbook_ids = []
        
        # Inject playbook examples if enabled
        if self.config.enable_playbook and self.playbook_engine:
            examples = self.playbook_engine.get_relevant_examples(
                agent_type=self.config.agent_type.value,
                query=user_message,
                max_examples=self.config.max_playbook_examples
            )
            
            if examples:
                playbook_ids = [ex.get("id", "") for ex in examples]
                examples_text = "\n\n## GOLDEN EXAMPLES (Follow these patterns):\n\n"
                for i, ex in enumerate(examples, 1):
                    examples_text += f"### Example {i}:\n"
                    examples_text += f"**Scenario:** {ex.get('scenario', 'N/A')}\n"
                    examples_text += f"**Response:** {ex.get('response', 'N/A')}\n\n"
                
                base_prompt = base_prompt + examples_text
        
        return base_prompt, playbook_ids
    
    def _extract_citations(
        self,
        response_text: str,
        asksage_sources: List[Dict[str, Any]],
        context: Optional[Dict[str, Any]] = None
    ) -> List[Citation]:
        """
        Extract citations from response and AskSage sources.
        """
        citations = []
        
        # Add sources from AskSage RAG if present
        for source in asksage_sources:
            citations.append(Citation(
                source=source.get("title", source.get("source", "Unknown")),
                text=source.get("snippet", source.get("content", ""))[:200],
                relevance=source.get("score", 0.5),
                url=source.get("url")
            ))
        
        return citations
    
    async def ainvoke(
        self,
        user_message: str,
        context: Optional[Dict[str, Any]] = None,
        user_role: str = "executive",
        force_model: Optional[str] = None
    ) -> AgentResponse:
        """
        Asynchronous invocation with smart model routing.
        
        Args:
            user_message: The user's query
            context: Optional context data
            user_role: User's role for RBAC check
            force_model: Override smart routing with specific model
            
        Returns:
            AgentResponse with content and metadata
        """
        start_time = time.time()
        
        # RBAC check
        if not self.check_access(user_role):
            raise PermissionError(
                f"Role '{user_role}' does not have access to {self.agent_name}"
            )
        
        # Build prompt with playbook injection
        system_prompt, playbook_ids = self._build_full_prompt(user_message, context)
        
        # Call AskSage API with smart routing
        asksage_response: AskSageResponse = await self.client.query(
            message=user_message,
            agent_type=self.config.agent_type.value,
            model=force_model,  # None = use smart routing
            system_prompt=system_prompt,
            context=context,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens
        )
        
        # Extract response content
        response_text = asksage_response.content
        
        # Track tokens if enabled
        if self.config.track_tokens and self.token_tracker:
            await asyncio.to_thread(
                self.token_tracker.track,
                agent_type=self.config.agent_type.value,
                input_tokens=asksage_response.input_tokens,
                output_tokens=asksage_response.output_tokens,
                model=asksage_response.model,
                cost=asksage_response.estimated_cost,
                user_id=context.get("user_id") if context else None
            )
        
        # Calculate confidence
        confidence_score, confidence_factors = self.calculate_confidence(
            response_text, context
        )
        confidence_level = AgentResponse.calculate_confidence_level(confidence_score)
        
        # Extract citations
        citations = self._extract_citations(
            response_text, 
            asksage_response.sources,
            context
        )
        
        # Build response
        processing_time = int((time.time() - start_time) * 1000)
        
        # Get routing metadata
        classification = asksage_response.classification
        
        return AgentResponse(
            id=str(uuid.uuid4()),
            agent_type=self.config.agent_type,
            content=response_text,
            confidence_score=confidence_score,
            confidence_level=confidence_level,
            confidence_factors=confidence_factors,
            input_tokens=asksage_response.input_tokens,
            output_tokens=asksage_response.output_tokens,
            total_tokens=asksage_response.total_tokens,
            estimated_cost=asksage_response.estimated_cost,
            model_used=asksage_response.model,
            model_tier=classification.model_tier.value if classification else "unknown",
            routing_reason=classification.routing_reason if classification else "",
            cui_detected=classification.cui_detected if classification else False,
            citations=citations,
            processing_time_ms=processing_time,
            playbook_examples_used=playbook_ids
        )
    
    def invoke(
        self,
        user_message: str,
        context: Optional[Dict[str, Any]] = None,
        user_role: str = "executive",
        force_model: Optional[str] = None
    ) -> AgentResponse:
        """
        Synchronous invocation (wrapper around async).
        """
        return asyncio.run(
            self.ainvoke(user_message, context, user_role, force_model)
        )
    
    async def stream(
        self,
        user_message: str,
        context: Optional[Dict[str, Any]] = None,
        user_role: str = "executive",
        force_model: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream response chunks for real-time display.
        
        Args:
            user_message: The user's query
            context: Optional context data
            user_role: User's role for RBAC check
            force_model: Override smart routing with specific model
            
        Yields:
            Response text chunks as they arrive
        """
        # RBAC check
        if not self.check_access(user_role):
            raise PermissionError(
                f"Role '{user_role}' does not have access to {self.agent_name}"
            )
        
        # Build prompt with playbook injection
        system_prompt, _ = self._build_full_prompt(user_message, context)
        
        # Stream from AskSage API
        async for chunk in self.client.stream(
            message=user_message,
            agent_type=self.config.agent_type.value,
            model=force_model,
            system_prompt=system_prompt,
            context=context,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens
        ):
            yield chunk
        
        # After stream completes, yield disclaimer
        yield f"\n\n---\n*{self.DISCLAIMER}*"
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(type={self.config.agent_type.value}, routing=smart)>"
