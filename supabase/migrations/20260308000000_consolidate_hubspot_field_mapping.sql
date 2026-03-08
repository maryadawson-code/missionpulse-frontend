-- Consolidate hubspot_field_mapping (singular, 18 rows) into
-- hubspot_field_mappings (plural, 11 rows) — the canonical table.
-- Schemas differ: singular has (hubspot_field, hubspot_type, missionpulse_field, notes, sync_direction)
-- Plural has (hubspot_field, missionpulse_field, direction, is_active, transform_config, transform_type, ...)

-- Migrate rows from singular → plural, mapping columns where possible.
-- Only insert rows whose hubspot_field+missionpulse_field combo doesn't already exist in plural.
INSERT INTO public.hubspot_field_mappings (hubspot_field, missionpulse_field, direction, is_active)
SELECT
  s.hubspot_field,
  s.missionpulse_field,
  COALESCE(s.sync_direction, 'bidirectional'),
  true
FROM public.hubspot_field_mapping s
WHERE NOT EXISTS (
  SELECT 1 FROM public.hubspot_field_mappings p
  WHERE p.hubspot_field = s.hubspot_field
    AND p.missionpulse_field = s.missionpulse_field
);

-- Drop the singular table
DROP TABLE IF EXISTS public.hubspot_field_mapping;

-- Create a compatibility view so any stale references still resolve
CREATE OR REPLACE VIEW public.hubspot_field_mapping AS
SELECT
  id,
  hubspot_field,
  missionpulse_field,
  direction AS sync_direction,
  NULL::text AS hubspot_type,
  NULL::text AS notes
FROM public.hubspot_field_mappings;
