/**
 * Export Utility for Frontend
 * Captures current map state and sends to backend for high-resolution rendering
 */

/**
 * Get the actual container dimensions of a map
 * @param {HTMLElement} container - Map container element
 * @returns {Object} Width and height in pixels
 */
function getContainerDimensions(container) {
    const rect = container.getBoundingClientRect();
    return {
        width: Math.round(rect.width),
        height: Math.round(rect.height)
    };
}

/**
 * Export current map state to configuration object
 * @param {mapboxgl.Map} map - Mapbox map instance
 * @param {HTMLElement} container - Map container element
 * @param {Array} markers - Array of marker objects (optional)
 * @param {Object} title - Title configuration (optional)
 * @returns {Object} Map configuration
 */
function exportMapState(map, container, markers = [], title = null) {
    const dimensions = getContainerDimensions(container);
    const center = map.getCenter();

    return {
        center: [center.lng, center.lat],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
        style: map.getStyle().sprite ? map.getStyle().sprite.replace('/sprite', '') : mapStyles[currentStyle],
        containerWidth: dimensions.width,
        containerHeight: dimensions.height,
        markers: markers,
        title: title
    };
}

/**
 * Generate poster configuration from current UI state
 * @param {string} layout - Layout type ('single', 'double', 'triple')
 * @param {string} shape - Shape type ('circle', 'square', 'heart')
 * @param {Object} printSettings - Print settings { widthCm, heightCm, dpi }
 * @returns {Object} Complete configuration for backend
 */
function generatePosterConfig(layout, shape, printSettings) {
    const config = {
        layout: {
            type: layout,
            shape: shape
        },
        maps: [],
        print: {
            widthCm: printSettings.widthCm || 80,
            heightCm: printSettings.heightCm || 60,
            dpi: printSettings.dpi || 200,
            orientation: printSettings.orientation || 'landscape'
        }
    };

    // Export map states based on layout
    if (layout === 'single' && map) {
        const container = document.getElementById('map');
        const mapMarkers = currentMarker ? [{
            coordinates: [currentMarker.getLngLat().lng, currentMarker.getLngLat().lat],
            icon: currentMarkerIcon || 'heart',
            color: currentMarkerColor || 'rgb(211, 59, 62)'
        }] : [];

        // Get title from UI
        const titleEnabled = document.querySelector('.title-overlay')?.style.display !== 'none';
        const titleConfig = titleEnabled ? {
            enabled: true,
            largeText: document.querySelector('.main-title')?.value || '',
            smallText: document.querySelector('.sub-title')?.value || '',
            font: currentFont || 'Poppins'
        } : null;

        config.maps.push(exportMapState(map, container, mapMarkers, titleConfig));

    } else if (layout === 'double' && map1 && map2) {
        // Export first map
        const container1 = document.getElementById('map1');
        const markers1 = currentMarker1 ? [{
            coordinates: [currentMarker1.getLngLat().lng, currentMarker1.getLngLat().lat],
            icon: markerSettings['double-1']?.iconElement || 'heart',
            color: markerSettings['double-1']?.color || 'rgb(211, 59, 62)'
        }] : [];
        config.maps.push(exportMapState(map1, container1, markers1));

        // Export second map
        const container2 = document.getElementById('map2');
        const markers2 = currentMarker2 ? [{
            coordinates: [currentMarker2.getLngLat().lng, currentMarker2.getLngLat().lat],
            icon: markerSettings['double-2']?.iconElement || 'heart',
            color: markerSettings['double-2']?.color || 'rgb(211, 59, 62)'
        }] : [];
        config.maps.push(exportMapState(map2, container2, markers2));

    } else if (layout === 'triple' && map1Triple && map2Triple && map3Triple) {
        // Export all three maps
        const container1 = document.getElementById('map1-triple');
        const markers1 = currentMarker1Triple ? [{
            coordinates: [currentMarker1Triple.getLngLat().lng, currentMarker1Triple.getLngLat().lat],
            icon: markerSettings['triple-1']?.iconElement || 'heart',
            color: markerSettings['triple-1']?.color || 'rgb(211, 59, 62)'
        }] : [];
        config.maps.push(exportMapState(map1Triple, container1, markers1));

        const container2 = document.getElementById('map2-triple');
        const markers2 = currentMarker2Triple ? [{
            coordinates: [currentMarker2Triple.getLngLat().lng, currentMarker2Triple.getLngLat().lat],
            icon: markerSettings['triple-2']?.iconElement || 'heart',
            color: markerSettings['triple-2']?.color || 'rgb(211, 59, 62)'
        }] : [];
        config.maps.push(exportMapState(map2Triple, container2, markers2));

        const container3 = document.getElementById('map3-triple');
        const markers3 = currentMarker3Triple ? [{
            coordinates: [currentMarker3Triple.getLngLat().lng, currentMarker3Triple.getLngLat().lat],
            icon: markerSettings['triple-3']?.iconElement || 'heart',
            color: markerSettings['triple-3']?.color || 'rgb(211, 59, 62)'
        }] : [];
        config.maps.push(exportMapState(map3Triple, container3, markers3));
    }

    return config;
}

/**
 * Send configuration to backend and generate poster
 * @param {Object} config - Poster configuration
 * @param {string} backendUrl - Backend API URL (default: http://localhost:3001)
 * @returns {Promise<Object>} Response from backend
 */
async function generateHighResPoster(config, backendUrl = 'http://localhost:3001') {
    try {
        console.log('Sending configuration to backend:', config);

        const response = await fetch(`${backendUrl}/api/v2/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                config: config,
                options: {
                    timeout: 120000,
                    debug: false
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate poster');
        }

        const result = await response.json();
        console.log('Poster generated successfully:', result.metadata);

        return result;

    } catch (error) {
        console.error('Error generating poster:', error);
        throw error;
    }
}

/**
 * Download base64 image
 * @param {string} base64Data - Base64 image data
 * @param {string} filename - Filename for download
 */
function downloadBase64Image(base64Data, filename = 'map-poster.png') {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Main function to export and generate poster
 * Call this when user clicks "Generate Poster" button
 */
async function exportAndGeneratePoster() {
    try {
        // Show loading indicator
        console.log('Starting poster generation...');

        // Determine current layout
        const layout = isTripleMapLayout ? 'triple' : (isDoubleMapLayout ? 'double' : 'single');

        // Determine current shape from UI
        const shape = currentLayout || 'circle';

        // Get print settings (you can make these configurable via UI)
        const printSettings = {
            widthCm: 80,
            heightCm: 60,
            dpi: 200,
            orientation: 'landscape'
        };

        // Generate configuration
        const config = generatePosterConfig(layout, shape, printSettings);
        console.log('Generated configuration:', config);

        // Send to backend
        const result = await generateHighResPoster(config);

        // Download the image
        if (result.success && result.image) {
            downloadBase64Image(result.image, `map-poster-${result.jobId}.png`);
            console.log('Poster downloaded successfully!');
            alert(`Poster generated successfully!\nSize: ${result.metadata.sizeInMB} MB\nDimensions: ${result.metadata.width}x${result.metadata.height}px`);
        }

    } catch (error) {
        console.error('Failed to generate poster:', error);
        alert('Failed to generate poster: ' + error.message);
    }
}

// Make function globally available
window.exportAndGeneratePoster = exportAndGeneratePoster;
window.generatePosterConfig = generatePosterConfig;
window.generateHighResPoster = generateHighResPoster;
