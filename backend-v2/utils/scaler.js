/**
 * Scaler Utility
 * Calculates proper dimensions and scaling factors for high-resolution printing
 */

/**
 * Calculate print dimensions and scaling factors
 *
 * @param {Object} config - Configuration object
 * @param {number} config.widthCm - Print width in centimeters
 * @param {number} config.heightCm - Print height in centimeters
 * @param {number} config.dpi - Dots per inch (150, 200, or 300)
 * @param {number} config.previewWidth - Frontend preview width in pixels
 * @param {number} config.previewHeight - Frontend preview height in pixels
 * @returns {Object} Scaling information
 */
function calculatePrintDimensions(config) {
    const {
        widthCm,
        heightCm,
        dpi = 200,
        previewWidth = 640,
        previewHeight = 640
    } = config;

    // Convert cm to inches (1 inch = 2.54 cm)
    const widthInches = widthCm / 2.54;
    const heightInches = heightCm / 2.54;

    // Calculate pixel dimensions for print
    const printWidthPx = Math.round(widthInches * dpi);
    const printHeightPx = Math.round(heightInches * dpi);

    // Use the actual print dimensions for rendering (not preview dimensions)
    // This ensures the output matches the selected poster size ratio
    const renderWidth = printWidthPx;
    const renderHeight = printHeightPx;

    // Calculate scaling factors based on preview
    const scaleX = printWidthPx / previewWidth;
    const scaleY = printHeightPx / previewHeight;
    const scale = Math.max(scaleX, scaleY); // Use maximum to ensure full coverage

    // Calculate device pixel ratio for high-quality rendering
    // Match frontend formula: devicePixelRatio * 1.5, capped at 3
    // For print: use DPI-based calculation
    // ADAPTIVE: Reduce pixelRatio for very large posters to avoid GPU memory limits
    let devicePixelRatio = Math.min((dpi / 96) * 1.5, 3);

    // Calculate total pixel count for the final render
    const totalPixels = renderWidth * renderHeight * devicePixelRatio * devicePixelRatio;
    const maxSafePixels = 20000000; // 20 million pixels (~4472x4472 at 1x)

    // If exceeds safe limit, reduce pixelRatio adaptively
    if (totalPixels > maxSafePixels) {
        const reductionFactor = Math.sqrt(maxSafePixels / (renderWidth * renderHeight));
        devicePixelRatio = Math.max(1.0, Math.min(devicePixelRatio, reductionFactor));
        console.log(`[SCALER] Large poster detected. Reducing pixelRatio from ${Math.min((dpi / 96) * 1.5, 3).toFixed(2)} to ${devicePixelRatio.toFixed(2)} to avoid GPU limits`);
    }

    return {
        print: {
            widthPx: printWidthPx,
            heightPx: printHeightPx,
            widthCm,
            heightCm,
            dpi
        },
        preview: {
            widthPx: previewWidth,
            heightPx: previewHeight
        },
        render: {
            widthPx: renderWidth,
            heightPx: renderHeight,
            scale,
            scaleX,
            scaleY
        },
        pixelRatio: devicePixelRatio,
        // Calculate marker and text scaling
        markerScale: scale,
        textScale: scale,
        // Estimated file size (rough calculation)
        estimatedSizeMB: (renderWidth * renderHeight * devicePixelRatio * devicePixelRatio * 4) / (1024 * 1024)
    };
}

/**
 * Calculate scaled marker size
 * @param {number} baseSize - Base marker size (e.g., 35px)
 * @param {number} scale - Scaling factor
 * @returns {number} Scaled marker size
 */
function scaleMarkerSize(baseSize, scale) {
    return Math.round(baseSize * scale);
}

/**
 * Calculate scaled font size
 * @param {number} baseFontSize - Base font size (e.g., 48px)
 * @param {number} scale - Scaling factor
 * @returns {number} Scaled font size
 */
function scaleFontSize(baseFontSize, scale) {
    return Math.round(baseFontSize * scale);
}

/**
 * Validate and normalize print configuration
 * @param {Object} printConfig - Print configuration
 * @returns {Object} Normalized configuration
 */
function normalizePrintConfig(printConfig) {
    const {
        widthCm = 80,
        heightCm = 60,
        dpi = 200,
        orientation = 'landscape'
    } = printConfig || {};

    // Ensure valid DPI
    const validDPI = [150, 200, 300].includes(dpi) ? dpi : 200;

    // Apply orientation
    let finalWidth = widthCm;
    let finalHeight = heightCm;

    if (orientation === 'portrait' && widthCm > heightCm) {
        finalWidth = heightCm;
        finalHeight = widthCm;
    } else if (orientation === 'landscape' && heightCm > widthCm) {
        finalWidth = heightCm;
        finalHeight = widthCm;
    }

    return {
        widthCm: finalWidth,
        heightCm: finalHeight,
        dpi: validDPI,
        orientation
    };
}

/**
 * Calculate viewport dimensions for Puppeteer
 * This ensures the viewport matches the aspect ratio needed
 * @param {Object} dimensions - Dimension object from calculatePrintDimensions
 * @returns {Object} Viewport configuration
 */
function calculateViewport(dimensions) {
    return {
        width: dimensions.render.widthPx,
        height: dimensions.render.heightPx,
        deviceScaleFactor: dimensions.pixelRatio
    };
}

module.exports = {
    calculatePrintDimensions,
    scaleMarkerSize,
    scaleFontSize,
    normalizePrintConfig,
    calculateViewport
};
