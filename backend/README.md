# Map Poster Generation Backend

High-resolution poster generation service for custom map posters.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your Mapbox token

4. Start server:
```bash
npm start
```

Server will run on http://localhost:3000

## API Endpoints

### POST /api/generate-poster
Generate high-resolution poster

**Request Body:**
```json
{
  "layout": {
    "type": "single",
    "shape": "circle"
  },
  "style": "streets-v12",
  "maps": [
    {
      "center": [-80.1918, 25.7617],
      "zoom": 13,
      "markers": [],
      "title": {
        "enabled": true,
        "largeText": "MIAMI",
        "smallText": "25.7617° N, 80.1918° W"
      }
    }
  ],
  "print": {
    "width": 80,
    "height": 60,
    "dpi": 200
  }
}
```

### GET /api/download/:jobId
Download generated poster

### GET /health
Health check

## Testing

Test with curl:
```bash
curl -X POST http://localhost:3000/api/generate-poster \
  -H "Content-Type: application/json" \
  -d @test-config.json \
  -o poster.png
```

## Supported Map Styles

- streets-v12 (default)
- outdoors-v12
- light-v11
- dark-v11
- satellite-v9
- satellite-streets-v12
- navigation-day-v1
- navigation-night-v1

## Poster Dimensions

Default: 80cm x 60cm at 200 DPI (6,300 x 4,720 pixels)

Supported DPI: 150, 200, 300
