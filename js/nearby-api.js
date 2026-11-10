// nearby-api.js - Fetches nearby amenities using Overpass API (OpenStreetMap)

const NearbyAPI = {
    // We can reuse WeatherAPI.getCoordinates if available
    async getCoordinates(locationStr) {
        if (window.WeatherAPI && window.WeatherAPI.cache[locationStr]) {
            return window.WeatherAPI.cache[locationStr];
        }
        try {
            const query = locationStr.includes('India') ? locationStr : `${locationStr}, India`;
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await res.json();
            
            if (data && data.length > 0) {
                return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
            }
        } catch (error) {
            console.error("Geocoding failed:", error);
        }
        return null;
    },

    async fetchNearbyPlaces(locationStr, type) {
        const coords = await this.getCoordinates(locationStr);
        if (!coords) return [];

        let queryTags = '';
        if (type === 'transit') queryTags = '["highway"="bus_stop"]'; // Basic bus stops
        if (type === 'hospital') queryTags = '["amenity"="hospital"]';
        if (type === 'hotel') queryTags = '["tourism"="hotel"]';
        if (type === 'airport') queryTags = '["aeroway"="aerodrome"]';

        // Expanding search radius based on type
        const radius = type === 'airport' ? 50000 : 5000; // 50km for airports, 5km for others

        // Overpass QL Query
        const query = `
            [out:json][timeout:10];
            node(around:${radius},${coords.lat},${coords.lon})${queryTags};
            out 5;
        `;

        try {
            const res = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query
            });
            const data = await res.json();
            
            if (data && data.elements) {
                return data.elements.map(el => ({
                    name: el.tags && el.tags.name ? el.tags.name : `Unnamed ${type}`,
                    lat: el.lat,
                    lon: el.lon,
                    distance: this.calculateDistance(coords.lat, coords.lon, el.lat, el.lon)
                })).sort((a, b) => a.distance - b.distance);
            }
        } catch (error) {
            console.error("Overpass API failed:", error);
        }
        return [];
    },

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return (R * c).toFixed(1);
    },

    renderNearbyList(containerId, places, typeIcon) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!places || places.length === 0) {
            container.innerHTML = `<p style="color: var(--color-neutral-500);"><i class="fa-solid fa-circle-exclamation"></i> No locations found within range.</p>`;
            return;
        }

        let html = '';
        places.forEach(p => {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-3); border: 1px solid var(--color-neutral-200); border-radius: var(--radius-sm); margin-bottom: var(--space-2); background: var(--color-white);">
                    <div style="display: flex; align-items: center; gap: var(--space-3);">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary-50); color: var(--color-primary-600); display: flex; align-items: center; justify-content: center;">
                            <i class="fa-solid ${typeIcon}"></i>
                        </div>
                        <span style="font-weight: 500;">${p.name}</span>
                    </div>
                    <span style="color: var(--color-neutral-500); font-size: var(--text-sm);">${p.distance} km</span>
                </div>
            `;
        });
        container.innerHTML = html;
    }
};

window.NearbyAPI = NearbyAPI;
