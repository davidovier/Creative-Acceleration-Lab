# RAG Architecture for Creative Acceleration Lab

This document outlines the Retrieval-Augmented Generation (RAG) architecture for the multi-agent Claude system.

## 🎯 Overview

The system combines:
- **Knowledge Base**: 33 markdown files organized in 8 folders
- **pgvector (Supabase)**: Vector storage for semantic search
- **OpenAI Embeddings**: text-embedding-3-small (1536 dimensions)
- **Claude**: Multi-agent reasoning and generation
- **Next.js/Vercel**: Deployment platform

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INPUT                               │
│              (Founder story / Project idea)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                ORCHESTRATOR ENDPOINT                         │
│              /api/session (Next.js API)                      │
│  • Receives user input                                       │
│  • Coordinates 4 agents in sequence                          │
│  • Manages RAG context for each agent                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   RAG HELPER LAYER                           │
│                                                               │
│  1. Embed user query (OpenAI text-embedding-3-small)         │
│  2. Query Supabase kb_chunks (pgvector similarity search)    │
│  3. Retrieve top K relevant chunks                           │
│  4. Format context for Claude                                │
│                                                               │
│  ┌────────────────────────────────────────────────┐          │
│  │    SUPABASE (PostgreSQL + pgvector)            │          │
│  │                                                 │          │
│  │  kb_chunks table:                              │          │
│  │  • source_file                                 │          │
│  │  • section_title                               │          │
│  │  • content                                     │          │
│  │  • tags (archetypes, frameworks, etc)          │          │
│  │  • embedding vector(1536)                      │          │
│  │  • metadata (JSONB)                            │          │
│  │                                                 │          │
│  │  HNSW Index for fast similarity search         │          │
│  └────────────────────────────────────────────────┘          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   4 CLAUDE AGENTS                            │
│                   (Sequential Execution)                     │
│                                                               │
│  1️⃣  INSIGHT AGENT                                           │
│      • Input: User story + RAG context (archetypes, psych)   │
│      • Process: Emotional clarity, wound identification      │
│      • Output: Core wound, archetype, desires                │
│                                                               │
│  2️⃣  STORY ARCHITECT                                         │
│      • Input: Insights + RAG context (narratives, myths)     │
│      • Process: Build hero's journey structure               │
│      • Output: Founder myth, metaphors, story framework      │
│                                                               │
│  3️⃣  PROTOTYPE ENGINEER                                      │
│      • Input: Story + RAG context (frameworks, prototyping)  │
│      • Process: Design 5-day prototype plan                  │
│      • Output: Technical plan, UX sketches, timeline         │
│                                                               │
│  4️⃣  SYMBOL WEAVER                                           │
│      • Input: All above + RAG (symbols, design)              │
│      • Process: Create visual/symbolic language              │
│      • Output: Symbols, tattoo concepts, visual direction    │
│                                                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   STRUCTURED OUTPUT                          │
│                   (JSON Response)                            │
│                                                               │
│  {                                                            │
│    "insight": { ... },                                        │
│    "story": { ... },                                          │
│    "prototype": { ... },                                      │
│    "symbols": { ... }                                         │
│  }                                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      WEB UI                                  │
│              (Next.js React Components)                      │
│  • Input form for user story                                 │
│  • Display structured report                                 │
│  • Visual presentation of symbols                            │
└─────────────────────────────────────────────────────────────┘
```

## 🗄️ Database Schema

### kb_chunks Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| source_file | TEXT | Path to source MD file |
| section_title | TEXT | Markdown heading (e.g., "## Archetype Discovery") |
| content | TEXT | Actual chunk text |
| tags | TEXT[] | Categories: archetype, framework, symbol, etc. |
| metadata | JSONB | Additional structured data |
| embedding | vector(1536) | OpenAI embedding |
| created_at | TIMESTAMPTZ | When chunk was ingested |
| updated_at | TIMESTAMPTZ | Last update |
| chunk_index | INTEGER | Position within file |
| total_chunks | INTEGER | Total chunks in file |
| char_count | INTEGER | Size of chunk |

### Indexes

- **HNSW** on `embedding` for similarity search (fast, no training needed)
- **GIN** on `tags` for tag filtering
- **B-tree** on `source_file` and `created_at`

### Helper Function

```sql
search_kb(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 10,
    filter_tags text[] DEFAULT NULL
)
```

Returns chunks ordered by cosine similarity with optional tag filtering.

## 📦 Data Flow

### 1. Ingestion Phase (Prompt 2)

```
KB Markdown Files
       ↓
Chunking (by section or fixed size)
       ↓
Generate Embeddings (OpenAI API)
       ↓
Insert into Supabase kb_chunks
       ↓
Create indexes (HNSW)
```

### 2. Query Phase (Runtime)

```
User Input
       ↓
Embed Query (OpenAI)
       ↓
Similarity Search (Supabase pgvector)
       ↓
Retrieve Top K Chunks (with tag filtering)
       ↓
Format Context for Claude
       ↓
Send to Agent with System Prompt + Context
       ↓
Receive Structured Output
```

## 🤖 Agent Specifications

### 1. Insight Agent
**Focus**: Emotional clarity, archetypes, psychology

**RAG Query Tags**: `['archetype', 'emotion', 'psychology', 'wound']`

**Input**:
- User's raw story/dump
- RAG context from archetype library, founder psychology

**Process**:
- Identify emotional keywords
- Map to archetypes
- Extract wounds and desires

**Output**:
```json
{
  "core_wound": "Fear of irrelevance after corporate burnout",
  "primary_archetype": "Creator-Magician",
  "desires": ["autonomy", "meaningful impact"],
  "fears": ["stagnation", "conformity"],
  "emotional_drivers": [...]
}
```

### 2. Story Architect
**Focus**: Narrative structure, myths, metaphors

**RAG Query Tags**: `['narrative', 'story', 'metaphor', 'myth']`

**Input**:
- Insight Agent output
- RAG context from story frameworks, messaging patterns

**Process**:
- Build hero's journey
- Create metaphors
- Construct founder myth

**Output**:
```json
{
  "founder_myth": "...",
  "hero": "The burned-out corporate escapee",
  "villain": "Bureaucratic slowness",
  "gift": "Rapid prototyping methodology",
  "transformation": "From stuck to shipping",
  "metaphors": [...]
}
```

### 3. Prototype Engineer
**Focus**: Technical planning, prototyping frameworks

**RAG Query Tags**: `['framework', 'prototype', 'technical', 'workflow']`

**Input**:
- Story Architect output
- RAG context from 5-Day Ritual, workflows, technical guides

**Process**:
- Design 5-day plan
- Create UX sketches outline
- Define technical skeleton

**Output**:
```json
{
  "five_day_plan": {
    "day_1": "Story extraction...",
    "day_2": "Human mapping...",
    ...
  },
  "core_features": [...],
  "technical_stack": [...],
  "success_metrics": [...]
}
```

### 4. Symbol Weaver
**Focus**: Visual symbols, tattoo concepts, aesthetic

**RAG Query Tags**: `['symbol', 'design', 'visual', 'archetype']`

**Input**:
- All previous outputs
- RAG context from symbol library, metaphor mappings

**Process**:
- Convert emotions to symbols
- Create visual language
- Design tattoo concepts

**Output**:
```json
{
  "primary_symbol": {
    "shape": "Upward spiral",
    "meaning": "Growth from wound",
    "visual_description": "..."
  },
  "color_palette": ["charcoal", "copper", "bone"],
  "tattoo_concepts": [...],
  "ux_motifs": [...]
}
```

## 🔧 Technology Stack

### Backend
- **Database**: Supabase (PostgreSQL + pgvector)
- **Embeddings**: OpenAI text-embedding-3-small
- **LLM**: Claude 3.5 Sonnet (Anthropic)
- **Runtime**: Node.js

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Deployment**: Vercel
- **Styling**: TailwindCSS (tattoo-inspired design)

### Libraries
- `@anthropic-ai/sdk` - Claude API
- `openai` - Embeddings
- `@supabase/supabase-js` - Database client
- `pg` / `postgres` - Direct PostgreSQL access
- `langchain` (optional) - Document loaders, chunking

## 📊 Embedding Strategy

### Recommended: OpenAI text-embedding-3-small
- **Dimensions**: 1536
- **Cost**: $0.02 per 1M tokens (~$0.0002 per KB file)
- **Quality**: Excellent for semantic search
- **Speed**: ~1000 embeddings/min
- **Use case**: Best balance of cost/quality

### Alternative: Voyage AI voyage-2
- **Dimensions**: 1024
- **Quality**: Slightly better for retrieval tasks
- **Cost**: Competitive
- **Note**: Requires schema change to `vector(1024)`

## 🎨 Chunking Strategy

### Markdown Section Strategy (Recommended)
- Chunk by markdown headers (`##`, `###`)
- Preserve semantic coherence
- Max section size: 2000 chars
- Min section size: 100 chars

**Advantages**:
- Maintains context
- Natural semantic boundaries
- Better retrieval quality

### Fixed-Size Strategy (Alternative)
- Chunk size: 1000 chars
- Overlap: 200 chars
- Simpler implementation

## 🔍 RAG Retrieval Strategy

### Agent-Specific Retrieval
Each agent queries with specific tags:
- Insight → `archetype`, `emotion`, `psychology`
- Story → `narrative`, `metaphor`, `story`
- Prototype → `framework`, `prototype`, `technical`
- Symbol → `symbol`, `design`, `visual`

### Parameters
- **Top K**: 5 chunks per query
- **Similarity Threshold**: 0.5 (cosine similarity)
- **Context Length**: ~8000 chars max to Claude

### Re-ranking (Future Enhancement)
- Retrieve top 20
- Re-rank with cross-encoder
- Send top 5 to Claude

## 🚀 Deployment Architecture (Vercel)

```
User Browser
      ↓
Vercel Edge Network
      ↓
Next.js API Routes (/api/session)
      ↓
      ├─→ Supabase (pgvector queries) → RAG Context
      ├─→ OpenAI (embeddings)
      └─→ Anthropic (Claude agents)
      ↓
Structured JSON Response
      ↓
Next.js Frontend
```

### Environment Variables (Vercel)
```bash
DATABASE_URL=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
```

## 📈 Scaling Considerations

### Performance
- Use session pooler for serverless (Vercel)
- Cache embeddings to avoid re-computing
- Implement query result caching (Redis)

### Cost Optimization
- Batch embeddings during ingestion
- Use `text-embedding-3-small` (cheapest quality option)
- Limit context window to necessary chunks only

### Quality Improvements
- Add user feedback loop
- Fine-tune similarity thresholds per agent
- Implement hybrid search (keyword + semantic)

## 🔐 Security

- API keys in environment variables only
- Use Supabase Row Level Security (RLS)
- Rate limiting on API endpoints
- Input sanitization

## 📝 Next Steps (Prompt 2)

- [ ] Implement KB ingestion script (`scripts/ingest_kb.js`)
- [ ] Test chunking strategy on sample files
- [ ] Verify embedding generation and insertion
- [ ] Build RAG helper functions
- [ ] Create test queries for each agent type
- [ ] Measure retrieval quality

## 🔗 References

- [Supabase Vector Docs](https://supabase.com/docs/guides/ai/vector-columns)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Claude API Docs](https://docs.anthropic.com/)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
