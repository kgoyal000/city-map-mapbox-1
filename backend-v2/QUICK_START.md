# Quick Start Guide - Backend V2

## ✅ Your Backend is Ready!

Generates **print-ready posters up to 80×60cm** in under 30 seconds.

---

## 🚀 Start the Server

```bash
cd backend-v2
npm start
```

Server runs on: **http://localhost:3001**

---

## 📝 Generate a Poster

### Option 1: Using cURL

```bash
curl -X POST http://localhost:3001/api/v2/generate \
  -H "Content-Type: application/json" \
  -d @test-80x60.json \
  -o my-poster.png
```

### Option 2: From Frontend

```javascript
// In your frontend (index.html)
await exportAndGeneratePoster();
// This function is already in js/export.js
```

---

## 📊 Test Files Available

- `test-small.json` - 20×20cm @ 150 DPI (~15s, 3 MB)
- `test-nabha.json` - 50×70cm @ 200 DPI (~20s, testing)
- `test-80x60.json` - **80×60cm @ 200 DPI** ✅ (~20s, 1.1 MB)

---

## 🎨 Configuration Template

```json
{
  "config": {
    "layout": { "type": "single", "shape": "circle" },
    "maps": [{
      "center": [lng, lat],
      "zoom": 12-15,
      "style": "mapbox://styles/...",
      "containerWidth": 640,
      "containerHeight": 640,
      "markers": [{ "coordinates": [lng, lat], "icon": "heart", "color": "#000" }],
      "title": { "enabled": true, "largeText": "City Name", "font": "Montserrat" }
    }],
    "print": { "widthCm": 80, "heightCm": 60, "dpi": 200 }
  }
}
```

---

## ✨ Recommended Settings

### For 80×60cm Posters
- **DPI**: 200 (perfect balance)
- **Zoom**: 12-15 (city views)
- **Shape**: Circle or Square
- **Font**: Montserrat or Poppins

### For Maximum Quality
- Sizes ≤40cm: Use 300 DPI
- Sizes 50-80cm: Use 200 DPI
- Sizes >80cm: Use 150 DPI

---

## 📦 Generated Files

Posters saved to: `backend-v2/output/poster-{jobId}.png`

Example: `poster-1760093664046.png` (80×60cm, 4724×4724px, 1.1 MB)

---

## 🔧 Troubleshooting

### Map looks different from frontend
- Make sure `containerWidth`/`containerHeight` match actual frontend container
- Use exact `zoom` from `map.getZoom()`
- Use exact `center` from `map.getCenter()`

### Rendering timeout
- Increase timeout: `"timeout": 300000` (5 min)
- Check internet connection (tiles must download)

### File too large
- Use 150 DPI instead of 200/300
- Reduce poster size

---

## 📞 API Endpoints

- `POST /api/v2/generate` - Generate poster
- `GET /api/v2/download/:jobId` - Download poster
- `GET /api/v2/job/:jobId` - Check status
- `GET /health` - Health check

---

## 🎉 You're Ready!

Start generating beautiful 80×60cm posters! 🗺️✨

**Server:** http://localhost:3001
**Docs:** [README.md](README.md)
**Complete Guide:** [/SOLUTION_COMPLETE.md](../SOLUTION_COMPLETE.md)
