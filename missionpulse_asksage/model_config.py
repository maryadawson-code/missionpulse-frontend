"""
================================================================================
MISSIONPULSE - MODEL CONFIGURATION & PRICING
================================================================================
Defines available models, capabilities, pricing tiers, and routing rules
for intelligent query routing to optimize cost and quality.

Author: Mission Meets Tech
Version: 1.0.0
Security: NIST 800-53 Rev 5 CHECKED
Encryption: FIPS 140-2 COMPLIANT (TLS 1.3 enforced)
================================================================================
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Any


class ModelTier(str, Enum):
    """Model tier classifications by capability and cost."""
    ECONOMY = "economy"      # Simple Q&A, lookups
    STANDARD = "standard"    # General analysis
    ADVANCED = "advanced"    # Complex reasoning
    CRITICAL = "critical"    # High-stakes decisions, CUI


class ModelCapability(str, Enum):
    """Capability flags for model selection."""
    FAST_RESPONSE = "fast_response"
    LONG_CONTEXT = "long_context"
    COMPLEX_REASONING = "complex_reasoning"
    CODE_GENERATION = "code_generation"
    DOCUMENT_ANALYSIS = "document_analysis"
    CUI_AUTHORIZED = "cui_authorized"
    MULTILINGUAL = "multilingual"


@dataclass
class ModelDefinition:
    """Complete model specification for AskSage routing."""
    id: str                          # AskSage model identifier
    display_name: str                # Human-readable name
    tier: ModelTier                  # Cost/capability tier
    provider: str                    # OpenAI, Anthropic, etc.
    
    # Pricing (per 1K tokens)
    input_cost_per_1k: float
    output_cost_per_1k: float
    
    # Capabilities
    capabilities: List[ModelCapability] = field(default_factory=list)
    max_context_tokens: int = 128000
    max_output_tokens: int = 4096
    
    # Routing hints
    best_for: List[str] = field(default_factory=list)
    avoid_for: List[str] = field(default_factory=list)
    
    # FedRAMP compliance
    cui_authorized: bool = False
    fedramp_environment: str = "commercial"  # commercial, high, dod
    
    def estimated_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Calculate estimated cost for a query."""
        input_cost = (input_tokens / 1000) * self.input_cost_per_1k
        output_cost = (output_tokens / 1000) * self.output_cost_per_1k
        return round(input_cost + output_cost, 6)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "display_name": self.display_name,
            "tier": self.tier.value,
            "provider": self.provider,
            "input_cost_per_1k": self.input_cost_per_1k,
            "output_cost_per_1k": self.output_cost_per_1k,
            "capabilities": [c.value for c in self.capabilities],
            "max_context_tokens": self.max_context_tokens,
            "max_output_tokens": self.max_output_tokens,
            "cui_authorized": self.cui_authorized,
            "fedramp_environment": self.fedramp_environment
        }


# =============================================================================
# MODEL REGISTRY
# =============================================================================

MODEL_REGISTRY: Dict[str, ModelDefinition] = {
    # -------------------------------------------------------------------------
    # ECONOMY TIER - Simple queries, high volume, low cost
    # -------------------------------------------------------------------------
    "gpt-4o-mini": ModelDefinition(
        id="gpt-4o-mini",
        display_name="GPT-4o Mini",
        tier=ModelTier.ECONOMY,
        provider="OpenAI",
        input_cost_per_1k=0.00015,
        output_cost_per_1k=0.0006,
        capabilities=[
            ModelCapability.FAST_RESPONSE,
            ModelCapability.CODE_GENERATION
        ],
        max_context_tokens=128000,
        max_output_tokens=16384,
        best_for=[
            "simple_qa",
            "clarification",
            "formatting",
            "summarization_short"
        ],
        avoid_for=[
            "complex_analysis",
            "cui_content",
            "legal_review",
            "pricing_decisions"
        ],
        cui_authorized=False,
        fedramp_environment="commercial"
    ),
    
    # -------------------------------------------------------------------------
    # STANDARD TIER - General analysis, good balance
    # -------------------------------------------------------------------------
    "gpt-4o": ModelDefinition(
        id="gpt-4o",
        display_name="GPT-4o",
        tier=ModelTier.STANDARD,
        provider="OpenAI",
        input_cost_per_1k=0.0025,
        output_cost_per_1k=0.01,
        capabilities=[
            ModelCapability.FAST_RESPONSE,
            ModelCapability.LONG_CONTEXT,
            ModelCapability.CODE_GENERATION,
            ModelCapability.DOCUMENT_ANALYSIS,
            ModelCapability.MULTILINGUAL
        ],
        max_context_tokens=128000,
        max_output_tokens=16384,
        best_for=[
            "general_analysis",
            "document_review",
            "writing_drafts",
            "technical_explanation"
        ],
        avoid_for=[
            "cui_content",
            "go_nogo_decisions",
            "contract_review"
        ],
        cui_authorized=False,
        fedramp_environment="commercial"
    ),
    
    "gpt-4o-gov": ModelDefinition(
        id="gpt-4o",  # Same model ID, different environment
        display_name="GPT-4o (FedRAMP High)",
        tier=ModelTier.STANDARD,
        provider="Azure OpenAI",
        input_cost_per_1k=0.003,
        output_cost_per_1k=0.012,
        capabilities=[
            ModelCapability.FAST_RESPONSE,
            ModelCapability.LONG_CONTEXT,
            ModelCapability.CODE_GENERATION,
            ModelCapability.DOCUMENT_ANALYSIS,
            ModelCapability.CUI_AUTHORIZED
        ],
        max_context_tokens=128000,
        max_output_tokens=16384,
        best_for=[
            "cui_document_review",
            "proposal_writing",
            "compliance_checks"
        ],
        avoid_for=[
            "go_nogo_decisions",
            "pricing_final"
        ],
        cui_authorized=True,
        fedramp_environment="high"
    ),
    
    # -------------------------------------------------------------------------
    # ADVANCED TIER - Complex reasoning, nuanced analysis
    # -------------------------------------------------------------------------
    "claude-3-5-sonnet": ModelDefinition(
        id="claude-3-5-sonnet-20241022",
        display_name="Claude 3.5 Sonnet",
        tier=ModelTier.ADVANCED,
        provider="Anthropic",
        input_cost_per_1k=0.003,
        output_cost_per_1k=0.015,
        capabilities=[
            ModelCapability.COMPLEX_REASONING,
            ModelCapability.LONG_CONTEXT,
            ModelCapability.CODE_GENERATION,
            ModelCapability.DOCUMENT_ANALYSIS
        ],
        max_context_tokens=200000,
        max_output_tokens=8192,
        best_for=[
            "complex_analysis",
            "multi_document_synthesis",
            "strategy_development",
            "competitive_analysis",
            "win_theme_generation"
        ],
        avoid_for=[
            "simple_qa",
            "high_volume_batch"
        ],
        cui_authorized=False,
        fedramp_environment="commercial"
    ),
    
    "claude-sonnet-4": ModelDefinition(
        id="claude-sonnet-4-20250514",
        display_name="Claude Sonnet 4",
        tier=ModelTier.ADVANCED,
        provider="Anthropic",
        input_cost_per_1k=0.003,
        output_cost_per_1k=0.015,
        capabilities=[
            ModelCapability.COMPLEX_REASONING,
            ModelCapability.LONG_CONTEXT,
            ModelCapability.CODE_GENERATION,
            ModelCapability.DOCUMENT_ANALYSIS,
            ModelCapability.CUI_AUTHORIZED
        ],
        max_context_tokens=200000,
        max_output_tokens=16000,
        best_for=[
            "pwin_calculation",
            "compliance_analysis",
            "blackhat_analysis",
            "orals_preparation"
        ],
        avoid_for=[
            "simple_qa"
        ],
        cui_authorized=True,
        fedramp_environment="high"
    ),
    
    # -------------------------------------------------------------------------
    # CRITICAL TIER - High-stakes decisions, maximum accuracy
    # -------------------------------------------------------------------------
    "claude-3-opus": ModelDefinition(
        id="claude-3-opus-20240229",
        display_name="Claude 3 Opus",
        tier=ModelTier.CRITICAL,
        provider="Anthropic",
        input_cost_per_1k=0.015,
        output_cost_per_1k=0.075,
        capabilities=[
            ModelCapability.COMPLEX_REASONING,
            ModelCapability.LONG_CONTEXT,
            ModelCapability.DOCUMENT_ANALYSIS,
            ModelCapability.CUI_AUTHORIZED
        ],
        max_context_tokens=200000,
        max_output_tokens=4096,
        best_for=[
            "go_nogo_decisions",
            "contract_risk_analysis",
            "pricing_strategy",
            "legal_review",
            "final_compliance_check"
        ],
        avoid_for=[
            "drafts",
            "iteration",
            "high_volume"
        ],
        cui_authorized=True,
        fedramp_environment="high"
    ),
    
    "o1": ModelDefinition(
        id="o1",
        display_name="OpenAI o1 (Reasoning)",
        tier=ModelTier.CRITICAL,
        provider="OpenAI",
        input_cost_per_1k=0.015,
        output_cost_per_1k=0.06,
        capabilities=[
            ModelCapability.COMPLEX_REASONING,
            ModelCapability.CODE_GENERATION
        ],
        max_context_tokens=200000,
        max_output_tokens=100000,
        best_for=[
            "mathematical_analysis",
            "pricing_calculations",
            "complex_tradeoffs",
            "multi_step_reasoning"
        ],
        avoid_for=[
            "creative_writing",
            "simple_qa",
            "real_time_chat"
        ],
        cui_authorized=False,
        fedramp_environment="commercial"
    )
}


# =============================================================================
# AGENT-TO-MODEL MAPPING (Defaults)
# =============================================================================

AGENT_MODEL_DEFAULTS: Dict[str, Dict[str, str]] = {
    "capture": {
        "default": "gpt-4o",
        "complex": "claude-sonnet-4",
        "critical": "claude-3-opus"
    },
    "strategy": {
        "default": "claude-sonnet-4",
        "complex": "claude-sonnet-4",
        "critical": "claude-3-opus"
    },
    "compliance": {
        "default": "claude-sonnet-4",
        "complex": "claude-sonnet-4",
        "critical": "claude-3-opus"
    },
    "writer": {
        "default": "gpt-4o",
        "complex": "claude-sonnet-4",
        "critical": "claude-sonnet-4"
    },
    "pricing": {
        "default": "claude-sonnet-4",
        "complex": "claude-3-opus",
        "critical": "claude-3-opus"
    },
    "blackhat": {
        "default": "claude-sonnet-4",
        "complex": "claude-sonnet-4",
        "critical": "claude-3-opus"
    },
    "contracts": {
        "default": "claude-sonnet-4",
        "complex": "claude-3-opus",
        "critical": "claude-3-opus"
    },
    "orals": {
        "default": "gpt-4o",
        "complex": "claude-sonnet-4",
        "critical": "claude-sonnet-4"
    }
}


# =============================================================================
# CUI-SENSITIVE KEYWORDS (Trigger upgrade to CUI-authorized model)
# =============================================================================

CUI_TRIGGER_KEYWORDS: List[str] = [
    "cui",
    "controlled unclassified",
    "fouo",
    "for official use only",
    "sensitive but unclassified",
    "sbu",
    "law enforcement sensitive",
    "les",
    "privacy act",
    "pii",
    "phi",
    "hipaa",
    "itar",
    "ear",
    "export controlled",
    "dfars 252.204-7012",
    "nist 800-171",
    "cmmc",
    "secret",
    "classified",
    "clearance"
]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_model(model_id: str) -> Optional[ModelDefinition]:
    """Retrieve model definition by ID."""
    return MODEL_REGISTRY.get(model_id)


def get_models_by_tier(tier: ModelTier) -> List[ModelDefinition]:
    """Get all models in a specific tier."""
    return [m for m in MODEL_REGISTRY.values() if m.tier == tier]


def get_cui_authorized_models() -> List[ModelDefinition]:
    """Get all CUI-authorized models."""
    return [m for m in MODEL_REGISTRY.values() if m.cui_authorized]


def get_cheapest_capable_model(
    capabilities: List[ModelCapability],
    cui_required: bool = False
) -> Optional[ModelDefinition]:
    """Find cheapest model with required capabilities."""
    candidates = []
    
    for model in MODEL_REGISTRY.values():
        # Check CUI requirement
        if cui_required and not model.cui_authorized:
            continue
        
        # Check capabilities
        if all(cap in model.capabilities for cap in capabilities):
            candidates.append(model)
    
    if not candidates:
        return None
    
    # Sort by input cost (proxy for overall cost)
    candidates.sort(key=lambda m: m.input_cost_per_1k)
    return candidates[0]


def estimate_query_cost(
    model_id: str,
    estimated_input_tokens: int = 1000,
    estimated_output_tokens: int = 500
) -> float:
    """Estimate cost for a query."""
    model = get_model(model_id)
    if not model:
        return 0.0
    return model.estimated_cost(estimated_input_tokens, estimated_output_tokens)
