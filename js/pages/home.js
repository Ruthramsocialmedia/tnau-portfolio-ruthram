// home.js - Logic for the TNAU Agri Portal homepage

document.addEventListener('DOMContentLoaded', async () => {
    // Check if data is loaded
    if (typeof fetchUniversities !== 'function') {
        console.error("fetchUniversities not loaded! Ensure supabase-client.js is loaded first.");
        return;
    }

    const universities = await fetchUniversities();
    
    // 1. Update 4 TNAU Stats & Animate
    const constituentCount = universities.filter(u => u.category === "Constituent Colleges").length || 18;
    const affiliatedCount = universities.filter(u => u.category === "Affiliated Colleges").length || 28;
    const stationsCount = universities.filter(u => u.category === "Research Stations").length || 38;
    const kvkCount = universities.filter(u => u.category === "Krishi Vigyan Kendras (KVKs)").length || 15;

    const elConstituent = document.getElementById('stat-constituent');
    const elAffiliated = document.getElementById('stat-affiliated');
    const elStations = document.getElementById('stat-stations');
    const elKvk = document.getElementById('stat-kvk');

    const statsBar = document.querySelector('.stats-bar');
    if (statsBar && typeof animateCounter === 'function') {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                if (elConstituent) animateCounter(elConstituent, constituentCount, 1500);
                if (elAffiliated) animateCounter(elAffiliated, affiliatedCount, 1500);
                if (elStations) animateCounter(elStations, stationsCount, 1500);
                if (elKvk) animateCounter(elKvk, kvkCount, 1500);
                observer.disconnect();
            }
        }, { threshold: 0.2 });
        observer.observe(statsBar);
    } else {
        if (elConstituent) elConstituent.textContent = constituentCount;
        if (elAffiliated) elAffiliated.textContent = affiliatedCount;
        if (elStations) elStations.textContent = stationsCount;
        if (elKvk) elKvk.textContent = kvkCount;
    }

    // 2. Fetch Live Coimbatore Campus Weather for Agromet Ticker
    const tickerWeather = document.getElementById('tickerWeather');
    if (tickerWeather && typeof WeatherAPI !== 'undefined' && typeof WeatherAPI.fetchCampusWeather === 'function') {
        WeatherAPI.fetchCampusWeather("Coimbatore, Tamil Nadu")
            .then(w => {
                if (w) {
                    tickerWeather.innerHTML = `TNAU Agromet Hub: <strong>Coimbatore HQ ${w.temp}°C, ${w.condition}</strong> (Humidity: ${w.humidity}% • Wind: ${w.wind} km/h) • All 7 Agro-Climatic Zones Monitored`;
                }
            })
            .catch(err => {
                console.warn("Agromet weather ticker error:", err);
            });
    }

    // 3. Render 6 Flagship TNAU Featured Institutions
    const featuredGrid = document.getElementById('featured-grid');
    if (featuredGrid && typeof createInstitutionCard === 'function') {
        const flagshipIds = [101, 102, 106, 107, 301, 401];
        let featured = flagshipIds.map(id => universities.find(u => u.id === id)).filter(Boolean);

        // Fallback if specific IDs weren't matched
        if (featured.length < 6) {
            const fallbackNames = [
                "Agricultural College & Research Institute, Coimbatore",
                "Agricultural College & Research Institute, Madurai",
                "Horticultural College & Research Institute, Periyakulam",
                "Forest College & Research Institute, Mettupalayam",
                "Tamil Nadu Rice Research Institute (TRRI), Aduthurai",
                "Krishi Vigyan Kendra (KVK), Sandhiyur, Salem"
            ];
            featured = universities.filter(u => fallbackNames.some(fn => u.name.includes(fn))).slice(0, 6);
        }

        // Additional fallback to first 6 if needed
        if (featured.length < 6) {
            featured = universities.slice(0, 6);
        }

        featuredGrid.innerHTML = '';
        featured.forEach(uni => {
            featuredGrid.innerHTML += createInstitutionCard(uni);
        });
    }

    // 4. Search Form Logic
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    function performSearch() {
        const query = searchInput ? searchInput.value.trim() : '';
        if (query) {
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        } else {
            window.location.href = 'search.html';
        }
    }
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }

    // AI Finder Button
    const aiFinderBtn = document.getElementById('aiCollegeFinderBtn');
    if (aiFinderBtn) {
        aiFinderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof openRecommender === 'function') {
                openRecommender();
            }
        });
    }

    // 5. Quick Filter Chips
    const quickChips = document.querySelectorAll('.quick-chip');
    quickChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const category = chip.getAttribute('data-category');
            if (category) {
                window.location.href = `search.html?category=${encodeURIComponent(category)}`;
            } else {
                window.location.href = `search.html`;
            }
        });
    });

    // 6. Category Cards (Bento Grid)
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.getAttribute('data-category') || card.querySelector('.category-name').textContent.trim();
            window.location.href = `search.html?category=${encodeURIComponent(category)}`;
        });
    });

    // 7. Populate District Grid
    const districtGrid = document.getElementById('district-grid');
    if (districtGrid) {
        const uniqueDistricts = [...new Set(universities.map(u => 
            u.district || (typeof getCity === 'function' ? getCity(u.location) : u.location.split(',')[0].trim())
        ))].filter(Boolean).sort();

        // Highlight top districts across agro-climatic zones
        const priorityDistricts = [
            "Coimbatore", "Madurai", "Tiruchirappalli", "Thanjavur", "Salem", 
            "Dindigul", "Theni", "The Nilgiris", "Tirunelveli", "Cuddalore", "Vellore", "Kanyakumari"
        ];
        const displayDistricts = priorityDistricts.filter(d => uniqueDistricts.includes(d));

        districtGrid.innerHTML = '';
        displayDistricts.forEach(district => {
            const chip = document.createElement('div');
            chip.className = 'district-chip';
            chip.textContent = district;
            chip.addEventListener('click', () => {
                window.location.href = `search.html?district=${encodeURIComponent(district)}`;
            });
            districtGrid.appendChild(chip);
        });
    }
});
