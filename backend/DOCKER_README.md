# Map Poster Generator - Docker Setup

This Docker setup provides a reliable, pre-configured environment with Chrome and WebGL support for generating high-resolution map posters.

## Prerequisites

- Docker installed ([Download Docker Desktop](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Navigate to backend directory
cd backend

# Build and start the container
docker-compose up --build

# The server will be available at http://localhost:3000
```

To stop the container:
```bash
docker-compose down
```

### Option 2: Using Docker Commands Directly

```bash
# Build the image
docker build -t map-poster-backend .

# Run the container
docker run -p 3000:3000 \
  -v $(pwd)/output:/app/output \
  --name poster-generator \
  map-poster-backend

# Stop the container
docker stop poster-generator

# Remove the container
docker rm poster-generator
```

## What's Included

- ✅ **Pre-configured Chrome** with WebGL support
- ✅ **All dependencies** installed automatically
- ✅ **Persistent storage** for generated posters
- ✅ **Health checks** to ensure service is running
- ✅ **Auto-restart** on failure

## How It Works

1. **Docker Image**: Uses official Puppeteer image (`ghcr.io/puppeteer/puppeteer:21.11.0`)
   - Includes Google Chrome Stable
   - Pre-configured for headless rendering
   - WebGL works out-of-the-box

2. **Server Detection**: The server.js automatically detects if it's running in Docker and uses the appropriate Chrome executable

3. **Volume Mounting**: Generated posters are saved to `./output` directory on your host machine

## API Endpoints

Once running, the following endpoints are available:

- `POST /api/generate-poster` - Generate high-res poster
- `GET /api/job/:jobId` - Check job status
- `GET /api/download/:jobId` - Download generated poster
- `GET /health` - Health check

## Testing

After starting the container, test that it's working:

```bash
# Check health
curl http://localhost:3000/health

# Should return: {"status":"ok"}
```

Then open your frontend and click "Add to cart" to generate a poster.

## Viewing Logs

```bash
# Follow logs in real-time
docker-compose logs -f

# Or with docker
docker logs -f poster-generator
```

## Troubleshooting

### Container won't start
- Check if port 3000 is already in use: `lsof -ti:3000`
- Kill existing process: `kill -9 $(lsof -ti:3000)`

### WebGL errors
The Docker image has WebGL pre-configured. If you still see WebGL errors:
1. Rebuild the image: `docker-compose build --no-cache`
2. Check logs: `docker-compose logs`

### Permission errors
If you get permission errors on the output directory:
```bash
chmod 777 output
```

## Production Deployment

For production, consider:

1. **Environment Variables**: Create a `.env` file
   ```
   NODE_ENV=production
   PORT=3000
   ```

2. **Resource Limits**: Add to docker-compose.yml
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 4G
   ```

3. **Reverse Proxy**: Use Nginx or Caddy in front of the container

## Advantages of Docker Setup

✅ **Consistent Environment** - Works the same on all systems
✅ **No WebGL Issues** - Pre-configured and tested
✅ **Easy Deployment** - One command to run
✅ **Isolated** - Doesn't affect your system
✅ **Production Ready** - Can deploy to any cloud provider

## Cloud Deployment

This Docker setup can be deployed to:
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform
- Heroku Container Registry

Example for Google Cloud Run:
```bash
gcloud run deploy poster-generator \
  --source . \
  --port 3000 \
  --memory 2Gi
```
