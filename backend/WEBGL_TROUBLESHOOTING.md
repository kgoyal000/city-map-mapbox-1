# WebGL Troubleshooting in Docker

## If WebGL Still Fails After Rebuild

### Option 1: Use Xvfb (Virtual Display)
Add Xvfb to Dockerfile for virtual display:

```dockerfile
# Add to Dockerfile after line 3
RUN apt-get update && apt-get install -y \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Update CMD at the end
CMD ["sh", "-c", "Xvfb :99 -screen 0 1920x1080x24 & DISPLAY=:99 node server.js"]
```

### Option 2: Use --disable-web-security (Not recommended for production)
Add to chromeArgs in server.js:
```javascript
'--disable-web-security',
'--disable-features=IsolateOrigins,site-per-process'
```

### Option 3: Switch to Maplibre GL JS (Static rendering)
Maplibre has better headless support. Can be migrated from Mapbox GL JS.

### Option 4: Run Backend Outside Docker
Use systemd or PM2 to run Node.js directly on host with system Chrome.

## Check Docker WebGL Support

Run this in container to test WebGL:
```bash
docker exec -it map-poster-backend /bin/bash
google-chrome-stable --headless --disable-gpu --dump-dom about:blank
```

## Verify Shared Memory
```bash
docker exec -it map-poster-backend df -h | grep shm
# Should show 2.0G
```

## Check Chrome Flags
Look for these in logs:
```
Using Docker bundled Chrome
Map 0 initialized with bearing=0, pitch=0
```
