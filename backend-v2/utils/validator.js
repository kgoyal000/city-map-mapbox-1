/**
 * Validator Utility
 * Validates input configurations for poster generation
 */

/**
 * Validate complete configuration
 * @param {Object} config - Configuration object
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateConfig(config) {
    const errors = [];

    if (!config) {
        errors.push('Configuration is required');
        return { valid: false, errors };
    }

    // Validate layout
    if (!config.layout) {
        errors.push('Layout configuration is required');
    } else {
        const layoutErrors = validateLayout(config.layout);
        errors.push(...layoutErrors);
    }

    // Validate maps array
    if (!config.maps || !Array.isArray(config.maps)) {
        errors.push('Maps array is required');
    } else if (config.maps.length === 0) {
        errors.push('At least one map is required');
    } else {
        config.maps.forEach((map, index) => {
            const mapErrors = validateMap(map, index);
            errors.push(...mapErrors);
        });
    }

    // Validate print settings
    if (!config.print) {
        errors.push('Print settings are required');
    } else {
        const printErrors = validatePrint(config.print);
        errors.push(...printErrors);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate layout configuration
 * @param {Object} layout - Layout config
 * @returns {Array} errors
 */
function validateLayout(layout) {
    const errors = [];
    const validTypes = ['single', 'double', 'triple'];
    const validShapes = ['circle', 'square', 'heart'];

    if (!layout.type) {
        errors.push('Layout type is required');
    } else if (!validTypes.includes(layout.type)) {
        errors.push(`Invalid layout type: ${layout.type}. Must be one of: ${validTypes.join(', ')}`);
    }

    if (!layout.shape) {
        errors.push('Layout shape is required');
    } else if (!validShapes.includes(layout.shape)) {
        errors.push(`Invalid layout shape: ${layout.shape}. Must be one of: ${validShapes.join(', ')}`);
    }

    return errors;
}

/**
 * Validate individual map configuration
 * @param {Object} map - Map config
 * @param {number} index - Map index
 * @returns {Array} errors
 */
function validateMap(map, index) {
    const errors = [];
    const prefix = `Map ${index}:`;

    // Validate center coordinates
    if (!map.center || !Array.isArray(map.center) || map.center.length !== 2) {
        errors.push(`${prefix} Center must be an array of [longitude, latitude]`);
    } else {
        const [lng, lat] = map.center;
        if (typeof lng !== 'number' || lng < -180 || lng > 180) {
            errors.push(`${prefix} Invalid longitude: ${lng}. Must be between -180 and 180`);
        }
        if (typeof lat !== 'number' || lat < -90 || lat > 90) {
            errors.push(`${prefix} Invalid latitude: ${lat}. Must be between -90 and 90`);
        }
    }

    // Validate zoom
    if (map.zoom === undefined || map.zoom === null) {
        errors.push(`${prefix} Zoom level is required`);
    } else if (typeof map.zoom !== 'number' || map.zoom < 0 || map.zoom > 22) {
        errors.push(`${prefix} Invalid zoom: ${map.zoom}. Must be between 0 and 22`);
    }

    // Validate style
    if (!map.style) {
        errors.push(`${prefix} Style is required`);
    } else if (typeof map.style !== 'string') {
        errors.push(`${prefix} Style must be a string`);
    }

    // Validate container dimensions
    if (!map.containerWidth || typeof map.containerWidth !== 'number' || map.containerWidth <= 0) {
        errors.push(`${prefix} Invalid containerWidth: ${map.containerWidth}`);
    }
    if (!map.containerHeight || typeof map.containerHeight !== 'number' || map.containerHeight <= 0) {
        errors.push(`${prefix} Invalid containerHeight: ${map.containerHeight}`);
    }

    // Validate optional bearing and pitch
    if (map.bearing !== undefined && (typeof map.bearing !== 'number' || map.bearing < 0 || map.bearing > 360)) {
        errors.push(`${prefix} Invalid bearing: ${map.bearing}. Must be between 0 and 360`);
    }
    if (map.pitch !== undefined && (typeof map.pitch !== 'number' || map.pitch < 0 || map.pitch > 60)) {
        errors.push(`${prefix} Invalid pitch: ${map.pitch}. Must be between 0 and 60`);
    }

    // Validate markers if present
    if (map.markers && Array.isArray(map.markers)) {
        map.markers.forEach((marker, markerIndex) => {
            const markerErrors = validateMarker(marker, index, markerIndex);
            errors.push(...markerErrors);
        });
    }

    return errors;
}

/**
 * Validate marker configuration
 * @param {Object} marker - Marker config
 * @param {number} mapIndex - Map index
 * @param {number} markerIndex - Marker index
 * @returns {Array} errors
 */
function validateMarker(marker, mapIndex, markerIndex) {
    const errors = [];
    const prefix = `Map ${mapIndex}, Marker ${markerIndex}:`;
    const validIcons = ['heart', 'house', 'star'];

    if (!marker.coordinates || !Array.isArray(marker.coordinates) || marker.coordinates.length !== 2) {
        errors.push(`${prefix} Coordinates must be an array of [longitude, latitude]`);
    } else {
        const [lng, lat] = marker.coordinates;
        if (typeof lng !== 'number' || lng < -180 || lng > 180) {
            errors.push(`${prefix} Invalid longitude: ${lng}`);
        }
        if (typeof lat !== 'number' || lat < -90 || lat > 90) {
            errors.push(`${prefix} Invalid latitude: ${lat}`);
        }
    }

    if (!marker.icon) {
        errors.push(`${prefix} Icon is required`);
    } else if (!validIcons.includes(marker.icon)) {
        errors.push(`${prefix} Invalid icon: ${marker.icon}. Must be one of: ${validIcons.join(', ')}`);
    }

    if (!marker.color) {
        errors.push(`${prefix} Color is required`);
    } else if (typeof marker.color !== 'string') {
        errors.push(`${prefix} Color must be a string`);
    }

    return errors;
}

/**
 * Validate print configuration
 * @param {Object} print - Print config
 * @returns {Array} errors
 */
function validatePrint(print) {
    const errors = [];
    const validDPIs = [150, 200, 300];

    if (!print.widthCm || typeof print.widthCm !== 'number' || print.widthCm <= 0) {
        errors.push('Invalid print width (cm)');
    } else if (print.widthCm > 200) {
        errors.push('Print width exceeds maximum (200cm)');
    }

    if (!print.heightCm || typeof print.heightCm !== 'number' || print.heightCm <= 0) {
        errors.push('Invalid print height (cm)');
    } else if (print.heightCm > 200) {
        errors.push('Print height exceeds maximum (200cm)');
    }

    if (print.dpi && !validDPIs.includes(print.dpi)) {
        errors.push(`Invalid DPI: ${print.dpi}. Must be one of: ${validDPIs.join(', ')}`);
    }

    return errors;
}

/**
 * Sanitize configuration (add defaults for optional fields)
 * @param {Object} config - Configuration object
 * @returns {Object} Sanitized config
 */
function sanitizeConfig(config) {
    const sanitized = { ...config };

    // Add defaults to maps
    if (sanitized.maps) {
        sanitized.maps = sanitized.maps.map(map => ({
            ...map,
            bearing: map.bearing || 0,
            pitch: map.pitch || 0,
            markers: map.markers || [],
            containerWidth: map.containerWidth || 640,
            containerHeight: map.containerHeight || 640
        }));
    }

    // Add defaults to print
    if (sanitized.print) {
        sanitized.print = {
            widthCm: sanitized.print.widthCm || 80,
            heightCm: sanitized.print.heightCm || 60,
            dpi: sanitized.print.dpi || 200,
            orientation: sanitized.print.orientation || 'landscape'
        };
    }

    return sanitized;
}

module.exports = {
    validateConfig,
    validateLayout,
    validateMap,
    validateMarker,
    validatePrint,
    sanitizeConfig
};
