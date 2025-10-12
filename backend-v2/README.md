# Map Poster Generator Backend V2

High-quality map poster generation with **exact frontend parity**. This backend renders maps at the same zoom level as your frontend but at higher resolution for printing.

## Key Features

✅ **Exact Frontend Match** - Same zoom, same view, just higher resolution
✅ **Smart Scaling** - Automatically scales markers and text for print size
✅ **Multiple Layouts** - Single, double, and triple map layouts
✅ **Shape Support** - Circle, square, and heart frames
✅ **Print Ready** - 150-300 DPI output for professional printing

---

## Quick Start

### 1. Install Dependencies

```bash
cd backend-v2
npm install
```

### 2. Start Server

```bash
npm start
```

Server will run on **http://localhost:3001**

### 3. Test with Sample Configuration

```bash
curl -X POST http://localhost:3001/api/v2/generate \
  -H "Content-Type: application/json" \
  -d @test-config.json \
  -o test-poster.png
```

---

## How It Works

### The Scaling Strategy

**Traditional Approach (WRONG):**
- Try to calculate zoom adjustment based on size ratio
- Results in mismatched views between frontend and print

**Our Approach (CORRECT):**
- Use **exact same zoom** as frontend
- Render in a **larger viewport** (640px → 6300px)
- Scale **markers and text** proportionally
- Result: Perfect 1:1 match with frontend

### Example:

**Frontend:**
- Container: 640px × 640px
- Zoom: 15.2
- Marker size: 35px
- Font size: 48px

**Backend (80cm × 60cm @ 200 DPI):**
- Viewport: 6300px × 4720px (9.84× larger)
- Zoom: 15.2 (**same as frontend!**)
- Marker size: 344px (35px × 9.84)
- Font size: 472px (48px × 9.84)

---

## API Endpoints

### POST `/api/v2/generate`

Generate high-resolution poster

**Request:**
```json
{
  "config": {
    "layout": {
      "type": "single",
      "shape": "circle"
    },
    "maps": [
      {
        "center": [-80.1918, 25.7617],
        "zoom": 15.2,
        "bearing": 0,
        "pitch": 0,
        "style": "mapbox://styles/dodo791/cmfdyppfj009701s3egb640uv",
        "containerWidth": 640,
        "containerHeight": 640,
        "markers": [
          {
            "coordinates": [-80.1918, 25.7617],
            "icon": "heart",
            "color": "rgb(211, 59, 62)"
          }
        ],
        "title": {
          "enabled": true,
          "largeText": "MIAMI, UNITED STATES",
          "smallText": "25.7617° N, 80.1918° W",
          "font": "Poppins"
        }
      }
    ],
    "print": {
      "widthCm": 80,
      "heightCm": 60,
      "dpi": 200
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "1234567890",
  "image": "data:image/png;base64,...",
  "downloadUrl": "/api/v2/download/1234567890",
  "metadata": {
    "width": 6300,
    "height": 4720,
    "pixelRatio": 2.083,
    "dpi": 200,
    "sizeInMB": "8.45",
    "renderTimeMs": 12450
  }
}
```

### GET `/api/v2/download/:jobId`

Download generated poster file

### GET `/api/v2/job/:jobId`

Check job status

### GET `/api/v2/jobs`

List all jobs (debugging)

### DELETE `/api/v2/job/:jobId`

Delete job and output file

### GET `/health`

Health check

---

## Configuration Guide

### Layout Types

- `single` - One map
- `double` - Two maps side by side
- `triple` - Three maps side by side

### Shape Types

- `circle` - Circular frame
- `square` - Square/rectangular (no masking)
- `heart` - Heart-shaped frame

### Print Settings

| Size | Width (cm) | Height (cm) | @ 200 DPI |
|------|-----------|-------------|-----------|
| Default | 80 | 60 | 6300 × 4720px |
| A1 | 84 | 59.4 | 6614 × 4677px |
| A2 | 59.4 | 42 | 4677 × 3307px |
| Custom | Any | Any | Calculated |

**DPI Options:** 150, 200, 300

### Marker Icons

- `heart` - Heart icon
- `house` - House icon
- `star` - Star icon

---

## Frontend Integration

### 1. Include Export Script

Add to your `index.html`:

```html
<script src="js/export.js"></script>
```

### 2. Add "Generate Poster" Button

```html
<button onclick="exportAndGeneratePoster()">
  Generate High-Res Poster
</button>
```

### 3. The export function will:

1. Capture current map state (center, zoom, bearing, pitch)
2. Get container dimensions
3. Collect markers and titles
4. Send to backend
5. Download high-res PNG

---

## Architecture

```
backend-v2/
├── server.js              # Express API server
├── renderer.js            # Puppeteer rendering engine
├── templates/
│   └── print.html         # Print template (matches frontend)
├── utils/
│   ├── scaler.js          # Dimension calculations
│   └── validator.js       # Input validation
├── output/                # Generated posters
├── package.json
└── README.md
```

---

## Key Differences from V1

| Feature | V1 (Old) | V2 (New) |
|---------|----------|----------|
| Zoom Calculation | Adjusted based on size ratio | **Exact zoom from frontend** |
| Viewport | Fixed based on print size | **Scaled proportionally** |
| Pixel Ratio | `dpi / 96` | **`(dpi / 96) * 1.5`** (matches frontend) |
| Markers | Fixed 35px | **Scaled to print size** |
| Text | Fixed size | **Scaled to print size** |
| Quality Match | Approximate | **Pixel-perfect** |

---

## Troubleshooting

### Issue: Map looks different from frontend

**Solution:** Make sure you're passing the **exact** values from frontend:
- Same zoom level
- Same center coordinates
- Same bearing/pitch
- Actual container dimensions

### Issue: Tiles not loading

**Solution:** Increase timeout:
```json
{
  "options": {
    "timeout": 180000
  }
}
```

### Issue: Markers too small/large

**Solution:** The system automatically scales markers. If they look wrong:
1. Check `containerWidth`/`containerHeight` in config
2. These should match your actual frontend container size

### Issue: Backend generates blank images

**Solution:**
1. Check Mapbox token is valid
2. Ensure Chrome/Chromium is installed
3. Enable debug mode: `"debug": true` in options
4. Check backend logs

---

## Performance Tips

1. **For testing:** Use 150 DPI (faster, smaller files)
2. **For web preview:** Use 100 DPI
3. **For professional print:** Use 200-300 DPI
4. **Timeout:** Allow 2-3 minutes for complex maps at high DPI

---

## Example: Complete Workflow

**Frontend (User Action):**
```javascript
// User designs map in UI...
// Clicks "Generate Poster"
exportAndGeneratePoster();
```

**What Happens:**
1. Frontend captures exact map state
2. Sends to backend with print dimensions
3. Backend renders at same zoom in larger viewport
4. Scales markers/text automatically
5. Returns high-res PNG
6. User downloads poster

**Result:** Pixel-perfect 80cm × 60cm poster at 200 DPI! 🎉

---

## Next Steps

1. ✅ Backend V2 is ready
2. ⏭️ Add "Generate Poster" button to frontend UI
3. ⏭️ Customize print size options in UI
4. ⏭️ Deploy backend to production server

---

## Support

For issues or questions, check the console logs with `debug: true` enabled.

Happy poster printing! 🗺️✨
