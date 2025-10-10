# Use Selenium standalone Chrome image (has WebGL support)
FROM seleniarm/standalone-chromium:latest

# Switch to root for installations
USER root

# Install Python and dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Install Chrome driver for Selenium
RUN pip3 install webdriver-manager

# Copy application files
COPY . .

# Create output directory
RUN mkdir -p /app/output && \
    chmod 777 /app/output

# Environment variables
ENV DOCKER_ENV=true
ENV PYTHONUNBUFFERED=1
ENV DISPLAY=:99

# Expose port
EXPOSE 3000

# Run the application
CMD ["python3", "app.py"]