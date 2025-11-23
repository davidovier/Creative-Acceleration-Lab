# Database Connection Setup Guide

This guide will help you connect to the Creative Acceleration Lab Supabase database in any future session.

## 🔐 Credentials

All database credentials are stored in the `.env` file. **Never commit this file to version control.**

- **Supabase URL**: https://idqhczkvuoxetllmooch.supabase.co
- **Connection Method**: Session Pooler (recommended for serverless/high-concurrency)
- **Database**: PostgreSQL

## 📁 Files Created

- `.env` - Contains your database credentials (DO NOT COMMIT)
- `.env.example` - Template for environment variables
- `.gitignore` - Ensures sensitive files aren't committed
- `db_connection.py` - Python database connection module
- `db_connection.js` - Node.js database connection module
- `requirements.txt` - Python dependencies
- `package.json` - Node.js dependencies

## 🚀 Quick Start

### Python Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Test connection**:
   ```bash
   python db_connection.py
   ```

3. **Use in your code**:
   ```python
   from db_connection import get_db_connection

   conn = get_db_connection()
   cursor = conn.cursor()
   cursor.execute("SELECT * FROM your_table")
   results = cursor.fetchall()
   cursor.close()
   conn.close()
   ```

### Node.js Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Test connection**:
   ```bash
   npm run test:db
   ```

3. **Use in your code**:
   ```javascript
   const { getDB } = require('./db_connection');

   const db = getDB();
   const result = await db.query('SELECT * FROM your_table');
   console.log(result.rows);
   ```

## 🔧 Connection Options

### Session Pooler (Recommended)
- **Port**: 5432
- **Best for**: Serverless functions, edge functions, high-concurrency applications
- **Connection string**: Already set in `.env` as `DATABASE_URL`

### Direct Connection
- **Port**: 6543
- **Best for**: Database migrations, admin tasks, low-concurrency
- **Connection string**: Available in `.env` as `DIRECT_DATABASE_URL`
- **Note**: Direct connections have a connection limit

## 📚 Usage Examples

### Python with psycopg2

```python
from db_connection import DatabaseConnection

db = DatabaseConnection()
conn = db.connect_with_psycopg2()

cursor = conn.cursor()
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
user = cursor.fetchone()

cursor.close()
conn.close()
```

### Python with SQLAlchemy

```python
from db_connection import get_db_engine
import pandas as pd

engine = get_db_engine()

# Read data into DataFrame
df = pd.read_sql("SELECT * FROM users", engine)

# Execute query
with engine.connect() as conn:
    result = conn.execute("INSERT INTO users (name) VALUES (%s)", ("John",))
```

### Python with asyncpg (Async)

```python
import asyncio
from db_connection import DatabaseConnection

async def main():
    db = DatabaseConnection()
    pool = await db.connect_with_asyncpg()

    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM users")
        for row in rows:
            print(row)

    await pool.close()

asyncio.run(main())
```

### Node.js Basic Query

```javascript
const { getDB } = require('./db_connection');

async function getUsers() {
    const db = getDB();
    const result = await db.query('SELECT * FROM users WHERE active = $1', [true]);
    return result.rows;
}
```

### Node.js Transaction

```javascript
const { getDB } = require('./db_connection');

async function createUserWithLog(userName) {
    const db = getDB();

    await db.transaction(async (client) => {
        // Insert user
        const userResult = await client.query(
            'INSERT INTO users (name) VALUES ($1) RETURNING id',
            [userName]
        );

        // Log the action
        await client.query(
            'INSERT INTO activity_log (action, user_id) VALUES ($1, $2)',
            ['user_created', userResult.rows[0].id]
        );
    });
}
```

## 🛡️ Security Best Practices

1. **Never commit `.env`** - It's in `.gitignore`, keep it there
2. **Use parameterized queries** - Prevent SQL injection
3. **Rotate credentials periodically** - Update in Supabase dashboard
4. **Use connection pooling** - Better performance and resource management
5. **Close connections** - Always close when done (or use context managers)

## 🔍 Troubleshooting

### Connection fails
- Check that `.env` file exists and has correct credentials
- Verify network connectivity
- Check Supabase dashboard for service status

### "DATABASE_URL not found"
- Ensure `.env` file is in the project root
- Check that `python-dotenv` (Python) or `dotenv` (Node.js) is installed

### SSL/TLS errors
- Node.js: `ssl: { rejectUnauthorized: false }` is already configured
- Python: No special SSL config needed with Supabase

### Connection pool exhausted
- Close connections when done
- Increase `MAX_CONNECTIONS` in `.env` if needed
- Use connection pooling properly

## 📖 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [psycopg2 Documentation](https://www.psycopg.org/docs/)
- [node-postgres Documentation](https://node-postgres.com/)

## 🔄 For Future Sessions

To use the database in a new session:

1. Ensure `.env` file exists with credentials
2. Install dependencies (Python: `pip install -r requirements.txt`, Node.js: `npm install`)
3. Import the connection module
4. Start querying!

The connection configuration is persistent and ready to use anytime.

---

## 🧠 Knowledge Base RAG Setup

### Schema Initialization

✅ **Status: COMPLETED**

The KB RAG system schema has been initialized on Supabase:

**What was created:**
- ✅ pgvector extension enabled
- ✅ kb_chunks table with vector(1536) embeddings
- ✅ HNSW index for fast similarity search
- ✅ GIN indexes for tags and metadata
- ✅ search_kb() helper function
- ✅ kb_chunk_stats monitoring view
- ✅ Auto-update trigger

**Current state:**
- Table: `kb_chunks` (0 chunks, ready for ingestion)
- Indexes: 6 created
- Functions: search_kb() ready

The database is now ready for knowledge base ingestion.

### Schema Overview

The `kb_chunks` table stores knowledge base content with embeddings:

```sql
CREATE TABLE kb_chunks (
    id BIGSERIAL PRIMARY KEY,
    source_file TEXT NOT NULL,           -- Which MD file
    section_title TEXT,                  -- Markdown section heading
    content TEXT NOT NULL,               -- Actual chunk text
    tags TEXT[],                         -- Categories (archetype, framework, etc)
    metadata JSONB,                      -- Additional structured data
    embedding vector(1536),              -- OpenAI text-embedding-3-small
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    chunk_index INTEGER,                 -- Chunk number within file
    total_chunks INTEGER,                -- Total chunks in file
    char_count INTEGER                   -- Size of chunk
);
```

### Indexes

- **HNSW index** on embeddings for fast similarity search
- **GIN index** on tags for filtering
- **B-tree indexes** on source_file and created_at

### Helper Functions

**search_kb(query_embedding, match_threshold, match_count, filter_tags)**
- Semantic search with optional tag filtering
- Returns top K most similar chunks
- Example:
  ```sql
  SELECT * FROM search_kb(
      your_query_embedding,
      0.5,  -- similarity threshold
      10,   -- number of results
      ARRAY['archetype', 'story']  -- filter tags
  );
  ```

### Embedding Configuration

**Recommended: OpenAI text-embedding-3-small**
- Dimensions: 1536
- Cost: $0.02 per 1M tokens
- Quality: Excellent for semantic search
- Speed: Fast

**Alternative: Voyage AI voyage-2**
- Dimensions: 1024 (requires schema change to `vector(1024)`)
- Quality: Slightly better for some use cases
- Cost: Competitive

To change embedding provider:
1. Update `vector(1536)` in `sql/01_init_kb.sql`
2. Update `config.embedding.provider` in `scripts/config.js`
3. Re-run SQL setup
4. Re-ingest knowledge base

### Next Steps for Prompt 2

- [ ] Implement knowledge base ingestion script
- [ ] Add OpenAI API key to `.env`
- [ ] Test chunking strategy on sample MD files
- [ ] Verify embedding + insertion pipeline
- [ ] Build RAG retrieval helper functions
