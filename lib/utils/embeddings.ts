'use server'

/**
 * Embedding utilities for pgvector semantic search.
 * Currently uses text search as a fallback. When AskSage AI gateway
 * is wired (Sprint 10+), this will generate real embeddings via API.
 */

/**
 * Search playbook entries using text search.
 * Falls back to ILIKE when pgvector embeddings are not yet available.
 */
export async function searchPlaybookEntries(
  query: string,
  _options?: { limit?: number; category?: string }
): Promise<string[]> {
  // Placeholder: returns empty array.
  // Real implementation will call AskSage embedding endpoint
  // and use pgvector <=> operator for cosine similarity search.
  void query
  return []
}
