/**
 * Supabase Database Connection Module (Node.js)
 * Provides connection pooling and query execution for the Creative Acceleration Lab
 */

require('dotenv').config();
const { Pool } = require('pg');

class DatabaseConnection {
    constructor() {
        this.connectionString = process.env.DATABASE_URL;
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.pool = null;

        if (!this.connectionString) {
            throw new Error('DATABASE_URL environment variable not set. Check your .env file.');
        }
    }

    /**
     * Get a connection pool
     * Reuses the same pool for efficiency
     */
    getPool() {
        if (!this.pool) {
            this.pool = new Pool({
                connectionString: this.connectionString,
                ssl: {
                    rejectUnauthorized: false
                },
                max: parseInt(process.env.MAX_CONNECTIONS || '20'),
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });

            // Handle pool errors
            this.pool.on('error', (err) => {
                console.error('Unexpected error on idle client', err);
            });
        }

        return this.pool;
    }

    /**
     * Execute a query
     *
     * @param {string} queryText - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object>} Query result
     *
     * Usage:
     *   const db = new DatabaseConnection();
     *   const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
     *   console.log(result.rows);
     */
    async query(queryText, params = []) {
        const pool = this.getPool();
        try {
            const result = await pool.query(queryText, params);
            return result;
        } catch (error) {
            console.error('Query error:', error);
            throw error;
        }
    }

    /**
     * Execute a transaction
     *
     * @param {Function} callback - Async function that receives a client
     * @returns {Promise<any>} Transaction result
     *
     * Usage:
     *   const db = new DatabaseConnection();
     *   await db.transaction(async (client) => {
     *       await client.query('INSERT INTO users (name) VALUES ($1)', ['John']);
     *       await client.query('INSERT INTO logs (action) VALUES ($1)', ['User created']);
     *   });
     */
    async transaction(callback) {
        const pool = this.getPool();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Transaction error:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Test the database connection
     *
     * @returns {Promise<boolean>} True if connection successful
     */
    async testConnection() {
        try {
            const result = await this.query('SELECT 1 as test');
            return result.rows[0].test === 1;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    /**
     * Close the connection pool
     * Call this when shutting down the application
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
}

// Singleton instance for convenience
let dbInstance = null;

/**
 * Get the database singleton instance
 *
 * Usage:
 *   const { getDB } = require('./db_connection');
 *   const db = getDB();
 *   const result = await db.query('SELECT * FROM users');
 */
function getDB() {
    if (!dbInstance) {
        dbInstance = new DatabaseConnection();
    }
    return dbInstance;
}

// Test connection if run directly
if (require.main === module) {
    (async () => {
        console.log('Testing database connection...');
        const db = new DatabaseConnection();

        const isConnected = await db.testConnection();

        if (isConnected) {
            console.log('✅ Database connection successful!');
            console.log(`Connected to: ${db.supabaseUrl}`);
        } else {
            console.log('❌ Database connection failed!');
            console.log('Please check your .env file and credentials.');
        }

        await db.close();
        process.exit(isConnected ? 0 : 1);
    })();
}

module.exports = {
    DatabaseConnection,
    getDB
};
