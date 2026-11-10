// compare.js - Logic for side-by-side comparison

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof fetchUniversities !== 'function') {
        console.error("fetchUniversities not loaded!");
        return;
    }

    const data = await fetchUniversities();
    const urlParams = new URLSearchParams(window.location.search);
    const urlIds = urlParams.getAll('id'); // e.g. ?id=anna-university&id=srm
    const localIds = JSON.parse(localStorage.getItem('compareList') || '[]');
    let ids = [...new Set([...urlIds, ...localIds])].slice(0, 3);
    localStorage.setItem('compareList', JSON.stringify(ids));
    
    // Selectors
    const compSelect = document.getElementById('compSelect');
    const compAddBtn = document.getElementById('compAddBtn');
    const compareTableContainer = document.getElementById('compareTableContainer');
    
    // 1. Populate dropdown
    if (compSelect) {
        // Sort alphabetically
        const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name));
        
        const customSelectOptions = document.getElementById('customSelectOptions');
        const customSelectTrigger = document.getElementById('customSelectTrigger');
        const customSelectLabel = document.getElementById('customSelectLabel');
        const customSelectWrapper = document.getElementById('customSelectWrapper');

        sortedData.forEach(u => {
            const slug = typeof toSlug === 'function' ? toSlug(u.name) : u.name.replace(/\s+/g, '-').toLowerCase();
            
            // Native option (for logic)
            const option = document.createElement('option');
            option.value = slug;
            option.textContent = u.name;
            compSelect.appendChild(option);
            
            // Custom option (for UI)
            if (customSelectOptions) {
                const customOpt = document.createElement('div');
                customOpt.className = 'custom-option';
                customOpt.textContent = u.name;
                customOpt.dataset.value = slug;
                
                customOpt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    compSelect.value = slug;
                    if (customSelectLabel) customSelectLabel.textContent = u.name;
                    customSelectOptions.classList.remove('open');
                });
                
                customSelectOptions.appendChild(customOpt);
            }
        });
        
        // Custom Dropdown Toggle Logic
        if (customSelectTrigger && customSelectOptions) {
            customSelectTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                customSelectOptions.classList.toggle('open');
            });
            
            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (customSelectWrapper && !customSelectWrapper.contains(e.target)) {
                    customSelectOptions.classList.remove('open');
                }
            });
        }
    }

    // 2. Add Button Logic
    if (compAddBtn && compSelect) {
        compAddBtn.addEventListener('click', () => {
            const slug = compSelect.value;
            if (!slug) return;
            
            if (ids.length >= 3) {
                if (typeof showToast === 'function') showToast("You can compare up to 3 institutions at a time.", "error");
                return;
            }
            
            if (ids.includes(slug)) {
                if (typeof showToast === 'function') showToast("This institution is already in the comparison.", "error");
                return;
            }
            
            // Update localStorage and reload
            ids.push(slug);
            localStorage.setItem('compareList', JSON.stringify(ids));
            window.location.href = 'compare.html';
        });
    }

    // 3. Render Table
    function renderTable() {
        if (!compareTableContainer) return;
        
        if (ids.length === 0) {
            compareTableContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-code-compare" style="font-size: var(--text-5xl); color: var(--color-neutral-300); margin-bottom: var(--space-4);"></i>
                    <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-2);">Select Institutions to Compare</h3>
                    <p style="color: var(--color-neutral-600); max-width: 400px; margin: 0 auto;">Use the dropdown above to add up to 3 institutions for a side-by-side comparison.</p>
                </div>
            `;
            return;
        }

        // Find selected unis
        // FIX: compareList always stores slugs now — no numeric ID fallback needed
        const selectedUnis = ids.map(id => {
            return data.find(u => {
                const slug = typeof toSlug === 'function' ? toSlug(u.name) : u.name.replace(/\s+/g, '-').toLowerCase();
                return slug === id;
            });
        }).filter(Boolean);

        if (selectedUnis.length === 0) {
            compareTableContainer.innerHTML = '<p>Selected institutions not found.</p>';
            return;
        }

        // Build HTML
        let html = `
            <div class="compare-swipe-hint">
                <i class="fa-solid fa-arrows-left-right"></i>
                <span>Swipe horizontally to compare institutions</span>
            </div>
            <div class="compare-table-wrapper">
                <table class="compare-table">
                    <thead>
                        <tr>
                            <th>Feature</th>
                            ${selectedUnis.map((u) => {
                                const slug = typeof toSlug === 'function' ? toSlug(u.name) : u.name.replace(/\s+/g, '-').toLowerCase();
                                const imgUrl = typeof getImageUrl === 'function' ? getImageUrl(u) : u.image;
                                return `
                                    <th>
                                        <div class="comp-inst-card">
                                            <div class="comp-inst-remove" onclick="removeCompare('${slug}')" title="Remove">
                                                <i class="fa-solid fa-xmark"></i>
                                            </div>
                                            <div class="comp-inst-img" style="background-image: url('${imgUrl}');"></div>
                                            <div class="comp-inst-name"><a href="institution.html?slug=${slug}" style="color: inherit;">${u.name}</a></div>
                                            <div style="font-size: var(--text-sm); font-weight: normal; color: var(--color-neutral-600);">${u.category}</div>
                                            <a href="institution.html?slug=${slug}" class="btn btn-primary btn-sm" style="margin: var(--space-3) auto 0; width: 140px; max-width: 100%;">View Profile</a>
                                        </div>
                                    </th>
                                `;
                            }).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Helper for rows
        const renderRow = (label, valueExtractor, isHtml = false) => {
            let row = `<tr><td>${label}</td>`;
            selectedUnis.forEach(u => {
                const val = valueExtractor(u);
                row += `<td>${isHtml ? val : escapeHTML(val)}</td>`;
            });
            row += `</tr>`;
            return row;
        };

        const renderSection = (title) => {
            return `<tr class="section-header"><td colspan="${selectedUnis.length + 1}">${title}</td></tr>`;
        };

        const renderBool = (val) => {
            return val 
                ? `<span class="bool-yes"><i class="fa-solid fa-check"></i> Yes</span>` 
                : `<span class="bool-no"><i class="fa-solid fa-xmark"></i> No</span>`;
        };

        const renderList = (arr) => {
            if (!arr || arr.length === 0) return '-';
            return `<ul class="comp-list">${arr.map(item => `<li>${item}</li>`).join('')}</ul>`;
        };

        const escapeHTML = (str) => {
            if (str === null || str === undefined) return '-';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        };

        // --- Basics ---
        html += renderSection("Overview");
        html += renderRow("Location", u => u.location);
        html += renderRow("Trust Score", u => `${typeof calculateTrustScore === 'function' ? calculateTrustScore(u) : '5.0'}/10`);
        html += renderRow("NAAC Grade", u => u.smartData && u.smartData.naacGrade ? u.smartData.naacGrade : "Not Accredited");
        html += renderRow("Campus Type", u => u.smartData && u.smartData.campusType ? u.smartData.campusType : "Urban");

        // --- Academics ---
        html += renderSection("Academics");
        html += renderRow("Programs", u => {
            if (u.smartData && u.smartData.coursesOffered) {
                return renderList(u.smartData.coursesOffered);
            }
            return "General Programs";
        }, true);
        
        // --- Facilities ---
        html += renderSection("Facilities");
        html += renderRow("Hostel", u => renderBool(u.smartData && u.smartData.hasHostel), true);
        html += renderRow("360° Tour", u => renderBool(u.tourUrl && u.tourUrl !== '#'), true);
        html += renderRow("Key Facilities", u => {
            if (u.smartData && u.smartData.facilities) {
                return renderList(u.smartData.facilities);
            }
            return "-";
        }, true);

        // --- Safety ---
        html += renderSection("Safety (Parent View)");
        html += renderRow("Women's College", u => renderBool(u.smartData && u.smartData.institutionTags && u.smartData.institutionTags.includes("Women's college")), true);
        html += renderRow("Safety Features", u => {
            if (u.smartData && u.smartData.safetyFeatures) {
                return renderList(u.smartData.safetyFeatures);
            }
            return "-";
        }, true);

        html += `
                    </tbody>
                </table>
            </div>
        `;

        compareTableContainer.innerHTML = html;
    }

    // Expose remove function globally
    window.removeCompare = function(slug) {
        ids = ids.filter(id => id !== slug);
        localStorage.setItem('compareList', JSON.stringify(ids));
        window.location.href = 'compare.html';
    };

    renderTable();
});
