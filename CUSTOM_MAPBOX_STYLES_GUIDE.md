# How to Use Your Custom Mapbox Styles

You have **two options** for using custom styles with your maps:

---

## Option 1: Create Custom Styles in Mapbox Studio (Easiest)

This is the **recommended approach** - create beautiful custom styles using Mapbox's visual editor.

### Steps:

#### 1. Go to Mapbox Studio
Visit: https://studio.mapbox.com/

#### 2. Sign in
Use the same account as your API token

#### 3. Create a New Style
- Click **"New style"**
- Choose a template to start from:
  - **Monochrome** (good for minimal/clean looks)
  - **Outdoors** (good for natural/beachglass looks)
  - **Light** (good for minimal/bright looks)
  - **Dark** (good for carbon/black looks)
  - **Streets** (good for classic/vintage looks)

#### 4. Customize Your Style

**For a "Minimal" Style:**
- Base template: Monochrome or Light
- Reduce colors to simple palette
- Make water light blue: `#B3D9F2`
- Make land beige/cream: `#F5F5DC`
- Keep roads white or light gray
- Minimal labels

**For a "Beachglass" Style:**
- Base template: Outdoors
- Water: Soft blue-green `#7EC8E3`
- Land: Sandy beige `#E8DCC8`
- Parks: Soft green `#C8E6C9`
- Muted, pastel colors

**For a "Carbon/Black" Style:**
- Base template: Dark
- Background: Dark gray `#2D2D2D`
- Water: Dark blue `#1A2332`
- Roads: Light gray `#4A4A4A`
- Labels: White with transparency

**For "Vintage" Style:**
- Base template: Streets
- Use warm, sepia tones
- Parchment background: `#F4ECD8`
- Muted greens and browns
- Classic fonts

#### 5. Publish Your Style
- Click **"Publish"** in top right
- Give it a name (e.g., "My Minimal Style")
- Click **"Publish"**

#### 6. Get Your Style URL
After publishing, you'll see a **Style URL** like:
```
mapbox://styles/YOUR_USERNAME/clxxxxxxxxxxxxxx
```

#### 7. Use in Your Code

Update `js/script.js`:

```javascript
let mapStyles = {
    'minimal': 'mapbox://styles/YOUR_USERNAME/STYLE_ID_1',
    'beachglass': 'mapbox://styles/YOUR_USERNAME/STYLE_ID_2',
    'carbon': 'mapbox://styles/YOUR_USERNAME/STYLE_ID_3',
    'black': 'mapbox://styles/YOUR_USERNAME/STYLE_ID_4',
    'vintage': 'mapbox://styles/YOUR_USERNAME/STYLE_ID_5',
    'classic': 'mapbox://styles/mapbox/streets-v12',
    'pink': 'mapbox://styles/YOUR_USERNAME/STYLE_ID_6',
    'green': 'mapbox://styles/mapbox/outdoors-v12',
    'intense': 'mapbox://styles/mapbox/satellite-streets-v12',
    'atlas': 'mapbox://styles/mapbox/streets-v12',
    'custom': 'mapbox://styles/mapbox/streets-v12'
};
```

---

## Option 2: Clone & Modify Existing Styles Programmatically

You can also clone and modify existing Mapbox styles using their Styles API.

### Steps:

#### 1. Use Mapbox Styles API to Create a Style

```bash
# Create a custom style based on Light template
curl -X POST "https://api.mapbox.com/styles/v1/YOUR_USERNAME?access_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Minimal Style",
    "layers": [...],
    "sources": {...}
  }'
```

This is more complex but gives you full programmatic control.

---

## Option 3: Convert Your Existing OpenMapTiles Styles (Advanced)

I can help convert your existing custom styles (minimal.json, beachglass.json, etc.) to work with Mapbox data.

**This requires:**
1. Changing source from OpenMapTiles to Mapbox
2. Mapping OpenMapTiles layers to Mapbox layers:
   - `landcover` → `landuse`
   - `transportation` → `road`
   - `boundary` → `admin`
   - `waterway` → `water`
3. Updating filters and expressions
4. Fixing sprite references

**Would you like me to do this conversion?** It will preserve your exact custom styles.

---

## Quick Start: Create Your First Custom Style Now

### 1. Open Mapbox Studio
Go to: https://studio.mapbox.com/

### 2. Create "Minimal" Style
- Click "New style"
- Choose "Monochrome" template
- Customize colors:
  - Background: `#FFFFFF`
  - Water: `#B3D9F2`
  - Land: `#F5F5DC`
  - Roads: `#FFFFFF`
- Publish as "Minimal"
- Copy the style URL: `mapbox://styles/YOUR_USERNAME/clxxx...`

### 3. Update Your Code

In `js/script.js`, replace:
```javascript
'minimal': 'mapbox://styles/mapbox/light-v11',
```

With:
```javascript
'minimal': 'mapbox://styles/YOUR_USERNAME/YOUR_STYLE_ID',
```

### 4. Refresh Your Page
Your custom style now loads!

---

## Recommended Approach

**Start with Option 1** (Mapbox Studio):
- ✅ Visual editor - easy to use
- ✅ See changes in real-time
- ✅ No coding required
- ✅ Professional results
- ✅ Works immediately

**Then move to Option 3** if you want to preserve your exact existing styles.

---

## Color Palette Suggestions

### Minimal Style
```
Background: #FFFFFF (white)
Water: #B3D9F2 (light blue)
Land: #F5F5DC (beige)
Roads: #FFFFFF (white with gray stroke)
Parks: #E8F5E9 (light green)
Labels: #333333 (dark gray)
```

### Beachglass Style
```
Background: #F0F4F8 (off-white)
Water: #7EC8E3 (sea glass blue)
Land: #E8DCC8 (sandy beige)
Roads: #FFFFFF (white)
Parks: #C8E6C9 (soft green)
Labels: #5D4E37 (brown)
```

### Carbon Style
```
Background: #1A1A1A (charcoal)
Water: #1A2332 (dark navy)
Land: #2D2D2D (dark gray)
Roads: #4A4A4A (medium gray)
Parks: #2A3F2F (dark green)
Labels: #E0E0E0 (light gray)
```

### Vintage Style
```
Background: #F4ECD8 (parchment)
Water: #A8C5D1 (muted blue)
Land: #E8DCC8 (tan)
Roads: #D4C4B0 (light brown)
Parks: #BFD8B8 (sage green)
Labels: #5D4E37 (brown)
```

---

## My Recommendation

**Create 3-5 custom styles in Mapbox Studio** to start:
1. **Minimal** (light, clean)
2. **Dark** (carbon/black theme)
3. **Vintage** (warm, classic)
4. **Beach** (soft, coastal)
5. **Satellite** (use built-in satellite-streets-v12)

This gives you variety while keeping it simple.

---

## Next Steps

1. Go to https://studio.mapbox.com/ now
2. Create your first custom style (5 minutes)
3. Get the style URL
4. Update `mapStyles` in js/script.js
5. Refresh and test!

**Want me to convert your existing OpenMapTiles styles to Mapbox instead?** Just let me know and I'll do the conversion for you.
