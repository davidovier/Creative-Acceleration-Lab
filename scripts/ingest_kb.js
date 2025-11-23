/**
 * KB Ingestion Script
 * Walks all KB folders, chunks markdown files, generates embeddings, and inserts into Supabase
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const OpenAI = require('openai');
const { getDB } = require('../db_connection.js');
const { config } = require('./config.js');
const { getRateLimiter } = require('./rate-limiter.js');

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: config.embedding.openai.apiKey });

// ANSI colors for better CLI output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Calculate hash for content deduplication
 */
function hashContent(content) {
    return crypto.createHash('md5').update(content.trim()).digest('hex');
}

/**
 * Sanitize unicode and weird characters
 */
function sanitizeText(text) {
    return text
        // Normalize unicode
        .normalize('NFKD')
        // Remove null bytes
        .replace(/\0/g, '')
        // Replace smart quotes
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        // Replace em/en dashes
        .replace(/[\u2013\u2014]/g, '-')
        // Replace ellipsis
        .replace(/\u2026/g, '...')
        // Remove other problematic unicode
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Extract tags from markdown content
 */
function extractTags(content, sectionTitle, fileName) {
    const tags = [];

    // Add folder-based tag
    const folderMatch = fileName.match(/\/(\d+_[^\/]+)\//);
    if (folderMatch) {
        tags.push(folderMatch[1]);
    }

    // Add tags from common keywords
    const keywords = {
        'archetype': ['archetype', 'persona', 'character'],
        'framework': ['framework', 'methodology', 'approach'],
        'technical': ['code', 'api', 'technical', 'development'],
        'creative': ['creative', 'design', 'visual', 'art'],
        'story': ['story', 'narrative', 'myth', 'hero'],
        'emotion': ['emotion', 'feeling', 'psychological'],
        'business': ['business', 'revenue', 'pricing', 'model'],
        'marketing': ['marketing', 'sales', 'audience'],
    };

    const lowerContent = (content + ' ' + sectionTitle).toLowerCase();

    for (const [tag, patterns] of Object.entries(keywords)) {
        if (patterns.some(pattern => lowerContent.includes(pattern))) {
            tags.push(tag);
        }
    }

    return [...new Set(tags)]; // Remove duplicates
}

/**
 * Chunk markdown content by sections
 */
function chunkMarkdown(content, sourceFile) {
    const chunks = [];

    // Split by ## headers (markdown sections)
    const sections = content.split(/(?=^##\s)/m);

    for (let sectionContent of sections) {
        sectionContent = sanitizeText(sectionContent);

        // Skip empty sections
        if (!sectionContent || sectionContent.length < 50) {
            continue;
        }

        // Extract section title
        const titleMatch = sectionContent.match(/^##\s+(.+?)$/m);
        const sectionTitle = titleMatch ? titleMatch[1].trim() : null;

        // If section is too long, split it further
        const maxChunkSize = config.chunking.maxSectionSize || 1200;

        if (sectionContent.length <= maxChunkSize) {
            // Section fits in one chunk
            chunks.push({
                content: sectionContent,
                sectionTitle: sectionTitle,
                sourceFile: sourceFile,
            });
        } else {
            // Split large section into smaller chunks
            const paragraphs = sectionContent.split(/\n\n+/);
            let currentChunk = '';
            let chunkIndex = 0;

            for (const paragraph of paragraphs) {
                const testChunk = currentChunk + '\n\n' + paragraph;

                if (testChunk.length > maxChunkSize && currentChunk) {
                    // Save current chunk
                    chunks.push({
                        content: sanitizeText(currentChunk),
                        sectionTitle: sectionTitle ? `${sectionTitle} (${chunkIndex + 1})` : null,
                        sourceFile: sourceFile,
                    });
                    currentChunk = paragraph;
                    chunkIndex++;
                } else {
                    currentChunk = testChunk;
                }
            }

            // Save final chunk
            if (currentChunk.trim()) {
                chunks.push({
                    content: sanitizeText(currentChunk),
                    sectionTitle: sectionTitle ? `${sectionTitle} (${chunkIndex + 1})` : null,
                    sourceFile: sourceFile,
                });
            }
        }
    }

    return chunks;
}

/**
 * Generate embeddings with retry logic and rate limiting
 */
async function embedText(text, retries = 3) {
    const limiter = getRateLimiter();

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await openai.embeddings.create({
                model: config.embedding.openai.model,
                input: text,
                dimensions: config.embedding.openai.dimensions,
            });

            // Track cost
            const tokens = response.usage.total_tokens;
            const cost = limiter.estimateEmbeddingCost(tokens);

            await limiter.logCost({
                provider: 'openai',
                endpoint: 'embeddings',
                model: config.embedding.openai.model,
                inputTokens: tokens,
                outputTokens: 0,
                cost: cost,
                ip: '127.0.0.1', // Local script
                requestId: response.id || null,
            });

            return {
                embedding: response.data[0].embedding,
                tokens: tokens,
                cost: cost,
            };

        } catch (error) {
            if (attempt < retries - 1) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                log(`  ⚠️  Retry ${attempt + 1}/${retries} after ${delay}ms: ${error.message}`, 'yellow');
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
}

/**
 * Batch embed chunks (up to 100 at a time per OpenAI limits)
 */
async function batchEmbedChunks(chunks) {
    const batchSize = config.embedding.openai.batchSize || 100;
    const results = [];
    let totalCost = 0;
    let totalTokens = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const batchTexts = batch.map(c => c.content);

        log(`  🔄 Embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} (${batch.length} chunks)...`, 'cyan');

        try {
            const response = await openai.embeddings.create({
                model: config.embedding.openai.model,
                input: batchTexts,
                dimensions: config.embedding.openai.dimensions,
            });

            const limiter = getRateLimiter();
            const tokens = response.usage.total_tokens;
            const cost = limiter.estimateEmbeddingCost(tokens);

            totalTokens += tokens;
            totalCost += cost;

            // Track cost
            await limiter.logCost({
                provider: 'openai',
                endpoint: 'embeddings',
                model: config.embedding.openai.model,
                inputTokens: tokens,
                outputTokens: 0,
                cost: cost,
                ip: '127.0.0.1',
                requestId: response.id || null,
            });

            // Pair embeddings with chunks
            for (let j = 0; j < batch.length; j++) {
                results.push({
                    ...batch[j],
                    embedding: response.data[j].embedding,
                });
            }

            log(`  ✅ Embedded ${batch.length} chunks (${tokens} tokens, $${cost.toFixed(6)})`, 'green');

        } catch (error) {
            log(`  ❌ Batch embedding failed: ${error.message}`, 'red');
            throw error;
        }

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < chunks.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    log(`  💰 Total embeddings: ${totalTokens} tokens, $${totalCost.toFixed(6)}`, 'magenta');

    return results;
}

/**
 * Insert chunks into database with deduplication
 */
async function insertChunks(chunks, db) {
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const chunk of chunks) {
        try {
            const contentHash = hashContent(chunk.content);
            const tags = extractTags(chunk.content, chunk.sectionTitle || '', chunk.sourceFile);

            // Check if chunk already exists
            const existingCheck = await db.query(`
                SELECT id FROM kb_chunks
                WHERE source_file = $1
                AND section_title = $2
                AND content = $3
                LIMIT 1
            `, [chunk.sourceFile, chunk.sectionTitle, chunk.content]);

            if (existingCheck.rows.length > 0) {
                skipped++;
                continue;
            }

            // Insert chunk
            await db.query(`
                INSERT INTO kb_chunks (
                    source_file,
                    section_title,
                    content,
                    tags,
                    embedding,
                    char_count,
                    metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                chunk.sourceFile,
                chunk.sectionTitle,
                chunk.content,
                tags,
                JSON.stringify(chunk.embedding), // pgvector accepts JSON array
                chunk.content.length,
                JSON.stringify({ content_hash: contentHash }),
            ]);

            inserted++;

        } catch (error) {
            errors++;
            log(`  ❌ Insert error: ${error.message}`, 'red');
        }
    }

    return { inserted, skipped, errors };
}

/**
 * Walk directory and find all markdown files
 */
function findMarkdownFiles(rootPath, folders) {
    const files = [];

    for (const folder of folders) {
        const folderPath = path.join(rootPath, folder);

        if (!fs.existsSync(folderPath)) {
            log(`  ⚠️  Folder not found: ${folder}`, 'yellow');
            continue;
        }

        const entries = fs.readdirSync(folderPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(folderPath, entry.name);

            if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (['.md', '.mdx', '.txt'].includes(ext)) {
                    files.push(fullPath);
                }
            } else if (entry.isDirectory()) {
                // Recursively search subdirectories
                const subFiles = findMarkdownFilesRecursive(fullPath);
                files.push(...subFiles);
            }
        }
    }

    return files;
}

/**
 * Recursive helper for finding markdown files
 */
function findMarkdownFilesRecursive(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (['.md', '.mdx', '.txt'].includes(ext)) {
                files.push(fullPath);
            }
        } else if (entry.isDirectory()) {
            files.push(...findMarkdownFilesRecursive(fullPath));
        }
    }

    return files;
}

/**
 * Main ingestion function
 */
async function ingestKB() {
    const startTime = Date.now();

    log('\n╔═══════════════════════════════════════════════════════════════╗', 'cyan');
    log('║          KB INGESTION PIPELINE - STARTING                     ║', 'cyan');
    log('╚═══════════════════════════════════════════════════════════════╝\n', 'cyan');

    try {
        // Initialize database
        log('📊 Connecting to database...', 'blue');
        const db = getDB();
        log('✅ Database connected\n', 'green');

        // Find all markdown files
        log('📁 Scanning KB folders...', 'blue');
        const files = findMarkdownFiles(config.kb.rootPath, config.kb.folders);
        log(`✅ Found ${files.length} markdown files\n`, 'green');

        if (files.length === 0) {
            log('⚠️  No files found. Check your KB folder paths.', 'yellow');
            return;
        }

        let totalChunks = 0;
        let totalInserted = 0;
        let totalSkipped = 0;
        let totalErrors = 0;
        const allChunks = [];

        // Process each file
        log('📝 Processing files and chunking...', 'blue');
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const relativePath = path.relative(config.kb.rootPath, file);

            log(`\n[${i + 1}/${files.length}] ${relativePath}`, 'cyan');

            try {
                // Read file
                const content = fs.readFileSync(file, 'utf-8');

                // Chunk content
                const chunks = chunkMarkdown(content, relativePath);

                if (chunks.length === 0) {
                    log('  ⚠️  No chunks created (file too short or no sections)', 'yellow');
                    continue;
                }

                log(`  ✅ Created ${chunks.length} chunks`, 'green');
                totalChunks += chunks.length;
                allChunks.push(...chunks);

            } catch (error) {
                log(`  ❌ Error processing file: ${error.message}`, 'red');
                totalErrors++;
            }
        }

        log(`\n✅ Total chunks created: ${totalChunks}\n`, 'green');

        if (totalChunks === 0) {
            log('⚠️  No chunks to embed. Exiting.', 'yellow');
            return;
        }

        // Generate embeddings
        log('🔮 Generating embeddings...', 'blue');
        const embeddedChunks = await batchEmbedChunks(allChunks);
        log(`✅ Generated ${embeddedChunks.length} embeddings\n`, 'green');

        // Insert into database
        log('💾 Inserting chunks into database...', 'blue');
        const result = await insertChunks(embeddedChunks, db);
        totalInserted = result.inserted;
        totalSkipped = result.skipped;
        totalErrors += result.errors;

        // Final summary
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        log('\n╔═══════════════════════════════════════════════════════════════╗', 'green');
        log('║          KB INGESTION COMPLETE                                ║', 'green');
        log('╚═══════════════════════════════════════════════════════════════╝\n', 'green');

        log('📊 Summary:', 'cyan');
        log(`   Files scanned:      ${files.length}`, 'cyan');
        log(`   Chunks created:     ${totalChunks}`, 'cyan');
        log(`   Chunks inserted:    ${totalInserted}`, 'green');
        log(`   Chunks skipped:     ${totalSkipped}`, 'yellow');
        log(`   Errors:             ${totalErrors}`, totalErrors > 0 ? 'red' : 'cyan');
        log(`   Duration:           ${duration}s`, 'cyan');

        // Verify database
        log('\n🔍 Verifying database...', 'blue');
        const countResult = await db.query('SELECT COUNT(*) as total FROM kb_chunks');
        log(`✅ Total chunks in database: ${countResult.rows[0].total}\n`, 'green');

        process.exit(0);

    } catch (error) {
        log(`\n❌ FATAL ERROR: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    }
}

// Run ingestion if executed directly
if (require.main === module) {
    ingestKB();
}

module.exports = { ingestKB, chunkMarkdown, embedText, sanitizeText };
