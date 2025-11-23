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
