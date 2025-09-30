# Tile Replacement Guide for Positive Prints Map Application

## Overview

Your application currently uses `https://tiles.positiveprints.com/data/v3.json` as the tile source. This guide shows you how to replace it with your own tiles or open source alternatives.

## Current Architecture

### Tile Source Configuration
All your map styles reference the same tile source in the `sources` section:

```json
"sources": {
    "openmaptiles": {
        "type": "vector",
        "url": "https://tiles.positiveprints.com/data/v3.json"
    }
}
```

### How It Works
1. **Vector Tiles**: Your app uses vector tiles (not raster/image tiles)
2. **TileJSON Format**: The URL points to a TileJSON specification
3. **Style Layers**: Each style file defines how to render the vector data

## Replacement Options

### 1. OpenMapTiles (Recommended Open Source)

**Free Hosting Options:**
- **MapTiler**: Free tier with 100k tile requests/month
- **Maptiler Cloud**: `https://api.maptiler.com/tiles/v3/tiles.json?key=YOUR_API_KEY`

**Self-Hosted:**
```json
"sources": {
    "openmaptiles": {
        "type": "vector",
        "url": "https://your-domain.com/data/v3.json"
    }
}
```

### 2. Mapbox Vector Tiles

Replace with Mapbox's vector tiles:
```json
"sources": {
    "mapbox": {
        "type": "vector",
        "url": "mapbox://mapbox.mapbox-streets-v8"
    }
}
```

### 3. Custom Tile Server

**Using OpenMapTiles Stack:**
1. Download OpenStreetMap data
2. Generate vector tiles using OpenMapTiles tools
3. Host on your server

**TileJSON Example:**
```json
{
    "tilejson": "2.2.0",
    "name": "Your Custom Tiles",
    "description": "Custom vector tiles",
    "version": "1.0.0",
    "attribution": "© Your Attribution",
    "scheme": "xyz",
    "tiles": [
        "https://your-server.com/tiles/{z}/{x}/{y}.pbf"
    ],
    "minzoom": 0,
    "maxzoom": 14,
    "bounds": [-180, -85.0511, 180, 85.0511],
    "center": [0, 0, 2]
}
```

## Implementation Steps

### Step 1: Choose Your Tile Source

**Option A: MapTiler (Free)**
1. Sign up at https://maptiler.com
2. Get your API key
3. Use: `https://api.maptiler.com/tiles/v3/tiles.json?key=YOUR_API_KEY`

**Option B: Mapbox**
1. Use your existing Mapbox token
2. Use: `mapbox://mapbox.mapbox-streets-v8`

**Option C: Self-Hosted**
1. Set up OpenMapTiles server
2. Generate your TileJSON endpoint

### Step 2: Update Map Styles

You need to update each style file in the `map-styles/` directory.

**Example for minimal.json:**
```json
{
    "version": 8,
    "name": "Your Custom Minimal",
    "sources": {
        "openmaptiles": {
            "type": "vector",
            "url": "https://api.maptiler.com/tiles/v3/tiles.json?key=YOUR_API_KEY"
        }
    },
    "layers": [
        // Keep existing layers or modify as needed
    ]
}
```

### Step 3: Update JavaScript (Optional)

If you want to add more tile sources, modify `js/script.js`:

```javascript
let mapStyles = {
    'minimal': 'minimal',
    'beachglass': 'beachglass',
    'carbon': 'carbon',
    'black': 'black',
    'vintage': 'vintage',
    'classic': 'classic',
    'pink': 'pink',
    'green': 'green',
    'intense': 'intense',
    'mapbox-streets': 'mapbox://styles/mapbox/streets-v12',
    'mapbox-satellite': 'mapbox://styles/mapbox/satellite-v9',
    'custom': 'mapbox://styles/mapbox/streets-v12'
};
```

## Free Tile Sources

### 1. MapTiler
- **URL**: `https://api.maptiler.com/tiles/v3/tiles.json?key=YOUR_API_KEY`
- **Free Tier**: 100,000 requests/month
- **Sign up**: https://maptiler.com

### 2. OpenMapTiles Demo
- **URL**: `https://api.openmaptiles.org/data/v3.json`
- **Limitations**: Rate limited, for testing only

### 3. Protomaps
- **URL**: Custom PMTiles format
- **Free**: Self-hosted option available
- **Website**: https://protomaps.com

### 4. Stamen/Stadia Maps
- **URL**: Various endpoints available
- **Free Tier**: Available with registration
- **Website**: https://stadiamaps.com

## Creating Custom Styles

### Basic Style Template
```json
{
    "version": 8,
    "name": "Your Custom Style",
    "sources": {
        "openmaptiles": {
            "type": "vector",
            "url": "YOUR_TILE_SOURCE_URL"
        }
    },
    "layers": [
        {
            "id": "background",
            "type": "background",
            "paint": {
                "background-color": "#f8f8f8"
            }
        },
        {
            "id": "water",
            "type": "fill",
            "source": "openmaptiles",
            "source-layer": "water",
            "paint": {
                "fill-color": "#a0c8f0"
            }
        },
        {
            "id": "roads",
            "type": "line",
            "source": "openmaptiles",
            "source-layer": "transportation",
            "paint": {
                "line-color": "#ffffff",
                "line-width": 2
            }
        }
    ]
}
```

## Testing Your Changes

1. **Backup**: Save your original style files
2. **Update**: Modify one style file first (e.g., `minimal.json`)
3. **Test**: Load your application and select that style
4. **Verify**: Check browser console for errors
5. **Iterate**: Apply to other styles once working

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your tile server allows cross-origin requests
2. **Attribution**: Include proper attribution for your tile source
3. **Rate Limits**: Monitor your usage to avoid hitting limits
4. **Layer Names**: Different tile sources may use different layer names

### Debug Tips

1. **Browser Console**: Check for network errors
2. **Network Tab**: Verify tile requests are successful
3. **Mapbox Inspector**: Use browser extension to debug styles

## Cost Considerations

### Free Options
- MapTiler: 100k requests/month
- Stadia Maps: 20k requests/month
- Self-hosted: Server costs only

### Paid Options
- MapTiler: $49/month for 500k requests
- Mapbox: Pay per request after free tier
- AWS/Google Cloud: Variable based on usage

## Next Steps

1. Choose your preferred tile source
2. Get API keys if needed
3. Update one style file for testing
4. Test thoroughly before updating all styles
5. Consider caching strategies for production use

## Additional Resources

- [OpenMapTiles Documentation](https://openmaptiles.org/docs/)
- [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/)
- [TileJSON Specification](https://github.com/mapbox/tilejson-spec)
- [Vector Tile Specification](https://github.com/mapbox/vector-tile-spec)