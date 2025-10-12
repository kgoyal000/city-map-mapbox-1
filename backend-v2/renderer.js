/**
 * Renderer Engine
 * Uses Puppeteer to render high-quality map posters
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { calculatePrintDimensions, calculateViewport } = require('./utils/scaler');

/**
 * Render a map poster to PNG
 * @param {Object} config - Complete configuration object
 * @param {string} outputPath - Path to save the PNG file
 * @param {Object} options - Rendering options
 * @returns {Promise<Object>} Render result with metadata
 */
async function renderPoster(config, outputPath, options = {}) {
    const {
        timeout = 120000, // 2 minutes default
        debug = false,
        jobId = Date.now().toString()
    } = options;

    let browser = null;
    const startTime = Date.now();

    try {
        console.log(`[${jobId}] Starting render...`);

        // Calculate dimensions for each map
        const mapsWithDimensions = config.maps.map(map => {
            const dimensions = calculatePrintDimensions({
                widthCm: config.print.widthCm,
                heightCm: config.print.heightCm,
                dpi: config.print.dpi,
                previewWidth: map.containerWidth,
                previewHeight: map.containerHeight
            });
            return { ...map, dimensions };
        });

        // Determine viewport size based on layout
        let viewport;
        const firstMapDimensions = mapsWithDimensions[0].dimensions;

        if (config.layout.type === 'single') {
            viewport = calculateViewport(firstMapDimensions);
        } else if (config.layout.type === 'double') {
            // Double layout: side by side
            viewport = {
                width: firstMapDimensions.render.widthPx * 2,
                height: firstMapDimensions.render.heightPx,
                deviceScaleFactor: firstMapDimensions.pixelRatio
            };
        } else if (config.layout.type === 'triple') {
            // Triple layout: side by side
            viewport = {
                width: firstMapDimensions.render.widthPx * 3,
                height: firstMapDimensions.render.heightPx,
                deviceScaleFactor: firstMapDimensions.pixelRatio
            };
        }

        console.log(`[${jobId}] Viewport: ${viewport.width}x${viewport.height} @ ${viewport.deviceScaleFactor}x`);

        // Launch browser
        browser = await launchBrowser(debug, jobId);
        const page = await browser.newPage();

        // Set up page logging
        setupPageLogging(page, jobId, debug);

        // Set viewport
        await page.setViewport(viewport);

        // Load print template
        const templatePath = `file://${path.join(__dirname, 'templates', 'print.html')}`;
        console.log(`[${jobId}] Loading template: ${templatePath}`);

        await page.goto(templatePath, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        console.log(`[${jobId}] Template loaded, initializing map...`);

        // Pass configuration to page
        const renderConfig = {
            layout: config.layout,
            maps: mapsWithDimensions,
            print: config.print
        };

        await page.evaluate((cfg) => {
            window.renderConfig = cfg;
            if (window.initializeMapForPrint) {
                window.initializeMapForPrint(cfg);
            }
        }, renderConfig);

        // Wait for rendering to complete
        console.log(`[${jobId}] Waiting for map rendering (timeout: ${timeout / 1000}s)...`);

        await page.waitForFunction(
            () => window.mapRenderComplete === true,
            { timeout }
        );

        console.log(`[${jobId}] Map rendered successfully!`);

        // Additional wait for tile loading stability
        console.log(`[${jobId}] Waiting 3s for tile loading to stabilize...`);
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Take screenshot
        console.log(`[${jobId}] Capturing screenshot...`);
        await page.screenshot({
            path: outputPath,
            type: 'png',
            fullPage: false,
            omitBackground: false
        });

        const renderTime = Date.now() - startTime;
        console.log(`[${jobId}] Screenshot saved to ${outputPath} (${renderTime}ms)`);

        // Get file stats
        const stats = await fs.stat(outputPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log(`[${jobId}] File size: ${fileSizeMB} MB`);

        return {
            success: true,
            outputPath,
            metadata: {
                width: viewport.width * viewport.deviceScaleFactor,
                height: viewport.height * viewport.deviceScaleFactor,
                pixelRatio: viewport.deviceScaleFactor,
                dpi: config.print.dpi,
                sizeInMB: fileSizeMB,
                renderTimeMs: renderTime
            }
        };

    } catch (error) {
        console.error(`[${jobId}] Render error:`, error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log(`[${jobId}] Browser closed`);
        }
    }
}

/**
 * Launch Puppeteer browser with optimal settings
 * @param {boolean} debug - Enable debug mode
 * @param {string} jobId - Job ID for logging
 * @returns {Promise<Browser>} Puppeteer browser instance
 */
async function launchBrowser(debug, jobId) {
    const isDocker = process.env.PUPPETEER_EXECUTABLE_PATH !== undefined;

    // Chrome flags optimized for Mapbox GL JS rendering
    const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        // WebGL and GPU acceleration (required for Mapbox)
        '--enable-webgl',
        '--use-gl=angle', // Use ANGLE for better macOS compatibility
        '--use-angle=swiftshader', // SwiftShader for software rendering
        '--enable-accelerated-2d-canvas',
        '--ignore-gpu-blocklist',
        '--disable-gpu-sandbox',
        // Memory and performance
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=VizDisplayCompositor'
    ];

    const launchOptions = {
        headless: 'new', // Use new headless mode with better WebGL support
        args,
        dumpio: debug // Log browser console to terminal in debug mode
    };

    // Use system Chrome on macOS for better performance
    if (!isDocker && process.platform === 'darwin') {
        const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        try {
            await fs.access(chromePath);
            launchOptions.executablePath = chromePath;
            console.log(`[${jobId}] Using system Chrome on macOS`);
        } catch {
            console.log(`[${jobId}] Using Puppeteer bundled Chromium`);
        }
    } else if (isDocker) {
        console.log(`[${jobId}] Using Docker bundled Chrome`);
    } else {
        console.log(`[${jobId}] Using Puppeteer bundled Chromium`);
    }

    return await puppeteer.launch(launchOptions);
}

/**
 * Set up page event logging
 * @param {Page} page - Puppeteer page
 * @param {string} jobId - Job ID
 * @param {boolean} debug - Enable debug mode
 */
function setupPageLogging(page, jobId, debug) {
    // Console messages from the page
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (debug || type === 'error' || type === 'warning') {
            console.log(`[${jobId}] [BROWSER ${type.toUpperCase()}]:`, text);
        }
    });

    // Page errors
    page.on('pageerror', error => {
        console.error(`[${jobId}] [PAGE ERROR]:`, error.message);
    });

    // Failed requests
    page.on('requestfailed', request => {
        console.error(`[${jobId}] [REQUEST FAILED]:`, request.url(), request.failure().errorText);
    });

    // Optional: Response errors
    page.on('response', response => {
        if (!response.ok() && debug) {
            console.warn(`[${jobId}] [RESPONSE ${response.status()}]:`, response.url());
        }
    });
}

module.exports = {
    renderPoster
};
