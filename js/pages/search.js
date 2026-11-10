// search.js - Logic for the search results page

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof fetchUniversities !== 'function') {
        console.error("fetchUniversities not loaded!");
        return;
    }

    const data = await fetchUniversities();
    const resultsGrid = document.getElementById('results-grid');
    const resultsCount = document.getElementById('results-count');
    const searchInput = document.getElementById('pageSearchInput');
    const sortSelect = document.getElementById('sortSelect');
    
    // Parse URL params
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q') || '';
    
    if (searchInput) searchInput.value = initialQuery;

    // Initial Filter State
    const initialState = {
        categories: urlParams.getAll('category'),
        zones: urlParams.getAll('zone'),
        districts: urlParams.getAll('district'),
        degrees: urlParams.getAll('degree').concat(urlParams.getAll('course')),
        accreditations: urlParams.getAll('accreditation'),
        features: []
    };

    // Initialize Sidebar
    let sidebar;
    if (document.getElementById('filter-sidebar-container')) {
        sidebar = new FilterSidebar('filter-sidebar-container', data);
        sidebar.setState(initialState);
        
        // Listen to changes
        sidebar.container.addEventListener('filter-change', (e) => {
            const state = e.detail;
            updateUrlAndFilter(searchInput ? searchInput.value : '', state, sortSelect ? sortSelect.value : 'relevance');
        });
    }

    // Sort Event
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            if (sidebar) {
                updateUrlAndFilter(searchInput ? searchInput.value : '', sidebar.state, sortSelect.value);
            }
        });
    }

    // Custom Sort Dropdown Logic
    const customSortWrapper = document.getElementById('customSortWrapper');
    const customSortTrigger = document.getElementById('customSortTrigger');
    const customSortOptions = document.getElementById('customSortOptions');
    const customSortLabel = document.getElementById('customSortLabel');

    if (customSortWrapper && customSortTrigger && customSortOptions && customSortLabel && sortSelect) {
        // Toggle dropdown open/close
        customSortTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            customSortWrapper.classList.toggle('open');
        });

        // Handle option selection
        const options = customSortOptions.querySelectorAll('.custom-sort-option');
        options.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = opt.dataset.value;
                const text = opt.textContent;

                // Update label
                customSortLabel.textContent = text;
                
                // Update selected class
                options.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');

                // Update underlying hidden select and trigger change event
                sortSelect.value = value;
                sortSelect.dispatchEvent(new Event('change'));

                // Close dropdown
                customSortWrapper.classList.remove('open');
            });
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!customSortWrapper.contains(e.target)) {
                customSortWrapper.classList.remove('open');
            }
        });
    }

    // Search Input & Button Events
    const searchBtn = document.getElementById('pageSearchBtn');
    
    const executeSearch = async () => {
        if (sidebar && searchInput) {
            await updateUrlAndFilter(searchInput.value, sidebar.state, sortSelect ? sortSelect.value : 'relevance');
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', debounce(executeSearch, 300));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') executeSearch();
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', executeSearch);
    }
    
    // AI Finder Event Listener
    const aiFinderBtn = document.getElementById('pageAiFinderBtn');
    if (aiFinderBtn) {
        aiFinderBtn.addEventListener('click', () => {
            if (searchInput && searchInput.value.trim()) {
                const url = new URL(window.location);
                url.searchParams.set('q', searchInput.value.trim());
                url.searchParams.set('ai', 'true');
                window.history.replaceState({}, '', url);
                executeSearch();
            } else {
                // If no query, open the interactive AI Recommender modal
                const modal = document.getElementById('recommender-modal');
                if (modal) {
                    modal.showModal();
                } else {
                    if (typeof showToast === 'function') showToast('Please enter a search query first for the AI to analyze.', 'error');
                }
            }
        });
    }

    // ─── View Mode Switcher (Grid vs List) ───
    let currentViewMode = localStorage.getItem('tnau_search_view') || 'grid';
    const viewGridBtn = document.getElementById('viewGridBtn');
    const viewListBtn = document.getElementById('viewListBtn');

    const updateViewButtons = () => {
        if (viewGridBtn && viewListBtn) {
            viewGridBtn.classList.toggle('active', currentViewMode === 'grid');
            viewListBtn.classList.toggle('active', currentViewMode === 'list');
        }
    };
    updateViewButtons();

    if (viewGridBtn) {
        viewGridBtn.addEventListener('click', () => {
            currentViewMode = 'grid';
            localStorage.setItem('tnau_search_view', 'grid');
            updateViewButtons();
            executeSearch();
        });
    }

    if (viewListBtn) {
        viewListBtn.addEventListener('click', () => {
            currentViewMode = 'list';
            localStorage.setItem('tnau_search_view', 'list');
            updateViewButtons();
            executeSearch();
        });
    }

    // ─── Persona Quick-Tabs ───
    const personaTabs = document.querySelectorAll('.persona-tab');
    personaTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const cat = tab.dataset.category;
            personaTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (sidebar) {
                const nextCategories = cat === 'all' ? [] : [cat];
                sidebar.state.categories = nextCategories;
                // Sync sidebar checkboxes
                const checkboxes = sidebar.container.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(cb => {
                    const catObj = sidebar.categories.find(c => c.id === cb.value || c.name === cb.value);
                    if (catObj) {
                        cb.checked = nextCategories.includes(catObj.name);
                    }
                });
                executeSearch();
            }
        });
    });

    const syncPersonaTabs = (activeCategories) => {
        personaTabs.forEach(tab => {
            const cat = tab.dataset.category;
            if (cat === 'all') {
                tab.classList.toggle('active', !activeCategories || activeCategories.length === 0);
            } else {
                tab.classList.toggle('active', activeCategories && activeCategories.includes(cat) && activeCategories.length === 1);
            }
        });
    };

    // ─── Active Filter Chips Bar ───
    const activeFiltersBar = document.getElementById('activeFiltersBar');
    const activeChipsList = document.getElementById('activeChipsList');
    const clearAllFiltersBtn = document.getElementById('clearAllFiltersBtn');

    const renderActiveChips = (filterState) => {
        if (!activeFiltersBar || !activeChipsList) return;
        activeChipsList.innerHTML = '';
        const chips = [];

        (filterState.categories || []).forEach(cat => {
            chips.push({ type: 'categories', val: cat, label: cat, icon: 'fa-building-columns' });
        });
        (filterState.zones || []).forEach(z => {
            chips.push({ type: 'zones', val: z, label: z, icon: 'fa-earth-asia' });
        });
        (filterState.districts || []).forEach(d => {
            chips.push({ type: 'districts', val: d, label: d, icon: 'fa-location-dot' });
        });
        (filterState.degrees || []).forEach(deg => {
            chips.push({ type: 'degrees', val: deg, label: deg, icon: 'fa-graduation-cap' });
        });

        if (chips.length === 0) {
            activeFiltersBar.style.display = 'none';
            return;
        }

        activeFiltersBar.style.display = 'flex';
        chips.forEach(chip => {
            const el = document.createElement('span');
            el.className = 'filter-chip';
            el.innerHTML = `
                <i class="fa-solid ${chip.icon}" style="font-size: 10px; color: var(--color-primary-600);"></i>
                <span>${chip.label}</span>
                <span class="filter-chip-remove" title="Remove filter">&times;</span>
            `;
            el.querySelector('.filter-chip-remove').addEventListener('click', () => {
                if (sidebar) {
                    sidebar.state[chip.type] = (sidebar.state[chip.type] || []).filter(v => v !== chip.val);
                    // Uncheck checkbox in sidebar
                    const cb = sidebar.container.querySelector(`input[value="${chip.val}"]`);
                    if (cb) cb.checked = false;
                    executeSearch();
                }
            });
            activeChipsList.appendChild(el);
        });
    };

    if (clearAllFiltersBtn) {
        clearAllFiltersBtn.addEventListener('click', () => {
            if (sidebar) {
                sidebar.clearAll();
                syncPersonaTabs([]);
                executeSearch();
            }
        });
    }

    // Core filter function
    async function updateUrlAndFilter(query, filterState, sortValue) {
        const oldUrl = new URL(window.location);
        const wasAi = oldUrl.searchParams.get('ai') === 'true';

        // Update URL
        const newUrl = new URL(window.location);
        newUrl.search = ''; // clear all
        
        if (query) newUrl.searchParams.set('q', query);
        if (wasAi) newUrl.searchParams.set('ai', 'true');
        filterState.categories.forEach(c => newUrl.searchParams.append('category', c));
        if (filterState.zones) filterState.zones.forEach(z => newUrl.searchParams.append('zone', z));
        filterState.districts.forEach(d => newUrl.searchParams.append('district', d));
        if (filterState.degrees) filterState.degrees.forEach(c => newUrl.searchParams.append('degree', c));
        if (filterState.courses) filterState.courses.forEach(c => newUrl.searchParams.append('course', c));
        if (filterState.accreditations) filterState.accreditations.forEach(a => newUrl.searchParams.append('accreditation', a));
        
        window.history.replaceState({}, '', newUrl);

        // Sync Persona Tabs & Active Filter Chips Bar
        syncPersonaTabs(filterState.categories);
        renderActiveChips(filterState);

        // Filter Data (Fallback/Normal Filtering)
        let results = [...data];
        
        // AI Logic Check
        const isAi = newUrl.searchParams.get('ai') === 'true';
        const aiContainer = document.getElementById('aiFinderContainer');
        const aiContent = document.getElementById('aiFinderContent');
        
        let aiSummary = '';
        
        if (isAi && aiContainer && aiContent && query) {
            aiContainer.style.display = 'block';
            aiContent.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing "${query}" using Google Gemini AI...`;
            
            try {
                // Call actual Gemini API
                const aiResponse = await callGeminiAI(query, data);
                aiSummary = aiResponse.summary;
                
                // Filter results by the names returned from Gemini
                if (aiResponse.names && aiResponse.names.length > 0) {
                    results = data.filter(u => aiResponse.names.some(n => u.name.toLowerCase().includes(n.toLowerCase())));
                } else if (aiResponse.ids && aiResponse.ids.length > 0) {
                    results = data.filter(u => aiResponse.ids.includes(u.id));
                } else {
                    results = []; // AI found no matches
                }
            } catch (err) {
                console.error("AI Error:", err);
                aiSummary = `<strong>AI Error:</strong> ${err.message}. Fallback to normal search.`;
                // Fallback to normal filtering
                const q = query.toLowerCase();
                results = results.filter(u => {
                    const matchNameLoc = (typeof fuzzyMatch === 'function' && (fuzzyMatch(u.name, query) || fuzzyMatch(u.location, query))) ||
                        (u.name && u.name.toLowerCase().includes(q)) ||
                        (u.location && u.location.toLowerCase().includes(q)) ||
                        (u.district && u.district.toLowerCase().includes(q)) ||
                        (u.zone && u.zone.toLowerCase().includes(q)) ||
                        (u.category && u.category.toLowerCase().includes(q));
                    
                    const matchDegrees = u.smartData && u.smartData.degreesOffered && u.smartData.degreesOffered.some(c => (typeof c === 'string' ? c : (c.title || '')).toLowerCase().includes(q));
                    const matchCourses = u.smartData && u.smartData.coursesOffered && u.smartData.coursesOffered.some(c => (typeof c === 'string' ? c : (c.title || '')).toLowerCase().includes(q));
                    const matchFocus = u.smartData && u.smartData.keyFocus && u.smartData.keyFocus.toLowerCase().includes(q);
                    const matchCrops = u.smartData && u.smartData.crops && u.smartData.crops.some(cr => cr.toLowerCase().includes(q));
                    
                    return matchNameLoc || matchDegrees || matchCourses || matchFocus || matchCrops;
                });
            }
        } else {
            if (aiContainer) aiContainer.style.display = 'none';
            
            // 1. Normal Text Search (only if AI is off)
            if (query) {
                const q = query.toLowerCase();
                results = results.filter(u => {
                    const matchNameLoc = (typeof fuzzyMatch === 'function' && (fuzzyMatch(u.name, query) || fuzzyMatch(u.location, query))) ||
                        (u.name && u.name.toLowerCase().includes(q)) ||
                        (u.location && u.location.toLowerCase().includes(q)) ||
                        (u.district && u.district.toLowerCase().includes(q)) ||
                        (u.zone && u.zone.toLowerCase().includes(q)) ||
                        (u.category && u.category.toLowerCase().includes(q));
                    
                    const matchDegrees = u.smartData && u.smartData.degreesOffered && u.smartData.degreesOffered.some(c => (typeof c === 'string' ? c : (c.title || '')).toLowerCase().includes(q));
                    const matchCourses = u.smartData && u.smartData.coursesOffered && u.smartData.coursesOffered.some(c => (typeof c === 'string' ? c : (c.title || '')).toLowerCase().includes(q));
                    const matchFocus = u.smartData && u.smartData.keyFocus && u.smartData.keyFocus.toLowerCase().includes(q);
                    const matchCrops = u.smartData && u.smartData.crops && u.smartData.crops.some(cr => cr.toLowerCase().includes(q));
                    
                    return matchNameLoc || matchDegrees || matchCourses || matchFocus || matchCrops;
                });
            }
        }

        // 2. Categories
        if (filterState.categories && filterState.categories.length > 0) {
            results = results.filter(u => filterState.categories.includes(u.category));
        }

        // 3. Agro-Climatic Zones
        if (filterState.zones && filterState.zones.length > 0) {
            results = results.filter(u => filterState.zones.includes(u.zone));
        }

        // 4. Districts
        if (filterState.districts && filterState.districts.length > 0) {
            results = results.filter(u => {
                const district = u.district || (typeof getCity === 'function' ? getCity(u.location) : u.location.split(',')[0].trim());
                return filterState.districts.includes(district);
            });
        }

        // 5. Degree Programs / Courses / Mandates
        const selectedDegrees = (filterState.degrees || []).concat(filterState.courses || []);
        if (selectedDegrees.length > 0) {
            results = results.filter(u => {
                const degrees = (u.smartData && u.smartData.degreesOffered) || [];
                const courses = (u.smartData && u.smartData.coursesOffered) || [];
                const allPrograms = [...degrees, ...courses].map(c => typeof c === 'string' ? c : (c.title || ''));
                return selectedDegrees.some(d => allPrograms.includes(d));
            });
        }

        // 6. Accreditations
        if (filterState.accreditations && filterState.accreditations.length > 0) {
            results = results.filter(u => {
                if (!u.smartData || !u.smartData.approvals) return false;
                return filterState.accreditations.some(a => u.smartData.approvals.includes(a));
            });
        }

        // 7. Features
        if (filterState.features && filterState.features.includes('hasTour')) {
            results = results.filter(u => u.tourUrl && u.tourUrl !== '#');
        }

        // Pinned Flagship TNAU Hubs (featured on default initial view)
        const PINNED_UNIVERSITIES = [
            "Agricultural College & Research Institute, Coimbatore",
            "Agricultural College & Research Institute, Madurai",
            "Horticultural College & Research Institute, Periyakulam",
            "Forest College & Research Institute, Mettupalayam",
            "Tamil Nadu Rice Research Institute (TRRI), Aduthurai",
            "Krishi Vigyan Kendra (KVK), Sandhiyur, Salem"
        ];

        const hasSearch = Boolean(query && query.trim());
        const hasCategory = filterState.categories && filterState.categories.length > 0;
        const hasZone = filterState.zones && filterState.zones.length > 0;
        const hasDistrict = filterState.districts && filterState.districts.length > 0;
        const hasDegree = selectedDegrees.length > 0;
        const hasAccreditation = filterState.accreditations && filterState.accreditations.length > 0;
        const hasFeature = filterState.features && filterState.features.length > 0;
        const hasCustomSort = sortValue && sortValue !== 'relevance';

        const isDefaultState = !hasSearch && !hasCategory && !hasZone && !hasDistrict && 
                               !hasDegree && !hasAccreditation && !hasFeature && 
                               !hasCustomSort && !isAi;

        if (isDefaultState) {
            const pinnedList = [];
            const remainingList = [];

            PINNED_UNIVERSITIES.forEach(target => {
                const targetLower = target.toLowerCase();
                const found = results.find(u => {
                    const nameLower = (u.name || '').toLowerCase();
                    return nameLower.includes(targetLower);
                });
                if (found && !pinnedList.some(p => p.id === found.id)) {
                    pinnedList.push(found);
                }
            });

            results.forEach(u => {
                if (!pinnedList.some(p => p.id === u.id)) {
                    remainingList.push(u);
                }
            });

            results = [...pinnedList, ...remainingList];
        } else {
            // Sort Data when not in default state or when custom sort is chosen
            if (sortValue === 'name-asc') {
                results.sort((a, b) => a.name.localeCompare(b.name));
            } else if (sortValue === 'name-desc') {
                results.sort((a, b) => b.name.localeCompare(a.name));
            }
        }

        renderResults(results, isAi, query, aiSummary);
    }

    function renderResults(results, isAi = false, query = '', aiSummary = '') {
        if (resultsCount) {
            resultsCount.textContent = `${results.length} institution${results.length !== 1 ? 's' : ''} found`;
        }

        if (resultsGrid) {
            if (results.length === 0) {
                resultsGrid.className = 'results-grid';
                resultsGrid.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <h3>No institutions found</h3>
                        <p>Try adjusting your filters or search query to find what you're looking for.</p>
                        <button class="btn btn-primary" style="margin-top: var(--space-4);" onclick="document.getElementById('clearAllFiltersBtn')?.click()">Clear Filters</button>
                    </div>
                `;
            } else {
                resultsGrid.innerHTML = '';
                const isListView = currentViewMode === 'list';
                resultsGrid.className = isListView ? 'inst-list-view' : 'results-grid';
                results.forEach(uni => {
                    if (isListView && typeof createInstitutionRow === 'function') {
                        resultsGrid.innerHTML += createInstitutionRow(uni);
                    } else if (typeof createInstitutionCard === 'function') {
                        resultsGrid.innerHTML += createInstitutionCard(uni);
                    }
                });
            }
        }
        
        // Render AI Result
        const aiContent = document.getElementById('aiFinderContent');
        if (isAi && aiContent && query) {
            if (aiSummary) {
                aiContent.innerHTML = `<p>${aiSummary}</p>`;
            } else if (results.length === 0) {
                aiContent.innerHTML = `<p><strong>AI Insight:</strong> I couldn't find any institutions matching <em>"${query}"</em> in our verified database. Try broadening your search.</p>`;
            }
        }
    }

    // --- GEMINI API INTEGRATION ---
    // --- GEMINI API INTEGRATION ---
    async function callGeminiAI(userQuery, fullData) {
        if (!CONFIG || !CONFIG.GEMINI_API_KEY) {
            throw new Error("Missing GEMINI_API_KEY in config.js");
        }

        // 1. Simplify database to save tokens
        const simplifiedDb = fullData.map(u => ({
            id: u.id,
            name: u.name,
            location: u.location,
            category: u.category,
            courses: u.smartData?.coursesOffered || [],
            approvals: u.smartData?.approvals || [],
            features: u.smartData?.institutionTags || []
        }));

        // 2. Build Prompt
        const prompt = `You are an AI College Finder for Tamil Nadu universities. 
The user is asking: "${userQuery}".

Here is the JSON array of our database:
${JSON.stringify(simplifiedDb)}

Task:
1. Find the institutions that best match the user's intent. Understand synonyms (e.g. "CS" = "Computer Science", "cheap" = specific categories or government, "placement" = tags). If the user mentions approvals or accreditations (like NMC, AICTE, NAAC, MCI, PCI, BCI, UGC), make sure to strictly filter by the 'approvals' array.
2. Write a helpful, concise summary (2-3 sentences) explaining your recommendations based on their query. Format it beautifully with HTML (e.g. <strong>).
3. Return the exact JSON structure below, strictly valid JSON. Return the exact names of the recommended institutions from the database.

{
  "summary": "<strong>AI Insight:</strong> I recommend...",
  "names": ["Exact University Name 1", "Exact University Name 2"]
}`;

        // 3. Call REST API
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.2,
                    response_mime_type: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Gemini API Error Response:", errText);
            throw new Error(`API HTTP error ${response.status}`);
        }

        const data = await response.json();
        
        try {
            let resultText = data.candidates[0].content.parts[0].text;
            resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(resultText);
        } catch (e) {
            console.error("Failed to parse Gemini response", e);
            throw new Error("Invalid AI Response Format");
        }
    }

    // Initial render
    if (sidebar) {
        updateUrlAndFilter(initialQuery, sidebar.state, sortSelect ? sortSelect.value : 'relevance');
    }
});
