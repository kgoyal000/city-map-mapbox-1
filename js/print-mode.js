// Print Mode Handler for High-Quality Poster Generation
// This file handles the print mode when accessed via query parameters

(function() {
//     // Check if we're in print mode
//     const urlParams = new URLSearchParams(window.location.search);
//     const isPrintMode = urlParams.get('print') === 'true';
//     const configData = urlParams.get('config');
//     const printDPI = parseInt(urlParams.get('dpi') || '300');
//     const printWidth = parseInt(urlParams.get('width') || '3937');
//     const printHeight = parseInt(urlParams.get('height') || '5511');

//     if (!isPrintMode || !configData) return;

//     console.log('Print mode activated:', printWidth + 'x' + printHeight + ' at ' + printDPI + ' DPI');

//     // Parse configuration from base64
//     let config;
//     try {
//         config = JSON.parse(atob(configData));
//     } catch (error) {
//         console.error('Failed to parse print configuration:', error);
//         return;
//     }

//     // Override the resizeFrame function to use print dimensions
//     window.resizeFrame = function() {
//         console.log('Print mode resize blocked - maintaining:', printWidth + 'x' + printHeight);

//         const mapEl = document.getElementById('map');
//         if (mapEl) {
//             // Always force map to use print dimensions with !important
//             mapEl.style.cssText = `
//                 width: ${printWidth}px !important;
//                 height: ${printHeight}px !important;
//                 max-width: none !important;
//                 position: absolute !important;
//                 top: 0 !important;
//                 left: 0 !important;
//                 display: block !important;
//                 visibility: visible !important;
//             `;
//         }

//         // Force map resize if it exists
//         if (window.map && typeof window.map.resize === 'function') {
//             window.map.resize();
//         }
//     };

//     // Store the target zoom level globally
//     let targetZoom = null;
//     let targetCenter = null;

//     // Continuously enforce print dimensions and zoom (prevent any changes)
//     setInterval(() => {
//         const mapEl = document.getElementById('map');
//         if (mapEl) {
//             const currentWidth = parseInt(mapEl.style.width);
//             const currentHeight = parseInt(mapEl.style.height);

//             if (currentWidth !== printWidth || currentHeight !== printHeight) {
//                 console.log('Dimension change detected, forcing back to print size');
//                 mapEl.style.cssText = `
//                     width: ${printWidth}px !important;
//                     height: ${printHeight}px !important;
//                     max-width: none !important;
//                     position: absolute !important;
//                     top: 0 !important;
//                     left: 0 !important;
//                     display: block !important;
//                     visibility: visible !important;
//                 `;

//                 const mapInstance = window.map;
//                 if (mapInstance && typeof mapInstance.resize === 'function') {
//                     mapInstance.resize();

//                     // Also restore zoom and center if we have them
//                     if (targetZoom !== null && targetCenter !== null) {
//                         setTimeout(() => {
//                             mapInstance.jumpTo({
//                                 center: targetCenter,
//                                 zoom: targetZoom,
//                                 duration: 0
//                             });
//                         }, 100);
//                     }
//                 }
//             }
//         }
//     }, 500);

//     // Initialize print mode when DOM is ready
//     document.addEventListener('DOMContentLoaded', function() {
//         console.log('Print mode DOM ready - configuring for print...');

//         // Hide all UI elements
//         const elementsToHide = [
//             '.details__body',
//             '.sidebar',
//             '.controls',
//             '.navbar',
//             '.marker-instruction',
//             '.map-preview-title',
//             '.poster-title',
//             '.shape-overlay',
//             '.photo-preview'
//         ];

//         elementsToHide.forEach(selector => {
//             document.querySelectorAll(selector).forEach(el => {
//                 el.style.display = 'none';
//             });
//         });

//         // Set body dimensions for print
//         document.body.style.width = printWidth + 'px';
//         document.body.style.height = printHeight + 'px';
//         document.body.style.margin = '0';
//         document.body.style.padding = '0';
//         document.body.style.overflow = 'hidden';
//         document.body.style.background = '#fff';
//         document.body.classList.add('print-mode');

//         // Force map container to print dimensions
//         const mapContainer = document.querySelector('.canvas__wrapper');
//         if (mapContainer) {
//             mapContainer.style.cssText = `
//                 width: ${printWidth}px !important;
//                 height: ${printHeight}px !important;
//                 max-width: none !important;
//                 position: absolute !important;
//                 top: 0 !important;
//                 left: 0 !important;
//                 display: block !important;
//                 visibility: visible !important;
//                 margin: 0 !important;
//                 padding: 0 !important;
//             `;
//         }

//         // Set high DPI for better print quality
//         if (window.devicePixelRatio !== (printDPI / 96)) {
//             window.devicePixelRatio = printDPI / 96;
//             console.log('Set device pixel ratio to:', window.devicePixelRatio);
//         }

//         // Function to check for map initialization and apply config
//         let mapCheckCount = 0;
//         const maxMapChecks = 40; // Max 20 seconds (40 * 500ms)
//         let configApplied = false;

//         const applyMapConfig = () => {
//             if (configApplied) {
//                 return; // Already applied, don't run again
//             }

//             mapCheckCount++;

//             // Check different possible map variables that might be initialized
//             const mapInstance = window.map || window.mapboxMap ||
//                                (document.getElementById('map') && document.getElementById('map')._mapboxMap);

//             if (!mapInstance) {
//                 console.log(`[${mapCheckCount}/${maxMapChecks}] Waiting for map to initialize...`);
//                 if (mapCheckCount < maxMapChecks) {
//                     setTimeout(applyMapConfig, 500);
//                 } else {
//                     console.error('Map failed to initialize after 20 seconds');
//                 }
//                 return;
//             }

//             // Skip the loaded check - just apply config as soon as map exists
//             console.log('Map found, applying print configuration...');
//             configApplied = true; // Mark as applied to prevent re-running

//             // Store reference globally if needed
//             if (!window.map) {
//                 window.map = mapInstance;
//             }

//             console.log('Map found! Applying configuration for print...');
//             const mapConfig = config.maps[0];

//             try {
//                 // Apply style first if specified
//                 if (config.style) {
//                     console.log('Setting map style:', config.style);
//                     mapInstance.setStyle(config.style);
//                 }

//                 // Force the exact center and zoom - use jumpTo for immediate positioning
//                 // Adjust zoom for print resolution (higher res needs slightly more zoom)
//                 const zoomAdjustment = 1.5; // Small adjustment for print clarity
//                 const adjustedZoom = mapConfig.zoom + zoomAdjustment;

//                 // Store target values globally to maintain them
//                 targetZoom = adjustedZoom;
//                 targetCenter = mapConfig.center;

//                 console.log('Setting map view - Center:', mapConfig.center, 'Original Zoom:', mapConfig.zoom, 'Adjusted Zoom:', adjustedZoom);

//                 // Use jumpTo for immediate positioning without animation
//                 mapInstance.jumpTo({
//                     center: mapConfig.center,
//                     zoom: adjustedZoom,
//                     bearing: mapConfig.bearing || 0,
//                     pitch: mapConfig.pitch || 0
//                 });

//                 // Double-check the position was set correctly
//                 setTimeout(() => {
//                     const currentCenter = mapInstance.getCenter();
//                     const currentZoom = mapInstance.getZoom();
//                     console.log('Current map position - Center:', [currentCenter.lng, currentCenter.lat], 'Zoom:', currentZoom);

//                     // If it's still wrong, force it again
//                     if (Math.abs(currentZoom - adjustedZoom) > 0.1) {
//                         console.log('Zoom mismatch detected, forcing correct zoom...');
//                         mapInstance.setZoom(adjustedZoom);
//                     }
//                     if (Math.abs(currentCenter.lng - mapConfig.center[0]) > 0.001 ||
//                         Math.abs(currentCenter.lat - mapConfig.center[1]) > 0.001) {
//                         console.log('Center mismatch detected, forcing correct position...');
//                         mapInstance.setCenter(mapConfig.center);
//                     }
//                 }, 500);
//             } catch (error) {
//                 console.error('Error applying map configuration:', error);
//                 return;
//             }

//             // Wait for style to load then add markers and title
//             const onStyleLoad = () => {
//                 console.log('Map style loaded - reapplying position and adding markers...');

//                 // Reapply position after style load (style changes can reset position)
//                 // Use the same adjusted zoom as before
//                 const zoomAdjustment = 1.5;
//                 const adjustedZoom = mapConfig.zoom + zoomAdjustment;

//                 mapInstance.jumpTo({
//                     center: mapConfig.center,
//                     zoom: adjustedZoom,
//                     bearing: mapConfig.bearing || 0,
//                     pitch: mapConfig.pitch || 0
//                 });

//                 // Add markers
//                 if (mapConfig.markers && mapConfig.markers.length > 0) {
//                     mapConfig.markers.forEach(marker => {
//                         const el = document.createElement('div');
//                         el.style.width = '40px';
//                         el.style.height = '40px';
//                         el.style.display = 'flex';
//                         el.style.alignItems = 'center';
//                         el.style.justifyContent = 'center';

//                         // Add heart icon if specified
//                         if (marker.icon === 'heart') {
//                             el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="35.908" height="32.946" viewBox="0 0 35.908 32.946">
//                                 <path fill="${marker.color || '#1B1B1B'}" d="M19.954,35.946l-2.6-2.37C8.1,25.191,2,19.661,2,12.875A9.779,9.779,0,0,1,11.875,3a10.752,10.752,0,0,1,8.079,3.752A10.752,10.752,0,0,1,28.033,3a9.779,9.779,0,0,1,9.875,9.875c0,6.787-6.1,12.316-15.351,20.719Z" transform="translate(-2 -3)"/>
//                             </svg>`;
//                         } else if (marker.icon === 'star') {
//                             el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="35.908" height="34.253" viewBox="0 0 35.908 34.253">
//                                 <path fill="${marker.color || '#1B1B1B'}" d="M20,30.776,8.783,36.65l2.146-12.515L1.858,15.277l12.568-1.826L20,2.4l5.576,11.05,12.568,1.826L29.07,24.135,31.217,36.65Z" transform="translate(-1.858 -2.396)"/>
//                             </svg>`;
//                         } else if (marker.icon === 'house') {
//                             el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="35.908" height="30.522" viewBox="0 0 35.908 30.522">
//                                 <path fill="${marker.color || '#1B1B1B'}" d="M30.5,18.1v13.1h-8.9v-9.3h-7.4v9.3H5.4V18.1L18,6.1L30.5,18.1z M18,3.9l-15,14.3c-1.6,1.6-4-0.9-2.4-2.5L16.8,0.5c0.7-0.6,1.7-0.6,2.4,0l7.6,7.2V4.3c0-0.4,0.4-0.8,0.8-0.8h2.2c0.4,0,0.8,0.4,0.8,0.8v6.9l4.8,4.5c1.7,1.6-0.7,4.1-2.4,2.5C28,13.4,23,8.7,18,3.9L18,3.9z"/>
//                             </svg>`;
//                         } else if (marker.icon === 'pin') {
//                             el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="26.932" height="35.908" viewBox="0 0 26.932 35.908">
//                                 <path fill="${marker.color || '#1B1B1B'}" d="M15.466,2A13.459,13.459,0,0,0,2,15.466c0,10.1,13.466,22.443,13.466,22.443S28.932,25.565,28.932,15.466A13.459,13.459,0,0,0,15.466,2Zm0,18.272a4.806,4.806,0,1,1,4.806-4.806A4.809,4.809,0,0,1,15.466,20.272Z" transform="translate(-2 -2)"/>
//                             </svg>`;
//                         } else {
//                             // Default circle marker
//                             el.style.width = '20px';
//                             el.style.height = '20px';
//                             el.style.backgroundColor = marker.color || '#1B1B1B';
//                             el.style.borderRadius = '50%';
//                         }

//                         new mapboxgl.Marker(el)
//                             .setLngLat(marker.coordinates)
//                             .addTo(mapInstance);
//                     });
//                 }

//                 // Add title overlay if enabled
//                 if (mapConfig.title && mapConfig.title.enabled) {
//                     const titleDiv = document.createElement('div');
//                     titleDiv.style.cssText = `
//                         position: absolute;
//                         bottom: 80px;
//                         left: 50%;
//                         transform: translateX(-50%);
//                         text-align: center;
//                         z-index: 1000;
//                         font-family: ${mapConfig.title.font || 'Montserrat'}, sans-serif;
//                         color: #1B1B1B;
//                     `;

//                     const largeText = document.createElement('div');
//                     largeText.textContent = mapConfig.title.largeText || '';
//                     largeText.style.cssText = `
//                         font-size: 72px;
//                         font-weight: 700;
//                         letter-spacing: 3px;
//                         text-transform: uppercase;
//                         margin-bottom: 12px;
//                     `;

//                     const smallText = document.createElement('div');
//                     smallText.textContent = mapConfig.title.smallText || '';
//                     smallText.style.cssText = `
//                         font-size: 36px;
//                         font-weight: 400;
//                         letter-spacing: 2px;
//                     `;

//                     titleDiv.appendChild(largeText);
//                     titleDiv.appendChild(smallText);
//                     document.body.appendChild(titleDiv);
//                 }

//                 // Force final resize to ensure correct dimensions
//                 window.resizeFrame();

//                 // Signal that map is ready for screenshot
//                 setTimeout(() => {
//                     window.mapRenderComplete = true;
//                     console.log('Map ready for print screenshot!');
//                 }, 3000);
//             };

//             // Handle style load event
//             if (mapInstance.isStyleLoaded && mapInstance.isStyleLoaded()) {
//                 onStyleLoad();
//             } else {
//                 mapInstance.on('style.load', onStyleLoad);
//             }
//         };

//         // Start configuration after a short delay
//         setTimeout(applyMapConfig, 1000);
//     });
// })();