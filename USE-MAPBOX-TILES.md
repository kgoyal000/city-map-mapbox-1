# Switching to Mapbox Commercial Tiles for Better Detail

## Why Switch?

Your current OpenMapTiles data has significantly less detail than PositivePrints:
- Your tiles: 4,662 transportation features per tile
- PositivePrints: 43,291 transportation features per tile (9.3x more!)

Mapbox's commercial vector tiles have the full detail level you need.

## Step 1: Get Mapbox Access Token

You already have one: `pk.eyJ1IjoiZG9kbzc5MSIsImEiOiJjbWZianUyejEwNDNsMmpxdzBjZmZnbndtIn0.t5a9KzottI8eUYz396kfbQ`

**Free Tier Limits:**
- 50,000 map loads per month (FREE)
- For a poster generator, this is plenty!

## Step 2: Update Your Map Initialization

### Current Code (Local Tiles):
```javascript
const styleToUse = await loadMapStyle(styleName);

map = new mapboxgl.Map({
    container: 'map',
    style: styleToUse, // Local JSON file
    center: [-80.1918, 25.7617],
    zoom: 12 + ZOOM_OFFSET
});
```

### New Code (Mapbox Tiles):
```javascript
// Option A: Use Mapbox built-in style
map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12', // Mapbox's street style
    center: [-80.1918, 25.7617],
    zoom: 12 + ZOOM_OFFSET
});

// Option B: Use your custom style JSON but with Mapbox tiles
const styleToUse = await loadMapStyle(styleName);

// Replace the source in the loaded style
styleToUse.sources.openmaptiles = {
    type: 'vector',
    url: 'mapbox://mapbox.mapbox-streets-v8' // Mapbox vector tiles
};

map = new mapboxgl.Map({
    container: 'map',
    style: styleToUse,
    center: [-80.1918, 25.7617],
    zoom: 12 + ZOOM_OFFSET
});
```

## Step 3: Test Different Mapbox Styles

Mapbox offers several built-in styles:

```javascript
// Minimal look (like your current style)
style: 'mapbox://styles/mapbox/light-v11'

// Standard streets
style: 'mapbox://styles/mapbox/streets-v12'

// Dark theme
style: 'mapbox://styles/mapbox/dark-v11'

// Outdoors (shows terrain)
style: 'mapbox://styles/mapbox/outdoors-v12'
```

## Comparison: Local vs Mapbox

| Feature | Local OpenMapTiles | Mapbox Commercial |
|---------|-------------------|-------------------|
| **Cost** | Free | Free tier: 50k loads/month |
| **Detail Level** | Basic (4.6k features) | Full (43k+ features) |
| **File Size** | 112 KB per tile | 1.2 MB per tile |
| **Building Data** | Zoom 14+ only | Zoom 13+ with offset |
| **Transportation** | Basic roads | Dense road network |
| **Updates** | Static (2020 data) | Live, constantly updated |
| **Internet Required** | No | Yes |
| **Setup Complexity** | High | Low |

## Hybrid Approach (Best of Both Worlds)

Keep both options and let users choose:

```javascript
const USE_MAPBOX_TILES = true; // Toggle this

async function initializeMap() {
    let styleToUse;

    if (USE_MAPBOX_TILES) {
        // Use Mapbox's built-in style
        styleToUse = 'mapbox://styles/mapbox/light-v11';
    } else {
        // Use local tiles
        const styleName = mapStyles['minimal'] || 'minimal';
        styleToUse = await loadMapStyle(styleName);
    }

    map = new mapboxgl.Map({
        container: 'map',
        style: styleToUse,
        center: [-80.1918, 25.7617],
        zoom: 12 + ZOOM_OFFSET
    });
}
```

## Pricing Beyond Free Tier

If you exceed 50,000 map loads/month:

**Mapbox Pricing:**
- 0-50,000 loads: FREE
- 50,001-100,000 loads: $5 per 1,000
- 100,001-200,000 loads: $4 per 1,000
- 200,000+ loads: $3 per 1,000

**For a poster generator:**
- Each poster preview = 1 load
- Each poster print = 1 load
- 50,000 free loads = 50,000 posters/month!

## Alternative: MapTiler Cloud

If you prefer MapTiler:

```javascript
// MapTiler Cloud API
map = new mapboxgl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/streets/style.json?key=YOUR_MAPTILER_KEY',
    center: [-80.1918, 25.7617],
    zoom: 12 + ZOOM_OFFSET
});
```

**MapTiler Pricing:**
- Free tier: 100,000 tile requests/month
- Pro: $39/month
- Premium: $99/month

## Recommendation

**Start with Mapbox's free tier:**

1. ✅ Easy to implement (change one line of code)
2. ✅ 50,000 free loads/month
3. ✅ Full detail like PositivePrints
4. ✅ No server maintenance
5. ✅ Always up-to-date data

**Keep your local tiles as backup** for offline use or if you exceed free tier limits.

## Implementation

Create a toggle in your app:

```javascript
// Add to your config
const config = {
    USE_COMMERCIAL_TILES: true,
    MAPBOX_STYLE: 'mapbox://styles/mapbox/light-v11',
    LOCAL_STYLE: 'minimal'
};

// Then in initializeMap:
const styleToUse = config.USE_COMMERCIAL_TILES
    ? config.MAPBOX_STYLE
    : await loadMapStyle(config.LOCAL_STYLE);
```

This gives you the best of both worlds!
