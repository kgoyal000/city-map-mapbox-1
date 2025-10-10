#!/usr/bin/env python3
"""
Map Poster Generation Backend - Python Version
Uses Selenium WebDriver for better WebGL support
"""

import os
import json
import time
import base64
import logging
import math
from datetime import datetime
from io import BytesIO

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from PIL import Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'output')
TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), 'templates')

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_chrome_options(width_px, height_px, is_docker=False):
    """Configure Chrome options for WebGL support"""
    options = Options()

    # Base options
    options.add_argument('--headless=new')  # New headless mode
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument(f'--window-size={width_px},{height_px}')

    # WebGL enablement flags
    options.add_argument('--enable-webgl')
    options.add_argument('--enable-webgl2')
    options.add_argument('--enable-accelerated-2d-canvas')
    options.add_argument('--enable-gpu-rasterization')
    options.add_argument('--ignore-gpu-blocklist')
    options.add_argument('--disable-software-rasterizer')

    # Use software rendering (works better in Docker)
    if is_docker or os.environ.get('DOCKER_ENV'):
        options.add_argument('--use-gl=swiftshader')
        options.add_argument('--disable-gpu-sandbox')
        # In Docker, Chrome is at a specific location
        options.binary_location = '/usr/bin/chromium'
    else:
        # For local development, use angle (better on Mac)
        options.add_argument('--use-angle')
        options.add_argument('--use-gl=angle')

    # Additional performance flags
    options.add_argument('--disable-web-security')  # Allow cross-origin for tiles
    options.add_argument('--disable-features=VizDisplayCompositor')
    options.add_argument('--enable-features=NetworkService,NetworkServiceInProcess')

    # Logging
    options.add_experimental_option('excludeSwitches', ['enable-logging'])

    return options

def calculate_zoom_adjustment(preview_width, poster_width_px):
    """Calculate zoom adjustment based on size ratio"""
    size_ratio = poster_width_px / preview_width
    zoom_adjustment = math.log2(size_ratio)
    return zoom_adjustment

def generate_poster(config, job_id):
    """Generate high-resolution poster using Selenium"""

    logger.info(f"[{job_id}] Starting poster generation...")
    logger.info(f"[{job_id}] Config: {json.dumps(config, indent=2)}")

    # Calculate dimensions
    width_cm = config['print'].get('width', 80)
    height_cm = config['print'].get('height', 60)
    dpi = config['print'].get('dpi', 200)

    width_px = int((width_cm / 2.54) * dpi)
    height_px = int((height_cm / 2.54) * dpi)

    logger.info(f"[{job_id}] Dimensions: {width_px}x{height_px}px ({width_cm}x{height_cm}cm @ {dpi} DPI)")

    # Initialize Chrome driver
    driver = None
    try:
        is_docker = os.environ.get('DOCKER_ENV') == 'true'
        options = get_chrome_options(width_px, height_px, is_docker)

        # Create driver with auto-downloaded ChromeDriver
        if is_docker:
            # In Docker, ChromeDriver is pre-installed at /usr/bin/chromedriver
            service = Service('/usr/bin/chromedriver')
            driver = webdriver.Chrome(service=service, options=options)
            logger.info(f"[{job_id}] Using Docker ChromeDriver")
        else:
            # Local development - use webdriver-manager with fix for ARM64 Mac
            try:
                # Try to use webdriver-manager
                from webdriver_manager.chrome import ChromeDriverManager
                driver_path = ChromeDriverManager().install()

                # On ARM64 Mac, webdriver-manager might return wrong file
                # Check if it's the actual chromedriver executable
                if 'THIRD_PARTY_NOTICES' in driver_path:
                    # Fix the path - go to parent directory and find chromedriver
                    driver_dir = os.path.dirname(driver_path)
                    chromedriver_path = os.path.join(driver_dir, 'chromedriver')
                    if not os.path.exists(chromedriver_path):
                        # Try the chromedriver-mac-arm64 subdirectory
                        chromedriver_path = os.path.join(driver_dir, 'chromedriver-mac-arm64', 'chromedriver')
                else:
                    chromedriver_path = driver_path

                logger.info(f"[{job_id}] Using ChromeDriver at: {chromedriver_path}")
                service = Service(chromedriver_path)
                driver = webdriver.Chrome(service=service, options=options)
            except Exception as e:
                logger.error(f"[{job_id}] Failed to auto-detect ChromeDriver: {e}")
                # Fallback to hardcoded path for ARM64 Mac
                chromedriver_path = "/Users/karangoyal/.wdm/drivers/chromedriver/mac64/141.0.7390.76/chromedriver-mac-arm64/chromedriver"
                logger.info(f"[{job_id}] Falling back to: {chromedriver_path}")
                service = Service(chromedriver_path)
                driver = webdriver.Chrome(service=service, options=options)

        logger.info(f"[{job_id}] Chrome driver initialized")

        # Set window size
        driver.set_window_size(width_px, height_px)

        # Encode configuration as base64 for URL parameter
        import urllib.parse
        config_json = json.dumps(config)
        config_base64 = base64.b64encode(config_json.encode()).decode()
        config_encoded = urllib.parse.quote(config_base64)

        # Use the actual frontend via ngrok with query parameters
        frontend_url = "https://d1fda6028e97.ngrok-free.app/"
        url = f"{frontend_url}?print=true&config={config_encoded}&dpi={dpi}&width={width_px}&height={height_px}"

        logger.info(f"[{job_id}] Loading frontend URL with print mode...")
        logger.info(f"[{job_id}] URL: {url[:100]}...")
        driver.get(url)
        logger.info(f"[{job_id}] Frontend loaded, waiting for print mode initialization...")

        # Wait for page to load
        time.sleep(2)

        # Wait for print mode and map to initialize
        logger.info(f"[{job_id}] Waiting for JavaScript and map to render...")
        wait = WebDriverWait(driver, 120)

        # Wait for mapRenderComplete flag to be set by print-mode.js
        try:
            wait.until(lambda d: d.execute_script("return window.mapRenderComplete === true"))
            logger.info(f"[{job_id}] Map render complete signal received")
        except Exception as e:
            logger.warning(f"[{job_id}] Timeout waiting for mapRenderComplete, checking map state...")
            # Check if map at least exists
            map_exists = driver.execute_script("return window.map !== undefined && window.map !== null")
            if map_exists:
                logger.info(f"[{job_id}] Map exists, proceeding with screenshot")
            else:
                raise Exception("Map failed to initialize")

        # Extra wait to ensure all tiles are loaded and JavaScript is complete
        logger.info(f"[{job_id}] Waiting additional 5 seconds for all tiles and JS to complete...")
        time.sleep(5)

        logger.info(f"[{job_id}] Map rendered successfully")

        # Take screenshot
        time.sleep(2)  # Extra wait for tiles to fully load
        screenshot = driver.get_screenshot_as_png()

        # Save screenshot
        output_path = os.path.join(OUTPUT_DIR, f"poster-{job_id}.png")
        with open(output_path, 'wb') as f:
            f.write(screenshot)

        logger.info(f"[{job_id}] Poster saved to {output_path}")

        # Convert to base64 for response
        base64_image = base64.b64encode(screenshot).decode('utf-8')

        return {
            'success': True,
            'jobId': job_id,
            'image': f"data:image/png;base64,{base64_image}",
            'path': output_path,
            'metadata': {
                'width': width_px,
                'height': height_px,
                'dpi': dpi,
                'sizeInMB': len(screenshot) / (1024 * 1024)
            }
        }

    except Exception as e:
        logger.error(f"[{job_id}] Error: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'jobId': job_id
        }
    finally:
        if driver:
            driver.quit()
            logger.info(f"[{job_id}] Chrome driver closed")

def create_render_template():
    """Create the render template (copied from Node.js version)"""
    template_html = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Map Poster Renderer</title>

    <!-- Mapbox GL JS -->
    <link href='https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css' rel='stylesheet' />
    <script src='https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js'></script>

    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { width: 100%; height: 100%; overflow: hidden; }
        #map-container { width: 100%; height: 100%; position: relative; }
        .map-wrapper { width: 100%; height: 100%; }
        #map-0 { width: 100%; height: 100%; }

        .title-overlay {
            position: absolute;
            top: 40px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            z-index: 2000;
            color: #000;
            text-shadow: 0 0 10px rgba(255,255,255,0.8);
        }

        .title-large {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 10px;
            letter-spacing: 2px;
        }

        .title-small {
            font-size: 24px;
            font-weight: 400;
            letter-spacing: 1px;
        }
    </style>
</head>
<body>
    <div id="map-container">
        <div class="map-wrapper">
            <div id="map-0"></div>
        </div>
    </div>

    <script>
        mapboxgl.accessToken = 'pk.eyJ1IjoiZG9kbzc5MSIsImEiOiJjbWZianUyejEwNDNsMmpxdzBjZmZnbndtIn0.t5a9KzottI8eUYz396kfbQ';

        window.mapRenderComplete = false;

        window.initializeMapForPrint = async function(config) {
            console.log('Initializing map with config:', config);

            try {
                const mapConfig = config.maps[0];
                const dpi = config.print?.dpi || 200;
                const pixelRatio = Math.min(dpi / 96, 3);

                // Calculate zoom adjustment
                const frontendPreviewWidth = mapConfig.previewWidth || 640;
                const posterWidth = Math.round((config.print.width / 2.54) * dpi);
                const sizeRatio = posterWidth / frontendPreviewWidth;
                const zoomAdjustment = Math.log2(sizeRatio);
                const adjustedZoom = (mapConfig.zoom || 15) + zoomAdjustment;

                console.log(`Zoom: preview=${frontendPreviewWidth}px, poster=${posterWidth}px, adjustment=+${zoomAdjustment.toFixed(2)}, final=${adjustedZoom.toFixed(2)}`);

                const map = new mapboxgl.Map({
                    container: 'map-0',
                    style: config.style || 'mapbox://styles/mapbox/streets-v12',
                    center: mapConfig.center,
                    zoom: adjustedZoom,
                    bearing: mapConfig.bearing || 0,
                    pitch: mapConfig.pitch || 0,
                    preserveDrawingBuffer: true,
                    interactive: false,
                    attributionControl: false,
                    antialias: true,
                    fadeDuration: 0,
                    pixelRatio: pixelRatio,
                    maxZoom: 22,
                    minZoom: 10,
                    renderWorldCopies: false,
                    crossSourceCollisions: false,
                    optimizeForTerrain: false
                });

                map.on('load', async function() {
                    console.log('Map loaded');

                    // Add markers if any
                    if (mapConfig.markers && mapConfig.markers.length > 0) {
                        mapConfig.markers.forEach(marker => {
                            const el = document.createElement('div');
                            el.style.width = '40px';
                            el.style.height = '40px';
                            el.style.backgroundColor = marker.color || 'red';
                            el.style.borderRadius = '50%';

                            new mapboxgl.Marker(el)
                                .setLngLat(marker.coordinates)
                                .addTo(map);
                        });
                    }

                    // Add title overlay if enabled
                    if (mapConfig.title && mapConfig.title.enabled) {
                        const overlay = document.createElement('div');
                        overlay.className = 'title-overlay';
                        overlay.style.fontFamily = mapConfig.title.font || 'Poppins';

                        if (mapConfig.title.largeText) {
                            const large = document.createElement('div');
                            large.className = 'title-large';
                            large.textContent = mapConfig.title.largeText;
                            overlay.appendChild(large);
                        }

                        if (mapConfig.title.smallText) {
                            const small = document.createElement('div');
                            small.className = 'title-small';
                            small.textContent = mapConfig.title.smallText;
                            overlay.appendChild(small);
                        }

                        document.querySelector('.map-wrapper').appendChild(overlay);
                    }

                    // Wait for tiles to load
                    setTimeout(() => {
                        window.mapRenderComplete = true;
                        console.log('Map rendering complete');
                    }, 5000);
                });

                map.on('error', (e) => {
                    console.error('Map error:', e);
                });

            } catch (error) {
                console.error('Error initializing map:', error);
                throw error;
            }
        };
    </script>
</body>
</html>'''

    os.makedirs(TEMPLATES_DIR, exist_ok=True)
    template_path = os.path.join(TEMPLATES_DIR, 'render.html')
    with open(template_path, 'w') as f:
        f.write(template_html)
    logger.info(f"Created render template at {template_path}")

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'backend': 'python-selenium'
    })

@app.route('/api/generate-poster', methods=['POST'])
def generate_poster_endpoint():
    """Generate poster endpoint"""
    job_id = str(int(time.time() * 1000))

    try:
        config = request.json
        result = generate_poster(config, job_id)

        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 500

    except Exception as e:
        logger.error(f"[{job_id}] Endpoint error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'jobId': job_id
        }), 500

@app.route('/api/download/<job_id>', methods=['GET'])
def download_poster(job_id):
    """Download generated poster"""
    file_path = os.path.join(OUTPUT_DIR, f"poster-{job_id}.png")

    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True, download_name=f"map-poster-{job_id}.png")
    else:
        return jsonify({'error': 'File not found'}), 404

if __name__ == '__main__':
    # Create render template on startup
    create_render_template()

    port = int(os.environ.get('PORT', 3000))
    logger.info(f"""
🚀 Python Poster Generation Backend running on http://localhost:{port}

Endpoints:
  POST   /api/generate-poster  - Generate high-res poster
  GET    /api/download/:jobId  - Download generated poster
  GET    /health               - Health check

Backend: Python + Selenium (Better WebGL support)
Ready to generate posters! 🎨
""")

    app.run(host='0.0.0.0', port=port, debug=False)