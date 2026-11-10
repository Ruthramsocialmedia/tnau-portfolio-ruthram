// filter-sidebar.js - Search page filter component

class FilterSidebar {
    constructor(containerId, data) {
        this.container = document.getElementById(containerId);
        this.data = data || [];
        this.state = {
            categories: [],
            zones: [],
            districts: [],
            degrees: [],
            accreditations: [],
            features: []
        };
        
        if (this.container && this.data.length > 0) {
            this.extractOptions();
            this.render();
            this.attachEventListeners();
        }
    }

    extractOptions() {
        // Categories with preferred TNAU order
        const allCategories = [...new Set(this.data.map(u => u.category))].filter(Boolean);
        const preferredOrder = [
            "Constituent Colleges",
            "Affiliated Colleges",
            "Research Stations",
            "Krishi Vigyan Kendras (KVKs)"
        ];
        allCategories.sort((a, b) => {
            const idxA = preferredOrder.indexOf(a);
            const idxB = preferredOrder.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });

        this.options = {
            categories: allCategories,
            zones: [...new Set(this.data.map(u => u.zone))].filter(Boolean).sort(),
            districts: [...new Set(this.data.map(u => 
                u.district || (typeof getCity === 'function' ? getCity(u.location) : u.location.split(',')[0].trim())
            ))].filter(Boolean).sort(),
            degrees: [...new Set(this.data.flatMap(u => 
                (u.smartData && u.smartData.degreesOffered) ? u.smartData.degreesOffered : 
                ((u.smartData && u.smartData.coursesOffered) ? u.smartData.coursesOffered : [])
            ))].filter(Boolean).sort(),
            accreditations: [...new Set(this.data.flatMap(u => u.smartData && u.smartData.approvals ? u.smartData.approvals : []))].filter(Boolean).sort()
        };
    }

    renderSection(title, key, options, isExpanded = true) {
        return `
            <div class="filter-group">
                <div class="filter-group-header" data-toggle="${key}">
                    <h4>${title}</h4>
                    <i class="fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}"></i>
                </div>
                <div class="filter-options" id="filter-${key}" style="display: ${isExpanded ? 'flex' : 'none'};">
                    ${options.map(opt => `
                        <label class="filter-checkbox">
                            <input type="checkbox" data-group="${key}" value="${opt}" ${this.state[key].includes(opt) ? 'checked' : ''}>
                            ${opt}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }

    render() {
        const html = `
            <div class="filter-sidebar">
                <div class="filter-header">
                    <h3>Filters</h3>
                    <div style="display: flex; gap: var(--space-4); align-items: center;">
                        <span class="clear-filters" id="clearAllFilters">Clear All</span>
                        <button class="filter-close-btn" id="closeFilterBtn" aria-label="Close Filters"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
                
                ${this.renderSection('Institution Type', 'categories', this.options.categories)}
                ${this.renderSection('Agro-Climatic Zone', 'zones', this.options.zones, false)}
                ${this.renderSection('District / City', 'districts', this.options.districts, false)}
                ${this.renderSection('Degree Programs / Mandates', 'degrees', this.options.degrees, false)}
                ${this.renderSection('Accreditations', 'accreditations', this.options.accreditations, false)}
                
                <div class="filter-group">
                    <div class="filter-group-header" data-toggle="features">
                        <h4>Special Features</h4>
                        <i class="fa-solid fa-chevron-up"></i>
                    </div>
                    <div class="filter-options" id="filter-features" style="display: flex;">
                        <label class="filter-checkbox">
                            <input type="checkbox" data-group="features" value="hasTour" ${this.state.features.includes('hasTour') ? 'checked' : ''}>
                            Virtual Tour Available
                        </label>
                    </div>
                </div>

                <div class="mobile-filter-apply-bar">
                    <button type="button" class="btn btn-primary" id="mobileApplyFiltersBtn" style="width: 100%; justify-content: center; display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-check"></i> Apply Filters
                    </button>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
    }

    attachEventListeners() {
        // Toggle sections
        const headers = this.container.querySelectorAll('.filter-group-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const key = header.getAttribute('data-toggle');
                const content = this.container.querySelector(`#filter-${key}`);
                const icon = header.querySelector('i');
                if (content.style.display === 'none') {
                    content.style.display = 'flex';
                    icon.className = 'fa-solid fa-chevron-up';
                } else {
                    content.style.display = 'none';
                    icon.className = 'fa-solid fa-chevron-down';
                }
            });
        });

        // Checkboxes
        const checkboxes = this.container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                const group = e.target.getAttribute('data-group');
                const value = e.target.value;
                
                if (e.target.checked) {
                    if (!this.state[group].includes(value)) {
                        this.state[group].push(value);
                    }
                } else {
                    this.state[group] = this.state[group].filter(v => v !== value);
                }
                
                this.dispatchChange();
            });
        });

        // Clear All
        const clearBtn = this.container.querySelector('#clearAllFilters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAll();
            });
        }

        // Mobile Drawer Toggle & Backdrop
        const closeBtn = this.container.querySelector('#closeFilterBtn');
        const mobileFilterBtn = document.getElementById('mobileFilterBtn');
        const sidebar = this.container.querySelector('.filter-sidebar');
        
        let backdrop = document.getElementById('filter-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'filter-backdrop';
            backdrop.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 390; display: none; opacity: 0; transition: opacity 0.3s;';
            document.body.appendChild(backdrop);
        }

        const closeSidebar = () => {
            if(sidebar) sidebar.classList.remove('open');
            if(backdrop) {
                backdrop.style.opacity = '0';
                setTimeout(() => backdrop.style.display = 'none', 300);
            }
            document.body.style.overflow = '';
        };

        const openSidebar = () => {
            if(backdrop) {
                backdrop.style.display = 'block';
                setTimeout(() => backdrop.style.opacity = '1', 10);
            }
            if(sidebar) sidebar.classList.add('open');
            document.body.style.overflow = 'hidden';
        };

        const mobileApplyBtn = this.container.querySelector('#mobileApplyFiltersBtn');

        if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
        if (backdrop) backdrop.addEventListener('click', closeSidebar);
        if (mobileApplyBtn) mobileApplyBtn.addEventListener('click', closeSidebar);
        if (mobileFilterBtn) {
            mobileFilterBtn.onclick = openSidebar;
        }
    }

    clearAll() {
        this.state = {
            categories: [],
            zones: [],
            districts: [],
            degrees: [],
            accreditations: [],
            features: []
        };
        const checkboxes = this.container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        this.dispatchChange();
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
        this.attachEventListeners();
    }

    dispatchChange() {
        const event = new CustomEvent('filter-change', { detail: this.state });
        this.container.dispatchEvent(event);
    }
}
