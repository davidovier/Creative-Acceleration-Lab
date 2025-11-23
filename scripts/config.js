/**
 * Configuration for Knowledge Base RAG System
 * Central configuration for embedding, chunking, and database settings
 */

require('dotenv').config();

const config = {
    // ========================================================================
    // DATABASE CONFIGURATION
    // ========================================================================
    database: {
        connectionString: process.env.DATABASE_URL,
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },

    // ========================================================================
    // EMBEDDING CONFIGURATION
    // ========================================================================
    embedding: {
        // Provider: 'openai' | 'voyage' | 'cohere'
        provider: 'openai',

        // OpenAI settings
        openai: {
            apiKey: process.env.OPENAI_API_KEY,
            // Model options:
            // - 'text-embedding-3-small' (1536 dims, $0.02/1M tokens) - RECOMMENDED
            // - 'text-embedding-3-large' (3072 dims, $0.13/1M tokens)
            // - 'text-embedding-ada-002' (1536 dims, legacy)
            model: 'text-embedding-3-small',
            dimensions: 1536,
            batchSize: 100, // Max embeddings per API call
        },

        // Voyage AI settings (alternative, high-quality embeddings)
        voyage: {
            apiKey: process.env.VOYAGE_API_KEY,
            model: 'voyage-2',
            dimensions: 1024,
            batchSize: 128,
        },
    },

    // ========================================================================
    // CLAUDE API CONFIGURATION
    // ========================================================================
    claude: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        // Model options for different agents
        models: {
            // For most agents (balanced speed + quality)
            default: 'claude-3-5-sonnet-20241022',
            // For complex reasoning (slower, more expensive)
            reasoning: 'claude-3-opus-20240229',
            // For fast, simple tasks (verified working)
            fast: 'claude-3-haiku-20240307',
        },
        maxTokens: 4096,
        // Note: As of testing, only haiku model was accessible
        // Sonnet/Opus may require API tier upgrade
    },

    // ========================================================================
    // CHUNKING CONFIGURATION
    // ========================================================================
    chunking: {
        // Strategy: 'markdown-section' | 'fixed-size' | 'semantic'
        strategy: 'markdown-section',

        // Fixed-size chunking params
        chunkSize: 1000,        // Characters per chunk
        chunkOverlap: 200,      // Overlap between chunks

        // Markdown section params
        preserveSections: true, // Keep markdown sections intact
        maxSectionSize: 2000,   // Split large sections

        // Metadata to extract
        extractMetadata: true,

        // Minimum chunk size (ignore very small chunks)
        minChunkSize: 100,
    },

    // ========================================================================
    // KNOWLEDGE BASE PATHS
    // ========================================================================
    kb: {
        rootPath: '/Users/davidvos/Desktop/Creative Acceleration Lab',
        folders: [
            '01_Brand_Identity',
            '02_Service_Pillars',
            '03_Frameworks_Methodologies',
            '04_AI_Agents',
            '05_Operations_Business',
            '06_Marketing_Sales',
            '07_Creative_Resources',
            '08_Templates_Tools',
        ],
        // File patterns to include
        include: ['**/*.md'],
        // File patterns to exclude
        exclude: ['node_modules/**', '.git/**', 'README.md'],
    },

    // ========================================================================
    // RAG CONFIGURATION
    // ========================================================================
    rag: {
        // Number of chunks to retrieve per query
        topK: 5,

        // Minimum similarity threshold (0-1)
        similarityThreshold: 0.5,

        // Re-ranking enabled
        rerank: false,

        // Context window management
        maxContextLength: 8000, // Characters to send to Claude
    },

    // ========================================================================
    // AGENT CONFIGURATION
    // ========================================================================
    agents: {
        // Agent-specific RAG settings
        insightAgent: {
            topK: 5,
            focusTags: ['archetype', 'emotion', 'psychology'],
            systemPrompt: 'You are the Insight Agent...',
        },
        storyArchitect: {
            topK: 5,
            focusTags: ['narrative', 'story', 'metaphor'],
            systemPrompt: 'You are the Story Architect...',
        },
        prototypeEngineer: {
            topK: 5,
            focusTags: ['framework', 'prototype', 'technical'],
            systemPrompt: 'You are the Prototype Engineer...',
        },
        symbolWeaver: {
            topK: 5,
            focusTags: ['symbol', 'design', 'visual'],
            systemPrompt: 'You are the Symbol Weaver...',
        },
    },

    // ========================================================================
    // LOGGING & DEBUGGING
    // ========================================================================
    logging: {
        level: process.env.LOG_LEVEL || 'info', // 'debug' | 'info' | 'warn' | 'error'
        logToFile: false,
        logPath: './logs',
    },

    // ========================================================================
    // PERFORMANCE
    // ========================================================================
    performance: {
        // Parallel processing during ingestion
        maxConcurrentEmbeddings: 5,
        maxConcurrentFileReads: 10,

        // Caching
        cacheEmbeddings: true,
        cachePath: './cache',
    },
};

// ========================================================================
// VALIDATION
// ========================================================================
function validateConfig() {
    const required = [
        'DATABASE_URL',
        'SUPABASE_URL',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\nPlease check your .env file.');
        process.exit(1);
    }

    // Warn about missing API keys
    if (!process.env.OPENAI_API_KEY && config.embedding.provider === 'openai') {
        console.warn('⚠️  OPENAI_API_KEY not set. Embedding will fail.');
    }

    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('⚠️  ANTHROPIC_API_KEY not set. Claude agents will fail.');
    }

    console.log('✅ Configuration validated');
}

// Run validation if executed directly
if (require.main === module) {
    validateConfig();
    console.log('\n📋 Current Configuration:');
    console.log(`   Embedding Provider: ${config.embedding.provider}`);
    console.log(`   Embedding Model: ${config.embedding[config.embedding.provider].model}`);
    console.log(`   Embedding Dimensions: ${config.embedding[config.embedding.provider].dimensions}`);
    console.log(`   Chunking Strategy: ${config.chunking.strategy}`);
    console.log(`   KB Folders: ${config.kb.folders.length} folders`);
}

module.exports = { config, validateConfig };
