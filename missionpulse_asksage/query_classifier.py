"""
================================================================================
MISSIONPULSE - QUERY CLASSIFIER & MODEL ROUTER
================================================================================
Analyzes query complexity and routes to optimal model tier for cost/quality
optimization. Implements smart routing based on:
- Query complexity signals
- Agent type defaults
- CUI sensitivity detection
- Cost optimization rules

Author: Mission Meets Tech
Version: 1.0.0
Security: NIST 800-53 Rev 5 CHECKED
Encryption: FIPS 140-2 COMPLIANT
================================================================================
"""

import re
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum

from .model_config import (
    MODEL_REGISTRY,
    AGENT_MODEL_DEFAULTS,
    CUI_TRIGGER_KEYWORDS,
    ModelTier,
    ModelDefinition,
    get_model,
    get_cui_authorized_models
)

logger = logging.getLogger(__name__)


class ComplexityLevel(str, Enum):
    """Query complexity classification."""
    SIMPLE = "simple"       # Score 0-30
    MODERATE = "moderate"   # Score 31-60
    COMPLEX = "complex"     # Score 61-85
    CRITICAL = "critical"   # Score 86-100


@dataclass
class ClassificationResult:
    """Result of query classification."""
    complexity_score: int
    complexity_level: ComplexityLevel
    recommended_model: str
    model_tier: ModelTier
    cui_detected: bool
    classification_factors: List[str] = field(default_factory=list)
    estimated_cost_usd: float = 0.0
    routing_reason: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "complexity_score": self.complexity_score,
            "complexity_level": self.complexity_level.value,
            "recommended_model": self.recommended_model,
            "model_tier": self.model_tier.value,
            "cui_detected": self.cui_detected,
            "classification_factors": self.classification_factors,
            "estimated_cost_usd": self.estimated_cost_usd,
            "routing_reason": self.routing_reason
        }


class QueryClassifier:
    """
    Intelligent query classifier for model routing.
    
    Analyzes queries using multiple signals:
    - Query length and structure
    - Keyword detection (CUI, technical terms)
    - Question patterns
    - Agent context
    - Conversation history
    """
    
    # -------------------------------------------------------------------------
    # COMPLEXITY SCORING WEIGHTS
    # -------------------------------------------------------------------------
    
    # Base scores by agent type
    AGENT_BASE_SCORES: Dict[str, int] = {
        "capture": 40,      # pWin needs accuracy
        "strategy": 55,     # Win themes need nuance
        "compliance": 60,   # FAR/DFARS critical
        "writer": 30,       # Volume work
        "pricing": 70,      # Financial, CUI-adjacent
        "blackhat": 55,     # Competitive analysis
        "contracts": 65,    # Legal implications
        "orals": 35         # Practice/simulation
    }
    
    # Score modifiers
    MODIFIERS: Dict[str, int] = {
        # Complexity increasers
        "cui_detected": 25,
        "long_query": 15,           # > 500 chars
        "very_long_query": 25,      # > 1500 chars
        "multiple_questions": 10,
        "document_reference": 10,
        "technical_acronyms": 5,
        "multi_step_request": 15,
        "comparison_request": 10,
        "decision_request": 20,
        "legal_reference": 15,
        "financial_reference": 15,
        
        # Complexity reducers
        "simple_question": -15,
        "yes_no_pattern": -10,
        "followup_clarification": -10,
        "greeting_only": -30,
        "formatting_request": -10
    }
    
    # Patterns for detection
    PATTERNS = {
        "yes_no": re.compile(
            r"^(is|are|do|does|did|will|would|can|could|should|has|have|was|were)\s",
            re.IGNORECASE
        ),
        "simple_question": re.compile(
            r"^(what is|who is|when is|where is|how do i|what's|who's)\s",
            re.IGNORECASE
        ),
        "multiple_questions": re.compile(r"\?.*\?", re.DOTALL),
        "decision_keywords": re.compile(
            r"\b(should we|recommend|decide|go.?no.?go|proceed|approve)\b",
            re.IGNORECASE
        ),
        "comparison": re.compile(
            r"\b(compare|versus|vs\.?|difference|better|worse|pros.?cons)\b",
            re.IGNORECASE
        ),
        "multi_step": re.compile(
            r"\b(first|then|next|finally|step|phase|and then|after that)\b",
            re.IGNORECASE
        ),
        "legal_terms": re.compile(
            r"\b(far\s?\d|dfars|clause|liability|indemnif|warrant|terminat)\b",
            re.IGNORECASE
        ),
        "financial_terms": re.compile(
            r"\b(price|cost|budget|roi|margin|wrap.?rate|fte|labor.?hour|bol)\b",
            re.IGNORECASE
        ),
        "technical_acronyms": re.compile(
            r"\b(idiq|bpa|gwac|otas|sbir|sttr|sdvosb|wosb|hubzone|8a)\b",
            re.IGNORECASE
        ),
        "document_reference": re.compile(
            r"\b(attached|uploaded|document|file|pdf|rfp|rfi|pwes|sow)\b",
            re.IGNORECASE
        ),
        "greeting": re.compile(
            r"^(hi|hello|hey|good morning|good afternoon|thanks|thank you)\s*[!.]?$",
            re.IGNORECASE
        ),
        "followup": re.compile(
            r"^(also|and|additionally|what about|how about|can you also)\s",
            re.IGNORECASE
        ),
        "formatting": re.compile(
            r"\b(format|reformat|bullet|number|list|table|markdown)\b",
            re.IGNORECASE
        )
    }
    
    def __init__(self, force_cui_models: bool = False):
        """
        Initialize classifier.
        
        Args:
            force_cui_models: Always use CUI-authorized models (for FedRAMP env)
        """
        self.force_cui_models = force_cui_models
    
    def classify(
        self,
        query: str,
        agent_type: str,
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict]] = None
    ) -> ClassificationResult:
        """
        Classify query and recommend optimal model.
        
        Args:
            query: User's query text
            agent_type: Which agent is handling this
            context: Additional context (opportunity, documents, etc.)
            conversation_history: Prior messages in conversation
            
        Returns:
            ClassificationResult with model recommendation
        """
        factors: List[str] = []
        
        # Start with agent base score
        base_score = self.AGENT_BASE_SCORES.get(agent_type, 40)
        factors.append(f"agent_base:{agent_type}={base_score}")
        
        score = base_score
        
        # =====================================================================
        # CUI DETECTION (Highest priority)
        # =====================================================================
        cui_detected = self._detect_cui(query, context)
        if cui_detected:
            score += self.MODIFIERS["cui_detected"]
            factors.append(f"cui_detected:+{self.MODIFIERS['cui_detected']}")
        
        # =====================================================================
        # QUERY LENGTH ANALYSIS
        # =====================================================================
        query_len = len(query)
        if query_len > 1500:
            score += self.MODIFIERS["very_long_query"]
            factors.append(f"very_long_query:+{self.MODIFIERS['very_long_query']}")
        elif query_len > 500:
            score += self.MODIFIERS["long_query"]
            factors.append(f"long_query:+{self.MODIFIERS['long_query']}")
        
        # =====================================================================
        # PATTERN MATCHING
        # =====================================================================
        
        # Greeting only (big reducer)
        if self.PATTERNS["greeting"].match(query.strip()):
            score += self.MODIFIERS["greeting_only"]
            factors.append(f"greeting_only:{self.MODIFIERS['greeting_only']}")
        
        # Simple yes/no question
        if self.PATTERNS["yes_no"].match(query):
            score += self.MODIFIERS["yes_no_pattern"]
            factors.append(f"yes_no_pattern:{self.MODIFIERS['yes_no_pattern']}")
        
        # Simple factual question
        if self.PATTERNS["simple_question"].match(query):
            score += self.MODIFIERS["simple_question"]
            factors.append(f"simple_question:{self.MODIFIERS['simple_question']}")
        
        # Multiple questions
        if self.PATTERNS["multiple_questions"].search(query):
            score += self.MODIFIERS["multiple_questions"]
            factors.append(f"multiple_questions:+{self.MODIFIERS['multiple_questions']}")
        
        # Decision-making request
        if self.PATTERNS["decision_keywords"].search(query):
            score += self.MODIFIERS["decision_request"]
            factors.append(f"decision_request:+{self.MODIFIERS['decision_request']}")
        
        # Comparison request
        if self.PATTERNS["comparison"].search(query):
            score += self.MODIFIERS["comparison_request"]
            factors.append(f"comparison_request:+{self.MODIFIERS['comparison_request']}")
        
        # Multi-step request
        if self.PATTERNS["multi_step"].search(query):
            score += self.MODIFIERS["multi_step_request"]
            factors.append(f"multi_step_request:+{self.MODIFIERS['multi_step_request']}")
        
        # Legal references
        if self.PATTERNS["legal_terms"].search(query):
            score += self.MODIFIERS["legal_reference"]
            factors.append(f"legal_reference:+{self.MODIFIERS['legal_reference']}")
        
        # Financial references
        if self.PATTERNS["financial_terms"].search(query):
            score += self.MODIFIERS["financial_reference"]
            factors.append(f"financial_reference:+{self.MODIFIERS['financial_reference']}")
        
        # Technical acronyms
        if self.PATTERNS["technical_acronyms"].search(query):
            score += self.MODIFIERS["technical_acronyms"]
            factors.append(f"technical_acronyms:+{self.MODIFIERS['technical_acronyms']}")
        
        # Document references
        if self.PATTERNS["document_reference"].search(query):
            score += self.MODIFIERS["document_reference"]
            factors.append(f"document_reference:+{self.MODIFIERS['document_reference']}")
        
        # Followup/clarification
        if conversation_history and len(conversation_history) > 0:
            if self.PATTERNS["followup"].match(query):
                score += self.MODIFIERS["followup_clarification"]
                factors.append(f"followup_clarification:{self.MODIFIERS['followup_clarification']}")
        
        # Formatting request
        if self.PATTERNS["formatting"].search(query):
            score += self.MODIFIERS["formatting_request"]
            factors.append(f"formatting_request:{self.MODIFIERS['formatting_request']}")
        
        # =====================================================================
        # CONTEXT MODIFIERS
        # =====================================================================
        if context:
            # Document attached
            if context.get("has_attachment") or context.get("document_ids"):
                score += 10
                factors.append("has_attachment:+10")
            
            # High-value opportunity
            if context.get("opportunity_value", 0) > 10_000_000:
                score += 10
                factors.append("high_value_opp:+10")
            
            # Near deadline
            if context.get("days_to_deadline", 999) < 7:
                score += 5
                factors.append("near_deadline:+5")
        
        # =====================================================================
        # CLAMP SCORE AND DETERMINE LEVEL
        # =====================================================================
        score = max(0, min(100, score))
        
        if score <= 30:
            complexity_level = ComplexityLevel.SIMPLE
        elif score <= 60:
            complexity_level = ComplexityLevel.MODERATE
        elif score <= 85:
            complexity_level = ComplexityLevel.COMPLEX
        else:
            complexity_level = ComplexityLevel.CRITICAL
        
        # =====================================================================
        # SELECT MODEL
        # =====================================================================
        model_id, model_tier, routing_reason = self._select_model(
            agent_type=agent_type,
            complexity_level=complexity_level,
            cui_required=cui_detected or self.force_cui_models
        )
        
        # Estimate cost
        model = get_model(model_id)
        estimated_cost = 0.0
        if model:
            # Rough estimate: 1K input, 500 output for simple, scale up
            input_estimate = {
                ComplexityLevel.SIMPLE: 500,
                ComplexityLevel.MODERATE: 1000,
                ComplexityLevel.COMPLEX: 2000,
                ComplexityLevel.CRITICAL: 3000
            }.get(complexity_level, 1000)
            
            output_estimate = input_estimate // 2
            estimated_cost = model.estimated_cost(input_estimate, output_estimate)
        
        return ClassificationResult(
            complexity_score=score,
            complexity_level=complexity_level,
            recommended_model=model_id,
            model_tier=model_tier,
            cui_detected=cui_detected,
            classification_factors=factors,
            estimated_cost_usd=estimated_cost,
            routing_reason=routing_reason
        )
    
    def _detect_cui(
        self,
        query: str,
        context: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Check if query contains CUI indicators."""
        query_lower = query.lower()
        
        # Check query text
        for keyword in CUI_TRIGGER_KEYWORDS:
            if keyword in query_lower:
                return True
        
        # Check context flags
        if context:
            if context.get("cui_marked"):
                return True
            if context.get("classification") in ["cui", "fouo", "sbu"]:
                return True
        
        return False
    
    def _select_model(
        self,
        agent_type: str,
        complexity_level: ComplexityLevel,
        cui_required: bool
    ) -> Tuple[str, ModelTier, str]:
        """
        Select optimal model based on classification.
        
        Returns:
            Tuple of (model_id, tier, routing_reason)
        """
        # Get agent defaults
        agent_defaults = AGENT_MODEL_DEFAULTS.get(agent_type, {
            "default": "gpt-4o",
            "complex": "claude-sonnet-4",
            "critical": "claude-3-opus"
        })
        
        # Map complexity to default key
        if complexity_level == ComplexityLevel.SIMPLE:
            default_key = "default"
            reason_prefix = "Simple query"
        elif complexity_level == ComplexityLevel.MODERATE:
            default_key = "default"
            reason_prefix = "Moderate complexity"
        elif complexity_level == ComplexityLevel.COMPLEX:
            default_key = "complex"
            reason_prefix = "Complex analysis required"
        else:  # CRITICAL
            default_key = "critical"
            reason_prefix = "Critical decision - maximum accuracy"
        
        model_id = agent_defaults.get(default_key, "gpt-4o")
        
        # If CUI required, ensure model is authorized
        if cui_required:
            model = get_model(model_id)
            if not model or not model.cui_authorized:
                # Upgrade to CUI-authorized model
                if complexity_level in [ComplexityLevel.SIMPLE, ComplexityLevel.MODERATE]:
                    model_id = "claude-sonnet-4"  # FedRAMP authorized
                else:
                    model_id = "claude-3-opus"
                reason_prefix += " + CUI upgrade"
        
        model = get_model(model_id)
        tier = model.tier if model else ModelTier.STANDARD
        
        return model_id, tier, f"{reason_prefix} → {model_id}"
    
    def explain_classification(self, result: ClassificationResult) -> str:
        """Generate human-readable explanation of classification."""
        lines = [
            f"**Query Classification Report**",
            f"",
            f"Complexity Score: {result.complexity_score}/100 ({result.complexity_level.value})",
            f"Recommended Model: {result.recommended_model} ({result.model_tier.value} tier)",
            f"CUI Content Detected: {'Yes ⚠️' if result.cui_detected else 'No'}",
            f"Estimated Cost: ${result.estimated_cost_usd:.4f}",
            f"",
            f"**Routing Logic:** {result.routing_reason}",
            f"",
            f"**Factors:**"
        ]
        
        for factor in result.classification_factors:
            lines.append(f"  • {factor}")
        
        return "\n".join(lines)


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

_classifier_instance: Optional[QueryClassifier] = None


def get_classifier(force_cui_models: bool = False) -> QueryClassifier:
    """Get or create classifier singleton."""
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = QueryClassifier(force_cui_models=force_cui_models)
    return _classifier_instance
