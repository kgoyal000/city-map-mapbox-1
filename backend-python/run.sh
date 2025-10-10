#!/bin/bash

# Run Python backend

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Running setup first..."
    ./setup.sh
fi

# Activate virtual environment
source venv/bin/activate

# Run the server
echo "🚀 Starting Python Map Poster Backend..."
python app.py