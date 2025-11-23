# KB Ingestion Instructions

Complete guide for ingesting your knowledge base into the RAG system.

---

## 🚀 Quick Start (Local Ingestion)

### 1. Prerequisites

Ensure you have:
- ✅ Database schema created (from Prompt 1)
- ✅ `.env` file with `OPENAI_API_KEY` and `DATABASE_URL`
- ✅ All dependencies installed (`npm install`)

### 2. Run Ingestion

```bash
# From project root
node scripts/ingest_kb.js
```

**Expected output:**
```
╔═══════════════════════════════════════════════════════════════╗
║          KB INGESTION PIPELINE - STARTING                     ║
╚═══════════════════════════════════════════════════════════════╝

📊 Connecting to database...
✅ Database connected

📁 Scanning KB folders...
✅ Found 33 markdown files

📝 Processing files and chunking...

[1/33] 01_Brand_Identity/brand_essence.md
  ✅ Created 8 chunks

[2/33] 01_Brand_Identity/core_values.md
  ✅ Created 5 chunks

... (continues for all files)

✅ Total chunks created: 234

🔮 Generating embeddings...
  🔄 Embedding batch 1/3 (100 chunks)...
  ✅ Embedded 100 chunks (45230 tokens, $0.000905)
  🔄 Embedding batch 2/3 (100 chunks)...
  ✅ Embedded 100 chunks (43891 tokens, $0.000878)
  🔄 Embedding batch 3/3 (34 chunks)...
  ✅ Embedded 34 chunks (14823 tokens, $0.000296)
  💰 Total embeddings: 103944 tokens, $0.002079

✅ Generated 234 embeddings

💾 Inserting chunks into database...

╔═══════════════════════════════════════════════════════════════╗
║          KB INGESTION COMPLETE                                ║
╚═══════════════════════════════════════════════════════════════╝

📊 Summary:
   Files scanned:      33
   Chunks created:     234
   Chunks inserted:    234
   Chunks skipped:     0
   Errors:             0
   Duration:           45.32s

🔍 Verifying database...
✅ Total chunks in database: 234
```

### 3. Verify Ingestion

```bash
# Check chunks in database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM kb_chunks;"

# View sample chunks
psql $DATABASE_URL -c "SELECT source_file, section_title, char_count FROM kb_chunks LIMIT 5;"

# Check spending
psql $DATABASE_URL -c "SELECT * FROM today_spending;"
```

---

## 📁 File Structure Overview

### Ingestion Script
```
scripts/
├── ingest_kb.js           # Main ingestion script
├── config.js              # Configuration (KB paths, chunking, embedding)
├── rate-limiter.js        # Cost tracking and rate limiting
└── INGEST_INSTRUCTIONS.md # This file
```

### KB Folders (Source Data)
```
Creative Acceleration Lab/
├── 01_Brand_Identity/
│   ├── brand_essence.md
│   ├── core_values.md
│   └── ...
├── 02_Service_Pillars/
├── 03_Frameworks_Methodologies/
├── 04_AI_Agents/
├── 05_Operations_Business/
├── 06_Marketing_Sales/
├── 07_Creative_Resources/
└── 08_Templates_Tools/
```

### Database Tables (Target)
```sql
kb_chunks (
    id,
    source_file,      -- e.g., "01_Brand_Identity/brand_essence.md"
    section_title,    -- e.g., "Core Brand Values"
    content,          -- Markdown text (~1200 chars max)
    tags,             -- e.g., ["archetype", "framework"]
    embedding,        -- vector(1536) from OpenAI
    char_count,
    metadata,
    created_at,
    updated_at
)
```

---

## 🔧 How It Works

### Step 1: File Discovery
- Walks all 8 KB folders: `01_Brand_Identity/` through `08_Templates_Tools/`
- Finds all `.md`, `.mdx`, and `.txt` files
- Recursively searches subdirectories

### Step 2: Chunking
- Splits markdown by `##` section headers
- Maximum chunk size: ~1200 characters
- If section is too large, splits by paragraphs (`\n\n`)
- Skips empty sections (<50 chars)

**Example:**
```markdown
## Brand Essence

Creative Acceleration Lab is a creative innovation studio...
(~800 chars)

## Core Values

We believe in radical creativity and systematic innovation...
(~600 chars)
```

Becomes 2 chunks:
1. Section: "Brand Essence" (800 chars)
2. Section: "Core Values" (600 chars)

### Step 3: Sanitization
- Normalizes unicode (NFKD)
- Replaces smart quotes with straight quotes
- Removes null bytes and control characters
- Normalizes whitespace

### Step 4: Tag Extraction
- Adds folder-based tag (e.g., `"01_Brand_Identity"`)
- Detects content-based tags:
  - `archetype` - if contains "archetype", "persona", "character"
  - `framework` - if contains "framework", "methodology"
  - `creative` - if contains "creative", "design", "visual"
  - `story` - if contains "story", "narrative", "myth"
  - etc.

### Step 5: Embedding Generation
- Batches chunks (100 at a time for efficiency)
- Calls OpenAI `text-embedding-3-small` API
- Generates 1536-dimensional vectors
- Logs cost to `api_costs` table

### Step 6: Deduplication
- Calculates MD5 hash of content
- Checks if `(source_file, section_title, content)` already exists
- Skips duplicates, inserts new chunks

### Step 7: Database Insertion
- Inserts chunk with embedding into `kb_chunks`
- Stores metadata (content hash, etc.)
- Returns summary statistics

---

## 🌐 API-Based Ingestion (CI/CD)

For production deployments, use the API endpoint instead of running locally.

### 1. Set Admin Secret

Add to `.env`:
```bash
ADMIN_INGEST_SECRET=your-secure-random-string-here
```

### 2. Trigger Ingestion via API

```bash
curl -X POST https://your-app.vercel.app/api/admin/ingest \
  -H "x-admin-secret: your-secure-random-string-here" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "status": "success",
  "filesScanned": 33,
  "chunksCreated": 234,
  "chunksInserted": 234,
  "chunksSkipped": 0,
  "errors": 0,
  "duration": "45.32s",
  "cost": "$0.002079"
}
```

### 3. GitHub Action (Optional)

Create `.github/workflows/ingest-kb.yml`:

```yaml
name: Ingest KB on Push

on:
  push:
    paths:
      - '01_Brand_Identity/**'
      - '02_Service_Pillars/**'
      - '03_Frameworks_Methodologies/**'
      - '04_AI_Agents/**'
      - '05_Operations_Business/**'
      - '06_Marketing_Sales/**'
      - '07_Creative_Resources/**'
      - '08_Templates_Tools/**'

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Ingestion
        run: |
          curl -X POST ${{ secrets.VERCEL_URL }}/api/admin/ingest \
            -H "x-admin-secret: ${{ secrets.ADMIN_INGEST_SECRET }}"
```

### 4. Vercel Deploy Hook (Optional)

Create a deploy hook in Vercel dashboard, then:

```bash
# Re-ingest on every deploy
curl -X POST https://api.vercel.com/v1/integrations/deploy/HOOK_ID
```

---

## 🛠️ Configuration

Edit `scripts/config.js` to customize:

### KB Paths
```javascript
kb: {
    rootPath: '/Users/davidvos/Desktop/Creative Acceleration Lab',
    folders: [
        '01_Brand_Identity',
        '02_Service_Pillars',
        // ... add more folders
    ],
    include: ['**/*.md', '**/*.mdx', '**/*.txt'],
    exclude: ['node_modules/**', '.git/**', 'README.md'],
}
```

### Chunking Strategy
```javascript
chunking: {
    strategy: 'markdown-section',  // Split by ## headers
    maxSectionSize: 1200,           // Max chars per chunk
    minChunkSize: 100,              // Skip chunks smaller than this
    preserveSections: true,         // Keep sections intact
}
```

### Embedding Settings
```javascript
embedding: {
    provider: 'openai',
    openai: {
        model: 'text-embedding-3-small',
        dimensions: 1536,
        batchSize: 100,  // Embeddings per API call
    },
}
```

---

## 🐛 Troubleshooting

### Error: "Missing required environment variables"

**Cause**: `.env` file is missing or incomplete

**Fix**:
```bash
# Check .env exists
cat .env

# Ensure these are set:
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-proj-...
SUPABASE_URL=https://...
```

### Error: "No files found"

**Cause**: KB folder paths are incorrect

**Fix**:
```bash
# Verify folders exist
ls -la "01_Brand_Identity/"

# Update config.js with correct rootPath:
kb: {
    rootPath: path.resolve(__dirname, '..'), // Adjust as needed
}
```

### Error: "relation 'kb_chunks' does not exist"

**Cause**: Database schema not initialized

**Fix**:
```bash
# Run the schema creation script from Prompt 1
node -e "const { getDB } = require('./db_connection.js'); const fs = require('fs'); const db = getDB(); db.query(fs.readFileSync('./sql/01_init_kb.sql', 'utf-8')).then(() => process.exit(0));"
```

### Error: "OpenAI API rate limit exceeded"

**Cause**: Too many requests too quickly

**Fix**:
- Ingestion script automatically retries with exponential backoff
- Wait a few minutes and try again
- Check OpenAI dashboard for rate limit status

### Error: "Daily budget exceeded"

**Cause**: Cost protection limit reached

**Fix**:
```bash
# Check spending
psql $DATABASE_URL -c "SELECT * FROM today_spending;"

# If legitimate, increase limit in scripts/rate-limiter.js:
budget: {
    perDay: 20.00,  // Increase from $10
}
```

### Chunks Skipped (Duplicates)

**Cause**: Chunks already exist in database

**Fix**:
```bash
# If you want to re-ingest, clear the table first:
psql $DATABASE_URL -c "TRUNCATE kb_chunks;"

# Then re-run ingestion
node scripts/ingest_kb.js
```

### Large Files Timeout

**Cause**: File is too large or has many chunks

**Fix**:
- Ingestion processes files sequentially (no timeout)
- If embedding fails, check OpenAI API status
- Reduce `batchSize` in config.js if needed

---

## 📊 Expected Costs

### One-Time Ingestion (33 files, ~234 chunks)
- **Tokens**: ~100K-150K
- **Cost**: $0.002 - $0.003
- **Duration**: 30-60 seconds

### Re-Ingestion (After Content Update)
- Same as above if all files changed
- Less if only a few files changed (deduplication skips existing chunks)

### Cost Per Chunk
- **Average chunk**: ~450 tokens
- **Cost**: ~$0.000009 per chunk
- **234 chunks**: ~$0.002 total

### Monthly Ongoing Cost
- **Ingestion**: $0 (unless you re-ingest)
- **Query embeddings**: ~$0.01/month (100 queries)
- **Total**: Negligible

---

## 🔍 Verification Queries

### Check Total Chunks
```sql
SELECT COUNT(*) as total_chunks FROM kb_chunks;
```

### Check Chunks Per Folder
```sql
SELECT
    SUBSTRING(source_file FROM '^[^/]+') as folder,
    COUNT(*) as chunk_count
FROM kb_chunks
GROUP BY folder
ORDER BY folder;
```

### Check Average Chunk Size
```sql
SELECT
    AVG(char_count) as avg_chars,
    MIN(char_count) as min_chars,
    MAX(char_count) as max_chars
FROM kb_chunks;
```

### Check Most Common Tags
```sql
SELECT
    unnest(tags) as tag,
    COUNT(*) as frequency
FROM kb_chunks
GROUP BY tag
ORDER BY frequency DESC
LIMIT 10;
```

### Find Chunks Without Embeddings
```sql
SELECT COUNT(*) FROM kb_chunks WHERE embedding IS NULL;
```

### Check Ingestion Cost
```sql
SELECT
    SUM(cost) as total_cost,
    SUM(input_tokens) as total_tokens
FROM api_costs
WHERE provider = 'openai'
AND endpoint = 'embeddings'
AND DATE(created_at) = CURRENT_DATE;
```

---

## 🎯 Next Steps

After successful ingestion:

1. **Verify Chunks**
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM kb_chunks;"
   ```

2. **Test Search**
   ```bash
   # Will create in Prompt 2
   curl http://localhost:3000/api/kb/search?q=archetype
   ```

3. **View KB Diagnostic Page**
   ```
   http://localhost:3000/kb
   ```

4. **Proceed to Prompt 3**
   - Implement agent orchestration
   - Create session endpoint
   - Build frontend UI

---

## 📝 Notes

### Markdown Chunking Strategy
- ✅ **Pros**: Preserves semantic sections, readable chunks
- ⚠️ **Cons**: Variable chunk sizes (50-1200 chars)

### Alternative Strategies
- **Fixed-size**: Split by exact character count (more uniform, may break sentences)
- **Semantic**: Use LLM to identify topic boundaries (expensive, slower)

### Why Batch Embeddings?
- OpenAI allows up to 2048 inputs per request
- We use 100 to balance speed and API limits
- Reduces total API calls from 234 to 3

### Deduplication Strategy
- Checks `(source_file, section_title, content)` tuple
- Prevents duplicate chunks if you re-run ingestion
- Uses MD5 hash in metadata for quick comparison

---

## 🚀 Performance Tips

### Speed Up Ingestion
- Use larger `batchSize` (max 2048)
- Run on server with good network connection
- Use parallel processing (future improvement)

### Reduce Costs
- Use smaller embedding model (trade-off: lower quality)
- Increase `minChunkSize` to skip tiny chunks
- Cache embeddings (future improvement)

### Improve Chunk Quality
- Adjust `maxSectionSize` based on your content
- Use custom chunking logic for specific file types
- Add more sophisticated tag extraction

---

## ✅ Success Checklist

After ingestion, verify:
- [ ] No errors in console output
- [ ] `chunksInserted` > 0
- [ ] `errors` = 0
- [ ] Database has expected chunk count
- [ ] Cost logged in `api_costs` table
- [ ] Embeddings are not NULL
- [ ] Tags extracted correctly
- [ ] Ready for RAG search testing

---

**Status**: Production Ready ✅

**Last Updated**: November 23, 2025

**Next**: Test RAG search with `/api/kb/search`
