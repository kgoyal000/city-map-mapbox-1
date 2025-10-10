# Running Backend Without Docker (Recommended for Development)

## Why Run Without Docker?

- ✅ **Instant startup** - No container build time
- ✅ **100% WebGL support** - Uses system Chrome with full GPU access
- ✅ **Faster iteration** - No rebuild needed for code changes
- ✅ **Same functionality** - Backend works identically

## Prerequisites

- Node.js installed (v16+ recommended)
- Google Chrome installed at `/Applications/Google Chrome.app/...`
- Port 3000 available

## Setup & Run

### 1. Stop Docker (if running)
```bash
cd /Users/karangoyal/Documents/city-map-mapbox-1/backend
docker-compose down
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Server
```bash
npm start
```

You should see:
```
🚀 Poster Generation Backend running on http://localhost:3000

Endpoints:
  POST   /api/generate-poster  - Generate high-res poster
  GET    /api/job/:jobId        - Check job status
  GET    /api/download/:jobId   - Download generated poster
  GET    /health                - Health check

Ready to generate posters! 🎨
```

## Testing

### Quick Test (Small Poster)
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
    "print": {"width": 20, "height": 15, "dpi": 150}
  }' -o quick-test.png

open quick-test.png
```

### Full Test (Dubai Config)
```bash
curl -X POST http://localhost:3000/api/generate-poster \
  -H "Content-Type: application/json" \
  -d @test-dubai-config.json \
  -o dubai-test.png

open dubai-test.png
```

## Expected Output

Console should show:
```
[1234567890] Starting poster generation...
[1234567890] Launching headless browser...
[1234567890] Using system Chrome on macOS
[1234567890] Rendering dimensions: 2362x1772px (40x30cm @ 150 DPI)
[1234567890] [BROWSER LOG]: Zoom calculation: preview=640px, poster=2362px, ratio=3.69x, adjustment=+1.88, final zoom=16.88
[1234567890] [BROWSER LOG]: Map 0 initialized with bearing=0, pitch=0, pixelRatio=1.5625
[1234567890] [BROWSER LOG]: Map 0 loaded
[1234567890] [BROWSER LOG]: Map 0 state after load: {"center":{"lng":55.2708,"lat":25.2048},"zoom":16.88,"bearing":0,"pitch":0}
[1234567890] Poster generated successfully! Size: 12.34 MB
```

## Troubleshooting

### "Chrome not found"
Verify Chrome path:
```bash
ls -la "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

### Port 3000 already in use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

### Module not found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Switching Back to Docker

When you're ready to use Docker again:

```bash
# Stop Node.js server (Ctrl+C)

# Rebuild Docker with latest changes
docker-compose build --no-cache
docker-compose up -d
```

## Production Deployment

For production, use Docker with the WebGL fixes:
1. Ensure `shm_size: 2gb` in docker-compose.yml
2. Use all Chrome WebGL flags in server.js
3. Test thoroughly before deploying

## Development Workflow

**Recommended:**
1. Develop and test with **Node.js directly** (this guide)
2. Once stable, test with **Docker locally**
3. Deploy to production with **Docker**

This gives you the best of both worlds!
