/**
 * Map Poster Generator Backend V2
 * High-quality poster generation with exact frontend parity
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { validateConfig, sanitizeConfig } = require('./utils/validator');
const { renderPoster } = require('./renderer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../')));

// Ensure output directory exists
const OUTPUT_DIR = path.join(__dirname, 'output');
fs.mkdir(OUTPUT_DIR, { recursive: true }).catch(console.error);

// Active jobs tracking
const jobs = new Map();

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /api/v2/generate
 * Generate high-resolution poster
 *
 * Expected request body:
 * {
 *   "config": {
 *     "layout": { "type": "single|double|triple", "shape": "circle|square|heart" },
 *     "maps": [
 *       {
 *         "center": [lng, lat],
 *         "zoom": 15,
 *         "bearing": 0,
 *         "pitch": 0,
 *         "style": "mapbox://styles/...",
 *         "containerWidth": 640,
 *         "containerHeight": 640,
 *         "markers": [...],
 *         "title": {...}
 *       }
 *     ],
 *     "print": {
 *       "widthCm": 80,
 *       "heightCm": 60,
 *       "dpi": 200
 *     }
 *   },
 *   "options": {
 *     "timeout": 120000,
 *     "debug": false
 *   }
 * }
 */
app.post('/api/v2/generate', async (req, res) => {
    const jobId = Date.now().toString();

    try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`[${jobId}] NEW POSTER GENERATION REQUEST`);
        console.log(`${'='.repeat(60)}\n`);

        const { config, options = {} } = req.body;

        if (!config) {
            return res.status(400).json({
                success: false,
                error: 'Configuration is required'
            });
        }

        // Validate configuration
        const validation = validateConfig(config);
        if (!validation.valid) {
            console.error(`[${jobId}] Validation failed:`, validation.errors);
            return res.status(400).json({
                success: false,
                error: 'Invalid configuration',
                details: validation.errors
            });
        }

        // Sanitize and add defaults
        const sanitizedConfig = sanitizeConfig(config);

        console.log(`[${jobId}] Configuration validated successfully`);
        console.log(`[${jobId}] Layout: ${sanitizedConfig.layout.type} / ${sanitizedConfig.layout.shape}`);
        console.log(`[${jobId}] Maps: ${sanitizedConfig.maps.length}`);
        console.log(`[${jobId}] Print: ${sanitizedConfig.print.widthCm}x${sanitizedConfig.print.heightCm}cm @ ${sanitizedConfig.print.dpi} DPI`);

        // Track job
        jobs.set(jobId, {
            status: 'rendering',
            startTime: Date.now(),
            config: sanitizedConfig
        });

        // Generate output path
        const outputPath = path.join(OUTPUT_DIR, `poster-${jobId}.png`);

        // Render poster
        const renderOptions = {
            jobId,
            timeout: options.timeout || 120000,
            debug: options.debug || false
        };

        const result = await renderPoster(sanitizedConfig, outputPath, renderOptions);

        // Read file and convert to base64
        const imageBuffer = await fs.readFile(outputPath);
        const base64Image = imageBuffer.toString('base64');

        // Update job status
        jobs.set(jobId, {
            status: 'completed',
            completedTime: Date.now(),
            outputPath
        });

        console.log(`\n${'='.repeat(60)}`);
        console.log(`[${jobId}] POSTER GENERATION COMPLETED`);
        console.log(`[${jobId}] Size: ${result.metadata.sizeInMB} MB`);
        console.log(`[${jobId}] Time: ${result.metadata.renderTimeMs}ms`);
        console.log(`${'='.repeat(60)}\n`);

        // Send response
        res.json({
            success: true,
            jobId,
            image: `data:image/png;base64,${base64Image}`,
            downloadUrl: `/api/v2/download/${jobId}`,
            metadata: {
                width: result.metadata.width,
                height: result.metadata.height,
                pixelRatio: result.metadata.pixelRatio,
                dpi: result.metadata.dpi,
                sizeInMB: result.metadata.sizeInMB,
                renderTimeMs: result.metadata.renderTimeMs
            }
        });

    } catch (error) {
        console.error(`\n[${jobId}] ERROR:`, error.message);
        console.error(error.stack);

        jobs.set(jobId, {
            status: 'failed',
            error: error.message,
            failedTime: Date.now()
        });

        res.status(500).json({
            success: false,
            jobId,
            error: error.message
        });
    }
});

/**
 * GET /api/v2/download/:jobId
 * Download generated poster
 */
app.get('/api/v2/download/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const outputPath = path.join(OUTPUT_DIR, `poster-${jobId}.png`);

    try {
        await fs.access(outputPath);
        res.download(outputPath, `map-poster-${jobId}.png`);
    } catch (error) {
        res.status(404).json({
            success: false,
            error: 'Poster not found'
        });
    }
});

/**
 * GET /api/v2/job/:jobId
 * Get job status
 */
app.get('/api/v2/job/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({
            success: false,
            error: 'Job not found'
        });
    }

    res.json({
        success: true,
        jobId,
        status: job.status,
        ...job
    });
});

/**
 * GET /api/v2/jobs
 * List all jobs (for debugging)
 */
app.get('/api/v2/jobs', (req, res) => {
    const jobList = Array.from(jobs.entries()).map(([id, job]) => ({
        jobId: id,
        status: job.status,
        startTime: job.startTime,
        completedTime: job.completedTime,
        failedTime: job.failedTime
    }));

    res.json({
        success: true,
        jobs: jobList,
        total: jobList.length
    });
});

/**
 * DELETE /api/v2/job/:jobId
 * Delete a job and its output file
 */
app.delete('/api/v2/job/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const outputPath = path.join(OUTPUT_DIR, `poster-${jobId}.png`);

    try {
        await fs.unlink(outputPath);
        jobs.delete(jobId);

        res.json({
            success: true,
            message: 'Job and output file deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Cleanup old jobs (run every hour)
 */
setInterval(async () => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [jobId, job] of jobs.entries()) {
        const jobTime = job.completedTime || job.failedTime || job.startTime;
        if (now - jobTime > maxAge) {
            const outputPath = path.join(OUTPUT_DIR, `poster-${jobId}.png`);
            try {
                await fs.unlink(outputPath);
                jobs.delete(jobId);
                console.log(`[CLEANUP] Deleted old job: ${jobId}`);
            } catch (error) {
                // File might already be deleted
            }
        }
    }
}, 60 * 60 * 1000); // Run every hour

// Start server
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀  MAP POSTER GENERATOR V2');
    console.log('='.repeat(60));
    console.log(`\n📍  Server: http://localhost:${PORT}`);
    console.log(`\n📋  Endpoints:`);
    console.log(`    POST   /api/v2/generate       - Generate poster`);
    console.log(`    GET    /api/v2/download/:id   - Download poster`);
    console.log(`    GET    /api/v2/job/:id        - Get job status`);
    console.log(`    GET    /api/v2/jobs           - List all jobs`);
    console.log(`    DELETE /api/v2/job/:id        - Delete job`);
    console.log(`    GET    /health                - Health check`);
    console.log(`\n✨  Ready to generate high-quality posters!\n`);
    console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});
