// map.js - Map explorer logic using Leaflet.js

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map');
    
    if (typeof L === 'undefined') {
        mapContainer.innerHTML = `
            <div class="map-fallback">
                <div class="map-fallback-content">
                    <i class="fa-regular fa-map" style="font-size: var(--text-5xl); color: var(--color-primary-500); margin-bottom: var(--space-4);"></i>
                    <h2 style="font-size: var(--text-2xl); margin-bottom: var(--space-2);">Interactive Map</h2>
                    <p style="color: var(--color-neutral-600); margin-bottom: var(--space-6);">Map failed to load. Please check your internet connection.</p>
                    <button class="btn btn-primary" onclick="window.location.href='search.html'">Browse Directory Instead</button>
                </div>
            </div>
        `;
        return;
    }

    if (typeof fetchUniversities !== 'function') {
        console.error("fetchUniversities not loaded!");
        return;
    }
    const data = await fetchUniversities();

    // Map Initialization
    const mapOverlay = document.getElementById('mapOverlay');
    if (mapOverlay) mapOverlay.style.display = 'block';

    const map = L.map(mapContainer, { zoomControl: false }).setView([11.1271, 78.6569], 7); // Tamil Nadu center
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    window.appMap = map; // Expose globally for routing and layers

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const markers = [];

    // FIX: Expanded city coordinates covering all TN districts in the dataset
    const cityCoordinates = {
        "Chennai":           { lat: 13.0827, lng: 80.2707 },
        "Coimbatore":        { lat: 11.0168, lng: 76.9558 },
        "Madurai":           { lat:  9.9252, lng: 78.1198 },
        "Tiruchirappalli":   { lat: 10.7905, lng: 78.7047 },
        "Salem":             { lat: 11.6643, lng: 78.1460 },
        "Vellore":           { lat: 12.9165, lng: 79.1325 },
        "Thanjavur":         { lat: 10.7870, lng: 79.1378 },
        "Chidambaram":       { lat: 11.3980, lng: 79.6954 },
        "Karaikudi":         { lat: 10.0735, lng: 78.7732 },
        "Kanchipuram":       { lat: 12.8342, lng: 79.7036 },
        "Tiruvarur":         { lat: 10.7704, lng: 79.6367 },
        "Cuddalore":         { lat: 11.7480, lng: 79.7714 },
        "Tirunelveli":       { lat:  8.7139, lng: 77.7567 },
        "Nagapattinam":      { lat: 10.7672, lng: 79.8449 },
        "Dindigul":          { lat: 10.3624, lng: 77.9695 },
        "Kanyakumari":       { lat:  8.0883, lng: 77.5385 },
        "Kodaikanal":        { lat: 10.2381, lng: 77.4892 },
        "Srivilliputhur":    { lat:  9.5093, lng: 77.6314 },
        "Erode":             { lat: 11.3410, lng: 77.7172 },
        "Siruseri":          { lat: 12.8376, lng: 80.2233 },
        "Kelambakkam":       { lat: 12.7850, lng: 80.2205 },
        "Villupuram":        { lat: 11.9399, lng: 79.4929 },
        "Thoothukudi":       { lat:  8.7642, lng: 78.1348 }
    };

    // FIX: Deterministic jitter so stacked same-city pins spread out visually.
    // Uses uni.id as seed for stable positions across reloads.
    function jitterCoords(lat, lng, seed) {
        const maxOffset = 0.018; // ~2km radius spread
        // Pseudo-random but stable: sin/cos of seed gives a fixed direction
        const angle = (seed * 137.508) % 360; // golden-angle distribution
        const radius = ((seed % 7) + 1) / 7 * maxOffset;
        const radAngle = (angle * Math.PI) / 180;
        return {
            lat: lat + radius * Math.cos(radAngle),
            lng: lng + radius * Math.sin(radAngle)
        };
    }

    function getTNAUMarkerIcon(category) {
        let color = '#166534'; // Constituent Emerald
        let iconClass = 'fa-building-columns';
        
        if (category === 'Affiliated Colleges') {
            color = '#2563eb';
            iconClass = 'fa-graduation-cap';
        } else if (category === 'Research Stations') {
            color = '#ea580c';
            iconClass = 'fa-flask-vial';
        } else if (category === 'Krishi Vigyan Kendras (KVKs)') {
            color = '#7c3aed';
            iconClass = 'fa-seedling';
        }
        
        return L.divIcon({
            className: 'custom-tnau-pin',
            html: `
                <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2px solid #ffffff;">
                    <i class="fa-solid ${iconClass}" style="transform: rotate(45deg); color: #ffffff; font-size: 13px;"></i>
                </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
    }

    data.forEach((uni) => {
        // Resolve coordinates: uni.lat/lng first, fallback to coordinates/smartData or city
        let coords = null;
        if (typeof uni.lat === 'number' && typeof uni.lng === 'number') {
            coords = { lat: uni.lat, lng: uni.lng };
        } else if (uni.coordinates && typeof uni.coordinates.lat === 'number' && typeof uni.coordinates.lng === 'number') {
            coords = { lat: uni.coordinates.lat, lng: uni.coordinates.lng };
        } else if (uni.smartData && typeof uni.smartData.latitude === 'number' && typeof uni.smartData.longitude === 'number') {
            coords = { lat: uni.smartData.latitude, lng: uni.smartData.longitude };
        } else {
            const city = typeof getCity === 'function' ? getCity(uni.location) : (uni.location ? uni.location.split(',')[0].trim() : '');
            const baseCoords = cityCoordinates[city];
            if (baseCoords) {
                // Apply deterministic jitter so pins don't stack
                coords = jitterCoords(baseCoords.lat, baseCoords.lng, uni.id || Math.random() * 100);
            }
        }
        
        if (coords) {
            const marker = L.marker([coords.lat, coords.lng], { icon: getTNAUMarkerIcon(uni.category) }).addTo(map);
            marker.uniData = uni;
            const slug = typeof toSlug === 'function' ? toSlug(uni.name) : uni.name.replace(/\s+/g, '-').toLowerCase();

            marker.bindTooltip(uni.name, { direction: 'top', offset: [0, -28] });

            marker.on('click', () => {
                // FIX: Smooth flyTo on pin click for better UX
                map.flyTo([coords.lat, coords.lng], 13, { duration: 0.8 });
                showDetailPanel(uni, coords, slug);
            });
            
            markers.push(marker);
        }
    });

    const detailPanel = document.getElementById('detail-panel');
    const closeDetailPanelBtn = document.getElementById('close-detail-panel');

    closeDetailPanelBtn.addEventListener('click', () => {
        detailPanel.classList.add('hidden');
    });

    function showDetailPanel(uni, coords, slug) {
        document.getElementById('detail-title').textContent = uni.name;
        document.getElementById('detail-category').textContent = uni.category;
        document.getElementById('detail-location').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${uni.location}`;
        
        // Adaptive Detail Stats (Academic vs Research/KVK)
        const isAcademic = uni.category && uni.category.includes("Colleges");
        const naacBox = document.getElementById('detail-naac');
        const estBox = document.getElementById('detail-est');
        const naacLabel = naacBox ? naacBox.nextElementSibling : null;
        const estLabel = estBox ? estBox.nextElementSibling : null;

        if (isAcademic) {
            if (naacBox) naacBox.textContent = (uni.smartData && uni.smartData.naacGrade) ? uni.smartData.naacGrade : 'ICAR';
            if (naacLabel) naacLabel.textContent = 'Accreditation';
            if (estBox) estBox.textContent = (uni.smartData && uni.smartData.established) ? uni.smartData.established : '1971';
            if (estLabel) estLabel.textContent = 'Est. Year';
        } else {
            if (naacBox) naacBox.textContent = uni.zone ? uni.zone.replace(' Zone', '') : 'Tamil Nadu';
            if (naacLabel) naacLabel.textContent = 'Agro Zone';
            if (estBox) estBox.textContent = uni.campusCode || (uni.category.includes('KVK') ? 'KVK' : 'Station');
            if (estLabel) estLabel.textContent = 'Unit Code';
        }

        // Dynamic Mandate / Specialty Box
        let mandateBox = document.getElementById('detail-mandate-box');
        if (!mandateBox) {
            mandateBox = document.createElement('div');
            mandateBox.id = 'detail-mandate-box';
            mandateBox.style.cssText = 'margin: 10px 0; padding: 10px 12px; background: #f0fdf4; border: 1px solid rgba(22,101,52,0.18); border-radius: 8px; font-size: 12px; color: #166534; font-weight: 500; display: flex; align-items: flex-start; gap: 8px; line-height: 1.4;';
            const locEl = document.getElementById('detail-location');
            if (locEl) locEl.parentNode.insertBefore(mandateBox, locEl.nextSibling);
        }
        const sd = uni.smartData || {};
        if (sd.cropMandate) {
            mandateBox.style.display = 'flex';
            mandateBox.innerHTML = `<i class="fa-solid fa-seedling" style="margin-top: 2px; color: #15803d; font-size: 14px;"></i> <div><strong>Research Mandate:</strong> ${sd.cropMandate}</div>`;
        } else if (sd.extensionMandate) {
            mandateBox.style.display = 'flex';
            mandateBox.innerHTML = `<i class="fa-solid fa-chalkboard-user" style="margin-top: 2px; color: #7e22ce; font-size: 14px;"></i> <div><strong>KVK Mandate:</strong> ${sd.extensionMandate}</div>`;
        } else if (sd.degreesOffered && sd.degreesOffered.length > 0) {
            mandateBox.style.display = 'flex';
            mandateBox.innerHTML = `<i class="fa-solid fa-graduation-cap" style="margin-top: 2px; color: #166534; font-size: 14px;"></i> <div><strong>Academic Degrees:</strong> ${sd.degreesOffered.join(' • ')}</div>`;
        } else {
            mandateBox.style.display = 'none';
        }
        
        // Use the proper college profile card image
        const imgUrl = typeof getImageUrl === 'function' ? getImageUrl(uni) : (uni.image || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80');
        document.getElementById('detail-cover-img').style.backgroundImage = `url('${imgUrl}')`;

        document.getElementById('btn-view-profile').href = `institution.html?slug=${slug}`;
        
        // Update Plan Route button
        const planRouteBtn = document.getElementById('btn-plan-route');
        planRouteBtn.onclick = () => {
            openRouteModal(uni.name.replace(/'/g, "\\'"), coords.lat, coords.lng);
        };

        // Update Campus Mode button
        const campusModeBtn = document.getElementById('btn-campus-mode');
        const campusKey = (typeof CAMPUS_LAYOUTS !== 'undefined') && (
            CAMPUS_LAYOUTS[uni.name] ? uni.name : 
            (CAMPUS_LAYOUTS[uni.name.split(',')[0].trim()] ? uni.name.split(',')[0].trim() : null)
        );
        if (campusKey) {
            campusModeBtn.style.display = 'flex';
            campusModeBtn.onclick = () => {
                window.viewCampusLayout(campusKey);
                detailPanel.classList.add('hidden');
                document.querySelector('.map-floating-top').style.opacity = '0';
                document.querySelector('.map-floating-top').style.pointerEvents = 'none';
                document.getElementById('btn-exit-campus').classList.remove('hidden');
            };
        } else {
            campusModeBtn.style.display = 'none';
        }

        // 360 Tour Button (Launches 2-Route Experience Modal)
        let tourBtn = document.getElementById('btn-map-tour');
        if (!tourBtn) {
            tourBtn = document.createElement('button');
            tourBtn.type = 'button';
            tourBtn.id = 'btn-map-tour';
            tourBtn.className = 'btn btn-accent btn-full';
            tourBtn.style.cssText = 'margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; border: none; font-family: inherit; font-size: inherit;';
            tourBtn.innerHTML = '<i class="fa-solid fa-vr-cardboard"></i> Launch 360° Tour';
            const actions = document.querySelector('.detail-actions');
            if (actions) actions.insertBefore(tourBtn, document.getElementById('btn-view-profile'));
        }
        if ((uni.tourUrl && uni.tourUrl !== '#') || (uni.streetViewUrl && uni.streetViewUrl !== '#')) {
            tourBtn.style.display = 'flex';
            tourBtn.setAttribute('data-explore', uni.name);
            tourBtn.onclick = (e) => {
                e.preventDefault();
                if (typeof window.showExplorePopup === 'function') {
                    window.showExplorePopup(e, uni.name);
                } else if (uni.tourUrl && uni.tourUrl !== '#') {
                    window.open(uni.tourUrl, '_blank');
                }
            };
        } else {
            tourBtn.style.display = 'none';
            tourBtn.onclick = null;
        }

        detailPanel.classList.remove('hidden');
    }

    document.getElementById('btn-exit-campus').addEventListener('click', () => {
        // Reset view to Tamil Nadu
        map.setView([11.1271, 78.6569], 7);
        
        // Clear active layers
        Object.keys(window.activeCampusLayers).forEach(key => {
            map.removeLayer(window.activeCampusLayers[key]);
        });
        window.activeCampusLayers = {};
        window.currentCampus = null;

        // Hide campus layer panel
        document.getElementById('campus-layers-panel').style.display = 'none';
        
        // Restore UI
        document.getElementById('btn-exit-campus').classList.add('hidden');
        document.querySelector('.map-floating-top').style.opacity = '1';
        document.querySelector('.map-floating-top').style.pointerEvents = 'auto';
    });

    // ==========================================
    // NEW FILTER & SEARCH LOGIC
    // ==========================================
    function showToast(message, type = 'error') {
        const toast = document.createElement('div');
        toast.className = 'toast-alert';
        if (type === 'error') {
            toast.style.background = 'var(--color-danger-500, #ef4444)';
            toast.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${message}`;
        } else {
            toast.style.background = 'var(--color-primary-500, #3b82f6)';
            toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${message}`;
        }
        document.body.appendChild(toast);
        
        // Trigger reflow
        void toast.offsetWidth;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function levenshteinDistance(s, t) {
        if (!s.length) return t.length;
        if (!t.length) return s.length;
        const arr = [];
        for (let i = 0; i <= t.length; i++) {
            arr[i] = [i];
            for (let j = 1; j <= s.length; j++) {
                arr[i][j] =
                    i === 0
                        ? j
                        : Math.min(
                            arr[i - 1][j] + 1,
                            arr[i][j - 1] + 1,
                            arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1)
                        );
            }
        }
        return arr[t.length][s.length];
    }

    function fuzzyMatch(query, text) {
        query = query.toLowerCase().trim();
        text = text.toLowerCase();
        if (text.includes(query)) return true;
        
        const qWords = query.split(/\s+/).filter(w => w.length > 3);
        const tWords = text.split(/\s+/);
        
        for (const qw of qWords) {
            for (const tw of tWords) {
                if (Math.abs(qw.length - tw.length) <= 2) {
                    if (levenshteinDistance(qw, tw) <= 2) return true;
                }
            }
        }
        return false;
    }

    const searchInput = document.getElementById('map-search-input');
    const pillFilters = document.querySelectorAll('.pill-filter');
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    let activeFilter = 'all';
    let searchQuery = '';

    function showSuggestions(query) {
        if (!suggestionsContainer) return;
        
        query = query.toLowerCase().trim();
        if (query.length < 2) {
            suggestionsContainer.classList.remove('show');
            return;
        }

        let html = '';
        let count = 0;
        const maxSuggestions = 6;

        // 1. Intent Matches
        if ('medical'.includes(query)) {
            html += `<div class="suggestion-item" data-intent="isMedical"><div class="suggestion-icon"><i class="fa-solid fa-stethoscope"></i></div><div class="suggestion-content"><div class="suggestion-text">Search Medical Colleges</div></div></div>`;
            count++;
        }
        if ('engineering'.includes(query) || 'enginering'.includes(query)) {
            html += `<div class="suggestion-item" data-intent="isEngineering"><div class="suggestion-icon"><i class="fa-solid fa-microchip"></i></div><div class="suggestion-content"><div class="suggestion-text">Search Engineering Colleges</div></div></div>`;
            count++;
        }
        if ('government'.includes(query) || 'govt'.includes(query)) {
            html += `<div class="suggestion-item" data-intent="isGovt"><div class="suggestion-icon"><i class="fa-solid fa-building-columns"></i></div><div class="suggestion-content"><div class="suggestion-text">Search Government Universities</div></div></div>`;
            count++;
        }
        if ('agriculture'.includes(query)) {
            html += `<div class="suggestion-item" data-intent="isAgriculture"><div class="suggestion-icon"><i class="fa-solid fa-leaf"></i></div><div class="suggestion-content"><div class="suggestion-text">Search Agriculture Colleges</div></div></div>`;
            count++;
        }

        // 2. City Matches
        const cities = ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Vellore'];
        for (const city of cities) {
            if (city.toLowerCase().startsWith(query)) {
                html += `<div class="suggestion-item" data-city="${city}"><div class="suggestion-icon"><i class="fa-solid fa-location-dot"></i></div><div class="suggestion-content"><div class="suggestion-text">Colleges in ${city}</div></div></div>`;
                count++;
            }
        }

        // 3. College Matches
        for (const uni of data) {
            if (count >= maxSuggestions) break;
            if (fuzzyMatch(query, uni.name)) {
                html += `<div class="suggestion-item" data-search="${uni.name.replace(/"/g, '&quot;')}"><div class="suggestion-icon"><i class="fa-solid fa-graduation-cap"></i></div><div class="suggestion-content"><div class="suggestion-text">${uni.name}</div><div class="suggestion-subtext"><i class="fa-solid fa-location-dot" style="font-size:10px;"></i> ${uni.location.split(',')[0]}</div></div></div>`;
                count++;
            }
        }

        if (count > 0) {
            suggestionsContainer.innerHTML = html;
            suggestionsContainer.classList.add('show');

            const items = suggestionsContainer.querySelectorAll('.suggestion-item');
            items.forEach(item => {
                item.addEventListener('click', () => {
                    if (item.dataset.intent) {
                        searchInput.value = '';
                        searchQuery = '';
                        pillFilters.forEach(b => b.classList.remove('active'));
                        const btn = document.querySelector(`.pill-filter[data-filter="${item.dataset.intent}"]`);
                        if (btn) btn.classList.add('active');
                        activeFilter = item.dataset.intent;
                    } else if (item.dataset.city || item.dataset.search) {
                        searchInput.value = item.dataset.city || item.dataset.search;
                        searchQuery = searchInput.value;
                    }
                    applyFilters();
                    suggestionsContainer.classList.remove('show');
                    searchInput.blur();
                });
            });
        } else {
            suggestionsContainer.classList.remove('show');
        }
    }

    // Hide dropdown on outside click or escape
    document.addEventListener('click', (e) => {
        if (suggestionsContainer && searchInput) {
            if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.classList.remove('show');
            }
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && suggestionsContainer) {
            suggestionsContainer.classList.remove('show');
            if(document.activeElement === searchInput) searchInput.blur();
        }
    });

    function applyFilters() {
        let mappedFilter = activeFilter;
        let isIntentMatch = false;

        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase().trim();
            if (searchLower === 'near me' || searchLower === 'college near me' || searchLower === 'colleges near me') {
                const btnGetLocation = document.getElementById('btn-get-location');
                if (btnGetLocation) btnGetLocation.click();
                if (searchInput) searchInput.value = '';
                searchQuery = '';
            } else {
                // Smart Intent Matching
                if (searchLower.includes('medical')) { mappedFilter = 'isMedical'; isIntentMatch = true; }
                else if (searchLower.includes('engineering') || searchLower.includes('enginering')) { mappedFilter = 'isEngineering'; isIntentMatch = true; }
                else if (searchLower.includes('naac')) { mappedFilter = 'NAAC'; isIntentMatch = true; }
                else if (searchLower.includes('agriculture')) { mappedFilter = 'isAgriculture'; isIntentMatch = true; }
                else if (searchLower.includes('govt') || searchLower.includes('government')) { mappedFilter = 'isGovt'; isIntentMatch = true; }
            }
        }

        const visibleMarkers = [];

        markers.forEach(m => {
            let show = true;
            const data = m.uniData;
            
            // 1. Text Search
            if (searchQuery && !isIntentMatch) {
                const nameStr = data.name || "";
                const locStr = data.location || "";
                const distStr = data.district || "";
                const codeStr = data.campusCode || "";
                if (!fuzzyMatch(searchQuery, nameStr) && !fuzzyMatch(searchQuery, locStr) && !fuzzyMatch(searchQuery, distStr) && !fuzzyMatch(searchQuery, codeStr)) {
                    show = false;
                }
            }

            // 2. Pill Filter or Mapped Intent
            if (show && mappedFilter !== 'all') {
                if (mappedFilter === 'isConstituent') {
                    if (data.category !== 'Constituent Colleges') show = false;
                } else if (mappedFilter === 'isAffiliated') {
                    if (data.category !== 'Affiliated Colleges') show = false;
                } else if (mappedFilter === 'isStation') {
                    if (data.category !== 'Research Stations') show = false;
                } else if (mappedFilter === 'isKvk') {
                    if (data.category !== 'Krishi Vigyan Kendras (KVKs)') show = false;
                } else if (mappedFilter === 'hasTour') {
                    if (!data.tourUrl || data.tourUrl === '#') show = false;
                } else if (mappedFilter === 'zone-Western') {
                    if (data.zone !== 'Western Zone') show = false;
                } else if (mappedFilter === 'zone-Cauvery') {
                    if (data.zone !== 'Cauvery Delta Zone') show = false;
                } else if (mappedFilter === 'zone-Southern') {
                    if (data.zone !== 'Southern Zone') show = false;
                } else if (mappedFilter === 'zone-NorthEastern') {
                    if (data.zone !== 'North Eastern Zone') show = false;
                } else if (mappedFilter === 'zone-NorthWestern') {
                    if (data.zone !== 'North Western Zone') show = false;
                } else if (mappedFilter === 'zone-HighRainfall') {
                    if (data.zone !== 'High Rainfall Zone') show = false;
                } else if (mappedFilter === 'zone-Hilly') {
                    if (data.zone !== 'Hilly Zone') show = false;
                } else if (mappedFilter === 'NAAC') {
                    if (!data.smartData || data.smartData.naacGrade !== 'A') show = false;
                } else if (mappedFilter === 'hasHostel') {
                    if (!data.smartData || !data.smartData.hasHostel) show = false;
                } else if (mappedFilter === 'isGovt') {
                    if (data.category !== 'Constituent Colleges') show = false;
                } else if (mappedFilter === 'isAgriculture') {
                    // All are agriculture!
                }
            }

            if (show) {
                if (!map.hasLayer(m)) m.addTo(map);
                visibleMarkers.push(m);
            } else {
                if (map.hasLayer(m)) m.remove();
            }
        });

        if (visibleMarkers.length === 1) {
            const m = visibleMarkers[0];
            const data = m.uniData;
            const coords = m.getLatLng();
            map.setView(coords, 15);
            
            const slug = typeof toSlug === 'function' ? toSlug(data.name) : data.name.replace(/\s+/g, '-').toLowerCase();
            showDetailPanel(data, coords, slug);
        } else if (visibleMarkers.length > 0 && (searchQuery || activeFilter !== 'all')) {
            const group = new L.featureGroup(visibleMarkers);
            map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 12 });
        } else if (!searchQuery && activeFilter === 'all') {
            map.setView([11.1271, 78.6569], 7);
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            showSuggestions(searchQuery);
            applyFilters();
        });
        
        searchInput.addEventListener('focus', (e) => {
            showSuggestions(e.target.value.trim());
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchQuery = e.target.value.trim();
                applyFilters();
                searchInput.blur(); // Hides keyboard on mobile
            }
        });
    }

    const searchBtn = document.getElementById('map-search-btn');
    const submitSearchBtn = document.getElementById('btn-submit-search');
    
    function executeExplicitSearch() {
        searchQuery = searchInput.value.trim();
        applyFilters();
        searchInput.blur(); // Hides keyboard on mobile
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', executeExplicitSearch);
    }
    if (submitSearchBtn && searchInput) {
        submitSearchBtn.addEventListener('click', executeExplicitSearch);
    }

    pillFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            pillFilters.forEach(b => b.classList.remove('active'));
            // Add active class to clicked
            btn.classList.add('active');
            
            activeFilter = btn.dataset.filter;
            applyFilters();
        });
    });

    // Near me logic
    const btnGetLocation = document.getElementById('btn-get-location');
    if (btnGetLocation) {
        btnGetLocation.addEventListener('click', () => {
            if (navigator.geolocation) {
                const originalIcon = btnGetLocation.innerHTML;
                btnGetLocation.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                btnGetLocation.style.color = 'var(--color-primary-800)';
                
                navigator.geolocation.getCurrentPosition(
                    pos => {
                        btnGetLocation.innerHTML = originalIcon;
                        const userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        window.appUserLocation = userLocation;
                        map.setView([userLocation.lat, userLocation.lng], 9);
                        L.circleMarker([userLocation.lat, userLocation.lng], {
                            radius: 8, fillColor: "#ff0000", color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.8
                        }).addTo(map).bindPopup("You are here").openPopup();
                    },
                    err => {
                        console.warn("Geolocation error:", err);
                        btnGetLocation.innerHTML = originalIcon;
                        showToast("Location access denied or timed out.", "error");
                    },
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            }
        });
    }

    // Nearest College Logic
    const btnNearestCollege = document.getElementById('btn-nearest-college');
    if (btnNearestCollege) {
        btnNearestCollege.addEventListener('click', () => {
            if (navigator.geolocation) {
                const originalIcon = btnNearestCollege.innerHTML;
                btnNearestCollege.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                btnNearestCollege.style.color = 'var(--color-primary-800)';
                
                navigator.geolocation.getCurrentPosition(
                    pos => {
                        btnNearestCollege.innerHTML = originalIcon;
                        btnNearestCollege.style.color = 'var(--color-primary-600)';
                        
                        const userLat = pos.coords.latitude;
                        const userLng = pos.coords.longitude;
                        const userLatLng = L.latLng(userLat, userLng);
                        
                        window.appUserLocation = { lat: userLat, lng: userLng };
                        
                        let nearestMarker = null;
                        let minDistance = Infinity;
                        
                        markers.forEach(m => {
                            const coords = m.getLatLng();
                            const dist = userLatLng.distanceTo(coords);
                            if (dist < minDistance) {
                                minDistance = dist;
                                nearestMarker = m;
                            }
                        });
                        
                        if (nearestMarker) {
                            const data = nearestMarker.uniData;
                            
                            if (searchInput) {
                                searchInput.value = data.name;
                                searchQuery = data.name;
                                applyFilters(); 
                            }
                            
                            const coords = nearestMarker.getLatLng();
                            map.setView(coords, 14);
                            
                            const popupContainer = document.createElement('div');
                            popupContainer.style.textAlign = 'center';
                            popupContainer.style.padding = '4px';
                            
                            popupContainer.innerHTML = `
                                <div style="color: var(--color-primary-600); font-weight: bold; font-size: 12px; margin-bottom: 4px;">
                                    <i class="fa-solid fa-location-arrow"></i> Nearest College Found
                                </div>
                                <div style="font-size: 14px; color: var(--color-neutral-800); font-weight: 600; margin-bottom: 8px;">
                                    ${data.name}
                                </div>
                            `;
                            
                            const viewBtn = document.createElement('button');
                            viewBtn.innerHTML = `View Profile <i class="fa-solid fa-arrow-right" style="margin-left:4px;"></i>`;
                            viewBtn.style.cssText = 'background: var(--color-primary-600); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; width: 100%; display: flex; justify-content: center; align-items: center;';
                            
                            viewBtn.addEventListener('click', () => {
                                const slug = typeof toSlug === 'function' ? toSlug(data.name) : data.name.replace(/\\s+/g, '-').toLowerCase();
                                showDetailPanel(data, coords, slug);
                            });
                            
                            popupContainer.appendChild(viewBtn);
                            
                            nearestMarker.bindPopup(popupContainer).openPopup();
                            
                            showToast(`Found nearest college: ${data.name}`);
                        } else {
                            showToast("No colleges found.", "error");
                        }
                    },
                    err => {
                        console.warn("Geolocation error:", err);
                        btnNearestCollege.innerHTML = originalIcon;
                        btnNearestCollege.style.color = 'var(--color-primary-600)';
                        showToast("Location access denied or timed out.", "error");
                    },
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            }
        });
    }

    // ==========================================
    // SIDEBAR TOGGLE LOGIC
    // ==========================================
    const filterToggleBtn = document.getElementById('btn-toggle-filters');
    const filterCloseBtn = document.getElementById('btn-close-filters');
    const filterSidebar = document.getElementById('filter-sidebar');

    if (filterToggleBtn && filterCloseBtn && filterSidebar) {
        filterToggleBtn.addEventListener('click', () => {
            filterSidebar.classList.remove('slide-hidden');
            filterToggleBtn.classList.add('active-filter');
        });

        filterCloseBtn.addEventListener('click', () => {
            filterSidebar.classList.add('slide-hidden');
            filterToggleBtn.classList.remove('active-filter');
        });
    }

    // ==========================================
    // CAMPUS LAYER LOGIC
    // ==========================================
    window.activeCampusLayers = {};
    window.currentCampus = null;

    window.viewCampusLayout = function(uniName) {
        if (!CAMPUS_LAYOUTS || !CAMPUS_LAYOUTS[uniName]) return;
        const layout = CAMPUS_LAYOUTS[uniName];
        
        map.setView(layout.center, layout.zoom);
        window.currentCampus = uniName;
        
        // Show the Campus Layers panel
        const panel = document.getElementById('campus-layers-panel');
        if (panel) {
            panel.style.display = 'block';
            
            // Reset all checkboxes in the panel
            const checkboxes = panel.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);
            
            // Re-check the academicBlocks checkbox visually
            const acadCb = panel.querySelector('input[onchange*="academicBlocks"]');
            if (acadCb) acadCb.checked = true;
        }
        
        // Auto-enable academic blocks by default when zooming in
        window.toggleCampusLayer('academicBlocks', true);
    };

    window.toggleCampusLayer = function(layerKey, forceState = null) {
        if (!window.currentCampus || !CAMPUS_LAYOUTS[window.currentCampus]) return;
        
        const layoutData = CAMPUS_LAYOUTS[window.currentCampus].layers[layerKey];
        if (!layoutData) return;

        // If it already exists, remove it (toggle off)
        if (window.activeCampusLayers[layerKey] && forceState !== true) {
            map.removeLayer(window.activeCampusLayers[layerKey]);
            delete window.activeCampusLayers[layerKey];
            return;
        }

        // Otherwise, render it
        if (forceState === false) return;

        const layerGroup = L.layerGroup();
        
        layoutData.forEach(item => {
            let colors = { color: '#3b82f6', fillColor: '#3b82f6' }; // Default blue
            if (item.type === 'hostel') colors = { color: '#10b981', fillColor: '#10b981' }; // Green
            if (item.type === 'admin') colors = { color: '#f59e0b', fillColor: '#f59e0b' }; // Orange
            if (item.type === 'lab') colors = { color: '#8b5cf6', fillColor: '#8b5cf6' }; // Purple
            if (item.type === 'safety') colors = { color: '#ef4444', fillColor: '#ef4444' }; // Red
            if (item.type === 'library') colors = { color: '#ec4899', fillColor: '#ec4899' }; // Pink
            if (item.type === 'sports') colors = { color: '#14b8a6', fillColor: '#14b8a6' }; // Teal
            if (item.type === 'canteen') colors = { color: '#eab308', fillColor: '#eab308' }; // Yellow
            if (item.type === 'transport') colors = { color: '#6366f1', fillColor: '#6366f1' }; // Indigo
            if (item.type === 'greenSpace') colors = { color: '#84cc16', fillColor: '#84cc16' }; // Lime
            if (item.type === 'route') colors = { color: '#0ea5e9', fillColor: '#0ea5e9' }; // Sky Blue
            
            if (item.polygon) {
                const poly = L.polygon(item.polygon, {
                    color: colors.color,
                    fillColor: colors.fillColor,
                    fillOpacity: 0.4,
                    weight: 2
                }).bindPopup(`<b>${item.name}</b><br>${item.type.toUpperCase()}`);
                layerGroup.addLayer(poly);
            } else if (item.point) {
                const marker = L.circleMarker(item.point, {
                    radius: 8,
                    color: colors.color,
                    fillColor: colors.fillColor,
                    fillOpacity: 1
                }).bindPopup(`<b>${item.name}</b><br>${item.type.toUpperCase()}`);
                layerGroup.addLayer(marker);
            } else if (item.path) {
                const polyline = L.polyline(item.path, {
                    color: colors.color,
                    weight: 4,
                    dashArray: '5, 10'
                }).bindPopup(`<b>${item.name}</b><br>${item.type.toUpperCase()}`);
                layerGroup.addLayer(polyline);
            }
        });

        layerGroup.addTo(map);
        window.activeCampusLayers[layerKey] = layerGroup;
    };

    // Deep-linking URL parameter handler (?focus=ID, ?id=ID, ?zone=..., ?category=..., ?q=...)
    const urlParams = new URLSearchParams(window.location.search);
    const focusId = urlParams.get('focus') || urlParams.get('id');
    const zoneParam = urlParams.get('zone');
    const categoryParam = urlParams.get('category');
    const searchParam = urlParams.get('search') || urlParams.get('q');

    if (focusId) {
        const targetMarker = markers.find(m => {
            if (!m.uniData) return false;
            if (String(m.uniData.id) === String(focusId)) return true;
            if (m.uniData.campusCode && m.uniData.campusCode.toLowerCase() === focusId.toLowerCase()) return true;
            const slug = typeof toSlug === 'function' ? toSlug(m.uniData.name) : m.uniData.name.replace(/\s+/g, '-').toLowerCase();
            return slug === focusId.toLowerCase();
        });

        if (targetMarker) {
            const coords = targetMarker.getLatLng();
            map.setView([coords.lat, coords.lng], 14);
            setTimeout(() => {
                targetMarker.fire('click');
            }, 350);
        }
    } else {
        if (searchParam && searchInput) {
            searchInput.value = searchParam;
            searchQuery = searchParam;
            applyFilters();
        } else if (zoneParam) {
            const normalizedZone = zoneParam.toLowerCase().replace(/[^a-z]/g, '');
            const matchingBtn = Array.from(pillFilters).find(b => {
                const f = (b.dataset.filter || '').toLowerCase().replace(/[^a-z]/g, '');
                return f.includes(normalizedZone) || normalizedZone.includes(f);
            });
            if (matchingBtn) matchingBtn.click();
        } else if (categoryParam) {
            const normalizedCat = categoryParam.toLowerCase().replace(/[^a-z]/g, '');
            const matchingBtn = Array.from(pillFilters).find(b => {
                const f = (b.dataset.filter || '').toLowerCase().replace(/[^a-z]/g, '');
                return f.includes(normalizedCat) || normalizedCat.includes(f);
            });
            if (matchingBtn) matchingBtn.click();
        }
    }
});
