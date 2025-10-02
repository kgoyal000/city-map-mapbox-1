let map;
let map1; // First map for double layout
let map2; // Second map for double layout
let map1Triple; // First map for triple layout
let map2Triple; // Second map for triple layout
let map3Triple; // Third map for triple layout
let currentMarker = null;
let currentMarker1 = null; // Marker for first map in double layout
let currentMarker2 = null; // Marker for second map in double layout
let currentMarker1Triple = null; // Marker for first map in triple layout
let currentMarker2Triple = null; // Marker for second map in triple layout
let currentMarker3Triple = null; // Marker for third map in triple layout
let isDoubleMapLayout = false; // Track if we're in double map mode
let isTripleMapLayout = false; // Track if we're in triple map mode
let currentLayout = 'default'; // Track current layout type (circle, heart, square, etc.)

let currentStyle = 'minimal'; // Start with Minimal style
let currentFont = 'Poppins'; // Start with Poppins font
let loadedStyles = {};
let customColors = {
	land: '#F5F5DC',
	roads: '#FFFFFF',
	water: '#87CEEB',
	background: '#F0F0F0'
};
let currentMarkerIcon = null; // Store the current marker icon element
let currentMarkerColor = '#E53422'; // Default red color

// Cropper.js instance
let cropper = null;

// Make cropper control functions globally available (defined early for onclick attributes)
window.zoomCropper = function(delta) {
	if (cropper) {
		cropper.zoom(delta);
	}
};

window.resetCropper = function() {
	if (cropper) {
		cropper.reset();
		// Restore fixed crop box size after reset
		setTimeout(() => {
			if (cropper) {
				const containerData = cropper.getContainerData();
				cropper.setCropBoxData({
					width: 150,
					height: 150,
					left: (containerData.width - 150) / 2,
					top: (containerData.height - 150) / 2
				});
			}
		}, 100);
	}
};

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
	'atlas': 'atlas', // Load GlobeTee Atlas style from JSON
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
			// Don't set width to 100% - let resizeFrame() handle dimensions
			// mapContainer.style.height = '640px';

			// Check if map canvas exists
			const canvas = mapContainer.querySelector('canvas');
			console.log('Map canvas found:', canvas);
			if (canvas) {
				console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
				canvas.style.display = 'block';
				canvas.style.visibility = 'visible';
			}

			// Ensure proper dimensions after map loads
			resizeFrame();


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

// Function to initialize double map layout
async function initializeDoubleMaps() {
	console.log('Initializing double maps...');
	
	const map1Container = document.getElementById('map1');
	const map2Container = document.getElementById('map2');
	
	if (!map1Container || !map2Container) {
		console.error('Double map containers not found!');
		return;
	}
	
	// Remove loading state
	map1Container.classList.remove('map-loading');
	map2Container.classList.remove('map-loading');

	// Load the current style (or fallback to Minimal)
	const styleKey = currentStyle || 'minimal';
	const styleConfig = mapStyles[styleKey] || mapStyles['minimal'];
	let styleToUse;

	if (typeof styleConfig === 'string' && styleConfig.includes('mapbox://')) {
		styleToUse = styleConfig;
	} else {
		const loadedStyle = await loadMapStyle(styleConfig);
		styleToUse = loadedStyle || 'mapbox://styles/mapbox/streets-v12';
	}

	try {
		// Initialize first map (e.g., Sophia's location)
		map1 = new mapboxgl.Map({
			container: 'map1',
			style: styleToUse,
			center: [-80.1918, 25.7617], // Default: Miami
			zoom: 12
		});

		// Initialize second map (e.g., Michael's location)
		map2 = new mapboxgl.Map({
			container: 'map2',
			style: styleToUse,
			center: [-0.1276, 51.5074], // Default: London
			zoom: 12
		});
		
		console.log('Both maps created');
		
		// Set up first map
		map1.on('load', function() {
			console.log('Map 1 loaded successfully!');
			
			// Add navigation controls to map1
			map1.addControl(new mapboxgl.NavigationControl(), 'top-left');
			
			console.log('Map 1 setup complete');
		});
		
		// Set up second map
		map2.on('load', function() {
			console.log('Map 2 loaded successfully!');
			
			// Add navigation controls to map2
			map2.addControl(new mapboxgl.NavigationControl(), 'top-left');
			
			console.log('Map 2 setup complete');
		});
		
		// Error handlers
		map1.on('error', function(e) {
			console.error('Map 1 error:', e);
		});
		
		map2.on('error', function(e) {
			console.error('Map 2 error:', e);
		});
		
	} catch (error) {
		console.error('Error creating double maps:', error);
	}
}

// Function to initialize triple map layout
async function initializeTripleMaps() {
	console.log('Initializing triple maps...');

	const map1Container = document.getElementById('map1-triple');
	const map2Container = document.getElementById('map2-triple');
	const map3Container = document.getElementById('map3-triple');

	if (!map1Container || !map2Container || !map3Container) {
		console.error('Triple map containers not found!');
		return;
	}

	// Remove loading state
	map1Container.classList.remove('map-loading');
	map2Container.classList.remove('map-loading');
	map3Container.classList.remove('map-loading');

	// Load the current style (or fallback to Minimal)
	const styleKey = currentStyle || 'minimal';
	const styleConfig = mapStyles[styleKey] || mapStyles['minimal'];
	let styleToUse;

	if (typeof styleConfig === 'string' && styleConfig.includes('mapbox://')) {
		styleToUse = styleConfig;
	} else {
		const loadedStyle = await loadMapStyle(styleConfig);
		styleToUse = loadedStyle || 'mapbox://styles/mapbox/streets-v12';
	}

	try {
		// Initialize first map
		map1Triple = new mapboxgl.Map({
			container: 'map1-triple',
			style: styleToUse,
			center: [-80.1918, 25.7617], // Default: Miami
			zoom: 12
		});

		// Initialize second map
		map2Triple = new mapboxgl.Map({
			container: 'map2-triple',
			style: styleToUse,
			center: [-0.1276, 51.5074], // Default: London
			zoom: 12
		});

		// Initialize third map
		map3Triple = new mapboxgl.Map({
			container: 'map3-triple',
			style: styleToUse,
			center: [139.6917, 35.6895], // Default: Tokyo
			zoom: 12
		});

		console.log('All three maps created');

		// Set up first map
		map1Triple.on('load', function() {
			console.log('Map 1 (triple) loaded successfully!');
			map1Triple.addControl(new mapboxgl.NavigationControl(), 'top-left');
		});

		// Set up second map
		map2Triple.on('load', function() {
			console.log('Map 2 (triple) loaded successfully!');
			map2Triple.addControl(new mapboxgl.NavigationControl(), 'top-left');
		});

		// Set up third map
		map3Triple.on('load', function() {
			console.log('Map 3 (triple) loaded successfully!');
			map3Triple.addControl(new mapboxgl.NavigationControl(), 'top-left');
		});

		// Error handlers
		map1Triple.on('error', function(e) {
			console.error('Map 1 (triple) error:', e);
		});

		map2Triple.on('error', function(e) {
			console.error('Map 2 (triple) error:', e);
		});

		map3Triple.on('error', function(e) {
			console.error('Map 3 (triple) error:', e);
		});

	} catch (error) {
		console.error('Error creating triple maps:', error);
	}
}

// Function to switch between single, double, and triple map layouts
function switchMapLayout(isDouble, isTriple = false) {
	const singleView = document.querySelector('.single-map-view');
	const doubleView = document.querySelector('.double-map-view');
	const tripleView = document.querySelector('.triple-map-view');
	const singleDetails = document.querySelector('.details__wrapper');
	const doubleDetails = document.querySelector('.details__wrapper--double');
	const tripleDetails = document.querySelector('.details__wrapper--triple');
	
	if (!singleView || !doubleView) {
		console.error('Map view containers not found');
		return;
	}
	
	if (isDouble) {
		console.log('Switching to double map layout');
		isDoubleMapLayout = true;
		isTripleMapLayout = false;

		// Hide other views
		if (singleView) singleView.style.display = 'none';
		if (doubleView) doubleView.style.display = 'flex';
		if (tripleView) tripleView.style.display = 'none';

		// Switch details panels - ensure complete hide/show
		if (singleDetails) {
			singleDetails.style.display = 'none';
			// Also hide any marker info sections in single layout
			$(singleDetails).find('.marker__info').hide();
			// Uncheck single layout marker checkbox to prevent conflicts
			$(singleDetails).find('.map__marker input[type="checkbox"]').prop('checked', false);
			// Remove any existing single map markers
			if (currentMarker) {
				currentMarker.remove();
				currentMarker = null;
			}
		}
		if (doubleDetails) {
			// Keep it hidden initially - will show when user clicks Details tab
			doubleDetails.style.display = 'none';
			// Hide marker info sections in double layout by default
			$(doubleDetails).find('.marker__info').hide();
		}
		if (tripleDetails) {
			tripleDetails.style.display = 'none';
		}

		// Update main title in double map view
		const mainTitleInput = document.getElementById('double-map-main-title');
		const doubleMapTitle = document.querySelector('.double-map-title h2');
		if (mainTitleInput && doubleMapTitle) {
			doubleMapTitle.textContent = mainTitleInput.value;
		}

		// Destroy other maps if they exist
		if (map) {
			map.remove();
			map = null;
			currentMarker = null;
		}
		if (map1Triple) {
			map1Triple.remove();
			map1Triple = null;
			currentMarker1Triple = null;
		}
		if (map2Triple) {
			map2Triple.remove();
			map2Triple = null;
			currentMarker2Triple = null;
		}
		if (map3Triple) {
			map3Triple.remove();
			map3Triple = null;
			currentMarker3Triple = null;
		}

		// Initialize double maps if not already initialized
		if (!map1 || !map2) {
			setTimeout(() => {
				initializeDoubleMaps();
				// Apply current style and font after maps are initialized
				setTimeout(() => {
					applyCurrentStyleAndFont();
				}, 500);
			}, 100);
		} else {
			// Resize existing maps
			setTimeout(() => {
				if (map1) map1.resize();
				if (map2) map2.resize();
				// Apply current style and font
				applyCurrentStyleAndFont();
			}, 150);
		}

		// Force landscape orientation for double map
		resizeType = "landscape";

	} else if (isTriple) {
		console.log('Switching to triple map layout');
		isTripleMapLayout = true;
		isDoubleMapLayout = false;

		// Hide other views
		if (singleView) singleView.style.display = 'none';
		if (doubleView) doubleView.style.display = 'none';
		if (tripleView) tripleView.style.display = 'flex';

		// Switch details panels
		if (singleDetails) {
			singleDetails.style.display = 'none';
			$(singleDetails).find('.marker__info').hide();
			$(singleDetails).find('.map__marker input[type="checkbox"]').prop('checked', false);
			if (currentMarker) {
				currentMarker.remove();
				currentMarker = null;
			}
		}
		if (doubleDetails) {
			doubleDetails.style.display = 'none';
			$(doubleDetails).find('.marker__info').hide();
		}
		if (tripleDetails) {
			// Keep it hidden initially - will show when user clicks Details tab
			tripleDetails.style.display = 'none';
			$(tripleDetails).find('.marker__info').hide();
		}

		// Update main title in triple map view
		const mainTitleInput = document.getElementById('triple-map-main-title');
		const tripleMapTitle = document.querySelector('.triple-map-title h2');
		if (mainTitleInput && tripleMapTitle) {
			tripleMapTitle.textContent = mainTitleInput.value;
		}

		// Destroy other maps
		if (map) {
			map.remove();
			map = null;
			currentMarker = null;
		}
		if (map1) {
			map1.remove();
			map1 = null;
			currentMarker1 = null;
		}
		if (map2) {
			map2.remove();
			map2 = null;
			currentMarker2 = null;
		}

		// Initialize triple maps if not already initialized
		if (!map1Triple || !map2Triple || !map3Triple) {
			setTimeout(() => {
				initializeTripleMaps();
				// Apply current style and font after maps are initialized
				setTimeout(() => {
					applyCurrentStyleAndFont();
				}, 500);
			}, 100);
		} else {
			// Resize existing maps
			setTimeout(() => {
				if (map1Triple) map1Triple.resize();
				if (map2Triple) map2Triple.resize();
				if (map3Triple) map3Triple.resize();
				// Apply current style and font
				applyCurrentStyleAndFont();
			}, 150);
		}

		// Force landscape orientation for triple map
		resizeType = "landscape";

	} else {
		console.log('Switching to single map layout');
		isDoubleMapLayout = false;
		isTripleMapLayout = false;

		// Show single map view
		if (singleView) singleView.style.display = 'block';

		// Hide other views
		if (doubleView) doubleView.style.display = 'none';
		if (tripleView) tripleView.style.display = 'none';

		// Switch details panels
		if (singleDetails) {
			singleDetails.style.display = 'block';
			// Hide marker info sections in single layout by default
			$(singleDetails).find('.marker__info').hide();
		}
		if (doubleDetails) {
			doubleDetails.style.display = 'none';
			// Also hide marker info in double layout and uncheck checkboxes
			$(doubleDetails).find('.marker__info').hide();
			$(doubleDetails).find('.map__marker input[type="checkbox"]').prop('checked', false);
			$(doubleDetails).find('.map__title input[type="checkbox"]').prop('checked', false);
			$(doubleDetails).find('.content').hide();
		}
		if (tripleDetails) {
			tripleDetails.style.display = 'none';
			$(tripleDetails).find('.marker__info').hide();
			$(tripleDetails).find('.map__marker input[type="checkbox"]').prop('checked', false);
			$(tripleDetails).find('.map__title input[type="checkbox"]').prop('checked', false);
			$(tripleDetails).find('.content').hide();
		}

		// Destroy double maps if they exist
		if (map1) {
			map1.remove();
			map1 = null;
			currentMarker1 = null;
		}
		if (map2) {
			map2.remove();
			map2 = null;
			currentMarker2 = null;
		}

		// Destroy triple maps if they exist
		if (map1Triple) {
			map1Triple.remove();
			map1Triple = null;
			currentMarker1Triple = null;
		}
		if (map2Triple) {
			map2Triple.remove();
			map2Triple = null;
			currentMarker2Triple = null;
		}
		if (map3Triple) {
			map3Triple.remove();
			map3Triple = null;
			currentMarker3Triple = null;
		}

		// Reinitialize single map if not exists
		if (!map) {
			setTimeout(() => {
				initializeMap();
			}, 100);
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

			// Check if this is a double map input
			const isDoubleMap1 = inputElement.id === 'double-map-place-1';
			const isDoubleMap2 = inputElement.id === 'double-map-place-2';
			const isDoubleMarker1 = inputElement.id === 'double-marker-address-1';
			const isDoubleMarker2 = inputElement.id === 'double-marker-address-2';

			// Check if this is a triple map input
			const isTripleMap1 = inputElement.id === 'triple-map-place-1';
			const isTripleMap2 = inputElement.id === 'triple-map-place-2';
			const isTripleMap3 = inputElement.id === 'triple-map-place-3';
			const isTripleMarker1 = inputElement.id === 'triple-marker-address-1';
			const isTripleMarker2 = inputElement.id === 'triple-marker-address-2';
			const isTripleMarker3 = inputElement.id === 'triple-marker-address-3';

			if (isDoubleMap1 && map1) {
				// Update first map
				map1.jumpTo({
					center: coordinates,
					zoom: 14
				});

				// Add or update marker only if checkbox is checked
				const markerCheckbox = document.getElementById('double-marker-1');
				if (markerCheckbox && markerCheckbox.checked) {
					if (currentMarker1) currentMarker1.remove();
					currentMarker1 = new mapboxgl.Marker({ color: currentMarkerColor })
						.setLngLat(coordinates)
						.addTo(map1);
				}

				// Update title fields for first map
				const titleInput = document.getElementById('double-large-text-1');
				const subtitleInput = document.getElementById('double-small-text-1');
				if (titleInput) titleInput.value = place.place_name;
				if (subtitleInput) subtitleInput.value = `${coordinates[1].toFixed(5)}°N / ${Math.abs(coordinates[0]).toFixed(5)}°W`;

				// Update display titles
				$('.map-1-title h3').text(place.place_name);
				$('.map-1-title p').text(`${coordinates[1].toFixed(5)}°N / ${Math.abs(coordinates[0]).toFixed(5)}°W`);

			} else if (isDoubleMarker1 && map1) {
				// Update first map for marker
				map1.jumpTo({
					center: coordinates,
					zoom: 14
				});

				// Add marker
				if (currentMarker1) currentMarker1.remove();
				currentMarker1 = new mapboxgl.Marker({ color: currentMarkerColor })
					.setLngLat(coordinates)
					.addTo(map1);

				// Update title fields for first map
				const titleInput = document.getElementById('double-large-text-1');
				const subtitleInput = document.getElementById('double-small-text-1');
				if (titleInput) titleInput.value = place.place_name;
				if (subtitleInput) subtitleInput.value = `${coordinates[1].toFixed(5)}°N / ${Math.abs(coordinates[0]).toFixed(5)}°W`;

				// Update display titles
				$('.map-label:first h3').text(place.place_name);
				$('.map-label:first p').text(`${coordinates[1].toFixed(5)}°N / ${Math.abs(coordinates[0]).toFixed(5)}°W`);

			} else if (isDoubleMarker2 && map2) {
				// Update second map for marker
				map2.jumpTo({
					center: coordinates,
					zoom: 14
				});

				// Add marker
				if (currentMarker2) currentMarker2.remove();
				currentMarker2 = new mapboxgl.Marker({ color: currentMarkerColor })
					.setLngLat(coordinates)
					.addTo(map2);

				// Update title fields for second map
				const titleInput = document.getElementById('double-large-text-2');
				const subtitleInput = document.getElementById('double-small-text-2');
				if (titleInput) titleInput.value = place.place_name;
				if (subtitleInput) subtitleInput.value = `${coordinates[1].toFixed(5)}°N / ${Math.abs(coordinates[0]).toFixed(5)}°W`;

				// Update display titles
				$('.map-label:last h3').text(place.place_name);
				$('.map-label:last p').text(`${coordinates[1].toFixed(5)}°N / ${Math.abs(coordinates[0]).toFixed(5)}°W`);

			} else if (isDoubleMap2 && map2) {
				// Update second map
				map2.jumpTo({
					center: coordinates,
					zoom: 14
				});

				// Add or update marker only if checkbox is checked
				const markerCheckbox = document.getElementById('double-marker-2');
				if (markerCheckbox && markerCheckbox.checked) {
					if (currentMarker2) currentMarker2.remove();
					currentMarker2 = new mapboxgl.Marker({ color: currentMarkerColor })
						.setLngLat(coordinates)
						.addTo(map2);
				}

				// Update title fields for second map
				const titleInput = document.getElementById('double-large-text-2');
				const subtitleInput = document.getElementById('double-small-text-2');
				if (titleInput) titleInput.value = place.place_name;
				if (subtitleInput) subtitleInput.value = `${coordinates[1].toFixed(5)}°N / ${Math.abs(coordinates[0]).toFixed(5)}°W`;

				// Update display titles
				$('.map-2-title h3').text(place.place_name);
				$('.map-2-title p').text(`${coordinates[1].toFixed(5)}°N / ${Math.abs(coordinates[0]).toFixed(5)}°W`);

			} else if (isTripleMap1 && map1Triple) {
				// Update first triple map
				map1Triple.jumpTo({
					center: coordinates,
					zoom: 14
				});

				// Add or update marker only if checkbox is checked
				const markerCheckbox = document.getElementById('triple-marker-1');
				if (markerCheckbox && markerCheckbox.checked) {
					if (currentMarker1Triple) currentMarker1Triple.remove();
					currentMarker1Triple = new mapboxgl.Marker({ color: currentMarkerColor })
						.setLngLat(coordinates)
						.addTo(map1Triple);
				}

				// Update title fields for first map
				const titleInput = document.getElementById('triple-large-text-1');
				const subtitleInput = document.getElementById('triple-small-text-1');
				if (titleInput) titleInput.value = place.place_name;
				if (subtitleInput) subtitleInput.value = `${coordinates[1].toFixed(5)}°N / ${Math.abs(coordinates[0]).toFixed(5)}°W`;

			} else if (isTripleMap2 && map2Triple) {
				// Update second triple map
				map2Triple.jumpTo({
					center: coordinates,
					zoom: 14
				});

				// Add or update marker only if checkbox is checked
				const markerCheckbox = document.getElementById('triple-marker-2');
				if (markerCheckbox && markerCheckbox.checked) {
					if (currentMarker2Triple) currentMarker2Triple.remove();
					currentMarker2Triple = new mapboxgl.Marker({ color: currentMarkerColor })
						.setLngLat(coordinates)
						.addTo(map2Triple);
				}

				// Update title fields for second map
				const titleInput = document.getElementById('triple-large-text-2');
				const subtitleInput = document.getElementById('triple-small-text-2');
				if (titleInput) titleInput.value = place.place_name;
				if (subtitleInput) subtitleInput.value = `${coordinates[1].toFixed(5)}°N / ${Math.abs(coordinates[0]).toFixed(5)}°W`;

			} else if (isTripleMap3 && map3Triple) {
				// Update third triple map
				map3Triple.jumpTo({
					center: coordinates,
					zoom: 14
				});

				// Add or update marker only if checkbox is checked
				const markerCheckbox = document.getElementById('triple-marker-3');
				if (markerCheckbox && markerCheckbox.checked) {
					if (currentMarker3Triple) currentMarker3Triple.remove();
					currentMarker3Triple = new mapboxgl.Marker({ color: currentMarkerColor })
						.setLngLat(coordinates)
						.addTo(map3Triple);
				}

				// Update title fields for third map
				const titleInput = document.getElementById('triple-large-text-3');
				const subtitleInput = document.getElementById('triple-small-text-3');
				if (titleInput) titleInput.value = place.place_name;
				if (subtitleInput) subtitleInput.value = `${coordinates[1].toFixed(5)}°N / ${Math.abs(coordinates[0]).toFixed(5)}°W`;

			} else if (isTripleMarker1 && map1Triple) {
				// Update first triple map for marker
				map1Triple.jumpTo({
					center: coordinates,
					zoom: 14
				});

				// Add marker
				if (currentMarker1Triple) currentMarker1Triple.remove();
				currentMarker1Triple = new mapboxgl.Marker({ color: currentMarkerColor })
					.setLngLat(coordinates)
					.addTo(map1Triple);

			} else if (isTripleMarker2 && map2Triple) {
				// Update second triple map for marker
				map2Triple.jumpTo({
					center: coordinates,
					zoom: 14
				});

				// Add marker
				if (currentMarker2Triple) currentMarker2Triple.remove();
				currentMarker2Triple = new mapboxgl.Marker({ color: currentMarkerColor })
					.setLngLat(coordinates)
					.addTo(map2Triple);

			} else if (isTripleMarker3 && map3Triple) {
				// Update third triple map for marker
				map3Triple.jumpTo({
					center: coordinates,
					zoom: 14
				});

				// Add marker
				if (currentMarker3Triple) currentMarker3Triple.remove();
				currentMarker3Triple = new mapboxgl.Marker({ color: currentMarkerColor })
					.setLngLat(coordinates)
					.addTo(map3Triple);

			} else if (map) {
				// Update single map (existing functionality)
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
	currentStyle = styleKey; // Save the style key, not the config

	// Helper function to apply style to a single map instance
	const applyStyleToMap = async (mapInstance) => {
		if (!mapInstance) return;

		// Check if it's a style name to load from JSON or a URL
		if (typeof styleConfig === 'string' && styleConfig.includes('mapbox://')) {
			// It's a Mapbox URL
			mapInstance.setStyle(styleConfig);
		} else {
			// It's a style name, load from JSON file
			const styleData = await loadMapStyle(styleConfig);
			if (styleData) {
				mapInstance.setStyle(styleData);
			} else {
				console.error(`Failed to load style: ${styleConfig}`);
				// Fallback to default Mapbox style
				mapInstance.setStyle('mapbox://styles/mapbox/streets-v12');
			}
		}

		// Wait for style to load before trying to modify layers
		mapInstance.once('styledata', () => {
			try {
				// Add custom styling for specific themes only if layers exist
				if (styleKey === 'pink') {
					if (mapInstance.getLayer('water')) {
						mapInstance.setPaintProperty('water', 'fill-color', '#e8b4d6');
					}
					if (mapInstance.getLayer('landuse')) {
						mapInstance.setPaintProperty('landuse', 'fill-color', '#f7e8f1');
					}
				} else if (styleKey === 'green') {
					if (mapInstance.getLayer('water')) {
						mapInstance.setPaintProperty('water', 'fill-color', '#a8d8a8');
					}
					if (mapInstance.getLayer('landuse')) {
						mapInstance.setPaintProperty('landuse', 'fill-color', '#e8f5e8');
					}
				} else if (styleKey === 'custom') {
					// Apply custom colors for custom style
					applyCustomMapColorsToInstance(mapInstance);
				}
			} catch (error) {
				console.warn('Could not apply custom layer styling:', error);
			}
		});
	};

	// Apply to single map
	if (map) {
		await applyStyleToMap(map);
	}

	// Apply to double map layout
	if (map1) {
		await applyStyleToMap(map1);
	}
	if (map2) {
		await applyStyleToMap(map2);
	}

	// Apply to triple map layout
	if (map1Triple) {
		await applyStyleToMap(map1Triple);
	}
	if (map2Triple) {
		await applyStyleToMap(map2Triple);
	}
	if (map3Triple) {
		await applyStyleToMap(map3Triple);
	}
}

// Helper function to apply custom colors to a specific map instance
function applyCustomMapColorsToInstance(mapInstance) {
	if (!mapInstance) return;

	// Function to apply colors
	const applyColors = () => {
		try {
			// Apply land/landuse color
			if (mapInstance.getLayer('landuse')) {
				mapInstance.setPaintProperty('landuse', 'fill-color', customColors.land);
			}
			if (mapInstance.getLayer('landcover')) {
				mapInstance.setPaintProperty('landcover', 'fill-color', customColors.land);
			}
			if (mapInstance.getLayer('land')) {
				mapInstance.setPaintProperty('land', 'background-color', customColors.land);
			}

			// Apply roads color - try multiple layer variations
			const roadLayers = ['road', 'road-primary', 'road-secondary-tertiary', 'road-street',
			                    'road-minor', 'road-arterial', 'road-highway', 'road-trunk',
			                    'road-motorway', 'bridge-street', 'tunnel-street'];
			roadLayers.forEach(layerId => {
				if (mapInstance.getLayer(layerId)) {
					mapInstance.setPaintProperty(layerId, 'line-color', customColors.roads);
				}
			});

			// Apply water color
			if (mapInstance.getLayer('water')) {
				mapInstance.setPaintProperty('water', 'fill-color', customColors.water);
			}
			if (mapInstance.getLayer('waterway')) {
				mapInstance.setPaintProperty('waterway', 'line-color', customColors.water);
			}

			// Apply background color
			if (mapInstance.getLayer('background')) {
				mapInstance.setPaintProperty('background', 'background-color', customColors.background);
			}

			console.log('Custom colors applied:', customColors);
		} catch (error) {
			console.warn('Could not apply custom colors:', error);
		}
	};

	// If map is loaded, apply immediately
	if (mapInstance.loaded()) {
		applyColors();
	} else {
		// Otherwise wait for load
		mapInstance.once('load', applyColors);
	}
}

// Apply custom colors to all active map layers
function applyCustomMapColors() {
	// Apply to single map
	if (map) {
		applyCustomMapColorsToInstance(map);
	}

	// Apply to double map layout
	if (map1) {
		applyCustomMapColorsToInstance(map1);
	}
	if (map2) {
		applyCustomMapColorsToInstance(map2);
	}

	// Apply to triple map layout
	if (map1Triple) {
		applyCustomMapColorsToInstance(map1Triple);
	}
	if (map2Triple) {
		applyCustomMapColorsToInstance(map2Triple);
	}
	if (map3Triple) {
		applyCustomMapColorsToInstance(map3Triple);
	}
}

function resetMapStyle() {
	if (map) {
		// Reset to original style
		map.setStyle(currentStyle);
	}
}

// Function to apply current style and font to all active maps
function applyCurrentStyleAndFont() {
	console.log('Applying current style and font:', currentStyle, currentFont);

	// Apply current map style to all active maps
	if (currentStyle) {
		console.log('Changing map style to:', currentStyle);
		changeMapStyle(currentStyle);
	}

	// Apply current font to all layouts
	if (currentFont) {
		console.log('Applying font to all layouts:', currentFont);
		applyFontToAllLayouts(currentFont);
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
	const markerCheckbox = document.querySelector('.details__wrapper .map__marker input[type="checkbox"]');

	if (markerCheckbox && markerCheckbox.checked) {
		// Enable click-to-place marker mode
		enableMarkerPlacement();
		// Show marker info section for single layout
		$('.details__wrapper .marker__info').slideDown(300);
		// Show instruction message
		showMarkerInstruction('Click or tap on the map to place a marker');
	} else {
		// Disable marker placement mode
		disableMarkerPlacement();
		if (currentMarker) {
			currentMarker.remove();
			currentMarker = null;
		}
		// Hide marker info section for single layout
		$('.details__wrapper .marker__info').slideUp(300);
	}
}

// Enable click/tap to place marker on map
function enableMarkerPlacement() {
	if (!map) return;

	// Change cursor to indicate marker placement mode
	map.getCanvas().style.cursor = 'crosshair';

	// Remove existing click handler if any
	if (map._markerClickHandler) {
		map.off('click', map._markerClickHandler);
	}

	// Add click handler for marker placement
	map._markerClickHandler = function(e) {
		const coordinates = [e.lngLat.lng, e.lngLat.lat];
		placeMarkerAtLocation(coordinates);
	};

	map.on('click', map._markerClickHandler);
}

// Disable marker placement mode
function disableMarkerPlacement() {
	if (!map) return;

	// Reset cursor
	map.getCanvas().style.cursor = '';

	// Remove click handler
	if (map._markerClickHandler) {
		map.off('click', map._markerClickHandler);
		map._markerClickHandler = null;
	}
}

// Place marker at specific coordinates
function placeMarkerAtLocation(coordinates) {
	if (!map) return;

	// Remove existing marker
	if (currentMarker) {
		currentMarker.remove();
	}

	// Create custom marker element if icon is selected
	let markerElement = null;
	if (currentMarkerIcon) {
		const el = document.createElement('div');
		el.className = 'custom-marker';
		el.innerHTML = currentMarkerIcon;
		el.style.width = '40px';
		el.style.height = '40px';
		el.style.cursor = 'move';
		el.style.display = 'flex';
		el.style.alignItems = 'center';
		el.style.justifyContent = 'center';

		// Apply color to SVG elements
		const svg = el.querySelector('svg');
		if (svg) {
			svg.style.width = '100%';
			svg.style.height = '100%';

			const fills = svg.querySelectorAll('.marker-fill');
			fills.forEach(path => path.setAttribute('fill', currentMarkerColor));

			const strokes = svg.querySelectorAll('.marker-stroke');
			strokes.forEach(path => path.setAttribute('stroke', currentMarkerColor));

			const st0Elements = svg.querySelectorAll('.st0');
			st0Elements.forEach(el => el.setAttribute('fill', currentMarkerColor));

			if (fills.length === 0 && strokes.length === 0 && st0Elements.length === 0) {
				const allPaths = svg.querySelectorAll('path');
				allPaths.forEach(path => {
					path.setAttribute('fill', currentMarkerColor);
					path.setAttribute('stroke', currentMarkerColor);
				});
			}
		}

		markerElement = el;
	}

	// Create marker with draggable option
	currentMarker = markerElement
		? new mapboxgl.Marker(markerElement, { draggable: true })
		: new mapboxgl.Marker({ color: currentMarkerColor, draggable: true });

	currentMarker
		.setLngLat(coordinates)
		.addTo(map);

	// Update marker position on drag end
	currentMarker.on('dragend', function() {
		const lngLat = currentMarker.getLngLat();
		console.log('Marker dragged to:', lngLat);
		// Update address fields if needed
		updateMarkerAddress(lngLat);
	});

	console.log('✓ Marker placed at:', coordinates);
	hideMarkerInstruction();
}

// Show instruction message
function showMarkerInstruction(message) {
	let instructionDiv = document.querySelector('.marker-instruction');
	if (!instructionDiv) {
		instructionDiv = document.createElement('div');
		instructionDiv.className = 'marker-instruction';
		instructionDiv.style.cssText = `
			position: fixed;
			top: 20px;
			left: 50%;
			transform: translateX(-50%);
			background: rgba(0, 0, 0, 0.8);
			color: white;
			padding: 12px 24px;
			border-radius: 8px;
			z-index: 10000;
			font-size: 14px;
			font-weight: 500;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		`;
		document.body.appendChild(instructionDiv);
	}
	instructionDiv.textContent = message;
	instructionDiv.style.display = 'block';
}

// Hide instruction message
function hideMarkerInstruction() {
	const instructionDiv = document.querySelector('.marker-instruction');
	if (instructionDiv) {
		instructionDiv.style.display = 'none';
	}
}

// Update marker address via reverse geocoding
function updateMarkerAddress(lngLat) {
	fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${mapboxgl.accessToken}`)
		.then(response => response.json())
		.then(data => {
			if (data.features && data.features.length > 0) {
				const place = data.features[0];
				const addressInput = document.querySelector('.details__wrapper .marker__info .address__info input[type="text"]');
				if (addressInput) {
					addressInput.value = place.place_name;
				}
			}
		})
		.catch(error => console.error('Reverse geocoding error:', error));
}

function updateMapTitle() {
	const titleCheckbox = document.querySelector('.details__wrapper .map__title .title input[type="checkbox"]');
	const posterTitle = document.querySelector('.poster-title');

	if (titleCheckbox && titleCheckbox.checked) {
		$('.details__wrapper .map__title .content').slideDown(300);
		if (posterTitle) {
			posterTitle.style.display = 'block';
		}
	} else {
		$('.details__wrapper .map__title .content').slideUp(300);
		if (posterTitle) {
			posterTitle.style.display = 'none';
		}
	}
}

function changeMapLayout(layoutType) {
	console.log('changeMapLayout called with:', layoutType);

	// Update current layout tracker
	currentLayout = layoutType;

	// Check if switching to double or triple map layout
	if (layoutType === 'double-map') {
		switchMapLayout(true, false);
		return;
	} else if (layoutType === 'triple-map') {
		switchMapLayout(false, true);
		return;
	} else if (isDoubleMapLayout || isTripleMapLayout) {
		// If we were in double or triple map mode, switch back to single
		switchMapLayout(false, false);
	}

	// Handle different layout shapes (circle, heart, square, puzzle, story)
	const mapContainer = document.getElementById('map');
	const photoUploadContainer = document.querySelector('.photo-upload-container');

	console.log('Map container found:', !!mapContainer);

	// Remove existing layout classes
	mapContainer.className = mapContainer.className.replace(/layout-\w+/g, '');
	const shapeOverLay = document.querySelector('#shape-overlay');

	// Fix for null shape overlay element
	if (shapeOverLay) {
		shapeOverLay.innerHTML = '';
	}

	$("#map canvas, #map").css({
		"max-height": document.querySelector('#map canvas')?.clientWidth*100 + "px",
	});

	// Add new layout class
	if (layoutType !== 'default') {
		mapContainer.classList.add(`layout-${layoutType}`);
	}

	// Ensure proper dimensions for the new layout
	resizeFrame();

	// Ensure map container is always visible
	mapContainer.style.display = 'block';
	mapContainer.style.visibility = 'visible';
	mapContainer.style.opacity = '1';

	if (map && map.loaded()) {
		setTimeout(function() {
			map.resize();
			console.log('Map resized - Mapbox handling canvas dimensions for crisp rendering');
		}, 150);
	}

	// Handle photo upload interface for "With Photo" and "Valentine" layouts
	if (layoutType === 'with-photo') {
			console.log('Showing photo preview in title area');
			showPhotoInTitleArea();
			// Remove with-valentine class if switching from valentine to photo
			const previewTitle = document.querySelector('.map-preview-title');
			if (previewTitle) {
				previewTitle.classList.remove('with-valentine');
			}
			mapContainer.style.clipPath = 'none';
			mapContainer.style.borderRadius = '0';

			$("#map canvas, #map").css({
				"max-height": document.querySelector('#map canvas').clientHeight-document.querySelector('.photo-preview img').clientHeight+50 + "px",
			});

			if (map && map.loaded()) {
				setTimeout(function() {
					map.resize();
					console.log('Map resized - Mapbox handling canvas dimensions for crisp rendering');
				}, 150);
			}
		} else if (layoutType === 'heart') {
			console.log('Showing valentine photo preview in title area');
			// Check if there's already an uploaded photo and update SVG if needed
			const existingPhoto = localStorage.getItem('uploadedPhoto');
			if (existingPhoto) {
				// Ensure SVG is updated with current photo before showing
				updateValentineSvgHref(existingPhoto);
				console.log('Updated SVG with existing photo for valentine layout');
			}

		// Apply current background color to valentine SVG outline
		const currentBgColor = $('.map-preview-title').css('background-color') || '#ffffff';
		if (currentBgColor !== 'rgba(0, 0, 0, 0)' && currentBgColor !== 'transparent') {
			updateValentineSvgOutlineColor(currentBgColor);
			console.log('Applied current background color to valentine SVG outline');
		}

			showValentinePhotoInTitleArea();
			// Remove with-photo class if it exists
			const previewTitle = document.querySelector('.map-preview-title');
			if (previewTitle) {
				previewTitle.classList.remove('with-photo');
			}
			// Keep map layout the same as with-photo (no clip-path changes)
			mapContainer.style.clipPath = 'none';
			mapContainer.style.borderRadius = '0';
		} else if (layoutType === 'circle') {
			console.log('Hiding photo preview for layout:', layoutType);
		// Hide photo preview for other layouts
			const photoPreview = document.querySelector('.photo-preview');
			const shapeOverLay = document.querySelector('#shape-overlay');
			
			if (photoPreview) {
				photoPreview.remove();
			}
			// Remove with-photo and with-valentine classes from title
			const previewTitle = document.querySelector('.map-preview-title');
			if (previewTitle) {
				previewTitle.classList.remove('with-photo', 'with-valentine');
			}
			// shapeOverLay.innerHTML = document.querySelector('#circle-svg').value;

			$("#map canvas").css({
				"max-height": document.querySelector('#map canvas').clientWidth + "px",
			});


			// previewTitle.classList.add('with-circle')
		}else if (layoutType === 'full-heart') {
			console.log('Hiding photo preview for layout:', layoutType);
		// Hide photo preview for other layouts
			const photoPreview = document.querySelector('.photo-preview');
			const shapeOverLay = document.querySelector('#shape-overlay');
			
			if (photoPreview) {
				photoPreview.remove();
			}
			// Remove with-photo and with-valentine classes from title
			const previewTitle = document.querySelector('.map-preview-title');
			if (previewTitle) {
				previewTitle.classList.remove('with-photo', 'with-valentine');
			}
			// shapeOverLay.innerHTML = document.querySelector('#circle-svg').value;

			$("#map canvas").css({
				"max-height": document.querySelector('#map canvas').clientWidth + "px",
			});


			// previewTitle.classList.add('with-circle')
		}
		else{
		console.log('Hiding photo preview for layout:', layoutType);
		// Hide photo preview for other layouts
		const photoPreview = document.querySelector('.photo-preview');
		if (photoPreview) {
			photoPreview.remove();
		}
		// Remove with-photo and with-valentine classes from title
		const previewTitle = document.querySelector('.map-preview-title');
		if (previewTitle) {
			previewTitle.classList.remove('with-photo', 'with-valentine');
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
}

// Function to show photo in title area
function showPhotoInTitleArea() {
	console.log('showPhotoInTitleArea called');

	// Add with-photo class to title area
	const previewTitle = document.querySelector('.map-preview-title');
	if (previewTitle) {
		previewTitle.classList.add('with-photo');
	}

	// Remove existing photo preview
	const existingPreview = document.querySelector('.photo-preview');
	if (existingPreview) {
		existingPreview.remove();
	}

	// Create photo preview container
	const photoPreview = document.createElement('div');
	photoPreview.className = 'photo-preview';

	// Check if photo is already uploaded
	const uploadedPhoto = localStorage.getItem('uploadedPhoto');
	if (uploadedPhoto) {
		// Show uploaded photo preview - use regular img tag for "With Photo" layout
		photoPreview.innerHTML = `
			<img src="${uploadedPhoto}" alt="Uploaded photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
		`;

		// Add click handler to open photo management popup
		photoPreview.addEventListener('click', function() {
			openPhotoManagementPopup(uploadedPhoto);
		});
	} else {
		// Show upload interface
		photoPreview.innerHTML = `
			<div style="text-align: center;">
				<div style="width: 40px; height: 40px; background: #f77147; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">📷</div>
				<p style="margin: 0; color: #666; font-size: 12px; font-weight: 500;">Click to add photo</p>
			</div>
		`;

		// Add click handler for upload
		photoPreview.addEventListener('click', function() {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = 'image/*';
			input.style.display = 'none';
			input.addEventListener('change', handlePhotoUpload);
			document.body.appendChild(input);
			input.click();
			document.body.removeChild(input);
		});
	}

	// Add to title area
	if (previewTitle) {
		previewTitle.appendChild(photoPreview);
	}
}

// Function to show valentine photo in title area
function showValentinePhotoInTitleArea() {
	console.log('showValentinePhotoInTitleArea called');

	// Add with-valentine class to title area
	const previewTitle = document.querySelector('.map-preview-title');
	if (previewTitle) {
		previewTitle.classList.add('with-valentine');
	}

	// Remove existing photo preview
	const existingPreview = document.querySelector('.photo-preview');
	if (existingPreview) {
		existingPreview.remove();
	}

	// Create photo preview container with valentine styling
	const photoPreview = document.createElement('div');
	photoPreview.className = 'photo-preview with-valentine';

	// Check if photo is already uploaded
	const uploadedPhoto = localStorage.getItem('uploadedPhoto');
	if (uploadedPhoto) {
		// For valentine layout, always use SVG approach
		const valentineSvgTextarea = document.getElementById('valentine-svg');
		if (valentineSvgTextarea) {
			// Get current SVG content
			let svgContent = valentineSvgTextarea.value;

			console.log('SVG content length:', svgContent.length);
			console.log('SVG contains uploaded photo:', svgContent.includes(uploadedPhoto));

			// FORCE update the SVG href to ensure it has the current photo
			console.log('Force updating SVG href...');
			svgContent = svgContent.replace(
				/href="[^"]*"/,
				`href="${uploadedPhoto}"`
			);
			// Update the textarea as well
			valentineSvgTextarea.value = svgContent;
			console.log('SVG href force updated in textarea');

			// Use the SVG content directly
			photoPreview.innerHTML = svgContent;
			console.log('Using SVG content for valentine layout, content preview:', svgContent.substring(0, 100) + '...');
		} else {
			console.error('valentine-svg textarea not found, falling back to img');
			// Fallback to img if textarea not found
			photoPreview.innerHTML = `
				<img src="${uploadedPhoto}" alt="Uploaded photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
			`;
		}

		// Add click handler to open valentine photo management popup
		photoPreview.addEventListener('click', function() {
			openValentinePhotoManagementPopup(uploadedPhoto);
		});
	} else {
		// Show upload interface - for valentine layout, we still show simple upload interface
		// The SVG will be used only after a photo is uploaded and processed
		photoPreview.innerHTML = `
			<div style="text-align: center;">
				<div style="width: 40px; height: 40px; background: #f77147; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">❤️</div>
				<p style="margin: 0; color: #666; font-size: 12px; font-weight: 500;">Click to add photo</p>
			</div>
		`;

		// Add click handler for upload
		photoPreview.addEventListener('click', function() {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = 'image/*';
			input.style.display = 'none';
			input.addEventListener('change', handleValentinePhotoUpload);
			document.body.appendChild(input);
			input.click();
			document.body.removeChild(input);
		});

		console.log('Showing valentine upload interface');
	}

	// Add to title area
	if (previewTitle) {
		previewTitle.appendChild(photoPreview);
	}
}


// Function to handle photo upload
function handlePhotoUpload(event) {
 	const file = event.target.files[0];
 	if (!file) return;

 	// Validate file type
 	if (!file.type.startsWith('image/')) {
 		alert('Please select a valid image file.');
 		return;
 	}

 	// Validate file size (10MB limit)
 	if (file.size > 10 * 1024 * 1024) {
 		alert('Please select an image smaller than 10MB.');
 		return;
 	}

 	const reader = new FileReader();
 	reader.onload = function(e) {
 		const photoData = e.target.result;

 		// Save to localStorage temporarily (will be updated after cropping)
 		localStorage.setItem('uploadedPhotoTemp', photoData);

 		// Open crop popup immediately after upload
 		openCropPopupAfterUpload(photoData);

 		console.log('Photo uploaded successfully, opening crop interface');
 	};

 	reader.onerror = function() {
 		alert('Error reading the file. Please try again.');
 	};

 	reader.readAsDataURL(file);
}

// Function to handle valentine photo upload
function handleValentinePhotoUpload(event) {
 	const file = event.target.files[0];
 	if (!file) return;

 	// Validate file type
 	if (!file.type.startsWith('image/')) {
 		alert('Please select a valid image file.');
 		return;
 	}

 	// Validate file size (10MB limit)
 	if (file.size > 10 * 1024 * 1024) {
 		alert('Please select an image smaller than 10MB.');
 		return;
 	}

 	const reader = new FileReader();
 	reader.onload = function(e) {
 		const photoData = e.target.result;

 		// Save to localStorage temporarily (will be updated after cropping)
 		localStorage.setItem('uploadedPhotoTemp', photoData);

 		// Open crop popup for valentine
 		openValentineCropPopupAfterUpload(photoData);

 		console.log('Valentine photo uploaded successfully, opening crop interface');
 	};

 	reader.onerror = function() {
 		alert('Error reading the file. Please try again.');
 	};

 	reader.readAsDataURL(file);
}

// Function to change photo
function changePhoto() {
	document.getElementById('photo-input').click();
}

// Function to remove photo
function removePhoto() {
	localStorage.removeItem('uploadedPhoto');
	showPhotoInTitleArea();
	console.log('Photo removed');
}

// Function to open photo management popup
function openPhotoManagementPopup(currentPhoto) {
	// Remove existing popup
	const existingPopup = document.querySelector('.photo-management-popup');
	if (existingPopup) {
		existingPopup.remove();
	}

	// Create popup overlay
	const popupOverlay = document.createElement('div');
	popupOverlay.className = 'photo-management-popup';
	popupOverlay.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
	`;

	// Create popup content
	const popupContent = document.createElement('div');
	popupContent.style.cssText = `
		background: white;
		border-radius: 12px;
		padding: 30px;
		max-width: 500px;
		width: 90%;
		text-align: center;
		position: relative;
	`;

	popupContent.innerHTML = `
		<div style="margin-bottom: 25px;">
			<img src="${currentPhoto}" alt="Current photo" style="max-width: 100%; max-height: 200px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
		</div>
		<div style="margin-bottom: 20px;">
			<button onclick="changePhotoFromPopup()" style="padding: 12px 24px; margin-right: 10px; background: #f77147; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">Change Photo</button>
			<button onclick="cropPhotoFromPopup()" style="padding: 12px 24px; margin-right: 10px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">Crop Photo</button>
			<button onclick="removePhotoFromPopup()" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">Remove</button>
		</div>
		<button onclick="closePhotoManagementPopup()" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
	`;

	popupOverlay.appendChild(popupContent);
	document.body.appendChild(popupOverlay);

	// Close popup when clicking outside
	popupOverlay.addEventListener('click', function(e) {
		if (e.target === popupOverlay) {
			closePhotoManagementPopup();
		}
	});
}

// Function to open valentine photo management popup
function openValentinePhotoManagementPopup(currentPhoto) {
	// Remove existing popup
	const existingPopup = document.querySelector('.photo-management-popup, .valentine-photo-management-popup');
	if (existingPopup) {
		existingPopup.remove();
	}

	// Create popup overlay with valentine styling
	const popupOverlay = document.createElement('div');
	popupOverlay.className = 'valentine-photo-management-popup';
	popupOverlay.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
	`;

	// Create popup content with valentine styling
	const popupContent = document.createElement('div');
	popupContent.style.cssText = `
		background: linear-gradient(135deg, #fff 0%, #fde3da 100%);
		border-radius: 16px;
		padding: 30px;
		max-width: 500px;
		width: 90%;
		text-align: center;
		position: relative;
		border: 2px solid #f77147;
		box-shadow: 0 8px 32px rgba(247, 113, 71, 0.3);
	`;

	// Get the SVG content for valentine display
	const valentineSvgTextarea = document.getElementById('valentine-svg');
	let photoDisplay = '';
	if (valentineSvgTextarea) {
		const svgContent = valentineSvgTextarea.value;
		// Use SVG content if available, otherwise fallback to img
		if (svgContent.includes(currentPhoto)) {
			photoDisplay = svgContent;
		} else {
			photoDisplay = `<img src="${currentPhoto}" alt="Current photo" style="max-width: 100%; max-height: 200px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">`;
		}
	} else {
		photoDisplay = `<img src="${currentPhoto}" alt="Current photo" style="max-width: 100%; max-height: 200px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">`;
	}

	popupContent.innerHTML = `
		<div style="margin-bottom: 25px; font-family: 'Poppins', sans-serif;">
			<h3 style="margin: 0 0 15px 0; color: #f77147; font-size: 24px;">💖 Valentine Photo</h3>
			<div style="background: white; border-radius: 12px; padding: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
				${photoDisplay}
			</div>
		</div>
		<div style="margin-bottom: 20px; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
			<button onclick="changeValentinePhotoFromPopup()" style="padding: 12px 24px; background: #f77147; color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: 600; min-width: 120px; transition: all 0.3s ease;" onmouseover="this.style.background='#e53422'" onmouseout="this.style.background='#f77147'">Change Photo</button>
			<button onclick="cropValentinePhotoFromPopup()" style="padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: 600; min-width: 120px; transition: all 0.3s ease;" onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4CAF50'">Crop Photo</button>
			<button onclick="removeValentinePhotoFromPopup()" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: 600; min-width: 120px; transition: all 0.3s ease;" onmouseover="this.style.background='#5a6268'" onmouseout="this.style.background='#6c757d'">Remove</button>
		</div>
		<button onclick="closeValentinePhotoManagementPopup()" style="position: absolute; top: 15px; right: 15px; background: #f77147; color: white; border: none; font-size: 20px; cursor: pointer; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;" onmouseover="this.style.background='#e53422'" onmouseout="this.style.background='#f77147'">×</button>
	`;

	popupOverlay.appendChild(popupContent);
	document.body.appendChild(popupOverlay);

	// Close popup when clicking outside
	popupOverlay.addEventListener('click', function(e) {
		if (e.target === popupOverlay) {
			closeValentinePhotoManagementPopup();
		}
	});

	console.log('Valentine photo management popup opened');
}

// Function to close photo management popup
function closePhotoManagementPopup() {
	const popup = document.querySelector('.photo-management-popup');
	if (popup) {
		popup.remove();
	}
}

// Function to close valentine photo management popup
function closeValentinePhotoManagementPopup() {
	const popup = document.querySelector('.valentine-photo-management-popup');
	if (popup) {
		popup.remove();
	}
	console.log('Valentine photo management popup closed');
}

// Function to change photo from popup
function changePhotoFromPopup() {
	closePhotoManagementPopup();
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = 'image/*';
	input.style.display = 'none';
	input.addEventListener('change', handlePhotoUpload);
	document.body.appendChild(input);
	input.click();
	document.body.removeChild(input);
}

// Function to crop photo from popup
function cropPhotoFromPopup() {
	closePhotoManagementPopup();
	openCropPopup();
}

// Function to remove photo from popup
function removePhotoFromPopup() {
	localStorage.removeItem('uploadedPhoto');
	closePhotoManagementPopup();
	showPhotoInTitleArea();
	console.log('Photo removed from popup');
}

// Function to change valentine photo from popup
function changeValentinePhotoFromPopup() {
	closeValentinePhotoManagementPopup();
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = 'image/*';
	input.style.display = 'none';
	input.addEventListener('change', handleValentinePhotoUpload);
	document.body.appendChild(input);
	input.click();
	document.body.removeChild(input);
	console.log('Changing valentine photo from popup');
}

// Function to crop valentine photo from popup
function cropValentinePhotoFromPopup() {
	closeValentinePhotoManagementPopup();
	// Open the valentine crop popup with current photo
	const currentPhoto = localStorage.getItem('uploadedPhoto');
	if (currentPhoto) {
		openValentineCropPopupAfterUpload(currentPhoto);
	} else {
		openCropPopup();
	}
	console.log('Cropping valentine photo from popup');
}

// Function to remove valentine photo from popup
function removeValentinePhotoFromPopup() {
	localStorage.removeItem('uploadedPhoto');
	closeValentinePhotoManagementPopup();
	showValentinePhotoInTitleArea();
	console.log('Valentine photo removed from popup');
}

// Function to open crop popup
function openCropPopup() {
	const currentPhoto = localStorage.getItem('uploadedPhoto');
	if (!currentPhoto) return;

	// Remove existing crop popup
	const existingCropPopup = document.querySelector('.crop-popup');
	if (existingCropPopup) {
		existingCropPopup.remove();
	}

	// Create crop popup overlay
	const cropOverlay = document.createElement('div');
	cropOverlay.className = 'crop-popup';
	cropOverlay.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10001;
	`;

	// Create crop content
	const cropContent = document.createElement('div');
	cropContent.style.cssText = `
		background: white;
		border-radius: 12px;
		padding: 30px;
		max-width: 600px;
		width: 90%;
		max-height: 80vh;
		overflow-y: auto;
	`;

	cropContent.innerHTML = `
		<div style="margin-bottom: 20px; text-align: center;">
			<h3 style="margin: 0 0 20px 0; color: #16212c;">Crop Photo</h3>
			<div style="position: relative; margin-bottom: 20px;">
				<img id="crop-image" src="${currentPhoto}" alt="Crop photo" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
			</div>
			<div style="margin-bottom: 20px;">
				<label style="display: block; margin-bottom: 10px; font-weight: 500;">Crop Shape:</label>
				<select id="crop-shape" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; margin-right: 10px;">
					<option value="square">Square</option>
					<option value="circle">Circle</option>
					<option value="rectangle">Rectangle</option>
				</select>
				<button onclick="applyCrop()" style="padding: 10px 20px; background: #f77147; color: white; border: none; border-radius: 6px; cursor: pointer;">Apply Crop</button>
			</div>
		</div>
		<div style="text-align: center;">
			<button onclick="closeCropPopup()" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
		</div>
	`;

	cropOverlay.appendChild(cropContent);
	document.body.appendChild(cropOverlay);

	// Close crop popup when clicking outside
	cropOverlay.addEventListener('click', function(e) {
		if (e.target === cropOverlay) {
			closeCropPopup();
		}
	});
}

// Function to close crop popup
function closeCropPopup() {
	const popup = document.querySelector('.crop-popup');
	if (popup) {
		popup.remove();
	}
}

// Function to open crop popup after upload
function openCropPopupAfterUpload(photoData) {
 	// Remove existing crop popup
 	const existingCropPopup = document.querySelector('.crop-popup');
 	if (existingCropPopup) {
 		existingCropPopup.remove();
 	}

 	// Create crop popup overlay
 	const cropOverlay = document.createElement('div');
 	cropOverlay.className = 'crop-popup';
 	cropOverlay.style.cssText = `
 		position: fixed;
 		top: 0;
 		left: 0;
 		width: 100%;
 		height: 100%;
 		background: rgba(0, 0, 0, 0.8);
 		display: flex;
 		align-items: center;
 		justify-content: center;
 		z-index: 10001;
 	`;

 	// Create crop content
 	const cropContent = document.createElement('div');
 	cropContent.style.cssText = `
 		background: white;
 		border-radius: 12px;
 		padding: 30px;
 		max-width: 700px;
 		width: 90%;
 		max-height: 90vh;
 		overflow-y: auto;
 	`;

 	cropContent.innerHTML = `
 	<div style="margin-bottom: 20px; text-align: center;">
 		<h3 style="margin: 0 0 20px 0; color: #16212c;">Crop Your Photo</h3>
 		<p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">Drag the image to position it, and use zoom controls to resize. The circular area shows what will be visible.</p>

 		<div style="margin-bottom: 20px; display: inline-block; position: relative; max-width: 100%;">
 			<img id="cropper-image" src="${photoData}" alt="Crop photo" style="max-width: 400px; max-height: 400px; height: auto; border-radius: 8px; display: block; margin: 0 auto;">
 		</div>

 		<div style="margin-bottom: 20px; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
 			<button onclick="zoomCropper(0.2)" style="padding: 10px 20px; background: #f77147; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">➕ Zoom In</button>
 			<button onclick="zoomCropper(-0.2)" style="padding: 10px 20px; background: #f77147; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">➖ Zoom Out</button>
 			<button onclick="resetCropper()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">↺ Reset</button>
 		</div>

 		<div style="margin-bottom: 20px;">
 			<button onclick="applyCropAfterUpload()" style="padding: 12px 30px; margin-right: 10px; background: #f77147; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500;">Apply Crop</button>
 			<button onclick="cancelCropAfterUpload()" style="padding: 12px 30px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500;">Cancel</button>
 		</div>
 	</div>
 `;

 	cropOverlay.appendChild(cropContent);
 	document.body.appendChild(cropOverlay);

 	// Initialize Cropper.js
 	setTimeout(() => {
 		const cropperImage = document.getElementById('cropper-image');
 		if (cropperImage && window.Cropper) {
 			try {
 				// Destroy existing cropper if it exists
 				if (cropper) {
 					cropper.destroy();
 				}

 				console.log('Initializing Cropper.js v1.6.2');

 				// Create new cropper instance - professional Instagram/Facebook style
 				cropper = new window.Cropper(cropperImage, {
 					aspectRatio: 1, // Square aspect ratio for circular crop
 					viewMode: 0,   // No restrictions - allow selecting any part of image including edges
 					dragMode: 'move', // Move the image, not the crop box
 					modal: true,   // Show dark overlay outside crop area
 					background: true, // Show grid background
 					guides: false,  // Hide grid guides for cleaner UI
 					autoCropArea: 0.5, // Fixed crop area size
 					center: true,  // Center the crop area
 					highlight: false, // No highlight for cleaner UI
 					cropBoxMovable: false, // Fixed crop box position (centered)
 					cropBoxResizable: false, // Fixed crop box size (no resizing)
 					toggleDragModeOnDblclick: false, // No mode toggling
 					movable: true, // Allow moving the image underneath
 					zoomable: true, // Enable zoom via buttons, mouse wheel, and touch
 					zoomOnTouch: true, // Enable pinch-to-zoom on mobile
 					zoomOnWheel: true, // Enable mouse wheel zoom
 					wheelZoomRatio: 0.1, // Zoom ratio for mouse wheel
 					scalable: true, // Allow image scaling
 					rotatable: false, // No rotation
 					minCropBoxWidth: 150,  // Fixed crop box size
 					minCropBoxHeight: 150,
 					ready() {
 						console.log('Cropper initialized - drag to move, pinch/scroll to zoom');
 						// Set fixed crop box in center
 						setTimeout(() => {
 							const containerData = cropper.getContainerData();
 							const cropBoxSize = 150;
 							cropper.setCropBoxData({
 								width: cropBoxSize,
 								height: cropBoxSize,
 								left: (containerData.width - cropBoxSize) / 2,
 								top: (containerData.height - cropBoxSize) / 2
 							});
 						}, 100);
 					}
 				});
 			} catch (error) {
 				console.error('Error initializing Cropper:', error);
 				showSimpleCropInterface(cropperImage, photoData);
 			}
 		} else {
 			console.error('Cropper.js not available or image not found');
 			if (cropperImage) {
 				showSimpleCropInterface(cropperImage, photoData);
 			}
 		}
 	}, 300); // Wait for Cropper.js to load from CDN

 	// Close crop popup when clicking outside
 	cropOverlay.addEventListener('click', function(e) {
 		if (e.target === cropOverlay) {
 			cancelCropAfterUpload();
 		}
 	});
}

// Function to open valentine crop popup after upload
function openValentineCropPopupAfterUpload(photoData) {
 	// Remove existing crop popup
 	const existingCropPopup = document.querySelector('.crop-popup');
 	if (existingCropPopup) {
 		existingCropPopup.remove();
 	}

 	// Create crop popup overlay
 	const cropOverlay = document.createElement('div');
 	cropOverlay.className = 'crop-popup';
 	cropOverlay.style.cssText = `
 		position: fixed;
 		top: 0;
 		left: 0;
 		width: 100%;
 		height: 100%;
 		background: rgba(0, 0, 0, 0.8);
 		display: flex;
 		align-items: center;
 		justify-content: center;
 		z-index: 10001;
 	`;

 	// Create crop content
 	const cropContent = document.createElement('div');
 	cropContent.style.cssText = `
 		background: white;
 		border-radius: 12px;
 		padding: 30px;
 		max-width: 700px;
 		width: 90%;
 		max-height: 90vh;
 		overflow-y: auto;
 	`;

 	cropContent.innerHTML = `
 	<div style="margin-bottom: 20px; text-align: center;">
 		<h3 style="margin: 0 0 20px 0; color: #16212c;">Crop Your Valentine Photo</h3>
 		<p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">Drag the image to position it, and use zoom controls to resize. The heart-shaped area shows what will be visible in your valentine design.</p>

 		<div style="margin-bottom: 20px; display: inline-block; position: relative; max-width: 100%;">
 			<img id="valentine-cropper-image" src="${photoData}" alt="Crop valentine photo" style="max-width: 400px; max-height: 400px; height: auto; border-radius: 8px; display: block; margin: 0 auto;">
 		</div>

 		<div style="margin-bottom: 20px; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
 			<button onclick="zoomValentineCropper(0.2)" style="padding: 10px 20px; background: #f77147; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">➕ Zoom In</button>
 			<button onclick="zoomValentineCropper(-0.2)" style="padding: 10px 20px; background: #f77147; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">➖ Zoom Out</button>
 			<button onclick="resetValentineCropper()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">↺ Reset</button>
 		</div>

 		<div style="margin-bottom: 20px;">
 			<button onclick="applyValentineCropAfterUpload()" style="padding: 12px 30px; margin-right: 10px; background: #f77147; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500;">Apply Crop</button>
 			<button onclick="cancelValentineCropAfterUpload()" style="padding: 12px 30px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500;">Cancel</button>
 		</div>
 	</div>
 `;

 	cropOverlay.appendChild(cropContent);
 	document.body.appendChild(cropOverlay);

 	// Initialize Valentine Cropper.js
 	setTimeout(() => {
 		const cropperImage = document.getElementById('valentine-cropper-image');
 		if (cropperImage && window.Cropper) {
 			try {
 				// Destroy existing cropper if it exists
 				if (cropper) {
 					cropper.destroy();
 				}

 				console.log('Initializing Valentine Cropper.js v1.6.2');

 				// Create new cropper instance for valentine
 				cropper = new window.Cropper(cropperImage, {
 					aspectRatio: 1, // Square aspect ratio for heart-shaped crop
 					viewMode: 0,   // No restrictions - allow selecting any part of image including edges
 					dragMode: 'move', // Move the image, not the crop box
 					modal: true,   // Show dark overlay outside crop area
 					background: true, // Show grid background
 					guides: false,  // Hide grid guides for cleaner UI
 					autoCropArea: 0.5, // Fixed crop area size
 					center: true,  // Center the crop area
 					highlight: false, // No highlight for cleaner UI
 					cropBoxMovable: false, // Fixed crop box position (centered)
 					cropBoxResizable: false, // Fixed crop box size (no resizing)
 					toggleDragModeOnDblclick: false, // No mode toggling
 					movable: true, // Allow moving the image underneath
 					zoomable: true, // Enable zoom via buttons, mouse wheel, and touch
 					zoomOnTouch: true, // Enable pinch-to-zoom on mobile
 					zoomOnWheel: true, // Enable mouse wheel zoom
 					wheelZoomRatio: 0.1, // Zoom ratio for mouse wheel
 					scalable: true, // Allow image scaling
 					rotatable: false, // No rotation
 					minCropBoxWidth: 150,  // Fixed crop box size
 					minCropBoxHeight: 150,
 					ready() {
 						console.log('Valentine Cropper initialized - drag to move, pinch/scroll to zoom');
 						// Set fixed crop box in center
 						setTimeout(() => {
 							const containerData = cropper.getContainerData();
 							const cropBoxSize = 150;
 							cropper.setCropBoxData({
 								width: cropBoxSize,
 								height: cropBoxSize,
 								left: (containerData.width - cropBoxSize) / 2,
 								top: (containerData.height - cropBoxSize) / 2
 							});
 						}, 100);
 					}
 				});
 			} catch (error) {
 				console.error('Error initializing Valentine Cropper:', error);
 				showSimpleValentineCropInterface(cropperImage, photoData);
 			}
 		} else {
 			console.error('Cropper.js not available or image not found');
 			if (cropperImage) {
 				showSimpleValentineCropInterface(cropperImage, photoData);
 			}
 		}
 	}, 300); // Wait for Cropper.js to load from CDN

 	// Close crop popup when clicking outside
 	cropOverlay.addEventListener('click', function(e) {
 		if (e.target === cropOverlay) {
 			cancelValentineCropAfterUpload();
 		}
 	});
}

// Function to apply crop after upload
function applyCropAfterUpload() {
 	if (cropper) {
 		// Get cropped canvas
 		const canvas = cropper.getCroppedCanvas({
 			width: 180,  // Match the preview size
 			height: 180,
 			imageSmoothingEnabled: true,
 			imageSmoothingQuality: 'high'
 		});

 		// Convert canvas to blob, then to data URL
 		canvas.toBlob(function(blob) {
 			const reader = new FileReader();
 			reader.onload = function(e) {
 				const croppedDataUrl = e.target.result;

 				// Save cropped image
 				localStorage.setItem('uploadedPhoto', croppedDataUrl);
 				localStorage.removeItem('uploadedPhotoTemp');

 				// Close crop popup and update interface
 				closeCropPopup();
 				showPhotoInTitleArea();

 				console.log('Crop applied and photo saved');
 			};
 			reader.readAsDataURL(blob);
 		}, 'image/jpeg', 0.9);
 	} else {
 		// Fallback if cropper not available
 		const tempPhoto = localStorage.getItem('uploadedPhotoTemp');
 		if (tempPhoto) {
 			localStorage.setItem('uploadedPhoto', tempPhoto);
 			localStorage.removeItem('uploadedPhotoTemp');
 			closeCropPopup();
 			showPhotoInTitleArea();
 		}
 	}
}

// Function to apply valentine crop after upload
function applyValentineCropAfterUpload() {
 	if (cropper) {
 		// Get cropped canvas
 		const canvas = cropper.getCroppedCanvas({
 			width: 180,  // Match the preview size
 			height: 180,
 			imageSmoothingEnabled: true,
 			imageSmoothingQuality: 'high'
 		});

 		// Convert canvas to blob, then to data URL
 		canvas.toBlob(function(blob) {
 			const reader = new FileReader();
 			reader.onload = function(e) {
 				const croppedDataUrl = e.target.result;

 				// Save cropped image
 				localStorage.setItem('uploadedPhoto', croppedDataUrl);
 				localStorage.removeItem('uploadedPhotoTemp');

 				// Update the SVG image href in the valentine-svg textarea
 				console.log('Updating SVG href with:', croppedDataUrl.substring(0, 50) + '...');
 				updateValentineSvgHref(croppedDataUrl);
 
 				// Apply current background color to SVG outline
 				const currentBgColor = $('.map-preview-title').css('background-color') || '#ffffff';
 				if (currentBgColor !== 'rgba(0, 0, 0, 0)' && currentBgColor !== 'transparent') {
 					updateValentineSvgOutlineColor(currentBgColor);
 				}
 
 				// Close crop popup
 				closeCropPopup();
 
 				// Small delay to ensure SVG is updated before showing
 				setTimeout(() => {
 					showValentinePhotoInTitleArea();
 					console.log('Valentine photo preview updated with SVG');
 				}, 100);

 			};
 			reader.readAsDataURL(blob);
 		}, 'image/jpeg', 0.9);
 	} else {
 		// Fallback if cropper not available
 		const tempPhoto = localStorage.getItem('uploadedPhotoTemp');
 		if (tempPhoto) {
 			localStorage.setItem('uploadedPhoto', tempPhoto);
 			localStorage.removeItem('uploadedPhotoTemp');
 			console.log('Updating SVG href with temp photo');
 			updateValentineSvgHref(tempPhoto);
 
 			// Apply current background color to SVG outline
 			const currentBgColor = $('.map-preview-title').css('background-color') || '#ffffff';
 			if (currentBgColor !== 'rgba(0, 0, 0, 0)' && currentBgColor !== 'transparent') {
 				updateValentineSvgOutlineColor(currentBgColor);
 			}
 
 			// Close crop popup
 			closeCropPopup();
 
 			// Small delay to ensure SVG is updated before showing
 			setTimeout(() => {
 				showValentinePhotoInTitleArea();
 				console.log('Valentine photo preview updated with SVG (fallback)');
 			}, 100);
 		}
 	}
}

// Function to cancel crop after upload
function cancelCropAfterUpload() {
 	// Remove temp photo
 	localStorage.removeItem('uploadedPhotoTemp');

 	// Close crop popup and update interface
 	closeCropPopup();
 	showPhotoInTitleArea();

 	console.log('Crop cancelled');
}

// Function to cancel valentine crop after upload
function cancelValentineCropAfterUpload() {
 	// Remove temp photo
 	localStorage.removeItem('uploadedPhotoTemp');

 	// Close crop popup and update interface
 	closeCropPopup();
 	showValentinePhotoInTitleArea();

 	console.log('Valentine crop cancelled');
}

// Fallback function if Cropper.js doesn't load
function showSimpleCropInterface(imageElement, photoData) {
 	// Replace the cropper image with a simple preview
 	const cropContent = imageElement.closest('.crop-popup').querySelector('.crop-content');
 	if (cropContent) {
 		cropContent.innerHTML = `
 			<div style="margin-bottom: 20px; text-align: center;">
 				<h3 style="margin: 0 0 20px 0; color: #16212c;">Crop Your Photo</h3>
 				<p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">Cropper.js library didn't load. Using simple preview instead.</p>

 				<div style="position: relative; margin-bottom: 20px; display: inline-block;">
 					<img src="${photoData}" alt="Preview" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
 					<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 180px; height: 180px; border: 3px solid #f77147; border-radius: 50%; pointer-events: none; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);"></div>
 				</div>

 				<div style="margin-bottom: 20px;">
 					<button onclick="applyCropAfterUpload()" style="padding: 12px 30px; margin-right: 10px; background: #f77147; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500;">Use Photo</button>
 					<button onclick="cancelCropAfterUpload()" style="padding: 12px 30px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500;">Cancel</button>
 				</div>
 			</div>
 		`;
 	}
}

// Fallback function for valentine crop if Cropper.js doesn't load
function showSimpleValentineCropInterface(imageElement, photoData) {
 	// Replace the cropper image with a simple preview
 	const cropContent = imageElement.closest('.crop-popup').querySelector('.crop-content');
 	if (cropContent) {
 		cropContent.innerHTML = `
 			<div style="margin-bottom: 20px; text-align: center;">
 				<h3 style="margin: 0 0 20px 0; color: #16212c;">Crop Your Valentine Photo</h3>
 				<p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">Cropper.js library didn't load. Using simple preview instead.</p>

 				<div style="position: relative; margin-bottom: 20px; display: inline-block;">
 					<img src="${photoData}" alt="Preview" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
 					<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 180px; height: 180px; border: 3px solid #f77147; border-radius: 50%; pointer-events: none; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);"></div>
 				</div>

 				<div style="margin-bottom: 20px;">
 					<button onclick="applyValentineCropAfterUpload()" style="padding: 12px 30px; margin-right: 10px; background: #f77147; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500;">Use Photo</button>
 					<button onclick="cancelValentineCropAfterUpload()" style="padding: 12px 30px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500;">Cancel</button>
 				</div>
 			</div>
 		`;
 	}
}

// Function to update the SVG image href in valentine-svg textarea
function updateValentineSvgHref(imageDataUrl) {
	// Get the valentine-svg textarea
	const valentineSvgTextarea = document.getElementById('valentine-svg');
	if (valentineSvgTextarea) {
		// Get the current SVG content
		let svgContent = valentineSvgTextarea.value;

		console.log('Original SVG content length:', svgContent.length);
		console.log('Looking for href in SVG...');

		// Check if href exists
		const hrefMatch = svgContent.match(/href="[^"]*"/);
		console.log('Found href:', hrefMatch);

		// Update the href attribute in the image element
		const updatedContent = svgContent.replace(
			/href="[^"]*"/,
			`href="${imageDataUrl}"`
		);

		// Update the textarea value
		valentineSvgTextarea.value = updatedContent;

		console.log('SVG href updated successfully');
		console.log('New SVG content length:', updatedContent.length);
		console.log('Image data URL length:', imageDataUrl.length);
	} else {
		console.error('valentine-svg textarea not found');
	}
}

// Function to update the SVG outline color in valentine-svg textarea
function updateValentineSvgOutlineColor(backgroundColor) {
	// Get the valentine-svg textarea
	const valentineSvgTextarea = document.getElementById('valentine-svg');
	if (valentineSvgTextarea) {
		// Get the current SVG content
		let svgContent = valentineSvgTextarea.value;

		console.log('Updating SVG outline color to:', backgroundColor);

		// Update the path.outline fill color
		// Look for the path with class="outline"
		const outlinePattern = /class="outline"[^>]*fill="[^"]*"/;
		if (svgContent.match(outlinePattern)) {
			// Replace existing fill color in path.outline
			svgContent = svgContent.replace(
				/(class="outline"[^>]*)fill="[^"]*"/,
				`$1fill="${backgroundColor}"`
			);
		} else {
			// If no fill attribute exists, add it
			svgContent = svgContent.replace(
				/class="outline"/,
				`class="outline" fill="${backgroundColor}"`
			);
		}

		// Update the textarea value
		valentineSvgTextarea.value = svgContent;

		// Also update any currently displayed valentine photo preview
		const valentinePreview = document.querySelector('.photo-preview.with-valentine');
		if (valentinePreview) {
			valentinePreview.innerHTML = svgContent;
		}

		console.log('SVG outline color updated successfully');
	} else {
		console.error('valentine-svg textarea not found');
	}
}

// Valentine cropper control functions
window.zoomValentineCropper = function(delta) {
 	if (cropper) {
 		cropper.zoom(delta);
 	}
};

window.resetValentineCropper = function() {
 	if (cropper) {
 		cropper.reset();
 		// Restore fixed crop box size after reset
 		setTimeout(() => {
 			if (cropper) {
 				const containerData = cropper.getContainerData();
 				cropper.setCropBoxData({
 					width: 150,
 					height: 150,
 					left: (containerData.width - 150) / 2,
 					top: (containerData.height - 150) / 2
 				});
 			}
 		}, 100);
 	}
};

// Function to apply crop (simplified - just saves the image as-is for now)
function applyCrop() {
	const currentPhoto = localStorage.getItem('uploadedPhoto');
	if (currentPhoto) {
		// For now, just keep the same image (in a real implementation, you'd use a cropping library)
		closeCropPopup();
		console.log('Crop applied (placeholder)');
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
	// Check if we're on mobile
	const isMobile = window.innerWidth <= 767;
	const isSmallMobile = window.innerWidth <= 480;
	const isLandscapeMobile = isMobile && window.innerWidth > window.innerHeight;

	// Adjust max dimensions based on screen size
	const screenPadding = isSmallMobile ? 20 : (isMobile ? 30 : 0);
	const availableWidth = isMobile ? (window.innerWidth - screenPadding) : 520;

	const maxTotalHeight = 750; // Maximum total poster height (map + title)
	const maxWidth = isMobile ? availableWidth : 520;  // Maximum poster width for portrait
	const maxLandscapeWidth = isMobile ? availableWidth : 800; // Maximum width for landscape

	// Get the preview title height (approximate) - smaller on landscape mobile
	const titleHeight = isLandscapeMobile ? 50 : (isSmallMobile ? 60 : 70); // Approximate height of map-preview-title section

	let width, mapHeight, totalHeight;

	// Calculate dimensions based on orientation
	// IMPORTANT: Aspect ratio applies to TOTAL poster (map + title), not just map
	if (resizeType === "landscape") {
		// Landscape - width is LARGER than height
		// For landscape: totalWidth / totalHeight = ratio
		// Start with a base total height and calculate width
		totalHeight = isMobile ? 350 : 470; // Base total poster height for landscape (map + title)
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
		totalHeight = isMobile ? availableWidth : 570; // Total poster height including title
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
	let finalWidth = Math.round(width);
	let finalHeight = Math.round(mapHeight);

	// Apply dimensions to map container - keep full width for all layouts
	// The canvas inside will be made square via JavaScript for circle/heart
	$("#map").css({
		"height": finalHeight + "px",
		"width": finalWidth + "px",
		"max-width": "100%",
		"display": "block",
		"visibility": "visible"
	});

	// Also resize preview title container to match poster width
	$('.map-preview-title').css({
		"width": finalWidth + "px",
		"max-width": "100%"
	});

	console.log('Resize:', resizeType, 'Ratio:', currentAspectRatio,
	           'Layout:', currentLayout,
	           'Map container:', finalWidth + 'w x ' + finalHeight + 'h',
	           'Total poster (map+title):', finalWidth + 'w x ' + Math.round(totalHeight) + 'h',
	           'Actual ratio:', (totalHeight / width).toFixed(3),
	           'Mobile:', isMobile);

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

			// Auto-select first frame option when Framed Poster is clicked
			if ($(this).attr("data-id") === '2') {
				const $frameOptions = $('.el__format[data-id="2"] .image__changer ul li a');
				if ($frameOptions.length > 0 && !$frameOptions.hasClass('current')) {
					$frameOptions.first().addClass('current').trigger('click');
				}
			}
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


	// Map title handler removed - now using delegated handler below


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
			
			// Hide all panels
			$('.design__info, .details__wrapper, .format__wrapper').css("display", 'none');
			$('.details__wrapper--double').css("display", 'none');
			
			// Show the appropriate panel based on layout
			const tabName = $(this).attr("data-tab");
			if (tabName === 'details__wrapper' && isTripleMapLayout) {
				// Show triple map details panel if in triple map mode
				$('.details__wrapper--triple').fadeIn(300);
			} else if (tabName === 'details__wrapper' && isDoubleMapLayout) {
				// Show double map details panel if in double map mode
				$('.details__wrapper--double').fadeIn(300);
			} else if (tabName === 'details__wrapper' && !isDoubleMapLayout && !isTripleMapLayout) {
				// Show single map details panel
				$('.details__wrapper').fadeIn(300);
			} else {
				// Show regular panel (design or format)
				$('.' + tabName).fadeIn(300);
			}
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
			'atlas': 'atlas',
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

				// Reset photo preview backgrounds
				$('.with-photo .photo-preview').css('background-color', '');
				$('.photo-preview.with-valentine path.outline').css('fill', '#fff');
				// Note: .photo-preview.with-valentine does NOT need background reset

				// Reset valentine SVG outline color to white
				updateValentineSvgOutlineColor('#ffffff');

				console.log('Reset background to white with default text colors');
			}
			
			changeMapStyle(styleMap[styleText]).catch(error => {
				console.error('Error changing style:', error);
			});
			console.log('Switching to GlobeTee style:', styleText);
		}
	});

	// Track previous layout to detect transitions from double/triple to single
	let previousLayoutText = '';

	// Layout picker functionality - target layout options specifically
	$('.design__info .elem__picker:first-child ul li a').on('click', function(e) {
		e.preventDefault();

		const layoutText = $(this).text().toLowerCase().trim();

		console.log('Layout clicked:', layoutText);

		// Layout mapping
		const layoutMap = {
			'square': 'square',
			'with photo': 'with-photo',
			'valentine': 'heart',
			'circle': 'circle',
			'heart': 'full-heart',
			'house': 'default',
			'double map': 'double-map',
			'triple map': 'triple-map'
		};

		if (layoutMap[layoutText]) {
			console.log('Switching to layout:', layoutMap[layoutText]);
			changeMapLayout(layoutMap[layoutText]);

			// Check if we're switching FROM double/triple map TO single layout
			const wasDoubleOrTriple = previousLayoutText === 'double map' || previousLayoutText === 'triple map';
			const isNowSingle = layoutText !== 'double map' && layoutText !== 'triple map';

			// For double and triple map, hide portrait/square options and show only landscape
			if (layoutText === 'double map' || layoutText === 'triple map') {
				// Auto-select landscape orientation
				$('.elem__picker .type__switcher li a[data-type="landscape"]').click();
				// Hide portrait and square options
				$('.elem__picker .type__switcher li a[data-type="portrait"]').parent().hide();
				$('.elem__picker .type__switcher li a[data-type="square"]').parent().hide();
			} else {
				// Show all orientation options for other layouts
				$('.elem__picker .type__switcher li').show();
				// Only auto-select portrait if switching from double/triple to single
				if (wasDoubleOrTriple && isNowSingle) {
					$('.elem__picker .type__switcher li a[data-type="portrait"]').click();
				}
			}

			// Update previous layout tracker
			previousLayoutText = layoutText;
		} else {
			console.log('Layout not found in mapping:', layoutText);
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

	// Map marker toggle functionality (single layout only)
	// Use delegated event handler for map marker checkbox (single layout)
	$(document).on('change', '.details__wrapper .map__marker input[type="checkbox"]', function() {
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

	// Map title toggle functionality (single layout only)
	// Use delegated event handler for map title checkbox (single layout)
	$(document).on('change', '.details__wrapper .map__title .title input[type="checkbox"]', function() {
		updateMapTitle();
	});

	// Title input change handlers (single layout only)
	$('.details__wrapper .map__title .content textarea').on('input', function() {
		const titleInput = $('.details__wrapper .map__title .content textarea').eq(0);
		const subtitleInput = $('.details__wrapper .map__title .content textarea').eq(1);
		
		const title = titleInput.val() || 'MIAMI, UNITED STATES';
		const subtitle = subtitleInput.val() || '25.76168°N / 80.19179°W';
		
		updatePosterTitle(title, subtitle);
		updatePreviewTitle(title, subtitle);
	});

	// Initialize map title state (single layout only)
	const titleCheckbox = $('.details__wrapper .map__title .title input[type="checkbox"]');
	if (titleCheckbox.prop('checked')) {
		$('.details__wrapper .map__title .content').show();
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













	// Marker info toggle for single layout only
	$('.details__wrapper .marker__info>.btns>a').on('click' ,function(e){
		e.preventDefault();
		if (!$(this).hasClass("current")) {
			$(this).closest(".btns").find(">a").removeClass("current");
			$(this).addClass('current');
			const $markerInfo = $(this).closest('.marker__info');
			if ($(this).attr("data-id") == "address") {
				$markerInfo.find('.address__info').fadeIn(300);
				$markerInfo.find('.address__geo').css("display" ,"none");
			}
			if ($(this).attr("data-id") == "gps") {
				$markerInfo.find('.address__info').css("display" ,"none");
				$markerInfo.find('.address__geo').fadeIn(300)
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

					// Apply background color to photo preview areas
					$('.with-photo .photo-preview').css('background-color', selectedColor);
					$('.photo-preview.with-valentine path.outline').css('fill', selectedColor);
					// Note: .photo-preview.with-valentine does NOT get background color

					// For valentine SVG, update the path.outline fill color
					updateValentineSvgOutlineColor(selectedColor);

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
	
	// Make cropper control functions globally available
	window.zoomCropper = function(delta) {
		if (cropper) {
			cropper.zoom(delta);
		}
	};
	
	window.resetCropper = function() {
		if (cropper) {
			cropper.reset();
			// Restore fixed crop box size after reset
			setTimeout(() => {
				if (cropper) {
					const containerData = cropper.getContainerData();
					cropper.setCropBoxData({
						width: 150,
						height: 150,
						left: (containerData.width - 150) / 2,
						top: (containerData.height - 150) / 2
					});
				}
			}, 100);
		}
	};
	
	// Cleanup cropper when popup closes
	function closeCropPopup() {
		if (cropper) {
			cropper.destroy();
			cropper = null;
		}
		const popup = document.querySelector('.crop-popup');
		if (popup) {
			popup.remove();
		}
	}

	// Double map title event listeners
	$('#double-map-main-title').on('input', function() {
		const title = $(this).val();
		$('.double-map-title h2').text(title);
	});

	$('#double-map-title-1').on('input', function() {
		const title = $(this).val();
		$('.map-1-title').text(title);
	});

	$('#double-map-title-2').on('input', function() {
		const title = $(this).val();
		$('.map-2-title').text(title);
	});

	// Double map place search functionality
	$('#double-map-place-1').on('input', function() {
		const query = $(this).val().trim();
		const $input = $(this);
		const inputElement = this;
		const $span = $input.next('span');

		if (query.length < 3) {
			$span.text('minimum 3 characters needed to search').css('color', '#666');
			return;
		}

		$span.text('searching...').css('color', '#f77147');

		clearTimeout(window.doubleMapSearchTimeout1);
		window.doubleMapSearchTimeout1 = setTimeout(() => {
			if (map1 && map1.loaded()) {
				searchLocation(query, false).then(suggestions => {
					if (suggestions && suggestions.length > 0) {
						showLocationSuggestions(suggestions, inputElement);
						$span.text(`${suggestions.length} locations found`).css('color', '#4CAF50');
					} else {
						$span.text('no locations found').css('color', '#f77147');
					}
				}).catch(error => {
					console.error('Double map search error:', error);
					$span.text('search error, please try again').css('color', '#f77147');
				});
			} else {
				$span.text('map not ready, please wait').css('color', '#f77147');
			}
		}, 300);
	});

	$('#double-map-place-2').on('input', function() {
		const query = $(this).val().trim();
		const $input = $(this);
		const inputElement = this;
		const $span = $input.next('span');

		if (query.length < 3) {
			$span.text('minimum 3 characters needed to search').css('color', '#666');
			return;
		}

		$span.text('searching...').css('color', '#f77147');

		clearTimeout(window.doubleMapSearchTimeout2);
		window.doubleMapSearchTimeout2 = setTimeout(() => {
			if (map2 && map2.loaded()) {
				searchLocation(query, false).then(suggestions => {
					if (suggestions && suggestions.length > 0) {
						showLocationSuggestions(suggestions, inputElement);
						$span.text(`${suggestions.length} locations found`).css('color', '#4CAF50');
					} else {
						$span.text('no locations found').css('color', '#f77147');
					}
				}).catch(error => {
					console.error('Double map search error:', error);
					$span.text('search error, please try again').css('color', '#f77147');
				});
			} else {
				$span.text('map not ready, please wait').css('color', '#f77147');
			}
		}, 300);
	});

	// Triple map place search inputs
	$('#triple-map-place-1').on('input', function() {
		const query = $(this).val().trim();
		const $input = $(this);
		const inputElement = this;
		const $span = $input.next('span');

		if (query.length < 3) {
			$span.text('minimum 3 characters needed to search').css('color', '#666');
			return;
		}

		$span.text('searching...').css('color', '#f77147');

		clearTimeout(window.tripleMapSearchTimeout1);
		window.tripleMapSearchTimeout1 = setTimeout(() => {
			if (map1Triple && map1Triple.loaded()) {
				searchLocation(query, false).then(suggestions => {
					if (suggestions && suggestions.length > 0) {
						showLocationSuggestions(suggestions, inputElement);
						$span.text(`${suggestions.length} locations found`).css('color', '#4CAF50');
					} else {
						$span.text('no locations found').css('color', '#f77147');
					}
				}).catch(error => {
					console.error('Triple map search error:', error);
					$span.text('search error, please try again').css('color', '#f77147');
				});
			} else {
				$span.text('map not ready, please wait').css('color', '#f77147');
			}
		}, 300);
	});

	$('#triple-map-place-2').on('input', function() {
		const query = $(this).val().trim();
		const $input = $(this);
		const inputElement = this;
		const $span = $input.next('span');

		if (query.length < 3) {
			$span.text('minimum 3 characters needed to search').css('color', '#666');
			return;
		}

		$span.text('searching...').css('color', '#f77147');

		clearTimeout(window.tripleMapSearchTimeout2);
		window.tripleMapSearchTimeout2 = setTimeout(() => {
			if (map2Triple && map2Triple.loaded()) {
				searchLocation(query, false).then(suggestions => {
					if (suggestions && suggestions.length > 0) {
						showLocationSuggestions(suggestions, inputElement);
						$span.text(`${suggestions.length} locations found`).css('color', '#4CAF50');
					} else {
						$span.text('no locations found').css('color', '#f77147');
					}
				}).catch(error => {
					console.error('Triple map search error:', error);
					$span.text('search error, please try again').css('color', '#f77147');
				});
			} else {
				$span.text('map not ready, please wait').css('color', '#f77147');
			}
		}, 300);
	});

	$('#triple-map-place-3').on('input', function() {
		const query = $(this).val().trim();
		const $input = $(this);
		const inputElement = this;
		const $span = $input.next('span');

		if (query.length < 3) {
			$span.text('minimum 3 characters needed to search').css('color', '#666');
			return;
		}

		$span.text('searching...').css('color', '#f77147');

		clearTimeout(window.tripleMapSearchTimeout3);
		window.tripleMapSearchTimeout3 = setTimeout(() => {
			if (map3Triple && map3Triple.loaded()) {
				searchLocation(query, false).then(suggestions => {
					if (suggestions && suggestions.length > 0) {
						showLocationSuggestions(suggestions, inputElement);
						$span.text(`${suggestions.length} locations found`).css('color', '#4CAF50');
					} else {
						$span.text('no locations found').css('color', '#f77147');
					}
				}).catch(error => {
					console.error('Triple map search error:', error);
					$span.text('search error, please try again').css('color', '#f77147');
				});
			} else {
				$span.text('map not ready, please wait').css('color', '#f77147');
			}
		}, 300);
	});

	// Double map marker toggle functionality using delegated events
	$(document).on('change', '#double-marker-1', function() {
		const isChecked = $(this).prop('checked');
		const $mapSection = $(this).closest('.map-section');
		const $markerInfo = $mapSection.find('.marker__info').first();
		
		if (isChecked) {
			if (currentMarker1 && map1) {
				currentMarker1.addTo(map1);
			}
			// Show marker info section for first map only
			$markerInfo.slideDown(300);
		} else {
			if (currentMarker1) {
				currentMarker1.remove();
			}
			// Hide marker info section for first map only
			$markerInfo.slideUp(300);
		}
	});

	$(document).on('change', '#double-marker-2', function() {
		const isChecked = $(this).prop('checked');
		const $mapSection = $(this).closest('.map-section');
		const $markerInfo = $mapSection.find('.marker__info').first();
		
		if (isChecked) {
			if (currentMarker2 && map2) {
				currentMarker2.addTo(map2);
			}
			// Show marker info section for second map only
			$markerInfo.slideDown(300);
		} else {
			if (currentMarker2) {
				currentMarker2.remove();
			}
			// Hide marker info section for second map only
			$markerInfo.slideUp(300);
		}
	});

	// Double map marker info toggle (address vs GPS) for map 1
	$('.details__wrapper--double .map-section:first-child .marker__info .btns a').on('click', function(e) {
		e.preventDefault();
		if (!$(this).hasClass('current')) {
			$(this).closest('.btns').find('a').removeClass('current');
			$(this).addClass('current');
			if ($(this).attr('data-id') === 'address-1') {
				$(this).closest('.marker__info').find('.address__info').fadeIn(300);
				$(this).closest('.marker__info').find('.address__geo').css('display', 'none');
			} else if ($(this).attr('data-id') === 'gps-1') {
				$(this).closest('.marker__info').find('.address__info').css('display', 'none');
				$(this).closest('.marker__info').find('.address__geo').fadeIn(300);
			}
		}
	});

	// Double map marker info toggle (address vs GPS) for map 2
	$('.details__wrapper--double .map-section:last-child .marker__info .btns a').on('click', function(e) {
		e.preventDefault();
		if (!$(this).hasClass('current')) {
			$(this).closest('.btns').find('a').removeClass('current');
			$(this).addClass('current');
			if ($(this).attr('data-id') === 'address-2') {
				$(this).closest('.marker__info').find('.address__info').fadeIn(300);
				$(this).closest('.marker__info').find('.address__geo').css('display', 'none');
			} else if ($(this).attr('data-id') === 'gps-2') {
				$(this).closest('.marker__info').find('.address__info').css('display', 'none');
				$(this).closest('.marker__info').find('.address__geo').fadeIn(300);
			}
		}
	});

	// Double map marker address search for map 1
	let doubleMarkerSearchTimeout1;
	$('#double-marker-address-1').on('input', function() {
		const query = $(this).val().trim();
		const $input = $(this);
		const inputElement = this;
		const $span = $input.next('span');

		if (query.length < 3) {
			$span.text('minimum 3 characters needed to search').css('color', '#666');
			const existingSuggestions = document.querySelector('.location-suggestions');
			if (existingSuggestions) existingSuggestions.remove();
			return;
		}

		$span.text('searching...').css('color', '#f77147');

		clearTimeout(doubleMarkerSearchTimeout1);
		doubleMarkerSearchTimeout1 = setTimeout(() => {
			if (map1 && map1.loaded()) {
				searchLocation(query, false).then(suggestions => {
					if (suggestions && suggestions.length > 0) {
						showLocationSuggestions(suggestions, inputElement);
						$span.text(`${suggestions.length} locations found`).css('color', '#4CAF50');
					} else {
						$span.text('no locations found').css('color', '#f77147');
					}
				}).catch(error => {
					console.error('Double marker search error:', error);
					$span.text('search error, please try again').css('color', '#f77147');
				});
			}
		}, 300);
	});

	// Double map marker address search for map 2
	let doubleMarkerSearchTimeout2;
	$('#double-marker-address-2').on('input', function() {
		const query = $(this).val().trim();
		const $input = $(this);
		const inputElement = this;
		const $span = $input.next('span');

		if (query.length < 3) {
			$span.text('minimum 3 characters needed to search').css('color', '#666');
			const existingSuggestions = document.querySelector('.location-suggestions');
			if (existingSuggestions) existingSuggestions.remove();
			return;
		}

		$span.text('searching...').css('color', '#f77147');

		clearTimeout(doubleMarkerSearchTimeout2);
		doubleMarkerSearchTimeout2 = setTimeout(() => {
			if (map2 && map2.loaded()) {
				searchLocation(query, false).then(suggestions => {
					if (suggestions && suggestions.length > 0) {
						showLocationSuggestions(suggestions, inputElement);
						$span.text(`${suggestions.length} locations found`).css('color', '#4CAF50');
					} else {
						$span.text('no locations found').css('color', '#f77147');
					}
				}).catch(error => {
					console.error('Double marker search error:', error);
					$span.text('search error, please try again').css('color', '#f77147');
				});
			}
		}, 300);
	});

	// GPS coordinates input for double map 1
	$('#double-marker-lat-1, #double-marker-lng-1').on('blur change keypress', function(e) {
		if (e.type === 'keypress' && e.which !== 13) return;

		const lat = parseFloat($('#double-marker-lat-1').val());
		const lng = parseFloat($('#double-marker-lng-1').val());

		if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
			if (map1 && map1.loaded()) {
				const coordinates = [lng, lat];
				map1.setCenter(coordinates);
				map1.setZoom(14);

				// Add marker
				if (currentMarker1) currentMarker1.remove();
				currentMarker1 = new mapboxgl.Marker({ color: currentMarkerColor })
					.setLngLat(coordinates)
					.addTo(map1);

				// Update title fields
				$('#double-large-text-1').val(`${lat.toFixed(5)}°N / ${Math.abs(lng).toFixed(5)}°W`);
				$('#double-small-text-1').val(`${lat.toFixed(5)}°N / ${Math.abs(lng).toFixed(5)}°W`);
			}
		}
	});

	// GPS coordinates input for double map 2
	$('#double-marker-lat-2, #double-marker-lng-2').on('blur change keypress', function(e) {
		if (e.type === 'keypress' && e.which !== 13) return;

		const lat = parseFloat($('#double-marker-lat-2').val());
		const lng = parseFloat($('#double-marker-lng-2').val());

		if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
			if (map2 && map2.loaded()) {
				const coordinates = [lng, lat];
				map2.setCenter(coordinates);
				map2.setZoom(14);

				// Add marker
				if (currentMarker2) currentMarker2.remove();
				currentMarker2 = new mapboxgl.Marker({ color: currentMarkerColor })
					.setLngLat(coordinates)
					.addTo(map2);

				// Update title fields
				$('#double-large-text-2').val(`${lat.toFixed(5)}°N / ${Math.abs(lng).toFixed(5)}°W`);
				$('#double-small-text-2').val(`${lat.toFixed(5)}°N / ${Math.abs(lng).toFixed(5)}°W`);
			}
		}
	});

	// Double map title toggle functionality
	$(document).on('change', '#double-title-1', function() {
		const isChecked = $(this).prop('checked');
		const $mapSection = $(this).closest('.map-section');
		const $content = $mapSection.find('.map__title .content').first();
		
		if (isChecked) {
			$content.slideDown(300);
			// Show map labels
			$('.double-map-container .map-wrapper').eq(0).find('.map-label').show();
		} else {
			$content.slideUp(300);
			// Hide map labels
			$('.double-map-container .map-wrapper').eq(0).find('.map-label').hide();
		}
	});

	$(document).on('change', '#double-title-2', function() {
		const isChecked = $(this).prop('checked');
		const $mapSection = $(this).closest('.map-section');
		const $content = $mapSection.find('.map__title .content').first();
		
		if (isChecked) {
			$content.slideDown(300);
			// Show map labels
			$('.double-map-container .map-wrapper').eq(1).find('.map-label').show();
		} else {
			$content.slideUp(300);
			// Hide map labels
			$('.double-map-container .map-wrapper').eq(1).find('.map-label').hide();
		}
	});

	// Double map title text input handlers
	$('#double-large-text-1, #double-small-text-1').on('input', function() {
		const largeText = $('#double-large-text-1').val() || 'Sophia';
		const smallText = $('#double-small-text-1').val() || 'small text, map 1';
		$('.double-map-container .map-wrapper:first .map-label h3').text(largeText);
		$('.double-map-container .map-wrapper:first .map-label p').text(smallText);
	});

	$('#double-large-text-2, #double-small-text-2').on('input', function() {
		const largeText = $('#double-large-text-2').val() || 'Michael';
		const smallText = $('#double-small-text-2').val() || 'small text, map 2';
		$('.double-map-container .map-wrapper:last .map-label h3').text(largeText);
		$('.double-map-container .map-wrapper:last .map-label p').text(smallText);
	});

	// Font picker functionality
	$('.font__picker .font-options li a').on('click', function(e) {
		e.preventDefault();
		console.log('Font picker clicked!');

		// Remove current class from all font options
		$('.font__picker .font-options li a').removeClass('current');
		$(this).addClass('current');

		// Get selected font
		const selectedFont = $(this).attr('data-font');
		console.log('Selected font:', selectedFont);

		// Save current font globally
		currentFont = selectedFont;

		// Apply font to all text elements in the map preview areas
		applyFontToAllLayouts(selectedFont);
	});

	// Function to apply font to all layouts
	function applyFontToAllLayouts(fontFamily) {
		// For serif fonts
		const isSerif = fontFamily === 'Playfair Display';
		// For cursive fonts
		const isCursive = fontFamily === 'Dancing Script' || fontFamily === 'Pacifico' ||
		                  fontFamily === 'Great Vibes' || fontFamily === 'Sacramento' ||
		                  fontFamily === 'Allura' || fontFamily === 'Satisfy' ||
		                  fontFamily === 'Amatic SC' || fontFamily === 'Permanent Marker' ||
		                  fontFamily === 'Caveat' || fontFamily === 'Indie Flower';
		// For display fonts
		const isDisplay = fontFamily === 'Bebas Neue' || fontFamily === 'Lobster' ||
		                  fontFamily === 'Righteous';

		let fontStyle;
		if (isSerif) {
			fontStyle = `"${fontFamily}", serif`;
		} else if (isCursive) {
			fontStyle = `"${fontFamily}", cursive`;
		} else if (isDisplay) {
			fontStyle = `"${fontFamily}", cursive`; // Display fonts use cursive fallback
		} else {
			fontStyle = `"${fontFamily}", sans-serif`;
		}

		console.log('Applying font:', fontStyle);

		// Apply to single map layout - target all title elements
		$('.map-preview-title h3, .map-preview-title p, #preview-title, #preview-subtitle').each(function() {
			$(this).css('font-family', fontStyle);
			console.log('Applied to:', this, 'Font:', $(this).css('font-family'));
		});

		// Apply to double map layout
		$('.double-map-title h2').css('font-family', fontStyle);
		$('.double-map-container .map-label h3, .double-map-container .map-label p').css('font-family', fontStyle);

		// Apply to triple map layout
		$('.triple-map-title h2').css('font-family', fontStyle);
		$('.triple-map-container .map-label h3, .triple-map-container .map-label p').css('font-family', fontStyle);

		console.log('Font changed to:', fontFamily);
	}
});