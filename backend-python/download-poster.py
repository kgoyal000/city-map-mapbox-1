#!/usr/bin/env python3
"""
Download poster from Python backend API
Usage: python3 download-poster.py config.json output.png
"""

import sys
import json
import base64
import requests


def download_poster(config_file, output_file):
    """Download poster from API and save as PNG"""

    # Read config
    with open(config_file, 'r') as f:
        config = json.load(f)

    # Send request to API
    print(f"Sending request to backend...")
    response = requests.post(
        'http://localhost:3000/api/generate-poster',
        json=config,
        headers={'Content-Type': 'application/json'}
    )

    if response.status_code != 200:
        print(f"Error: API returned status {response.status_code}")
        print(response.text)
        return False

    # Parse response
    data = response.json()

    if 'image' not in data:
        print("Error: No image in response")
        print(json.dumps(data, indent=2))
        return False

    # Extract and decode base64 image
    image_data = data['image'].split('base64,')[1]
    image_bytes = base64.b64decode(image_data)

    # Save to file
    with open(output_file, 'wb') as f:
        f.write(image_bytes)

    print(f"✅ Poster saved to {output_file}")
    return True


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 download-poster.py config.json output.png")
        sys.exit(1)

    config_file = sys.argv[1]
    output_file = sys.argv[2]

    if download_poster(config_file, output_file):
        print(f"Successfully generated poster from {config_file}")
    else:
        print("Failed to generate poster")
        sys.exit(1)