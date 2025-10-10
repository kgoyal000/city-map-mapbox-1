# Python Map Poster Backend

## Why Python?

- ✅ **Better WebGL support** - Selenium + Chrome works reliably
- ✅ **No Docker needed** - Runs directly on macOS
- ✅ **Simple setup** - Just Python and Chrome
- ✅ **Same API** - Compatible with existing frontend

## Prerequisites

1. Python 3.8+ installed
2. Google Chrome installed
3. ChromeDriver (will be auto-downloaded)

## Setup

### 1. Create virtual environment
```bash
cd backend-python
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
pip install webdriver-manager  # Auto-downloads ChromeDriver
```

### 3. Run the server
```bash
python app.py
```

Server will start at http://localhost:3000

## Test

### Quick test
```bash
curl -X POST http://localhost:3000/api/generate-poster \
  -H "Content-Type: application/json" \
  -d @../backend/test-nabha-config.json \
  -o test.png

open test.png
```

### Using frontend config
```bash
curl -X POST http://localhost:3000/api/generate-poster \
  -H "Content-Type: application/json" \
  -d '{
    "layout": {"type": "single", "shape": "square"},
    "style": "mapbox://styles/dodo791/cmfdyppfj009701s3egb640uv",
    "maps": [{
      "center": [55.2708, 25.2048],
      "zoom": 15,
      "bearing": 0,
      "pitch": 0,
      "previewWidth": 640,
      "title": {
        "enabled": true,
        "largeText": "DUBAI",
        "smallText": "25.27° N / 55.27° E"
      }
    }],
    "print": {"width": 40, "height": 30, "dpi": 150}
  }' -o dubai.png
```

## Advantages over Node.js/Puppeteer

1. **WebGL Support**: Selenium has better WebGL compatibility
2. **Chrome Integration**: Direct Chrome control, not headless-only
3. **ARM64 Native**: Runs natively on Apple Silicon Macs
4. **Simpler Dependencies**: No complex npm packages

## API Endpoints

Same as Node.js version:
- `POST /api/generate-poster` - Generate poster
- `GET /api/download/<job_id>` - Download file
- `GET /health` - Health check

## Troubleshooting

### ChromeDriver issues
```bash
# Manual download if needed
pip install --upgrade webdriver-manager
```

### Chrome not found
```bash
# Check Chrome location
ls -la "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

### Port already in use
```bash
# Change port
PORT=3001 python app.py
```