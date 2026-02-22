# Phase J Cross-Document Coordination

**MissionPulse v1.3 | Sprint 30 | Phase J**

---

## 1. Overview

The Cross-Document Coordination Engine is a rules-based system that automatically propagates field changes across related proposal documents. In government contracting proposals, data frequently appears in multiple volumes -- a labor category rate defined in the pricing volume must match the rate cited in the technical volume, the contract value in the cover letter must equal the total from the pricing spreadsheet, and so on.

The coordination engine eliminates manual copy-paste errors by defining **coordination rules** that specify:

- Which document type and field is the **source** of truth.
- Which document type and field is the **target** that must stay synchronized.
- What **transform** to apply during propagation (direct copy, formatting, aggregation, or cross-reference).

When a source document changes, the engine automatically locates all target documents of the matching type within the same company, applies the configured transform, records a new version, and logs the entire execution for audit compliance.

**Source files:**
- `lib/sync/coordination-engine.ts` -- Execution and preview logic
- `lib/sync/coordination-rules.ts` -- CRUD operations for rule management

---

## 2. Rule Configuration

A coordination rule is defined by five core fields:

| Field | Type | Description |
|-------|------|-------------|
| `source_doc_type` | `string` | The document type that owns the authoritative value |
| `source_field_path` | `string` | Dot-separated path to the source field within the document snapshot (e.g., `pricing.total_value`) |
| `target_doc_type` | `string` | The document type that should receive the propagated value |
| `target_field_path` | `string` | Dot-separated path to the target field within the target document snapshot |
| `transform_type` | `string` | How to transform the value before writing: `copy`, `format`, `aggregate`, or `reference` |

### Valid Document Types

The following 15 document types are supported as source or target:

| Document Type | Typical Use |
|---------------|-------------|
| `cover_letter` | Transmittal letter with contract summary data |
| `executive_summary` | High-level proposal overview |
| `technical_volume` | Technical approach narrative |
| `management_volume` | Management approach narrative |
| `past_performance` | Past performance citations |
| `pricing_volume` | Cost/price proposal |
| `staffing_plan` | Labor category definitions and FTE counts |
| `quality_plan` | Quality assurance plan |
| `transition_plan` | Transition-in plan |
| `subcontracting_plan` | Small business subcontracting plan |
| `compliance_matrix` | Requirements compliance cross-reference |
| `resume` | Key personnel resumes |
| `org_chart` | Organizational chart |
| `schedule` | Project schedule |
| `risk_register` | Risk identification and mitigation |

### Additional Rule Fields

| Field | Type | Description |
|-------|------|-------------|
| `company_id` | `uuid` | Company scope (enforced by RLS) |
| `is_active` | `boolean` | Whether the rule is currently active (soft-delete sets to `false`) |
| `description` | `string` or `null` | Human-readable description of what this rule does |

### Validation Rules

- Source and target document types must be from the valid set.
- Field paths must be non-empty after trimming.
- Self-referencing rules (same doc type AND same field path) are rejected.
- Transform type must be one of the four valid values.

---

## 3. Transform Types

### 3.1 `copy` -- Direct Value Replication

Copies the source value to the target field without modification. Use when both fields share the same data format.

**Example:**
- **Source:** `pricing_volume` / `contract_value`
- **Target:** `cover_letter` / `proposed_price`
- **Effect:** When the pricing volume's `contract_value` changes to `4500000`, the cover letter's `proposed_price` is set to `4500000`.

### 3.2 `format` -- Formatted Value Propagation

Applies formatting to the source value before writing to the target. Behavior varies by source type:

| Source Type | Output |
|-------------|--------|
| `number` | USD currency string (e.g., `4500000` becomes `$4,500,000`) |
| `Date` | ISO 8601 string |
| Other | `String()` coercion |

**Example:**
- **Source:** `pricing_volume` / `contract_value` (numeric: `4500000`)
- **Target:** `executive_summary` / `total_price_display`
- **Effect:** Target receives the string `"$4,500,000"`.

### 3.3 `aggregate` -- Array Aggregation

Sums numeric values from an array source field. Non-numeric array elements are treated as zero. If the source value is not an array, it is passed through unchanged.

**Example:**
- **Source:** `pricing_volume` / `line_item_totals` (array: `[150000, 200000, 100000]`)
- **Target:** `cover_letter` / `total_price`
- **Effect:** Target receives `450000`.

### 3.4 `reference` -- Cross-Reference Pointer

Wraps the source value in a reference marker string formatted as `[ref:<value>]`. Useful for inserting traceable cross-references between volumes.

**Example:**
- **Source:** `staffing_plan` / `pm_name` (string: `"Jane Smith"`)
- **Target:** `technical_volume` / `key_personnel.pm_reference`
- **Effect:** Target receives `"[ref:Jane Smith]"`.

---

## 4. Cascade Preview

Before applying a coordination rule, users can preview the impact using `previewCascade()`. This function is **read-only** -- it does not modify any data.

### Preview Workflow

1. User selects a coordination rule and enters a simulated new value.
2. `previewCascade(ruleId, newValue)` is called.
3. The engine loads the rule, applies the configured transform to the new value, and identifies all target documents.
4. For each target document, it returns a `CascadePreviewItem` showing:
   - The rule description
   - The target document ID and title
   - The target field path
   - The **current value** in the target field
   - The **new value** that would be written

### CascadePreviewItem Structure

```typescript
interface CascadePreviewItem {
  ruleId: string
  ruleDescription: string | null
  targetDocType: string
  targetFieldPath: string
  currentValue: unknown
  newValue: unknown
  documentId: string
  documentTitle: string
}
```

### UI Behavior

The cascade preview is displayed as a table or card list showing:
- Document name and type
- Field being changed
- Current value (left column) vs. new value (right column)
- A confirmation button to execute the cascade

---

## 5. Coordination Log

Every coordination rule execution is recorded in the `coordination_log` table, regardless of outcome. This provides a complete audit trail of all automated cross-document changes.

### Log Entry Structure

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` PK | Auto-generated primary key |
| `rule_id` | `uuid` FK | The coordination rule that was executed |
| `trigger_document_id` | `uuid` | The document whose change triggered the rule |
| `company_id` | `uuid` FK | Company scope |
| `affected_documents` | `jsonb` | Array of document IDs that were modified |
| `changes_applied` | `jsonb` | Array of change records (see below) |
| `status` | `text` | Execution outcome: `pending`, `applied`, `failed`, or `skipped` |
| `error_message` | `text` | Error details if `status` is `failed` |
| `executed_at` | `timestamptz` | When the execution occurred |

### Change Record Format

Each entry in `changes_applied` contains:

```json
{
  "document_id": "uuid",
  "field_path": "pricing.total_value",
  "old_value": 3000000,
  "new_value": 4500000
}
```

### Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Queued but not yet processed |
| `applied` | Successfully executed; all target documents updated |
| `failed` | Execution failed; `error_message` contains details |
| `skipped` | Rule fired but no action was needed (e.g., source field not found, no target documents matched) |

### Audit Log Integration

In addition to the coordination log, every successful execution also writes to the immutable `audit_logs` table with action `COORDINATION_EXECUTE`, recording:
- Trigger document ID
- Number of affected documents
- Transform type used

---

## 6. Database Schema

### 6.1 `coordination_rules`

Stores the rule definitions that govern how field changes cascade.

```sql
CREATE TABLE public.coordination_rules (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id      uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_doc_type text NOT NULL,
  source_field_path text NOT NULL,
  target_doc_type text NOT NULL,
  target_field_path text NOT NULL,
  transform_type  text NOT NULL DEFAULT 'copy'
                  CHECK (transform_type IN ('copy', 'format', 'aggregate', 'reference')),
  is_active       boolean NOT NULL DEFAULT true,
  description     text,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);
```

**RLS Policies:**
- SELECT: Users can view rules belonging to their company.
- ALL: Users can manage (insert, update, delete) rules for their company.

### 6.2 `coordination_log`

Records every coordination rule execution for audit compliance.

```sql
CREATE TABLE public.coordination_log (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id              uuid NOT NULL REFERENCES public.coordination_rules(id) ON DELETE CASCADE,
  trigger_document_id  uuid NOT NULL,
  company_id           uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  affected_documents   jsonb NOT NULL DEFAULT '[]'::jsonb,
  changes_applied      jsonb NOT NULL DEFAULT '[]'::jsonb,
  status               text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'applied', 'failed', 'skipped')),
  error_message        text,
  executed_at          timestamptz DEFAULT now() NOT NULL
);
```

**RLS Policies:**
- SELECT only: Users can view log entries for their company but cannot modify them.

### Indexes

```sql
CREATE INDEX idx_coordination_log_rule ON public.coordination_log(rule_id);
```
