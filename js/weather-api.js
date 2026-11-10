// weather-api.js - Fetches real-time weather data using Open-Meteo & Nominatim

const WeatherAPI = {
    cache: {},

    async getCoordinates(locationStr) {
        if (this.cache[locationStr]) return this.cache[locationStr];
        try {
            // Add "India" to ensure better accuracy for Tamil Nadu cities
            const query = locationStr.includes('India') ? locationStr : `${locationStr}, India`;
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await res.json();
            
            if (data && data.length > 0) {
                const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
                this.cache[locationStr] = coords;
                return coords;
            }
        } catch (error) {
            console.error("Geocoding failed:", error);
        }
        return null; // Fallback
    },

    getWeatherIconAndText(code) {
        // WMO Weather interpretation codes
        if (code === 0) return { text: "Clear Sky", icon: "fa-sun" };
        if (code === 1 || code === 2 || code === 3) return { text: "Partly Cloudy", icon: "fa-cloud-sun" };
        if (code === 45 || code === 48) return { text: "Fog", icon: "fa-smog" };
        if (code >= 51 && code <= 67) return { text: "Rain", icon: "fa-cloud-rain" };
        if (code >= 71 && code <= 77) return { text: "Snow", icon: "fa-snowflake" };
        if (code >= 80 && code <= 82) return { text: "Showers", icon: "fa-cloud-showers-heavy" };
        if (code >= 95 && code <= 99) return { text: "Thunderstorm", icon: "fa-cloud-bolt" };
        return { text: "Unknown", icon: "fa-cloud" };
    },

    async fetchCampusWeather(locationStr) {
        const coords = await this.getCoordinates(locationStr);
        if (!coords) return null;

        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`);
            const data = await res.json();

            if (data && data.current) {
                const wInfo = this.getWeatherIconAndText(data.current.weather_code);
                return {
                    temp: Math.round(data.current.temperature_2m),
                    humidity: Math.round(data.current.relative_humidity_2m),
                    wind: Math.round(data.current.wind_speed_10m),
                    condition: wInfo.text,
                    icon: wInfo.icon
                };
            }
        } catch (error) {
            console.error("Weather fetch failed:", error);
        }
        return null;
    },

    renderWeatherWidget(containerId, weatherData) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (!weatherData) {
            container.innerHTML = `<div style="grid-column: 1/-1; color: var(--color-neutral-500); padding: 10px;">Weather data unavailable.</div>`;
            return;
        }

        container.innerHTML = `
            <div style="background: var(--color-white); padding: var(--space-3); border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
                <i class="fa-solid ${weatherData.icon}" style="font-size: var(--text-2xl); color: var(--color-primary-500); margin-bottom: var(--space-2);"></i>
                <div style="font-weight: 600;">${weatherData.temp}°C</div>
                <div style="font-size: var(--text-xs); color: var(--color-neutral-500);">${weatherData.condition}</div>
            </div>
            <div style="background: var(--color-white); padding: var(--space-3); border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
                <i class="fa-solid fa-droplet" style="font-size: var(--text-2xl); color: var(--color-blue-500); margin-bottom: var(--space-2);"></i>
                <div style="font-weight: 600;">${weatherData.humidity}%</div>
                <div style="font-size: var(--text-xs); color: var(--color-neutral-500);">Humidity</div>
            </div>
            <div style="background: var(--color-white); padding: var(--space-3); border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
                <i class="fa-solid fa-wind" style="font-size: var(--text-2xl); color: var(--color-neutral-500); margin-bottom: var(--space-2);"></i>
                <div style="font-weight: 600;">${weatherData.wind} km/h</div>
                <div style="font-size: var(--text-xs); color: var(--color-neutral-500);">Wind</div>
            </div>
        `;
    }
};

window.WeatherAPI = WeatherAPI;
