// routing.js - Handles real route planning and POI fetching

let routingControl = null;
let poiMarkers = L.layerGroup();
const poiCache = {}; // Cache to prevent duplicate API calls

let routeTarget = null; // {name, lat, lng}

function openRouteModal(name, lat, lng) {
    if (name && lat && lng) {
        routeTarget = {name, lat, lng};
    } else {
        // Fallback for the button inside the campus layers panel
        if (!window.currentCampus || !CAMPUS_LAYOUTS[window.currentCampus]) {
            if (typeof showToast === 'function') showToast("Please select a destination first!", "error");
            return;
        }
        routeTarget = {
            name: window.currentCampus,
            lat: CAMPUS_LAYOUTS[window.currentCampus].center[0],
            lng: CAMPUS_LAYOUTS[window.currentCampus].center[1]
        };
    }
    // Reset modal state
    document.getElementById('route-results').innerHTML = '';
    document.getElementById('route-modal').showModal();
}

// Clear the route from the map
window.clearRoute = function() {
    if (routingControl) {
        window.appMap.removeControl(routingControl);
        routingControl = null;
    }
    poiMarkers.clearLayers();
    document.getElementById('route-info-panel').style.display = 'none';
    document.getElementById('route-results').innerHTML = '';
};

function calculateRoute() {
    const resultsDiv = document.getElementById('route-results');
    
    if (!window.appMap || !routeTarget) {
        resultsDiv.innerHTML = 'Error: No destination selected. Please select a campus first.';
        return;
    }

    if (!window.appUserLocation && navigator.geolocation) {
        resultsDiv.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Asking for your location...';
        navigator.geolocation.getCurrentPosition(
            pos => {
                window.appUserLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                // Call again with location
                calculateRoute();
            },
            err => {
                console.warn("Geolocation error:", err);
                if (typeof showToast === 'function') showToast("Could not get your location. Using default map center.", "error");
                window.appUserLocation = { lat: 11.1271, lng: 78.6569 }; // Fallback
                calculateRoute();
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
        return;
    }

    resultsDiv.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Calculating optimal route...';

    // Default to TN center if no GPS (fallback if navigator.geolocation is missing)
    let uLat = window.appUserLocation ? window.appUserLocation.lat : 11.1271;
    let uLng = window.appUserLocation ? window.appUserLocation.lng : 78.6569;
    
    const targetLat = routeTarget.lat;
    const targetLng = routeTarget.lng;
    const campusName = routeTarget.name;

    if (routingControl) {
        window.appMap.removeControl(routingControl);
    }
    
    // Clear previous POIs
    poiMarkers.clearLayers();
    window.appMap.addLayer(poiMarkers);

    // 1. Draw Route using Leaflet Routing Machine
    routingControl = L.Routing.control({
        plan: L.Routing.plan([
            L.latLng(uLat, uLng),
            L.latLng(targetLat, targetLng)
        ], {
            createMarker: function(i, waypoint, n) {
                return null; // Prevents the default duplicate pins from drawing!
            }
        }),
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        lineOptions: {
            styles: [{color: 'red', opacity: 0.8, weight: 5}]
        }
    }).on('routesfound', function(e) {
        const routes = e.routes;
        const summary = routes[0].summary;
        const routeCoords = routes[0].coordinates;
        
        // Draw dashed connecting lines to bridge the gap between drivable roads and exact pin locations
        if (routeCoords && routeCoords.length > 0) {
            const firstPoint = routeCoords[0];
            const lastPoint = routeCoords[routeCoords.length - 1];
            
            // Connect User Location to start of road route
            poiMarkers.addLayer(L.polyline([[uLat, uLng], firstPoint], {
                color: 'red', weight: 3, dashArray: '8, 8', opacity: 0.7
            }));
            
            // Connect end of road route to Destination Pin
            poiMarkers.addLayer(L.polyline([lastPoint, [targetLat, targetLng]], {
                color: 'red', weight: 3, dashArray: '8, 8', opacity: 0.7
            }));
        }
        
        // distance is in meters, time in seconds
        const distanceKm = (summary.totalDistance / 1000).toFixed(1);
        const timeMins = Math.round(summary.totalTime / 60);
        
        // Hide the original modal immediately!
        document.getElementById('route-modal').close();
        
        // Show the new floating panel on the map
        const infoPanel = document.getElementById('route-info-panel');
        infoPanel.style.display = 'block';
        infoPanel.style.opacity = '1';
        
        const infoContent = document.getElementById('route-info-content');
        infoContent.innerHTML = `
            <div style="padding-bottom: 8px;">
                <strong><i class="fa-solid fa-clock"></i> Travel Time:</strong> ${timeMins} mins<br>
                <strong><i class="fa-solid fa-route"></i> Distance:</strong> ${distanceKm} km
            </div>
        `;
        
        if (!window.appUserLocation) {
            infoContent.innerHTML += '<div style="color:var(--color-primary-600); font-size: 12px; margin-top: 4px;"><i class="fa-solid fa-circle-info"></i> Using default map center.</div>';
        }
        
        // 2. Fetch POIs using Overpass API
        fetchNearbyPOIs(targetLat, targetLng, campusName);
        
    }).addTo(window.appMap);
}

function fetchNearbyPOIs(lat, lng, campusName) {
    const infoContent = document.getElementById('route-info-content');
    infoContent.innerHTML += '<div id="poi-loading" style="margin-top: 8px;"><i class="fa fa-spinner fa-spin"></i> Fetching nearby amenities...</div>';
    
    // Radius in meters
    const radius = 2000; 
    
    // Overpass QL query: Look for railway stations, bus stations, hospitals, and hotels near campus
    const query = `
        [out:json][timeout:15];
        (
          node["public_transport"="station"](around:${radius},${lat},${lng});
          node["amenity"="hospital"](around:${radius},${lat},${lng});
          node["tourism"="hotel"](around:${radius},${lat},${lng});
        );
        out body;
        >;
        out skel qt;
    `;
    
    const cacheKey = `${lat},${lng}`;
    
    // Check if we already fetched POIs for this campus
    if (poiCache[cacheKey]) {
        renderPOIs(poiCache[cacheKey]);
        return;
    }
    
    fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'data=' + encodeURIComponent(query)
    })
    .then(res => res.json())
    .then(data => {
        // Save to cache
        poiCache[cacheKey] = data;
        renderPOIs(data);
    })
    .catch(err => {
        console.error(err);
        const loadingDiv = document.getElementById('poi-loading');
        if (loadingDiv) loadingDiv.innerHTML = '<em style="color:red;">Failed to load amenities.</em>';
    });
}

function renderPOIs(data) {
        let hospitals = 0, hotels = 0, stations = 0;
        
        data.elements.forEach(el => {
            if (el.type === 'node') {
                const isHospital = el.tags && el.tags.amenity === 'hospital';
                const isHotel = el.tags && el.tags.tourism === 'hotel';
                const isStation = el.tags && el.tags.public_transport === 'station';
                
                let color = 'gray';
                let typeName = 'POI';
                
                if (isHospital) { hospitals++; }
                else if (isHotel) { hotels++; }
                else if (isStation) { stations++; }
                // FIX: Removed L.circleMarker creation \u2014 markers were never rendered (addLayer was commented out)
                // Amenity counts are still collected and displayed in the modal summary below
            }
        });
        
        const summaryHtml = `
            <div style="margin-top: 8px; border-top: 1px solid var(--color-neutral-200); padding-top: 8px;">
                <div style="font-weight: 600; margin-bottom: 4px;">Amenities (2km Radius)</div>
                <div style="display: flex; gap: 12px; font-size: 12px;">
                    <span><i class="fa-solid fa-hospital" style="color:red;"></i> ${hospitals}</span>
                    <span><i class="fa-solid fa-bed" style="color:blue;"></i> ${hotels}</span>
                    <span><i class="fa-solid fa-train" style="color:purple;"></i> ${stations}</span>
                </div>
            </div>
        `;
        
        const loadingDiv = document.getElementById('poi-loading');
        if (loadingDiv) {
            loadingDiv.outerHTML = summaryHtml;
        } else {
            document.getElementById('route-info-content').innerHTML += summaryHtml;
        }
}
