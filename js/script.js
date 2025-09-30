let map;
let currentMarker = null;
let currentStyle = 'minimal'; // Start with Minimal style
let loadedStyles = {};
let customColors = {
	land: '#F5F5DC',
	roads: '#FFFFFF',
	water: '#87CEEB',
	background: '#F0F0F0'
};
let currentMarkerIcon = null; // Store the current marker icon element
let currentMarkerColor = '#E53422'; // Default red color

// Function to load map styles from JSON files
async function loadMapStyle(styleName) {
    if (loadedStyles[styleName]) {
        return loadedStyles[styleName];
    }

    try {
        const response = await fetch(`map-styles/${styleName}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load ${styleName}.json`);
        }
        const styleData = await response.json();
        loadedStyles[styleName] = styleData;
        return styleData;
    } catch (error) {
        console.error(`Error loading style ${styleName}:`, error);
        return null;
    }
}

let mapStyles = {
	'minimal': 'minimal', // Load GlobeTee Minimal style from JSON
	'beachglass': 'beachglass', // Load GlobeTee Beachglass style from JSON
	'carbon': 'carbon', // Load GlobeTee Carbon style from JSON
	'black': 'black', // Load GlobeTee Black style from JSON
	'vintage': 'vintage', // Load GlobeTee Vintage style from JSON
	'classic': 'classic', // Load GlobeTee Classic style from JSON
	'pink': 'pink', // Load GlobeTee Wanderlust style from JSON
	'green': 'green', // Load GlobeTee Cosy style from JSON
	'intense': 'intense', // Load GlobeTee Intense style from JSON
	'custom': 'mapbox://styles/mapbox/streets-v12' // Will be customized
};

// Mapbox access token - Get yours from https://account.mapbox.com/access-tokens/
mapboxgl.accessToken = 'pk.eyJ1IjoiZG9kbzc5MSIsImEiOiJjbWZianUyejEwNDNsMmpxdzBjZmZnbndtIn0.t5a9KzottI8eUYz396kfbQ';

/*
NOTE: The GlobeTee styles use custom tile server (https://tiles.positiveprints.com/data/v3.json)
For production use, you may need to:
1. Use Mapbox's default tiles (mapbox://mapbox.mapbox-streets-v8)
2. Or create your own tile server
3. Or use a different data source

The styles are loaded dynamically from JSON files in the map-styles/ directory.
*/

async function initializeMap() {
	console.log('Initializing map...');
	console.log('Mapbox token:', mapboxgl.accessToken ? 'Token exists' : 'No token');
	console.log('Map container:', document.getElementById('map'));

	// Check if container exists
	const mapContainer = document.getElementById('map');
	if (!mapContainer) {
		console.error('Map container not found!');
		return;
	}

	// Remove loading state
	mapContainer.classList.remove('map-loading');
	
	// Load the Minimal style from JSON
	const minimalStyle = await loadMapStyle('minimal');
	const styleToUse = minimalStyle || 'mapbox://styles/mapbox/streets-v12';

	try {
		map = new mapboxgl.Map({
			container: 'map',
			style: styleToUse,
			center: [-80.1918, 25.7617], // Miami coordinates
			zoom: 12
		});

		console.log('Map object created:', map);

		map.on('load', function() {
			console.log('Map loaded successfully!');

			// Force map container to be visible
			const mapContainer = document.getElementById('map');
			mapContainer.style.display = 'block';
			mapContainer.style.visibility = 'visible';
			mapContainer.style.opacity = '1';
			mapContainer.style.width = '100%';
			// mapContainer.style.height = '640px';

			// Check if map canvas exists
			const canvas = mapContainer.querySelector('canvas');
			console.log('Map canvas found:', canvas);
			if (canvas) {
				console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
				canvas.style.display = 'block';
				canvas.style.visibility = 'visible';
			}

			// Remove debug border after map loads
			setTimeout(() => {
				mapContainer.style.border = 'none';
			}, 2000);
	
				// Add navigation controls
				map.addControl(new mapboxgl.NavigationControl(), 'top-right');
	
				// Add geolocation control
				map.addControl(new mapboxgl.GeolocateControl({
					positionOptions: {
						enableHighAccuracy: true
					},
					trackUserLocation: true
				}), 'top-right');
	
				// Update title fields with Miami info (no default marker)
				updateTitleFields('Miami, United States', [-80.1918, 25.7617]);
				
				// Add poster title overlay
				addPosterTitleOverlay();
	
				console.log('Map setup complete');
				console.log('Map container final dimensions:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);
			});

		map.on('error', function(e) {
			console.error('Map error:', e);

			// Check if it's a token-related error
			if (e.error && e.error.message && e.error.message.includes('accessToken')) {
				createTokenSetupMessage();
			} else {
				mapContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #f77147; font-size: 16px; padding: 20px; text-align: center;">Error loading map: ' + e.error.message + '<br><br>Please check your internet connection and Mapbox token.</div>';
			}
		});

		map.on('styleerror', function(e) {
			console.error('Style error:', e);
		});

	} catch (error) {
		console.error('Error creating map:', error);

		// Check if it's a token-related error
		if (error.message && error.message.includes('accessToken')) {
			createTokenSetupMessage();
		} else {
			mapContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #f77147; font-size: 16px; padding: 20px; text-align: center;">Error initializing map: ' + error.message + '<br><br>Please check your Mapbox token and internet connection.</div>';
		}
	}
}

// Function to reinitialize map with current state preserved
async function reinitializeMap() {
	if (!map) {
		resizeFrame();
		return;
	}
	
	// Hide map container and show loading spinner
	const mapContainer = document.getElementById('map');
	const previewTitle = document.querySelector('.map-preview-title');
	
	// Create loading spinner
	const loadingSpinner = document.createElement('div');
	loadingSpinner.className = 'map-loading-spinner';
	loadingSpinner.innerHTML = `
		<div class="spinner-container">
			<div class="spinner"></div>
			<p>Updating preview...</p>
		</div>
	`;
	loadingSpinner.style.cssText = `
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(255, 255, 255, 0.95);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	`;
	
	// Add spinner to map container's parent
	const innContainer = mapContainer.parentElement;
	innContainer.style.position = 'relative';
	innContainer.appendChild(loadingSpinner);
	
	mapContainer.style.opacity = '0';
	if (previewTitle) {
		previewTitle.style.opacity = '0';
	}
	
	console.log('Loading spinner shown');
	
	// Save current map state including title text and custom colors
	const titleTextarea1 = document.querySelector('.map__title .content textarea:nth-child(2)');
	const titleTextarea2 = document.querySelector('.map__title .content textarea:nth-child(4)');
	
	// Save current background color from preview title
	const currentBgColor = $('.map-preview-title').css('background-color') || '#ffffff';
	const currentTextColor = $('.map-preview-title h3').css('color') || '#16212c';
	
	const savedState = {
		center: map.getCenter(),
		zoom: map.getZoom(),
		styleKey: currentStyle, // Save the style key/name
		customColors: { ...customColors }, // Deep copy of custom colors
		backgroundColor: currentBgColor,
		textColor: currentTextColor,
		marker: currentMarker ? {
			position: currentMarker.getLngLat(),
			icon: currentMarkerIcon,
			color: currentMarkerColor
		} : null,
		title: titleTextarea1 ? titleTextarea1.value : 'MIAMI, UNITED STATES',
		subtitle: titleTextarea2 ? titleTextarea2.value : '25.76168°N / 80.19179°W'
	};
	
	console.log('Saving map state for reinit (including background):', savedState);
	
	// Remove current map
	map.remove();
	map = null;
	currentMarker = null;
	
	// Clear the map container
	mapContainer.innerHTML = '';
	
	// Resize container first and get the exact dimensions
	resizeFrame();
	
	// Force container to have explicit dimensions
	setTimeout(async function() {
		const container = document.getElementById('map');
		const containerWidth = container.offsetWidth;
		const containerHeight = container.offsetHeight;
		
		// Set explicit pixel dimensions on container
		container.style.width = containerWidth + 'px';
		container.style.height = containerHeight + 'px';
		
		console.log('Container explicit dimensions set:', containerWidth, 'x', containerHeight);
		
		// Load the style properly
		let styleToUse = savedState.styleKey;
		let isCustomStyle = false;
		
		// If it's a style name (not a URL), load from JSON
		if (typeof styleToUse === 'string' && !styleToUse.includes('mapbox://')) {
			isCustomStyle = (styleToUse === 'custom');
			const styleData = await loadMapStyle(styleToUse);
			if (styleData) {
				styleToUse = styleData;
			} else {
				// Fallback to Mapbox default
				styleToUse = 'mapbox://styles/mapbox/streets-v12';
			}
		} else if (styleToUse === 'mapbox://styles/mapbox/streets-v12' && savedState.customColors.land !== '#F5F5DC') {
			// This is likely custom style using default Mapbox base
			isCustomStyle = true;
		}
		
		console.log('Using style for reinit:', typeof styleToUse === 'object' ? 'JSON style object' : styleToUse, 'Custom:', isCustomStyle);
		
		// Wait for DOM to settle, then initialize map
		setTimeout(function() {
			// Reinitialize map with saved state
			map = new mapboxgl.Map({
				container: 'map',
				style: styleToUse,
				center: savedState.center,
				zoom: savedState.zoom
			});
			
			map.on('load', function() {
				console.log('Map loaded successfully');
				
				// Reapply custom colors if it was custom style
				if (isCustomStyle) {
					console.log('Reapplying custom colors:', savedState.customColors);
					customColors = savedState.customColors;
					applyCustomMapColors();
				}
				
				// Restore background color to both elements
				$('.map-preview-title').css('background-color', savedState.backgroundColor);
				$('.main__wrapper .outer__main .canvas__wrapper canvas').css('background-color', savedState.backgroundColor);
				$('.map-preview-title h3, .map-preview-title p').css('color', savedState.textColor);
				console.log('Background color restored:', savedState.backgroundColor, 'Text color:', savedState.textColor);
				
				// Aggressive canvas sizing
				const canvas = mapContainer.querySelector('canvas');
				if (canvas) {
					// Force canvas to exact container dimensions
					canvas.style.width = containerWidth + 'px';
					canvas.style.height = containerHeight + 'px';
					console.log('Canvas dimensions set to:', containerWidth, 'x', containerHeight);
				}
				
				// Multiple resize calls with increasing delays
				[50, 150, 300, 500].forEach((delay, index) => {
					setTimeout(function() {
						map.resize();
						
						const canvas = mapContainer.querySelector('canvas');
						if (canvas) {
							canvas.style.width = containerWidth + 'px';
							canvas.style.height = containerHeight + 'px';
							// Reapply background color to canvas
							canvas.style.backgroundColor = savedState.backgroundColor;
						}
						
						console.log(`Resize attempt ${index + 1} completed`);
					}, delay);
				});
				
				// Restore marker if it existed
				if (savedState.marker) {
					setTimeout(function() {
						addOrUpdateMarker([savedState.marker.position.lng, savedState.marker.position.lat]);
						console.log('Marker restored at:', savedState.marker.position);
					}, 600);
				}
				
				// Restore poster title overlay with saved text
				addPosterTitleOverlay();
				updatePosterTitle(savedState.title, savedState.subtitle);
				updatePreviewTitle(savedState.title, savedState.subtitle);
				console.log('Title restored:', savedState.title, savedState.subtitle);
				
				// Show map after everything is applied
				setTimeout(function() {
					// Fade out spinner
					if (loadingSpinner) {
						loadingSpinner.style.opacity = '0';
						setTimeout(function() {
							loadingSpinner.remove();
						}, 300);
					}
					
					// Fade in map
					mapContainer.style.opacity = '1';
					mapContainer.style.visibility = 'visible';
					if (previewTitle) {
						previewTitle.style.opacity = '1';
					}
					console.log('✓ Map shown - all changes applied');
				}, 650); // Show after all resizes complete
			});
			
			map.on('error', function(e) {
				console.error('Map reinit error:', e);
			});
		}, 100);
	}, 100);
}

// Function to show token setup message
function createTokenSetupMessage() {
	const mapContainer = document.getElementById('map');
	if (!mapContainer) return;

	mapContainer.innerHTML = `
		<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 16px; padding: 20px; text-align: center; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
			<div style="width: 100px; height: 100px; background: #f77147; border-radius: 50%; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">🔑</div>
			<h3 style="margin: 0 0 10px 0; color: #333;">Mapbox Token Required</h3>
			<p style="margin: 0 0 20px 0; font-size: 14px;">To enable the interactive map, you need to set up your Mapbox token:</p>
			<ol style="text-align: left; font-size: 12px; color: #555; margin-bottom: 20px;">
				<li>Go to <a href="https://account.mapbox.com/access-tokens/" target="_blank" style="color: #f77147;">Mapbox Account</a></li>
				<li>Create a free account (if you don't have one)</li>
				<li>Generate a new access token</li>
				<li>Copy the token and replace 'pk.eyJ1IjoiZG9kbzc5MSIsImEiOiJjbWZianUyejEwNDNsMmpxdzBjZmZnbndtIn0.t5a9KzottI8eUYz396kfbQ' in the JavaScript file</li>
				<li>Refresh the page</li>
			</ol>
			<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-family: monospace; font-size: 11px; word-break: break-all; border-left: 4px solid #f77147;">
				<strong>Current token:</strong><br>
				${mapboxgl.accessToken}
			</div>
			<button onclick="location.reload()" style="padding: 8px 16px; background: #f77147; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Reload Page</button>
			<button onclick="window.open('https://account.mapbox.com/access-tokens/', '_blank')" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Get Token</button>
		</div>
	`;
}

// Fallback function if Mapbox fails
function createFallbackMap() {
	const mapContainer = document.getElementById('map');
	if (!mapContainer) return;

	mapContainer.innerHTML = `
		<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 16px; padding: 20px; text-align: center; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
			<div style="width: 100px; height: 100px; background: #f77147; border-radius: 50%; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">🗺️</div>
			<h3 style="margin: 0 0 10px 0; color: #333;">Interactive Map</h3>
			<p style="margin: 0 0 20px 0; font-size: 14px;">The map failed to load. This might be due to:</p>
			<ul style="text-align: left; font-size: 12px; color: #555; margin-bottom: 20px;">
				<li>Invalid or expired Mapbox token</li>
				<li>Network connectivity issues</li>
				<li>Mapbox service temporarily unavailable</li>
			</ul>
			<button onclick="location.reload()" style="padding: 8px 16px; background: #f77147; color: white; border: none; border-radius: 4px; cursor: pointer;">Try Again</button>
		</div>
	`;
}

// Handle window resize
$(window).on('resize', function() {
	if (map) {
		setTimeout(function() {
			map.resize();
		}, 100);
	}
});

// Check map status after a delay
setTimeout(function() {
	if (!map || !map.loaded()) {
		console.log('Map not loaded, checking token...');
		if (mapboxgl.accessToken === 'pk.eyJ1IjoiZG9kbzc5MSIsImEiOiJjbWZianUyejEwNDNsMmpxdzBjZmZnbndtIn0.t5a9KzottI8eUYz396kfbQ' || !mapboxgl.accessToken) {
			console.log('Mapbox token not set, showing token setup message...');
			createTokenSetupMessage();
		} else {
			console.log('Map not loaded despite having token, creating fallback...');
			createFallbackMap();
		}
	}
}, 5000);

// Add keyboard shortcuts
$(document).on('keydown', function(e) {
	if (e.ctrlKey || e.metaKey) {
		switch(e.key) {
			case 's':
				e.preventDefault();
				saveMapConfiguration();
				break;
			case 'e':
				e.preventDefault();
				exportMap('png');
				break;
		}
	}
});

function searchLocation(query, selectFirst = true) {
	if (query.length < 3) return;

	return fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&limit=5`)
		.then(response => response.json())
		.then(data => {
			if (data.features && data.features.length > 0) {
				if (selectFirst) {
					const place = data.features[0];
					const coordinates = place.center;

					// Update map center without animation
					map.jumpTo({
						center: coordinates,
						zoom: 14
					});

					// Add or update marker only if checkbox is checked
					const markerCheckbox = document.querySelector('.map__marker input[type="checkbox"]');
					if (markerCheckbox && markerCheckbox.checked) {
						addOrUpdateMarker(coordinates);
					}

					// Update title fields
					updateTitleFields(place.place_name, coordinates);
				}
				return data.features;
			}
			return [];
		})
		.catch(error => {
			console.error('Error searching location:', error);
			return [];
		});
}

// Function to create custom marker with icon and color
function addOrUpdateMarker(coordinates) {
	console.log('Creating marker at:', coordinates, 'Color:', currentMarkerColor, 'Has icon:', !!currentMarkerIcon);
	
	// Remove existing marker
	if (currentMarker) {
		currentMarker.remove();
	}
	
	// Create custom marker element if icon is selected
	if (currentMarkerIcon) {
		const el = document.createElement('div');
		el.className = 'custom-marker';
		el.innerHTML = currentMarkerIcon;
		el.style.width = '40px';
		el.style.height = '40px';
		el.style.cursor = 'pointer';
		el.style.display = 'flex';
		el.style.alignItems = 'center';
		el.style.justifyContent = 'center';
		
		// Apply color to SVG elements
		const svg = el.querySelector('svg');
		if (svg) {
			svg.style.width = '100%';
			svg.style.height = '100%';
			
			console.log('Applying color to SVG...');
			
			// Apply color to all paths with marker-fill class
			const fills = svg.querySelectorAll('.marker-fill');
			console.log('Found marker-fill elements:', fills.length);
			fills.forEach(path => {
				path.setAttribute('fill', currentMarkerColor);
			});
			
			// Apply color to all paths with marker-stroke class
			const strokes = svg.querySelectorAll('.marker-stroke');
			console.log('Found marker-stroke elements:', strokes.length);
			strokes.forEach(path => {
				path.setAttribute('stroke', currentMarkerColor);
			});
			
			// Also try to apply to .st0 class (common in SVGs)
			const st0Elements = svg.querySelectorAll('.st0');
			console.log('Found .st0 elements:', st0Elements.length);
			st0Elements.forEach(el => {
				el.setAttribute('fill', currentMarkerColor);
			});
			
			// If no special classes, apply to all paths
			if (fills.length === 0 && strokes.length === 0 && st0Elements.length === 0) {
				console.log('No special classes found, applying to all paths');
				const allPaths = svg.querySelectorAll('path');
				console.log('Total paths found:', allPaths.length);
				allPaths.forEach(path => {
					path.setAttribute('fill', currentMarkerColor);
					path.setAttribute('stroke', currentMarkerColor);
				});
			}
		}
		
		// Create marker with custom element (pass element directly, not in options)
		currentMarker = new mapboxgl.Marker(el)
			.setLngLat(coordinates)
			.addTo(map);
			
		console.log('✓ Custom marker created with icon and color:', currentMarkerColor);
	} else {
		// Default marker with color
		currentMarker = new mapboxgl.Marker({ color: currentMarkerColor })
			.setLngLat(coordinates)
			.addTo(map);
			
		console.log('✓ Default marker created with color:', currentMarkerColor);
	}
}

function showLocationSuggestions(suggestions, inputElement) {
	// Remove existing suggestions
	const existingSuggestions = document.querySelector('.location-suggestions');
	if (existingSuggestions) {
		existingSuggestions.remove();
	}

	if (!suggestions || suggestions.length === 0) return;

	// Create suggestions dropdown
	const suggestionsDiv = document.createElement('div');
	suggestionsDiv.className = 'location-suggestions';
	suggestionsDiv.style.cssText = `
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #dedede;
		border-top: none;
		border-radius: 0 0 4px 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		z-index: 1000;
		max-height: 200px;
		overflow-y: auto;
	`;

	suggestions.forEach((place, index) => {
		const suggestionItem = document.createElement('div');
		suggestionItem.className = 'suggestion-item';
		suggestionItem.style.cssText = `
			padding: 12px 16px;
			cursor: pointer;
			border-bottom: 1px solid #f0f0f0;
			transition: background-color 0.2s ease;
		`;
		
		suggestionItem.innerHTML = `
			<div style="font-weight: 500; color: #16212c; margin-bottom: 2px;">${place.text}</div>
			<div style="font-size: 12px; color: #666;">${place.place_name}</div>
		`;

		suggestionItem.addEventListener('mouseenter', () => {
			suggestionItem.style.backgroundColor = '#f8f9fa';
		});

		suggestionItem.addEventListener('mouseleave', () => {
			suggestionItem.style.backgroundColor = 'white';
		});

		suggestionItem.addEventListener('click', () => {
			const coordinates = place.center;
			
			// Update input value
			inputElement.value = place.place_name;
			
			// Update map
			if (map) {
				map.jumpTo({
					center: coordinates,
					zoom: 14
				});

				// Add or update marker only if checkbox is checked
				const markerCheckbox = document.querySelector('.map__marker input[type="checkbox"]');
				if (markerCheckbox && markerCheckbox.checked) {
					addOrUpdateMarker(coordinates);
				}

				// Update title fields
				updateTitleFields(place.place_name, coordinates);
			}

			// Remove suggestions
			suggestionsDiv.remove();
		});

		if (index === suggestions.length - 1) {
			suggestionItem.style.borderBottom = 'none';
		}

		suggestionsDiv.appendChild(suggestionItem);
	});

	// Position relative to input
	const inputContainer = inputElement.parentElement;
	inputContainer.style.position = 'relative';
	inputContainer.appendChild(suggestionsDiv);

	// Close suggestions when clicking outside
	const closeHandler = (e) => {
		if (!suggestionsDiv.contains(e.target) && e.target !== inputElement) {
			suggestionsDiv.remove();
			document.removeEventListener('click', closeHandler);
		}
	};
	
	setTimeout(() => {
		document.addEventListener('click', closeHandler);
	}, 100);
}

function showMarkerSuggestions(suggestions, inputElement) {
	// Remove existing suggestions
	const existingSuggestions = document.querySelector('.location-suggestions');
	if (existingSuggestions) {
		existingSuggestions.remove();
	}

	if (!suggestions || suggestions.length === 0) return;

	// Create suggestions dropdown
	const suggestionsDiv = document.createElement('div');
	suggestionsDiv.className = 'location-suggestions';
	suggestionsDiv.style.cssText = `
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #dedede;
		border-top: none;
		border-radius: 0 0 4px 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		z-index: 1000;
		max-height: 200px;
		overflow-y: auto;
	`;

	suggestions.forEach((place, index) => {
		const suggestionItem = document.createElement('div');
		suggestionItem.className = 'suggestion-item';
		suggestionItem.style.cssText = `
			padding: 12px 16px;
			cursor: pointer;
			border-bottom: 1px solid #f0f0f0;
			transition: background-color 0.2s ease;
		`;
		
		suggestionItem.innerHTML = `
			<div style="font-weight: 500; color: #16212c; margin-bottom: 2px;">${place.text}</div>
			<div style="font-size: 12px; color: #666;">${place.place_name}</div>
		`;

		suggestionItem.addEventListener('mouseenter', () => {
			suggestionItem.style.backgroundColor = '#f8f9fa';
		});

		suggestionItem.addEventListener('mouseleave', () => {
			suggestionItem.style.backgroundColor = 'white';
		});

		suggestionItem.addEventListener('click', () => {
			const coordinates = place.center;
			
			// Update input value
			inputElement.value = place.place_name;
			
			// Update map
			if (map) {
				map.jumpTo({
					center: coordinates,
					zoom: 14
				});

				// Add marker
				addOrUpdateMarker(coordinates);

				// Update title fields
				updateTitleFields(place.place_name, coordinates);
			}

			// Remove suggestions
			suggestionsDiv.remove();
		});

		if (index === suggestions.length - 1) {
			suggestionItem.style.borderBottom = 'none';
		}

		suggestionsDiv.appendChild(suggestionItem);
	});

	// Position relative to input
	const inputContainer = inputElement.parentElement;
	inputContainer.style.position = 'relative';
	inputContainer.appendChild(suggestionsDiv);

	// Close suggestions when clicking outside
	const closeHandler = (e) => {
		if (!suggestionsDiv.contains(e.target) && e.target !== inputElement) {
			suggestionsDiv.remove();
			document.removeEventListener('click', closeHandler);
		}
	};
	
	setTimeout(() => {
		document.addEventListener('click', closeHandler);
	}, 100);
}

function updateTitleFields(placeName, coordinates) {
	const titleInput = document.querySelector('.map__title .content textarea:nth-child(2)');
	const subtitleInput = document.querySelector('.map__title .content textarea:nth-child(4)');

	if (titleInput) {
		titleInput.value = placeName || 'MIAMI, UNITED STATES';
	}

	if (subtitleInput) {
		const lat = coordinates[1].toFixed(5);
		const lng = coordinates[0].toFixed(5);
		subtitleInput.value = `${lat}°N / ${Math.abs(lng)}°W`;
	}
	
	// Update poster title overlay
	updatePosterTitle(placeName, `${coordinates[1].toFixed(5)}°N / ${Math.abs(coordinates[0]).toFixed(5)}°W`);
	
	// Update preview title below map
	updatePreviewTitle(placeName, `${coordinates[1].toFixed(5)}°N / ${Math.abs(coordinates[0]).toFixed(5)}°W`);
}

// Update preview title below map
function updatePreviewTitle(title, subtitle) {
	const previewTitle = document.getElementById('preview-title');
	const previewSubtitle = document.getElementById('preview-subtitle');
	
	if (previewTitle) {
		previewTitle.textContent = title || 'MIAMI, UNITED STATES';
	}
	
	if (previewSubtitle) {
		previewSubtitle.textContent = subtitle || '25.76168°N / 80.19179°W';
	}
}

async function changeMapStyle(styleKey) {
	const styleConfig = mapStyles[styleKey] || mapStyles['minimal'];
	currentStyle = styleConfig;

	if (map) {
		// Check if it's a style name to load from JSON or a URL
		if (typeof styleConfig === 'string' && styleConfig.includes('mapbox://')) {
			// It's a Mapbox URL
			map.setStyle(styleConfig);
		} else {
			// It's a style name, load from JSON file
			const styleData = await loadMapStyle(styleConfig);
			if (styleData) {
				map.setStyle(styleData);
			} else {
				console.error(`Failed to load style: ${styleConfig}`);
				// Fallback to default Mapbox style
				map.setStyle('mapbox://styles/mapbox/streets-v12');
			}
		}

		// Wait for style to load before trying to modify layers
		map.once('styledata', () => {
			try {
				// Add custom styling for specific themes only if layers exist
				if (styleKey === 'pink') {
					if (map.getLayer('water')) {
						map.setPaintProperty('water', 'fill-color', '#e8b4d6');
					}
					if (map.getLayer('landuse')) {
						map.setPaintProperty('landuse', 'fill-color', '#f7e8f1');
					}
				} else if (styleKey === 'green') {
					if (map.getLayer('water')) {
						map.setPaintProperty('water', 'fill-color', '#a8d8a8');
					}
					if (map.getLayer('landuse')) {
						map.setPaintProperty('landuse', 'fill-color', '#e8f5e8');
					}
				} else if (styleKey === 'custom') {
					// Apply custom colors for custom style
					applyCustomMapColors();
				}
			} catch (error) {
				console.warn('Could not apply custom layer styling:', error);
			}
		});
	}
}

// Apply custom colors to map layers
function applyCustomMapColors() {
	if (!map) return;
	
	// Function to apply colors
	const applyColors = () => {
		try {
			// Apply land/landuse color
			if (map.getLayer('landuse')) {
				map.setPaintProperty('landuse', 'fill-color', customColors.land);
			}
			if (map.getLayer('landcover')) {
				map.setPaintProperty('landcover', 'fill-color', customColors.land);
			}
			if (map.getLayer('land')) {
				map.setPaintProperty('land', 'background-color', customColors.land);
			}
			
			// Apply roads color - try multiple layer variations
			const roadLayers = ['road', 'road-primary', 'road-secondary-tertiary', 'road-street',
			                    'road-minor', 'road-arterial', 'road-highway', 'road-trunk',
			                    'road-motorway', 'bridge-street', 'tunnel-street'];
			roadLayers.forEach(layerId => {
				if (map.getLayer(layerId)) {
					map.setPaintProperty(layerId, 'line-color', customColors.roads);
				}
			});
			
			// Apply water color
			if (map.getLayer('water')) {
				map.setPaintProperty('water', 'fill-color', customColors.water);
			}
			if (map.getLayer('waterway')) {
				map.setPaintProperty('waterway', 'line-color', customColors.water);
			}
			
			// Apply background color
			if (map.getLayer('background')) {
				map.setPaintProperty('background', 'background-color', customColors.background);
			}
			
			console.log('Custom colors applied:', customColors);
		} catch (error) {
			console.warn('Could not apply custom colors:', error);
		}
	};
	
	// If map is loaded, apply immediately
	if (map.loaded()) {
		applyColors();
	} else {
		// Otherwise wait for load
		map.once('load', applyColors);
	}
}

function resetMapStyle() {
	if (map) {
		// Reset to original style
		map.setStyle(currentStyle);
	}
}

function exportMap(format = 'png') {
	if (!map) {
		alert('Map is not loaded yet. Please wait a moment and try again.');
		return;
	}

	// Create a canvas element to capture the map
	const canvas = map.getCanvas();

	// Add timestamp to filename
	const timestamp = new Date().toISOString().split('T')[0];
	const filename = `map-export-${timestamp}.${format}`;

	try {
		if (format === 'png') {
			// For PNG, use the canvas directly
			const dataURL = canvas.toDataURL('image/png');

			// Create download link
			const link = document.createElement('a');
			link.download = filename;
			link.href = dataURL;
			link.click();
		} else if (format === 'jpg') {
			// For JPG, convert canvas to blob
			canvas.toBlob(function(blob) {
				const url = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.download = filename;
				link.href = url;
				link.click();
				URL.revokeObjectURL(url);
			}, 'image/jpeg', 0.9);
		}

		// Show success message
		showExportMessage('Map exported successfully!');
	} catch (error) {
		console.error('Export error:', error);
		showExportMessage('Error exporting map. Please try again.', 'error');
	}
}

function showExportMessage(message, type = 'success') {
	// Create or update export message
	let messageEl = document.getElementById('export-message');

	if (!messageEl) {
		messageEl = document.createElement('div');
		messageEl.id = 'export-message';
		messageEl.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			padding: 12px 20px;
			border-radius: 8px;
			color: white;
			font-weight: 500;
			z-index: 1000;
			transition: all 0.3s ease;
			background-color: ${type === 'error' ? '#f77147' : '#4CAF50'};
		`;
		document.body.appendChild(messageEl);
	} else {
		messageEl.style.backgroundColor = type === 'error' ? '#f77147' : '#4CAF50';
	}

	messageEl.textContent = message;
	messageEl.style.display = 'block';

	// Hide after 3 seconds
	setTimeout(() => {
		messageEl.style.display = 'none';
	}, 3000);
}

function saveMapConfiguration() {
	const config = {
		center: map.getCenter(),
		zoom: map.getZoom(),
		style: currentStyle,
		marker: currentMarker ? currentMarker.getLngLat() : null,
		title: document.querySelector('.map__title .content textarea:nth-child(2)')?.value || '',
		subtitle: document.querySelector('.map__title .content textarea:nth-child(4)')?.value || '',
		timestamp: new Date().toISOString()
	};

	// Save to localStorage
	localStorage.setItem('mapConfiguration', JSON.stringify(config));

	showExportMessage('Map configuration saved!');
}

function loadMapConfiguration() {
	const saved = localStorage.getItem('mapConfiguration');

	if (saved) {
		try {
			const config = JSON.parse(saved);

			// Restore map state
			if (config.center) {
				map.flyTo({
					center: config.center,
					zoom: config.zoom || 12
				});
			}

			// Restore marker
			if (config.marker) {
				if (currentMarker) {
					currentMarker.remove();
				}
				currentMarker = new mapboxgl.Marker()
					.setLngLat(config.marker)
					.addTo(map);
			}

			// Restore title fields
			const titleInput = document.querySelector('.map__title .content textarea:nth-child(2)');
			const subtitleInput = document.querySelector('.map__title .content textarea:nth-child(4)');

			if (titleInput && config.title) {
				titleInput.value = config.title;
			}

			if (subtitleInput && config.subtitle) {
				subtitleInput.value = config.subtitle;
			}

			showExportMessage('Map configuration loaded!');
		} catch (error) {
			console.error('Error loading configuration:', error);
			showExportMessage('Error loading saved configuration.', 'error');
		}
	} else {
		showExportMessage('No saved configuration found.', 'error');
	}
}

function toggleMapMarker() {
	const markerCheckbox = document.querySelector('.map__marker input[type="checkbox"]');

	if (markerCheckbox && markerCheckbox.checked) {
		if (currentMarker && map) {
			currentMarker.addTo(map);
		}
		// Show marker info section
		$('.marker__info').slideDown(300);
	} else {
		if (currentMarker) {
			currentMarker.remove();
		}
		// Hide marker info section
		$('.marker__info').slideUp(300);
	}
}

function updateMapTitle() {
	const titleCheckbox = document.querySelector('.map__title .title input[type="checkbox"]');
	const posterTitle = document.querySelector('.poster-title');

	if (titleCheckbox && titleCheckbox.checked) {
		$('.map__title .content').slideDown(300);
		if (posterTitle) {
			posterTitle.style.display = 'block';
		}
	} else {
		$('.map__title .content').slideUp(300);
		if (posterTitle) {
			posterTitle.style.display = 'none';
		}
	}
}

function changeMapLayout(layoutType) {
	// Handle different layout shapes (circle, heart, square, puzzle, story)
	const mapContainer = document.getElementById('map');

	// Remove existing layout classes
	mapContainer.className = mapContainer.className.replace(/layout-\w+/g, '');

	// Add new layout class
	if (layoutType !== 'default') {
		mapContainer.classList.add(`layout-${layoutType}`);
	}

	// Apply different clip-paths for different shapes
	switch(layoutType) {
		case 'circle':
			mapContainer.style.clipPath = 'circle(50% at center)';
			break;
		case 'heart':
			mapContainer.style.clipPath = 'path("M128 0C59 0 0 59 0 128c0 69 59 128 128 128s128-59 128-128C256 59 197 0 128 0z")';
			break;
		case 'square':
			mapContainer.style.clipPath = 'none';
			mapContainer.style.borderRadius = '0';
			break;
		default:
			mapContainer.style.clipPath = 'none';
			mapContainer.style.borderRadius = '8px';
	}
}

function addMapOverlay() {
	// Add a subtle overlay to the map for better text readability
	const overlay = document.createElement('div');
	overlay.className = 'map-overlay';
	overlay.style.cssText = `
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.1);
		pointer-events: none;
		z-index: 1;
		border-radius: 8px;
	`;

	document.getElementById('map').appendChild(overlay);
}

// Add poster title overlay to the map
function addPosterTitleOverlay() {
	const mapContainer = document.getElementById('map');
	if (!mapContainer) return;
	
	// Remove existing title overlay
	const existingTitle = mapContainer.querySelector('.poster-title');
	if (existingTitle) {
		existingTitle.remove();
	}
	
	// Create title overlay
	const titleOverlay = document.createElement('div');
	titleOverlay.className = 'poster-title';
	titleOverlay.innerHTML = `
		<h3>MIAMI, UNITED STATES</h3>
		<p>25.76168°N / 80.19179°W</p>
	`;
	
	mapContainer.appendChild(titleOverlay);
}

// Update poster title overlay
function updatePosterTitle(title, subtitle) {
	const titleOverlay = document.querySelector('.poster-title');
	if (titleOverlay) {
		const h3 = titleOverlay.querySelector('h3');
		const p = titleOverlay.querySelector('p');
		
		if (h3) h3.textContent = title || 'MIAMI, UNITED STATES';
		if (p) p.textContent = subtitle || '25.76168°N / 80.19179°W';
	}
}

// Size to aspect ratio mapping (height/width for PORTRAIT orientation)
// These are actual paper proportions
const sizeRatios = {
	'A4': 1.414,        // 21 x 29.7 cm (height/width = 29.7/21)
	'50x70cm': 1.4,     // 50 x 70 cm (height/width = 70/50)
	'70x100cm': 1.428,  // 70 x 100 cm (height/width = 100/70)
	'30x40cm': 1.333    // 30 x 40 cm (height/width = 40/30)
};

let resizeType = "portrait";

// Get the selected size or default to first size
function getSelectedSizeRatio() {
	const selectedSize = $('.elem__picker .size__picker > a.current .head p').text().trim();
	if (selectedSize && sizeRatios[selectedSize]) {
		return sizeRatios[selectedSize];
	}
	// Default to first size in the list (A4)
	return sizeRatios['A4'] || 0.85;
}

let currentAspectRatio = getSelectedSizeRatio(); // Get initial ratio from selected/first size

// Resize frame function - must be defined before document.ready
function resizeFrame(){
	const maxTotalHeight = 750; // Maximum total poster height (map + title)
	const maxWidth = 520;  // Maximum poster width for portrait
	const maxLandscapeWidth = 800; // Maximum width for landscape
	
	// Get the preview title height (approximate)
	const titleHeight = 70; // Approximate height of map-preview-title section
	
	let width, mapHeight, totalHeight;
	
	// Calculate dimensions based on orientation
	// IMPORTANT: Aspect ratio applies to TOTAL poster (map + title), not just map
	if (resizeType === "landscape") {
		// Landscape - width is LARGER than height
		// For landscape: totalWidth / totalHeight = ratio
		// Start with a base total height and calculate width
		totalHeight = 470; // Base total poster height for landscape (map + title)
		width = totalHeight * currentAspectRatio; // width = total height × (width/height ratio)
		mapHeight = totalHeight - titleHeight;
		
		// If width exceeds max, recalculate proportionally
		if (width > maxLandscapeWidth) {
			width = maxLandscapeWidth;
			totalHeight = width / currentAspectRatio; // total height = width / (width/height ratio)
			mapHeight = totalHeight - titleHeight;
		}
	} else if (resizeType === "square") {
		// Square - total dimensions should be equal (1:1 ratio)
		// For square: totalWidth = totalHeight
		totalHeight = 570; // Total poster height including title
		width = totalHeight; // Width equals height for square
		mapHeight = totalHeight - titleHeight;
	} else {
		// Portrait (default) - height is LARGER than width
		// For portrait: totalHeight / width = ratio
		// Total poster (map + title) should match the aspect ratio
		
		width = maxWidth;
		totalHeight = width * currentAspectRatio; // total height = width × (height/width ratio)
		mapHeight = totalHeight - titleHeight;
		
		// If total height exceeds max, scale down proportionally
		if (totalHeight > maxTotalHeight) {
			totalHeight = maxTotalHeight;
			width = totalHeight / currentAspectRatio; // width = total height / (height/width ratio)
			mapHeight = totalHeight - titleHeight;
		}
	}
	
	// Round dimensions
	const finalWidth = Math.round(width);
	const finalHeight = Math.round(mapHeight);
	
	// Apply dimensions to map container ONLY
	// Let Mapbox handle canvas sizing internally for proper rendering
	$("#map").css({
		"height": finalHeight + "px",
		"width": finalWidth + "px",
		"max-width": finalWidth + "px"
	});
	
	// Also resize preview title container to match width
	$('.map-preview-title').css("width", finalWidth + "px");
	
	console.log('Resize:', resizeType, 'Ratio:', currentAspectRatio,
	           'Map container:', finalWidth + 'w x ' + finalHeight + 'h',
	           'Total poster (map+title):', finalWidth + 'w x ' + Math.round(totalHeight) + 'h',
	           'Actual ratio:', (totalHeight / width).toFixed(3));
	
	// Force Mapbox to resize - it will handle canvas dimensions properly
	// Mapbox automatically sizes the canvas with correct device pixel ratio
	if (map && map.loaded()) {
		setTimeout(function() {
			map.resize();
			console.log('Map resized - Mapbox handling canvas dimensions for crisp rendering');
		}, 150);
	}
}

$(document).ready(function(){
	console.log('Document ready, initializing map editor...');

	// Test if map container exists
	const mapContainer = document.getElementById('map');
	console.log('Map container found:', mapContainer);

	if (mapContainer) {
		console.log('Map container dimensions:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);
	}
	
	// Set initial size BEFORE initializing the map
	// This ensures the map loads with correct dimensions from the start
	resizeFrame();
	console.log('Initial container size set before map initialization');

	$('.elem__picker ul li a').on('click' ,function(e){
		e.preventDefault();
		$(this).closest('ul').find('.current').removeClass("current");
		$(this).addClass('current');
		if ($(this).closest('.tab__switcher').length) {
			$('.el__format').css("display" ,"none");
			$('.el__format[data-id='+ $(this).attr("data-id") +']').fadeIn(300);
		}
	});

	$('.info__button').on('click' ,function(e){
		e.preventDefault();
		$('.info__popup[data-id='+ $(this).attr("data-id") +']').fadeIn(300);
		$('body,html').css("overflow-y" ,"hidden");
	});
	$('.info__popup .box>.top>a').on('click' ,function(e){
		$('.info__popup').fadeOut(300);
		$('body,html').css("overflow-y" ,"initial");
	});

	$('.estimated .show__more>a').on("click" ,function(e){
		e.preventDefault();
		$(this).closest('.show__more').css("display" ,"none");
		$(this).closest('.estimated').find("li").css('display' , "flex");
	});


	$('.map__title .title input').on("change" , function(e){
		if ($(this).prop("checked") == true) {
			$('.map__title .content').slideDown(300);
		} else {
			$('.map__title .content').slideUp(300);			
		}
	});



	$('.size__picker>a').on("click" ,function(e){
		e.preventDefault();
		
		// Update current class
		$(this).closest('.size__picker').find('.current').removeClass("current");
		$(this).addClass("current");
		
		// Get the size from the clicked element
		const sizeText = $(this).find('.head p').text().trim();
		
		if (sizeRatios[sizeText]) {
			// sizeRatios stores height/width for portrait
			// For landscape, width/height is the same value (just dimensions swapped)
			// For square, it's always 1:1
			if (resizeType === "square") {
				currentAspectRatio = 1.0;
			} else {
				// For both portrait and landscape, use the same ratio
				// Portrait: height = width × ratio
				// Landscape: width = height × ratio
				currentAspectRatio = sizeRatios[sizeText];
			}
			
			console.log('Size changed to:', sizeText, 'Orientation:', resizeType, 'Aspect ratio:', currentAspectRatio);
			
			// Reinitialize map for crisp rendering
			reinitializeMap();
		}
	});

	$('.add__details').on('click' ,function(e){
		$('.main__switcher>ul>li:nth-child(2)>a').click();
	});
	$('.select__format').on('click' ,function(e){
		$('.main__switcher>ul>li:nth-child(3)>a').click();
	});

	$('.main__switcher ul li a').on('click', function(e){
		e.preventDefault();
		if (!$(this).hasClass("current")) {
			$(this).closest('ul').find('.current').removeClass("current");
			$(this).addClass('current');
			$('.design__info ,.details__wrapper , .format__wrapper').css("display" ,'none');
			$('.' + $(this).attr("data-tab")).fadeIn(300);
		}
	});


	$('.ideas__wrapper .top>a').on("click" ,function(e){
		e.preventDefault();
		$(this).closest('.ideas__wrapper').fadeOut(300);
		$("body,html").css("overflow-y" ,"initial");
	});


	$('.open__popup--ideas').on('click' ,function(e){
		e.preventDefault();
		$('.ideas__wrapper').fadeIn(300);
		$('body,html').css('overflow-y' ,"hidden");
	});



	$('.ideas__wrapper .content>ul>li>a').on('click' ,function(e){
		e.preventDefault();
		if (!$(this).hasClass('current')) {
			$(this).closest("ul").find('.current').removeClass('current');
			$(this).addClass('current');
			$('.list .elem').css("display" , "none");
			$('.list .elem[data-id='+ $(this).attr("data-id") +']').fadeIn(300);
		}
	});
	
	// Handle selecting ideas - clicking on checkbox label
	$(document).on('click', '.ideas__wrapper .list .elem label', function(e) {
		const ideaText = $(this).find('p').text().trim();
		
		// Update the title textarea with selected idea
		const titleTextarea = $('.map__title .content textarea').eq(0);
		titleTextarea.val(ideaText);
		
		const title = ideaText;
		const subtitle = $('.map__title .content textarea').eq(1).val() || '25.76168°N / 80.19179°W';
		
		// Update both poster and preview
		updatePosterTitle(title, subtitle);
		updatePreviewTitle(title, subtitle);
		
		// Close the popup
		$('.ideas__wrapper').fadeOut(300);
		$('body,html').css('overflow-y', 'initial');
		
		console.log('✓ Idea applied:', ideaText);
	});
	
	// Handle Select button in ideas popup
	$('.ideas__wrapper .btn a').on('click', function(e) {
		e.preventDefault();
		
		// Find checked ideas
		const checkedIdeas = $('.ideas__wrapper .list .elem input[type="checkbox"]:checked');
		
		if (checkedIdeas.length > 0) {
			// Get the text from the first checked idea
			const selectedIdea = checkedIdeas.first().closest('label').find('p').text().trim();
			
			// Update the title textarea
			const titleTextarea = $('.map__title .content textarea').eq(0);
			titleTextarea.val(selectedIdea);
			
			const title = selectedIdea;
			const subtitle = $('.map__title .content textarea').eq(1).val() || '25.76168°N / 80.19179°W';
			
			// Update both poster and preview
			updatePosterTitle(title, subtitle);
			updatePreviewTitle(title, subtitle);
			
			console.log('✓ Selected idea applied:', selectedIdea);
		}
		
		// Close the popup
		$('.ideas__wrapper').fadeOut(300);
		$('body,html').css('overflow-y', 'initial');
	});

	// Map functionality
	initializeMap();

	// Style picker functionality
	$('.elem__picker ul li a').on('click', function(e) {
		e.preventDefault();
		const styleText = $(this).text().toLowerCase().trim();

		// Map style mapping - now using PositivePrints styles
		const styleMap = {
			'minimal': 'minimal',
			'beachglass': 'beachglass',
			'carbon': 'carbon',
			'black': 'black',
			'vintage': 'vintage',
			'classic': 'classic',
			'pink': 'pink',
			'green': 'green',
			'intense': 'intense',
			'custom': 'custom'
		};

		if (styleMap[styleText]) {
			// Show/hide custom style panel
			if (styleText === 'custom') {
				$('.custom__style').slideDown(300);
			} else {
				$('.custom__style').slideUp(300);
				
				// Reset background and text colors when switching away from custom
				$('.map-preview-title').css('background-color', '#ffffff');
				$('.map-preview-title h3, .map-preview-title p').css('color', '');
				$('.main__wrapper .outer__main .canvas__wrapper canvas').css('background-color', '');
				console.log('Reset background to white with default text colors');
			}
			
			changeMapStyle(styleMap[styleText]).catch(error => {
				console.error('Error changing style:', error);
			});
			console.log('Switching to GlobeTee style:', styleText);
		}
	});

	// Layout picker functionality
	$('.elem__picker .layout a').on('click', function(e) {
		e.preventDefault();
		const layoutText = $(this).text().toLowerCase().trim();

		// Layout mapping
		const layoutMap = {
			'circle': 'circle',
			'heart': 'heart',
			'square': 'square',
			'puzzle': 'default',
			'story': 'default'
		};

		if (layoutMap[layoutText]) {
			changeMapLayout(layoutMap[layoutText]);
		}
	});

	// Search functionality with suggestions
	let searchTimeout;
	$('.details__wrapper input[type="text"]').on('input', function() {
		const query = $(this).val().trim();
		const $input = $(this);
		const inputElement = this;
		
		// Show minimum character requirement
		const $span = $input.next('span');
		if (query.length < 3) {
			$span.text('minimum 3 characters needed to search').css('color', '#666');
			// Remove existing suggestions
			const existingSuggestions = document.querySelector('.location-suggestions');
			if (existingSuggestions) {
				existingSuggestions.remove();
			}
			return;
		}
		
		$span.text('searching...').css('color', '#f77147');

		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			if (map && map.loaded()) {
				searchLocation(query, false).then(suggestions => {
					if (suggestions && suggestions.length > 0) {
						showLocationSuggestions(suggestions, inputElement);
						$span.text(`${suggestions.length} locations found`).css('color', '#4CAF50');
					} else {
						$span.text('no locations found').css('color', '#f77147');
					}
				}).catch(error => {
					console.error('Search error:', error);
					$span.text('search error, please try again').css('color', '#f77147');
				});
			} else {
				$span.text('map not ready, please wait').css('color', '#f77147');
			}
		}, 300);
	});

	// Handle Enter key to select first suggestion
	$('.details__wrapper input[type="text"]').on('keydown', function(e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			const suggestions = document.querySelector('.location-suggestions');
			if (suggestions) {
				const firstSuggestion = suggestions.querySelector('.suggestion-item');
				if (firstSuggestion) {
					firstSuggestion.click();
				}
			}
		}
	});

	// Add export button functionality
	$('.bottom__controls .btn a').on('click', function(e) {
		if ($(this).text().includes('Add to cart')) {
			e.preventDefault();
			exportMap();
		}
	});

	// Map marker toggle functionality
	$('.map__marker input[type="checkbox"]').on('change', function() {
		toggleMapMarker();
	});
	
	// Marker address input functionality with autocomplete
	let markerSearchTimeout;
	$('.marker__info .address__info input[type="text"]').on('input', function() {
		const query = $(this).val().trim();
		const $input = $(this);
		const inputElement = this;
		const $span = $input.next('span');
		
		if (query.length < 3) {
			$span.text('minimum 3 characters needed to search').css('color', '#666');
			// Remove existing suggestions
			const existingSuggestions = document.querySelector('.location-suggestions');
			if (existingSuggestions) {
				existingSuggestions.remove();
			}
			return;
		}
		
		$span.text('searching...').css('color', '#f77147');
		
		clearTimeout(markerSearchTimeout);
		markerSearchTimeout = setTimeout(() => {
			if (map && map.loaded()) {
				// Search but don't auto-select - show suggestions instead
				searchLocation(query, false).then(suggestions => {
					if (suggestions && suggestions.length > 0) {
						showMarkerSuggestions(suggestions, inputElement);
						$span.text(`${suggestions.length} locations found`).css('color', '#4CAF50');
					} else {
						$span.text('no locations found').css('color', '#f77147');
					}
				}).catch(error => {
					console.error('Search error:', error);
					$span.text('search error, please try again').css('color', '#f77147');
				});
			}
		}, 300);
	});
	
	// Handle Enter key for marker search
	$('.marker__info .address__info input[type="text"]').on('keydown', function(e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			const suggestions = document.querySelector('.location-suggestions');
			if (suggestions) {
				const firstSuggestion = suggestions.querySelector('.suggestion-item');
				if (firstSuggestion) {
					firstSuggestion.click();
				}
			}
		}
	});
	
	// GPS coordinates input functionality - trigger on blur (focus out)
	$('.address__geo .double input[type="text"]').on('blur change keypress', function(e) {
		// If keypress, only respond to Enter key
		if (e.type === 'keypress' && e.which !== 13) {
			return;
		}
		
		const latInput = $('.address__geo .double input[type="text"]').eq(0);
		const lngInput = $('.address__geo .double input[type="text"]').eq(1);
		
		const lat = parseFloat(latInput.val());
		const lng = parseFloat(lngInput.val());
		
		console.log('GPS input - Lat:', lat, 'Lng:', lng);
		
		if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
			// Update map center to marker location
			if (map) {
				const coordinates = [lng, lat];
				
				console.log('Moving map to GPS coordinates:', coordinates);
				
				// Center map on the marker location - ensure map is loaded
				if (map.loaded()) {
					map.setCenter(coordinates);
					map.setZoom(14);
					console.log('Map centered using setCenter');
				} else {
					map.once('load', () => {
						map.setCenter(coordinates);
						map.setZoom(14);
						console.log('Map centered after load');
					});
				}
				
				// Small delay to ensure map has moved, then add marker
				setTimeout(() => {
					// Add or update marker only if checkbox is checked
					const markerCheckbox = document.querySelector('.map__marker input[type="checkbox"]');
					if (markerCheckbox && markerCheckbox.checked) {
						console.log('Adding marker at GPS location');
						addOrUpdateMarker(coordinates);
					} else {
						console.log('Marker checkbox not checked');
					}
				}, 100);
				
				// Update title fields
				updateTitleFields(`${lat.toFixed(5)}°N / ${Math.abs(lng).toFixed(5)}°W`, coordinates);
				console.log('✓ GPS location applied successfully - Map centered on:', coordinates);
			}
		} else if (latInput.val() !== '' || lngInput.val() !== '') {
			console.warn('Invalid coordinates - Lat:', lat, 'Lng:', lng);
			alert('Please enter valid coordinates. Latitude: -90 to 90, Longitude: -180 to 180');
		}
	});
	
	// Marker icon selection functionality
	$('.marker__switcher ul li a').on('click', function(e) {
		e.preventDefault();
		if (!$(this).hasClass('current')) {
			$(this).closest('ul').find('.current').removeClass('current');
			$(this).addClass('current');
		}
		
		// Get the SVG from the current (clicked) element
		const svgElement = $(this).find('.media svg');
		
		console.log('Marker icon clicked, found SVG:', svgElement.length > 0);
		
		if (svgElement.length > 0) {
			// Clone the SVG and get its outer HTML
			const clonedSvg = svgElement.clone();
			const wrapper = $('<div>').append(clonedSvg);
			currentMarkerIcon = wrapper.html();
			
			console.log('Marker icon stored, length:', currentMarkerIcon.length);
			
			// Update marker if it exists
			if (currentMarker && map) {
				const coords = currentMarker.getLngLat();
				addOrUpdateMarker([coords.lng, coords.lat]);
				console.log('Marker updated with new icon at:', coords);
			} else {
				console.log('No marker yet - icon will apply when marker is created');
			}
		} else {
			console.log('No SVG found - searching in:', $(this).html().substring(0, 200));
		}
	});
	
	// Marker color selection functionality
	$('.marker__color .wrap a').on('click', function(e) {
		e.preventDefault();
		if (!$(this).hasClass('current')) {
			$(this).closest('.marker__color').find('.current').removeClass('current');
			$(this).addClass('current');
			
			// Get the color from the clicked element
			const colorElement = $(this).find('.color');
			let selectedColor = colorElement.css('background-color');
			
			console.log('Marker color clicked, raw color:', selectedColor);
			
			// Convert rgb to hex if needed
			if (selectedColor && selectedColor.startsWith('rgb')) {
				selectedColor = rgbToHex(selectedColor);
			}
			
			if (selectedColor) {
				currentMarkerColor = selectedColor;
				console.log('Marker color updated to:', selectedColor);
				
				// Update marker if it exists
				if (currentMarker && map) {
					const coords = currentMarker.getLngLat();
					console.log('Updating marker at coords:', coords, 'with color:', currentMarkerColor, 'and icon:', currentMarkerIcon ? 'Custom' : 'Default');
					addOrUpdateMarker([coords.lng, coords.lat]);
					console.log('Marker recreated with new color');
				} else {
					console.log('No marker to update yet');
				}
			}
		}
	});
	
	// Helper function to convert RGB to Hex (for marker colors)
	function rgbToHex(rgb) {
		const result = rgb.match(/\d+/g);
		if (!result || result.length < 3) return rgb;
		
		const r = parseInt(result[0]);
		const g = parseInt(result[1]);
		const b = parseInt(result[2]);
		
		return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
	}

	// Map title toggle functionality
	$('.map__title .title input[type="checkbox"]').on('change', function() {
		updateMapTitle();
	});

	// Title input change handlers
	$('.map__title .content textarea').on('input', function() {
		const titleInput = $('.map__title .content textarea').eq(0);
		const subtitleInput = $('.map__title .content textarea').eq(1);
		
		const title = titleInput.val() || 'MIAMI, UNITED STATES';
		const subtitle = subtitleInput.val() || '25.76168°N / 80.19179°W';
		
		updatePosterTitle(title, subtitle);
		updatePreviewTitle(title, subtitle);
	});

	// Initialize map title state
	const titleCheckbox = $('.map__title .title input[type="checkbox"]');
	if (titleCheckbox.prop('checked')) {
		$('.map__title .content').show();
		const posterTitle = document.querySelector('.poster-title');
		if (posterTitle) {
			posterTitle.style.display = 'block';
		}
	} else {
		const posterTitle = document.querySelector('.poster-title');
		if (posterTitle) {
			posterTitle.style.display = 'none';
		}
	}













	$('.marker__info>.btns>a').on('click' ,function(e){
		e.preventDefault();
		if (!$(this).hasClass("current")) {
			$(this).closest(".btns").find(">a").removeClass("current");
			$(this).addClass('current');
			if ($(this).attr("data-id") == "address") {
				$('.address__info').fadeIn(300);
				$('.address__geo').css("display" ,"none");
			}
			if ($(this).attr("data-id") == "gps") {
				$('.address__info').css("display" ,"none");
				$('.address__geo').fadeIn(300)
			}
		}
	});


	$('.elem__picker.image__changer ul li a').on('click' ,function(e){
		if ($(this).closest('.image__changer').length) {
			if ($(this).hasClass('current')) {
				if ($('.main__wrapper .outer__main .canvas__wrapper .inn > .media>img').length) {
					$('.main__wrapper .outer__main .canvas__wrapper .inn > .media>img').attr("src" ,$(this).attr("data-src"));
				} else {
					$('.main__wrapper .outer__main .canvas__wrapper .inn > .media').append("<img src="+ $(this).attr("data-src") +">");				
				}
			}
		}
	});


	$('.custom__style>.switcher>a').on("click" ,function(e){
		e.preventDefault();
		if (!$(this).hasClass('current')) {
			$(this).closest(".switcher").find(".current").removeClass('current');
			$(this).addClass('current');
			$('.custom__style .box').css("display" , 'none');
			$('.custom__style .box[data-id='+ $(this).attr("data-id") +']').fadeIn(300);
		}
	});



	$('.marker__color .wrap a').on("click" ,function(e){
		e.preventDefault();
		if (!$(this).hasClass('current')) {
			$(this).closest(".marker__color").find('.current').removeClass('current');
			$(this).addClass('current');
		}
	});


	$('.custom__style .wrap a').on("click" ,function(e){
		e.preventDefault();
		if (!$(this).hasClass('current')) {
			// Get the active tab to determine which property we're changing
			const activeTab = $('.custom__style .switcher a.current').attr('data-id');
			
			// Get the color from the span element
			const colorElement = $(this).find('.color');
			let selectedColor = colorElement.css('background-color');
			
			// Convert rgb to hex if needed
			if (selectedColor && selectedColor.startsWith('rgb')) {
				selectedColor = rgbToHex(selectedColor);
			}
			
			// Update the customColors object based on active tab
			if (activeTab && selectedColor) {
				if (activeTab === 'land') {
					customColors.land = selectedColor;
				} else if (activeTab === 'roads') {
					customColors.roads = selectedColor;
				} else if (activeTab === 'water') {
					customColors.water = selectedColor;
				} else if (activeTab === 'background') {
					customColors.background = selectedColor;
					// Apply background color to preview title and canvas element
					$('.map-preview-title').css('background-color', selectedColor);
					$('.main__wrapper .outer__main .canvas__wrapper canvas').css('background-color', selectedColor);
					
					// Automatically adjust text color based on background brightness
					const textColor = getContrastTextColor(selectedColor);
					$('.map-preview-title h3, .map-preview-title p').css('color', textColor);
					
					console.log('Background color applied:', selectedColor, 'Text color:', textColor);
				}
				
				// Apply the new colors to the map
				applyCustomMapColors();
				
				console.log('Color updated for', activeTab, ':', selectedColor);
			}
			
			// Update UI
			$(this).closest(".box").find('.current').removeClass('current');
			$(this).addClass('current');
		}
	});
	
	// Helper function to convert RGB to Hex
	function rgbToHex(rgb) {
		const result = rgb.match(/\d+/g);
		if (!result || result.length < 3) return rgb;
		
		const r = parseInt(result[0]);
		const g = parseInt(result[1]);
		const b = parseInt(result[2]);
		
		return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
	}
	
	// Helper function to determine if text should be white or black based on background color
	function getContrastTextColor(backgroundColor) {
		// Convert hex to RGB if needed
		let r, g, b;
		
		if (backgroundColor.startsWith('#')) {
			const hex = backgroundColor.replace('#', '');
			r = parseInt(hex.substr(0, 2), 16);
			g = parseInt(hex.substr(2, 2), 16);
			b = parseInt(hex.substr(4, 2), 16);
		} else if (backgroundColor.startsWith('rgb')) {
			const result = backgroundColor.match(/\d+/g);
			if (result && result.length >= 3) {
				r = parseInt(result[0]);
				g = parseInt(result[1]);
				b = parseInt(result[2]);
			} else {
				return '#000'; // Default to black
			}
		} else {
			return '#000'; // Default to black
		}
		
		// Calculate relative luminance (perceived brightness)
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		
		// Return white for dark backgrounds, black for light backgrounds
		return luminance > 0.5 ? '#000000' : '#FFFFFF';
	}


	
	// Set first size as selected if none is selected
	if ($('.elem__picker .size__picker > a.current').length === 0) {
		$('.elem__picker .size__picker > a').first().addClass('current');
	}
	
	resizeFrame();

	$(window).on('resize' ,function(){
		resizeFrame();
	});


	$('.elem__picker .type__switcher li a').on('click' ,function(e){
		e.preventDefault();
		
		// Update current class
		if (!$(this).hasClass('current')) {
			$(this).closest('ul').find('.current').removeClass('current');
			$(this).addClass('current');
		}
		
		const layoutType = $(this).attr("data-type");
		
		// Get currently selected size
		const currentSize = $('.elem__picker .size__picker > a.current .head p').text().trim();
		
		// Base ratios for each layout type
		if (layoutType == "portrait") {
			resizeType = "portrait";
			// Use the size-specific ratio (height/width)
			if (currentSize && sizeRatios[currentSize]) {
				currentAspectRatio = sizeRatios[currentSize];
			} else {
				currentAspectRatio = 1.414; // Default A4 portrait
			}
		}
		else if (layoutType == "square") {
			resizeType = "square";
			currentAspectRatio = 1.0; // Square is always 1:1
		}
		else if (layoutType == "landscape") {
			resizeType = "landscape";
			// For landscape, use the same ratio as portrait
			// Portrait: 21×29.7cm (ratio = 29.7/21 = 1.414 for height/width)
			// Landscape: 29.7×21cm (ratio = 29.7/21 = 1.414 for width/height)
			// The ratio value is the same, just applied to different dimensions
			if (currentSize && sizeRatios[currentSize]) {
				currentAspectRatio = sizeRatios[currentSize];
			} else {
				currentAspectRatio = 1.414; // Default A4 landscape (width/height)
			}
		}
		
		console.log('Orientation changed to:', layoutType, 'Aspect ratio:', currentAspectRatio);
		
		// Reinitialize map for crisp rendering with new dimensions
		reinitializeMap();
	});
});