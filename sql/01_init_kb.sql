-- Creative Acceleration Lab Knowledge Base Schema
-- This SQL initializes the pgvector extension and creates the kb_chunks table
-- for storing embedded knowledge base content

-- ============================================================================
-- STEP 1: Enable pgvector extension
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- STEP 2: Create kb_chunks table
-- ============================================================================
-- This table stores chunked knowledge base content with embeddings for RAG
CREATE TABLE IF NOT EXISTS kb_chunks (
    -- Primary key
    id BIGSERIAL PRIMARY KEY,

    -- Source file tracking
    source_file TEXT NOT NULL,
    section_title TEXT,

    -- Content
    content TEXT NOT NULL,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    -- Vector embedding (1536 dimensions for OpenAI text-embedding-3-small)
    -- Note: Change dimension if using a different embedding model
    -- - OpenAI text-embedding-3-small: 1536
    -- - OpenAI text-embedding-3-large: 3072
    -- - Voyage AI voyage-2: 1024
    embedding vector(1536),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Chunk metadata
    chunk_index INTEGER,
    total_chunks INTEGER,
    char_count INTEGER,

    -- Constraints
    CONSTRAINT valid_chunk_index CHECK (chunk_index >= 0),
    CONSTRAINT valid_char_count CHECK (char_count >= 0)
);

-- ============================================================================
-- STEP 3: Create indexes for performance
-- ============================================================================

-- Index for vector similarity search using HNSW (Hierarchical Navigable Small World)
-- HNSW is faster than IVFFlat for most use cases and doesn't require training
CREATE INDEX IF NOT EXISTS kb_chunks_embedding_idx
ON kb_chunks
USING hnsw (embedding vector_cosine_ops);

-- Alternative: IVFFlat index (uncomment if you prefer IVFFlat)
-- Requires more setup but can be faster for very large datasets
-- Note: You'll need to tune the 'lists' parameter based on your data size
-- Rule of thumb: lists = rows / 1000 for datasets < 1M rows
--
-- CREATE INDEX IF NOT EXISTS kb_chunks_embedding_ivfflat_idx
-- ON kb_chunks
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- Index for filtering by source file
CREATE INDEX IF NOT EXISTS kb_chunks_source_file_idx
ON kb_chunks(source_file);

-- Index for filtering by tags
CREATE INDEX IF NOT EXISTS kb_chunks_tags_idx
ON kb_chunks USING GIN(tags);

-- Index for JSONB metadata queries
CREATE INDEX IF NOT EXISTS kb_chunks_metadata_idx
ON kb_chunks USING GIN(metadata);

-- Index for timestamp queries
CREATE INDEX IF NOT EXISTS kb_chunks_created_at_idx
ON kb_chunks(created_at DESC);

-- ============================================================================
-- STEP 4: Create helper functions
-- ============================================================================

-- Function to search knowledge base by semantic similarity
CREATE OR REPLACE FUNCTION search_kb(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 10,
    filter_tags text[] DEFAULT NULL
)
RETURNS TABLE (
    id bigint,
    source_file text,
    section_title text,
    content text,
    tags text[],
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb_chunks.id,
        kb_chunks.source_file,
        kb_chunks.section_title,
        kb_chunks.content,
        kb_chunks.tags,
        kb_chunks.metadata,
        1 - (kb_chunks.embedding <=> query_embedding) as similarity
    FROM kb_chunks
    WHERE
        -- Apply tag filter if provided
        (filter_tags IS NULL OR kb_chunks.tags && filter_tags)
        -- Apply similarity threshold
        AND 1 - (kb_chunks.embedding <=> query_embedding) > match_threshold
    ORDER BY kb_chunks.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_kb_chunks_updated_at
    BEFORE UPDATE ON kb_chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: Grant permissions (optional, adjust based on your security model)
-- ============================================================================

-- Grant SELECT to authenticated users (Supabase pattern)
-- ALTER TABLE kb_chunks ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (uncomment and adjust as needed)
-- CREATE POLICY "Enable read access for authenticated users" ON kb_chunks
--     FOR SELECT
--     TO authenticated
--     USING (true);

-- ============================================================================
-- STEP 6: Create sample view for debugging (optional)
-- ============================================================================

-- View to see chunk statistics by source file
CREATE OR REPLACE VIEW kb_chunk_stats AS
SELECT
    source_file,
    COUNT(*) as chunk_count,
    SUM(char_count) as total_chars,
    AVG(char_count) as avg_char_count,
    MIN(created_at) as first_ingested,
    MAX(created_at) as last_ingested
FROM kb_chunks
GROUP BY source_file
ORDER BY chunk_count DESC;

-- ============================================================================
-- VERIFICATION QUERIES (Run these after setup to verify)
-- ============================================================================

-- Check if extension is enabled
-- SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'kb_chunks';

-- Check indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'kb_chunks';

-- Check chunk statistics
-- SELECT * FROM kb_chunk_stats;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Embedding Dimensions:
-- - This schema uses 1536 dimensions (OpenAI text-embedding-3-small)
-- - If using different model, update ALL vector(1536) references
-- - Common dimensions: 1024 (Voyage), 1536 (OpenAI small), 3072 (OpenAI large)
--
-- Index Types:
-- - HNSW: Better for most use cases, no training needed
-- - IVFFlat: Can be faster for very large datasets, requires training
--
-- Similarity Metrics:
-- - vector_cosine_ops: Cosine similarity (most common for text)
-- - vector_l2_ops: Euclidean distance
-- - vector_ip_ops: Inner product
--
-- Performance Tips:
-- - Increase maintenance_work_mem before creating indexes on large datasets
-- - Consider partitioning if you have millions of chunks
-- - Monitor query performance and adjust match_threshold as needed
--
-- ============================================================================
