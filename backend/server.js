const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../')));

// Store for ongoing render jobs
const renderJobs = new Map();

/**
 * POST /api/generate-poster
 *
 * Generates high-resolution poster based on configuration
 *
 * Request body example:
 * {
 *   "layout": {
 *     "type": "single",   // "single", "double", "triple"
 *     "shape": "circle"    // "circle", "square", "heart"
 *   },
 *   "style": "minimal",   // Style name or "custom"
 *   "customColors": {     // Only if style is "custom"
 *     "land": "#F5F5DC",
 *     "roads": "#FFFFFF",
 *     "water": "#87CEEB",
 *     "background": "#FFFFFF"
 *   },
 *   "maps": [             // Array of map configurations (1 for single, 2 for double, 3 for triple)
 *     {
 *       "center": [-80.1918, 25.7617],
 *       "zoom": 13,
 *       "markers": [
 *         {
 *           "coordinates": [-80.1918, 25.7617],
 *           "icon": "heart",
 *           "color": "rgb(211, 59, 62)"
 *         }
 *       ],
 *       "title": {
 *         "enabled": true,
 *         "largeText": "MIAMI, UNITED STATES",
 *         "smallText": "25.7617° N, 80.1918° W",
 *         "font": "Poppins"
 *       }
 *     }
 *   ],
 *   "frame": {
 *     "enabled": true,
 *     "color": "white",
 *     "type": "40x30-white"
 *   },
 *   "print": {
 *     "width": 80,        // cm
 *     "height": 60,       // cm
 *     "dpi": 200,         // 150, 200, or 300
 *     "orientation": "landscape",  // "landscape" or "portrait"
 *     "format": "PNG"
 *   }
 * }
 */
app.post('/api/generate-poster', async (req, res) => {
    const jobId = Date.now().toString();

    try {
        console.log(`[${jobId}] Starting poster generation...`);
        console.log(`[${jobId}] Configuration:`, JSON.stringify(req.body, null, 2));

        const config = req.body;

        // Validate configuration
        if (!config.layout || !config.print) {
            return res.status(400).json({
                error: 'Invalid configuration: layout and print settings are required'
            });
        }

        // Calculate pixel dimensions
        const widthCm = config.print.width || 80;
        const heightCm = config.print.height || 60;
        const dpi = config.print.dpi || 200;

        // Sanity check for dimensions
        if (widthCm > 200 || heightCm > 200) {
            console.error(`[${jobId}] ERROR: Dimensions too large: ${widthCm}x${heightCm}cm`);
            return res.status(400).json({
                success: false,
                error: `Dimensions too large: ${widthCm}x${heightCm}cm. Maximum is 200x200cm. Please check your size selection.`,
                receivedConfig: { width: widthCm, height: heightCm, orientation: config.print.orientation }
            });
        }

        const widthPx = Math.round((widthCm / 2.54) * dpi);
        const heightPx = Math.round((heightCm / 2.54) * dpi);

        // Check pixel dimensions don't exceed reasonable limits
        const maxPixels = 20000; // Max dimension in pixels
        if (widthPx > maxPixels || heightPx > maxPixels) {
            console.error(`[${jobId}] ERROR: Pixel dimensions too large: ${widthPx}x${heightPx}px`);
            return res.status(400).json({
                success: false,
                error: `Resulting image would be too large: ${widthPx}x${heightPx}px. Please reduce size or DPI.`,
                receivedConfig: { widthCm, heightCm, dpi, widthPx, heightPx }
            });
        }

        console.log(`[${jobId}] Rendering dimensions: ${widthPx}x${heightPx}px (${widthCm}x${heightCm}cm @ ${dpi} DPI)`);

        // Store job status
        renderJobs.set(jobId, { status: 'rendering', progress: 0 });

        // Generate poster
        const outputPath = path.join(__dirname, 'output', `poster-${jobId}.png`);
        await generatePoster(config, outputPath, widthPx, heightPx, dpi, jobId);

        // Read the file and send as base64
        const imageBuffer = await fs.readFile(outputPath);
        const base64Image = imageBuffer.toString('base64');

        console.log(`[${jobId}] Poster generated successfully! Size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);

        // Clean up
        renderJobs.delete(jobId);

        res.json({
            success: true,
            jobId: jobId,
            image: `data:image/png;base64,${base64Image}`,
            downloadUrl: `/api/download/${jobId}`,
            metadata: {
                width: widthPx,
                height: heightPx,
                dpi: dpi,
                sizeInMB: (imageBuffer.length / 1024 / 1024).toFixed(2)
            }
        });

    } catch (error) {
        console.error(`[${jobId}] Error generating poster:`, error);
        renderJobs.delete(jobId);

        res.status(500).json({
            success: false,
            error: error.message,
            jobId: jobId
        });
    }
});

/**
 * GET /api/job/:jobId
 * Check job status
 */
app.get('/api/job/:jobId', (req, res) => {
    const job = renderJobs.get(req.params.jobId);
    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
});

/**
 * GET /api/download/:jobId
 * Download generated poster
 */
app.get('/api/download/:jobId', async (req, res) => {
    const outputPath = path.join(__dirname, 'output', `poster-${req.params.jobId}.png`);

    try {
        await fs.access(outputPath);
        res.download(outputPath, `custom-map-poster-${req.params.jobId}.png`);
    } catch (error) {
        res.status(404).json({ error: 'File not found' });
    }
});

/**
 * Main poster generation function
 */
async function generatePoster(config, outputPath, widthPx, heightPx, dpi, jobId) {
    let browser = null;

    try {
        console.log(`[${jobId}] Launching headless browser...`);

        // Detect if running in Docker or local environment
        const isDocker = process.env.PUPPETEER_EXECUTABLE_PATH !== undefined;

        // Chrome flags to enable WebGL and GPU rendering (required for Mapbox GL JS)
        // Different flags needed for Docker vs local
        const chromeArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            // GPU/WebGL flags - CRITICAL for Mapbox GL JS
            '--enable-features=UseSkiaRenderer',
            '--enable-webgl',
            '--enable-accelerated-2d-canvas',
            '--disable-software-rasterizer',
            '--ignore-gpu-blocklist',
            '--enable-gpu-rasterization',
            '--disable-gpu-sandbox',
            `--window-size=${widthPx},${heightPx}`
        ];

        // Add Docker-specific or macOS-specific GL flags
        if (isDocker) {
            // For Docker on ARM64 Mac, use SwiftShader (software rendering)
            chromeArgs.push('--use-gl=swiftshader'); // Software GL
            chromeArgs.push('--enable-unsafe-swiftshader');
            chromeArgs.push('--disable-gl-drawing-for-tests'); // Force software rendering
        } else {
            chromeArgs.push('--use-gl=swiftshader'); // SwiftShader for local
        }

        const launchOptions = {
            headless: true, // Use old headless mode (more compatible)
            args: chromeArgs,
            dumpio: true // Log browser console to terminal
        };

        // Use system Chrome on macOS, bundled Chrome in Docker
        if (!isDocker && process.platform === 'darwin') {
            launchOptions.executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
            console.log(`[${jobId}] Using system Chrome on macOS`);
        } else if (isDocker) {
            console.log(`[${jobId}] Using Docker bundled Chrome`);
        } else {
            console.log(`[${jobId}] Using Puppeteer bundled Chromium`);
        }

        browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();

        // Enable console output from the page
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            console.log(`[${jobId}] [BROWSER ${type.toUpperCase()}]:`, text);
        });

        // Log page errors
        page.on('pageerror', error => {
            console.error(`[${jobId}] [BROWSER ERROR]:`, error.message);
        });

        // Log failed requests
        page.on('requestfailed', request => {
            console.error(`[${jobId}] [REQUEST FAILED]:`, request.url(), request.failure().errorText);
        });

        // Set viewport to exact print dimensions
        // NOTE: We set deviceScaleFactor to 1 here because we handle DPI/pixel ratio
        // in the Mapbox map initialization itself (via pixelRatio parameter)
        await page.setViewport({
            width: widthPx,
            height: heightPx,
            deviceScaleFactor: 1 // Let Mapbox handle scaling via pixelRatio
        });

        console.log(`[${jobId}] Loading render template...`);

        // Load the render template
        const templatePath = `file://${path.join(__dirname, 'templates', 'render.html')}`;
        await page.goto(templatePath, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        console.log(`[${jobId}] Initializing map with configuration...`);

        // Pass configuration to the page
        await page.evaluate((config) => {
            window.initializeMapForPrint(config);
        }, config);

        // Wait for render to complete
        console.log(`[${jobId}] Waiting for map to render (timeout: 120s)...`);

        await page.waitForFunction(() => {
            return window.mapRenderComplete === true;
        }, { timeout: 120000 }); // 2 minute timeout

        console.log(`[${jobId}] Taking screenshot...`);

        // Take screenshot
        await page.screenshot({
            path: outputPath,
            type: 'png',
            fullPage: false,
            omitBackground: false
        });

        console.log(`[${jobId}] Screenshot saved to ${outputPath}`);

    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Poster Generation Backend running on http://localhost:${PORT}`);
    console.log(`\nEndpoints:`);
    console.log(`  POST   /api/generate-poster  - Generate high-res poster`);
    console.log(`  GET    /api/job/:jobId        - Check job status`);
    console.log(`  GET    /api/download/:jobId   - Download generated poster`);
    console.log(`  GET    /health                - Health check`);
    console.log(`\nReady to generate posters! 🎨\n`);
});
