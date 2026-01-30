-- Sprint 42: Document Storage & Attachments
-- Run in Supabase Dashboard > SQL Editor

DROP TABLE IF EXISTS proposal_documents CASCADE;
CREATE TABLE proposal_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    
    document_type TEXT CHECK (document_type IN (
        'rfp', 'amendment', 'qa', 'proposal_draft', 'proposal_final',
        'technical', 'management', 'past_performance', 'pricing', 
        'teaming', 'resume', 'org_chart', 'graphic', 'reference',
        'contract', 'nda', 'compliance', 'other'
    )) DEFAULT 'other',
    
    volume TEXT,
    section TEXT,
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT true,
    parent_document_id UUID REFERENCES proposal_documents(id),
    status TEXT CHECK (status IN ('draft', 'review', 'approved', 'final', 'archived')) DEFAULT 'draft',
    description TEXT,
    tags TEXT[],
    access_level TEXT CHECK (access_level IN ('team', 'leadership', 'confidential')) DEFAULT 'team',
    
    uploaded_by UUID REFERENCES profiles(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_docs_opp ON proposal_documents(opportunity_id);
CREATE INDEX idx_docs_type ON proposal_documents(document_type);
CREATE INDEX idx_docs_current ON proposal_documents(is_current) WHERE is_current = true;

ALTER TABLE proposal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View docs" ON proposal_documents FOR SELECT USING (
    access_level = 'team' OR
    (access_level = 'leadership' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('CEO','COO','Admin','CAP','PM'))) OR
    (access_level = 'confidential' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('CEO','COO','Admin')))
);

CREATE POLICY "Insert docs" ON proposal_documents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update docs" ON proposal_documents FOR UPDATE USING (
    uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('CEO','COO','Admin'))
);

CREATE POLICY "Delete docs" ON proposal_documents FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('CEO','COO','Admin'))
);

GRANT ALL ON proposal_documents TO authenticated;
