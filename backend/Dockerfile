# Use official Puppeteer image with Chrome pre-installed
FROM ghcr.io/puppeteer/puppeteer:21.11.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install --production

# Copy application files
COPY . .

# Create output directory for generated posters
RUN mkdir -p /app/output

# Expose port
EXPOSE 3000

# Set environment variable for Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Run the application
CMD ["node", "server.js"]
