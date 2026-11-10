// institution.js - Logic for the Institution Profile page

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof fetchUniversities !== 'function') {
        console.error("fetchUniversities not loaded!");
        return;
    }

    const data = await fetchUniversities();

    // 1. Get Slug from URL
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    const isParentView = urlParams.get('view') === 'parent';

    if (!slug) {
        showError("Institution not specified.");
        return;
    }

    // 2. Find University
    const uni = data.find(u => {
        const uSlug = typeof toSlug === 'function' ? toSlug(u.name) : u.name.replace(/\s+/g, '-').toLowerCase();
        return uSlug === slug;
    });

    if (!uni) {
        showError("Institution not found.");
        return;
    }

    // 3. Update Title & Hero
    document.title = `${uni.name} | TNAU Agri Portal`;
    
    document.getElementById('heroName').textContent = uni.name;
    document.getElementById('heroLocation').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${uni.location}`;
    
    const zoneBadge = uni.zone ? ` • <i class="fa-solid fa-compass"></i> ${uni.zone}` : '';
    const districtBadge = uni.district ? ` • <i class="fa-solid fa-map-pin"></i> ${uni.district}` : '';
    document.getElementById('heroCategory').innerHTML = `<span>${uni.category}${zoneBadge}${districtBadge}</span>`;
    
    const imgUrl = typeof getImageUrl === 'function' ? getImageUrl(uni) : uni.image;
    const heroCover = document.getElementById('heroCover');
    if (heroCover) {
        heroCover.src = imgUrl;
        heroCover.onerror = function() {
            const fallback = typeof DEFAULT_IMAGE !== 'undefined'
                ? DEFAULT_IMAGE
                : 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?fm=jpg&q=60&w=3000&auto=format&fit=crop';
            this.src = fallback;
            this.onerror = null;
        };
    }

    const badgesContainer = document.getElementById('heroBadges');
    if (badgesContainer) {
        let badgeClass = 'badge-constituent';
        if (uni.category === 'Affiliated Colleges') badgeClass = 'badge-affiliated';
        else if (uni.category === 'Research Stations') badgeClass = 'badge-station';
        else if (uni.category === 'Krishi Vigyan Kendras (KVKs)') badgeClass = 'badge-kvk';

        let badgesHtml = `<span class="badge ${badgeClass}"><span class="pulse-dot"></span> ${uni.category}</span>`;
        if (uni.smartData && uni.smartData.naacGrade && uni.smartData.naacGrade !== 'Not Accredited') {
            badgesHtml += `<span class="badge" style="color: var(--color-warm-600);"><i class="fa-solid fa-medal"></i> NAAC ${uni.smartData.naacGrade}</span>`;
        }
        if (uni.smartData && uni.smartData.icarAccredited) {
            badgesHtml += `<span class="badge" style="color: var(--color-primary-600);"><i class="fa-solid fa-award"></i> ICAR Accredited</span>`;
        }
        if (uni.tourUrl && uni.tourUrl !== '#') {
            badgesHtml += `<span class="badge badge-tour"><i class="fa-solid fa-vr-cardboard"></i> 360° Virtual Tour</span>`;
        }
        badgesContainer.innerHTML = badgesHtml;
    }

    // Dynamic Tab Labels based on Category
    const coursesTabBtn = document.querySelector('.tab-btn[data-tab="courses"]');
    if (coursesTabBtn) {
        if (uni.category === 'Research Stations') {
            coursesTabBtn.innerHTML = '<i class="fa-solid fa-flask-vial"></i> <span class="tab-label-full">Crop Mandates</span><span class="tab-label-short">Mandates</span>';
        } else if (uni.category === 'Krishi Vigyan Kendras (KVKs)') {
            coursesTabBtn.innerHTML = '<i class="fa-solid fa-seedling"></i> <span class="tab-label-full">Extension Mandates</span><span class="tab-label-short">Mandates</span>';
        } else {
            coursesTabBtn.innerHTML = '<i class="fa-solid fa-graduation-cap"></i> <span class="tab-label-full">Degree Programs</span><span class="tab-label-short">Programs</span>';
        }
    }

    // Button actions
    const launchTourBtn = document.getElementById('btnLaunchTour');
    if (launchTourBtn) {
        if (uni.tourUrl && uni.tourUrl !== '#') {
            launchTourBtn.onclick = () => {
                let visitedList = JSON.parse(localStorage.getItem('visited_virtually') || '[]');
                if (!visitedList.includes(uni.id)) {
                    visitedList.push(uni.id);
                    localStorage.setItem('visited_virtually', JSON.stringify(visitedList));
                }
                window.open(uni.tourUrl, '_blank');
            };
        } else {
            launchTourBtn.style.display = 'none';
        }
    }

    const modelTourBtn = document.getElementById('btnLaunchModelTour');
    if (modelTourBtn) {
        if (uni.id === 101 || (uni.name && uni.name.toLowerCase().includes('coimbatore'))) {
            modelTourBtn.style.display = 'inline-flex';
        } else {
            modelTourBtn.style.display = 'none';
        }
    }

    const parentViewBtn = document.getElementById('btnParentView');
    if (parentViewBtn) {
        parentViewBtn.onclick = toggleParentView;
    }

    const compareBtn = document.getElementById('btnCompare');
    if (compareBtn) {
        compareBtn.addEventListener('click', () => {
            const slug = typeof toSlug === 'function' ? toSlug(uni.name) : uni.name.replace(/\s+/g, '-').toLowerCase();
            let compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
            if (!compareList.includes(slug)) {
                if (compareList.length >= 3) {
                    if (typeof showToast === 'function') showToast("You can only compare up to 3 institutions.", "error");
                    return;
                }
                compareList.push(slug);
                localStorage.setItem('compareList', JSON.stringify(compareList));
                if (typeof showToast === 'function') showToast("Added to Compare", "success");
            } else {
                if (typeof showToast === 'function') showToast("Already in Compare list", "info");
            }
            window.location.href = 'compare.html';
        });
    }



    // 6. WhatsApp Integration — FIX: Hide button if no real WhatsApp contact available
    const btnWhatsapp = document.getElementById('btnWhatsapp');
    if (btnWhatsapp) {
        const hasWhatsapp = uni.smartData && uni.smartData.whatsapp;
        if (hasWhatsapp) {
            btnWhatsapp.addEventListener('click', (e) => {
                e.preventDefault();
                const phone = uni.smartData.whatsapp.replace(/\D/g, '');
                const message = encodeURIComponent(`Hello Admission Desk, I am interested in admission details for ${uni.name}. Can you please share the fee structure and NRI quota availability?`);
                window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
            });
        } else {
            // Gracefully hide — no fake phone fallback
            btnWhatsapp.style.opacity = '0.4';
            btnWhatsapp.style.pointerEvents = 'none';
            btnWhatsapp.title = 'WhatsApp contact not available for this institution';
            btnWhatsapp.setAttribute('aria-disabled', 'true');
        }
    }

    // 6.5 Brochure Download Integration
    const btnBrochure = document.getElementById('btnDownloadBrochure');
    if (btnBrochure) {
        btnBrochure.addEventListener('click', (e) => {
            e.preventDefault();
            const url = (uni.smartData && uni.smartData.brochureUrl) ? uni.smartData.brochureUrl : "#";
            if (url !== "#") {
                window.open(url, '_blank');
            } else {
                if (typeof showToast === 'function') showToast("Brochure not available currently.", "info");
            }
        });
    }

    // FIX: Apply Now — no longer opens a fake placeholder URL
    const btnApplyNow = document.getElementById('btnApplyNow');
    if (btnApplyNow) {
        btnApplyNow.addEventListener('click', () => {
            const admissionUrl = uni.smartData && uni.smartData.admissionUrl;
            const contactUrl = uni.contactUrl && uni.contactUrl !== '#' ? uni.contactUrl : null;
            // Try specific admission URL first, then contact URL, then Google search
            const destination = admissionUrl || contactUrl ||
                `https://www.google.com/search?q=${encodeURIComponent(uni.name + ' admission 2025')}`;
            if (typeof showToast === 'function') showToast('Opening official admission page...', 'info');
            setTimeout(() => window.open(destination, '_blank'), 600);
        });
    }


    const btnShareParents = document.getElementById('btnShareParents');
    if (btnShareParents) {
        btnShareParents.addEventListener('click', async () => {
            const shareData = {
                title: `${uni.name} Admission Details`,
                text: `Hey, check out this university for my higher studies: ${uni.name} in ${uni.location}.`,
                url: window.location.href,
            };
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.log("Error sharing", err);
                }
            } else {
                navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                if (typeof showToast === 'function') showToast("Link copied to clipboard! Share it with your parents.", "success");
            }
        });
    }

    const btnBookCounselling = document.getElementById('btnBookCounselling');
    const counsellingModal = document.getElementById('counsellingModal');
    const counsellingModalClose = document.getElementById('counsellingModalClose');
    const counsellingForm = document.getElementById('counsellingForm');

    if (btnBookCounselling && counsellingModal) {
        btnBookCounselling.addEventListener('click', () => {
            counsellingModal.style.display = 'flex';
        });

        // FIX: null check before binding close button
        if (counsellingModalClose) {
            counsellingModalClose.addEventListener('click', () => {
                counsellingModal.style.display = 'none';
            });
        }

        counsellingModal.addEventListener('click', (e) => {
            if (e.target === counsellingModal) counsellingModal.style.display = 'none';
        });

        if (counsellingForm) {
            counsellingForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const btn = counsellingForm.querySelector('button');
                const origText = btn.textContent;
                btn.textContent = 'Booking...';
                btn.disabled = true;
                
                try {
                    const date = document.getElementById('counsellingDate').value;
                    const time = document.getElementById('counsellingTime').value;
                    const phone = document.getElementById('counsellingPhone').value;
                    
                    const { data: { session } } = await window.db.auth.getSession();
                    const userName = session?.user?.user_metadata?.full_name || 'Guest User';
                    const userEmail = session?.user?.email || 'guest@example.com';
                    
                    // We must resolve the actual UUID from the DB since uni.id is a local integer in data.js
                    let dbInstId = null;
                    const { data: dbInst } = await window.db.from('institutions').select('id').eq('name', uni.name).single();
                    if (dbInst) {
                        dbInstId = dbInst.id;
                    }
                    
                    if (!dbInstId) {
                        throw new Error("Institution not found in database.");
                    }

                    const { error } = await window.db.from('enquiries').insert([
                        {
                            institution_id: dbInstId,
                            student_name: userName,
                            email: userEmail,
                            phone: phone,
                            query: `[BOOK COUNSELLING] Requested session on ${date} (${time}).`,
                            status: 'pending'
                        }
                    ]);
                    
                    if (error) throw error;
                    
                    counsellingModal.style.display = 'none';
                    if (typeof showToast === 'function') showToast(`Counselling booked for ${date}! We will call you.`, "success");
                    counsellingForm.reset();
                } catch (err) {
                    console.error("Booking error:", err);
                    if (typeof showToast === 'function') {
                        showToast('Failed to book: ' + (err.message || JSON.stringify(err)), 'error');
                    }
                } finally {
                    btn.textContent = origText;
                    btn.disabled = false;
                }
            });
        }
    }

    // 7. Populate Tabs
    populateOverview(uni);
    populateCourses(uni);
    populateFacilities(uni);
    populateSafety(uni);
    populateAccreditation(uni);
    populateAchievements(uni);
    populateEvents(uni);
    
    // Live APIs Integration
    initLiveAPIs(uni);

    // Sidebar
    const sidebar = document.getElementById('instSidebar');
    if (sidebar && typeof renderEnquiryForm === 'function') {
        sidebar.innerHTML = renderEnquiryForm(uni.id, uni.name);
    }

    // 5. Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    function switchTab(tabId) {
        if (window.TTSManager) window.TTSManager.stop();
        
        tabBtns.forEach(btn => btn.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));
        
        const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        const targetPanel = document.getElementById(`tab-${tabId}`);
        
        if (targetBtn) {
            targetBtn.classList.add('active');
            try {
                targetBtn.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center',
                    block: 'nearest'
                });
            } catch (err) {
                targetBtn.scrollIntoView();
            }
        }
        if (targetPanel) targetPanel.classList.add('active');
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    // 6. Handle Parent View
    function toggleParentView() {
        const body = document.body;
        const isParent = body.classList.toggle('parent-view');
        
        if (isParent) {
            switchTab('safety');
            if (typeof showToast === 'function') {
                showToast("Parent View enabled. Highlighting safety and transport.", "success");
            }
            
            // Update URL
            const url = new URL(window.location);
            url.searchParams.set('view', 'parent');
            window.history.replaceState({}, '', url);
        } else {
            switchTab('overview');
            const url = new URL(window.location);
            url.searchParams.delete('view');
            window.history.replaceState({}, '', url);
        }
    }

    if (isParentView) {
        toggleParentView(); // initial load
    }

    // Resolve the Supabase UUID for this institution using its name
    let dbInstId = null;
    const resolveDbId = async () => {
        if (!window.db) return;
        const { data } = await window.db.from('institutions').select('id').eq('name', uni.name).single();
        if (data) dbInstId = data.id;
    };
    
    // 6. Shortlist Logic
    // Use event delegation to ensure all buttons (even dynamically added ones) work
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-shortlist-action');
        if (btn) {
            e.preventDefault();
            // Try to get ID from button dataset, fallback to current uni.id
            const id = parseInt(btn.dataset.id) || uni.id;
            if (id && typeof toggleShortlist === 'function') {
                toggleShortlist(id);
            } else {
                console.error("toggleShortlist is not loaded or ID is missing.");
            }
        }
    });

    // Make sure we set dataset IDs on existing buttons immediately just in case
    const shortlistBtns = document.querySelectorAll('.btn-shortlist-action');
    if (shortlistBtns.length > 0) {
        shortlistBtns.forEach(btn => {
            btn.dataset.id = uni.id; // Assign ID so updateShortlistUI knows which college it is
        });
        
        // Run initial UI state check
        if (typeof updateShortlistUI === 'function') {
            updateShortlistUI();
        }
    }

    // --- Population Helpers ---

    function populateOverview(u) {
        document.getElementById('overviewDesc').textContent = u.description || `${u.name} is a premier institution located in ${u.location}.`;
        
        const sd = u.smartData || {};
        const isAcademic = u.category === "Constituent Colleges" || u.category === "Affiliated Colleges";
        
        let statsHtml = '';
        if (isAcademic) {
            const degCount = (sd.degreesOffered && sd.degreesOffered.length) || (sd.coursesOffered && sd.coursesOffered.length) || 1;
            statsHtml = `
                <div class="stat-box">
                    <div class="stat-box-val">${degCount}</div>
                    <div class="stat-box-label">Degree Programs</div>
                </div>
                <div class="stat-box">
                    <div class="stat-box-val" style="font-size: var(--text-sm); line-height: 1.3;">${u.zone || 'Western Zone'}</div>
                    <div class="stat-box-label">Agro-Climatic Zone</div>
                </div>
                <div class="stat-box">
                    <div class="stat-box-val">${sd.hasHostel ? 'Available' : 'Day Scholar'}</div>
                    <div class="stat-box-label">Hostels</div>
                </div>
                <div class="stat-box">
                    <div class="stat-box-val">${sd.established || '1971'}</div>
                    <div class="stat-box-label">Est. Year</div>
                </div>
            `;
        } else {
            const cropsCount = (sd.crops && sd.crops.length) || 1;
            statsHtml = `
                <div class="stat-box">
                    <div class="stat-box-val">${cropsCount} Focus</div>
                    <div class="stat-box-label">Mandate Crops</div>
                </div>
                <div class="stat-box">
                    <div class="stat-box-val" style="font-size: var(--text-sm); line-height: 1.3;">${u.zone || 'Cauvery Delta'}</div>
                    <div class="stat-box-label">Agro-Climatic Zone</div>
                </div>
                <div class="stat-box">
                    <div class="stat-box-val" style="font-size: var(--text-sm);">${u.district || 'Tamil Nadu'}</div>
                    <div class="stat-box-label">Target District</div>
                </div>
                <div class="stat-box">
                    <div class="stat-box-val">${sd.established || 'TNAU Unit'}</div>
                    <div class="stat-box-label">Est. Year</div>
                </div>
            `;
        }
        document.getElementById('overviewStats').innerHTML = statsHtml;
        
        if (typeof calculateTransparencyScore === 'function') {
            const transparency = calculateTransparencyScore(u);
            const scoreVal = document.getElementById('transparencyScoreVal');
            const scoreBar = document.getElementById('transparencyScoreBar');
            const breakdownList = document.getElementById('transparencyBreakdown');
            
            if (scoreVal) scoreVal.textContent = `${transparency.total}%`;
            
            if (scoreBar) {
                let color = '#f59e0b';
                let textColor = '#b45309';
                if (transparency.total < 50) {
                    color = '#ef4444'; textColor = '#b91c1c';
                } else if (transparency.total >= 80) {
                    color = '#22c55e'; textColor = '#15803d';
                }

                scoreBar.style.backgroundColor = color;
                scoreBar.style.transition = 'width 1.2s ease-in-out, background-color 0.5s ease';
                if (scoreVal) {
                    scoreVal.style.color = textColor;
                    scoreVal.style.transition = 'color 0.5s ease';
                }
                setTimeout(() => {
                    scoreBar.style.width = `${transparency.total}%`;
                }, 100);
            }
            
            if (breakdownList) {
                const breakdownHtml = transparency.breakdown.map(item => `
                    <li style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>${item.label}</span>
                        <span>
                            ${item.met 
                                ? '<i class="fa-solid fa-circle-check" style="color: var(--color-success-500);"></i> <span style="font-size: 11px; color: var(--color-success-600)">Verified</span>' 
                                : '<i class="fa-solid fa-circle-xmark" style="color: var(--color-neutral-400);"></i> <span style="font-size: 11px; color: var(--color-neutral-500)">Missing</span>'}
                        </span>
                    </li>
                `).join('');
                breakdownList.style.listStyleType = 'none';
                breakdownList.style.paddingLeft = '0';
                breakdownList.innerHTML = breakdownHtml;
            }
        }
    }

    function populateCourses(u) {
        const container = document.getElementById('coursesList');
        if (!container) return;
        
        const sd = u.smartData || {};
        const isAcademic = u.category === "Constituent Colleges" || u.category === "Affiliated Colleges";

        if (isAcademic) {
            const rawPrograms = (sd.degreesOffered && sd.degreesOffered.length > 0) 
                ? sd.degreesOffered 
                : (sd.coursesOffered || ["B.Sc. (Hons.) Agriculture"]);

            container.innerHTML = rawPrograms.map(c => {
                const title = typeof c === 'string' ? c : (c.title || c.name || c.program || 'Degree Program');
                const subtitle = (typeof c === 'object' && c.duration) ? c.duration : '4-Year Professional Undergraduate Degree (ICAR / TNAU Approved)';
                const safeTitle = title.replace(/'/g, "\\'");
                return `
                <div class="course-item">
                    <div>
                        <h4 style="font-size: var(--text-base); color: var(--color-primary-900); display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-graduation-cap" style="color: var(--color-primary-600);"></i> ${title}
                        </h4>
                        <p style="font-size: var(--text-sm); color: var(--color-neutral-600); margin-top: 4px;">${subtitle}</p>
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="if(typeof openAiExplainer === 'function') openAiExplainer('${safeTitle}')">
                        <i class="fa-solid fa-sparkles"></i> AI Explain
                    </button>
                </div>
                `;
            }).join('');
        } else {
            // Research Stations & KVKs
            const focus = sd.keyFocus || 'Regional Crop Research & Seed Production';
            const crops = sd.crops || ['Paddy', 'Millets', 'Pulses'];
            
            let mandatesHtml = `
                <div class="course-item" style="flex-direction: column; align-items: flex-start; gap: 12px; background: var(--color-primary-50); border-color: var(--color-primary-200);">
                    <div>
                        <span class="badge ${u.category === 'Research Stations' ? 'badge-station' : 'badge-kvk'}" style="margin-bottom: 8px;">
                            <i class="fa-solid fa-bullseye"></i> Primary Mandate
                        </span>
                        <h4 style="font-size: var(--text-lg); color: var(--color-primary-950); margin: 6px 0;">${focus}</h4>
                        <p style="font-size: var(--text-sm); color: var(--color-neutral-700);">Serving farmers and agricultural researchers across the <strong>${u.zone || 'Tamil Nadu'}</strong> agro-ecological zone.</p>
                    </div>
                </div>

                <div style="margin-top: var(--space-4);">
                    <h4 style="font-size: var(--text-base); color: var(--color-primary-900); margin-bottom: var(--space-3);">Target Crops & Disciplines:</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${crops.map(crop => `
                            <div style="background: white; border: 1px solid var(--color-primary-200); padding: 8px 14px; border-radius: var(--radius-full); font-size: var(--text-sm); color: var(--color-primary-900); display: flex; align-items: center; gap: 6px; box-shadow: var(--shadow-sm);">
                                <i class="fa-solid fa-leaf" style="color: var(--color-primary-500); font-size: 11px;"></i> ${crop}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="course-item" style="margin-top: var(--space-4);">
                    <div>
                        <h4 style="font-size: var(--text-base); color: var(--color-primary-900);"><i class="fa-solid fa-flask-vial"></i> Technical Advisory & Services</h4>
                        <p style="font-size: var(--text-sm); color: var(--color-neutral-600);">Quality Breeder Seeds, Soil Testing, Pest Diagnostics, and Farmer Field Days</p>
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="if(typeof openAiExplainer === 'function') openAiExplainer('${focus.replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-sparkles"></i> AI Mandate Details
                    </button>
                </div>
            `;
            container.innerHTML = mandatesHtml;
        }
    }

    function populateFacilities(u) {
        const container = document.getElementById('facilitiesList');
        if (!container) return;
        
        const facilities = u.smartData && u.smartData.facilities ? u.smartData.facilities : ["Library", "Labs", "Sports"];
        
        const iconMap = {
            "Smart Classrooms": "fa-chalkboard-user",
            "High-Tech Computer Labs": "fa-network-wired",
            "Central Library": "fa-book-open-reader",
            "Innovation & Incubation Center": "fa-rocket",
            "College Buses": "fa-bus",
            "AC & Non-AC Hostels": "fa-building-user",
            "EV Charging Stations": "fa-charging-station",
            "Metro Connectivity": "fa-train-subway",
            "Indoor Sports Complex": "fa-volleyball",
            "Swimming Pool": "fa-water-ladder",
            "Modern Gymnasium": "fa-dumbbell",
            "Multi-Cuisine Food Court": "fa-utensils",
            "Cafeteria & Bakery": "fa-mug-hot",
            "Campus-Wide Wi-Fi": "fa-wifi",
            "AC Classrooms": "fa-snowflake",
            "Auditorium": "fa-masks-theater",
            "On-Campus Clinic": "fa-briefcase-medical",
            // New additions
            "Advanced Research Laboratories": "fa-microscope",
            "Center of Excellence (CoE)": "fa-award",
            "Student Startup Cell": "fa-lightbulb",
            "Technology Transfer Office": "fa-file-signature",
            "Maker Space / Tinkering Lab": "fa-hammer",
            "Industry MoUs & Partnerships": "fa-handshake",
            "Skill Development Center": "fa-user-graduate",
            "International Collaborations": "fa-earth-americas",
            "Global Student Exchange Programs": "fa-plane-departure",
            "Corporate Sponsored Labs": "fa-building",
            "Campus Community Radio": "fa-microphone-lines",
            "Extension & Outreach Activities": "fa-people-carry-box",
            "Corporate Social Responsibility (CSR) Cell": "fa-hands-holding-child",
            "NSS & NCC Units": "fa-medal",
            "Cultural & Fine Arts Clubs": "fa-masks-theater",
            "Centralized Instrumentation Facility": "fa-microchip",
            "Digital Language Lab": "fa-language",
            "e-Learning & Smart Video Studios": "fa-video"
        };
        
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(140px, 1fr))';
        container.style.gap = 'var(--space-4)';
        
        container.innerHTML = facilities.map(f => `
            <div style="
                background: white; 
                padding: var(--space-4) var(--space-2); 
                border: 1px solid var(--color-neutral-200); 
                border-radius: var(--radius-lg);
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                gap: var(--space-3);
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                cursor: default;
            " onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 20px -3px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.05)';">
                <div style="
                    background: var(--color-primary-50); 
                    width: 48px; 
                    height: 48px; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: var(--color-primary-600); 
                    font-size: 1.25rem;
                ">
                    <i class="fa-solid ${iconMap[f] || 'fa-building-circle-check'}"></i>
                </div>
                <span style="font-weight: 600; font-size: 13px; color: var(--color-neutral-800); line-height: 1.3;">${f}</span>
            </div>
        `).join('');
    }

    function populateSafety(u) {
        const container = document.getElementById('safetyList');
        if (!container) return;
        
        const safety = u.smartData && u.smartData.safetyFeatures ? u.smartData.safetyFeatures : [
            "24/7 Security Personnel",
            "Fire Safety Compliant",
            "First Aid Facility",
            "Disaster Management Cell"
        ];
        
        // Resilient keyword icon resolver (verified Font Awesome 6 Free icons only)
        const getSafetyIcon = (text) => {
            const t = String(text || '').toLowerCase();
            if (t.includes('security') || t.includes('guard') || t.includes('patrol')) return 'fa-user-shield';
            if (t.includes('fire')) return 'fa-fire-extinguisher';
            if (t.includes('first aid') || t.includes('medical') || t.includes('clinic') || t.includes('ambulance') || t.includes('health')) return 'fa-kit-medical';
            if (t.includes('disaster') || t.includes('emergency') || t.includes('evacuat') || t.includes('cell')) return 'fa-person-shelter';
            if (t.includes('cctv') || t.includes('surveillance') || t.includes('camera') || t.includes('video')) return 'fa-video';
            if (t.includes('women') || t.includes('girl')) return 'fa-person-dress';
            if (t.includes('ragging') || t.includes('ban')) return 'fa-ban';
            if (t.includes('id') || t.includes('card') || t.includes('badge')) return 'fa-id-card';
            if (t.includes('bio') || t.includes('fingerprint')) return 'fa-fingerprint';
            if (t.includes('wifi') || t.includes('firewall') || t.includes('cyber')) return 'fa-shield-halved';
            if (t.includes('sms') || t.includes('alert') || t.includes('bell')) return 'fa-bell';
            if (t.includes('lock') || t.includes('payment')) return 'fa-lock';
            return 'fa-shield-halved';
        };
        
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(210px, 1fr))';
        container.style.gap = 'var(--space-3)';
        
        container.innerHTML = safety.map(s => `
            <div style="
                background: white; 
                padding: 12px 14px; 
                border: 1px solid var(--color-neutral-200); 
                border-radius: var(--radius-lg);
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                min-height: 60px;
                box-sizing: border-box;
            ">
                <div style="
                    background: #ebf5ee; 
                    width: 36px; 
                    height: 36px; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: #166534; 
                    font-size: 1rem;
                    flex-shrink: 0;
                ">
                    <i class="fa-solid ${getSafetyIcon(s)}"></i>
                </div>
                <span style="font-weight: 600; font-size: 13px; color: var(--color-neutral-800); line-height: 1.3;">${s}</span>
            </div>
        `).join('');
    }

    function populateAccreditation(u) {
        const container = document.getElementById('accreditationList');
        if (!container) return;
        
        const approvals = u.smartData && u.smartData.approvals ? u.smartData.approvals : ["Recognized Institution"];
        
        container.innerHTML = approvals.map(a => `
            <div class="feature-item" style="background: var(--color-neutral-50); padding: var(--space-3); border-radius: var(--radius-sm);">
                <i class="fa-solid fa-certificate" style="color: var(--color-warm-500);"></i>
                <span style="font-weight: 500;">${a}</span>
            </div>
        `).join('');
    }

    function populateAchievements(u) {
        const container = document.getElementById('achievementsList');
        if (!container) return;
        
        // Standard high-end achievements for the model project
        const achievements = [
            { title: "Golden Jubilee Excellence", desc: "Celebrating 50+ years of academic excellence and institutional legacy.", icon: "fa-trophy", color: "var(--color-warm-500)" },
            { title: "State Rank #1 in Student Placements", desc: "Recognized for maintaining the highest placement records for 3 consecutive years.", icon: "fa-medal", color: "var(--color-primary-600)" },
            { title: "Award-Winning Green Campus", desc: "Awarded the 'Most Sustainable & Eco-Friendly Campus' by the State Environment Board.", icon: "fa-leaf", color: "var(--color-success-600)" },
            { title: "Top 10 Innovator Award", desc: "Recognized by the Ministry of Education for outstanding student startups and patents.", icon: "fa-star", color: "var(--color-accent-500)" },
            { title: "100+ University Gold Medalists", desc: "A proud history of producing top university rank holders and academic champions.", icon: "fa-graduation-cap", color: "var(--color-warm-600)" },
            { title: "Record-Breaking 95%+ Placement Rate", desc: "Consistent track record of placing students in top-tier multinational corporations.", icon: "fa-briefcase", color: "var(--color-primary-700)" },
            { title: "Global Alumni Network Excellence", desc: "Honored for building a strong, active network of over 100,000 successful alumni worldwide.", icon: "fa-globe", color: "var(--color-accent-600)" },
            { title: "Best Industry-Academia Interface", desc: "Awarded for creating the best industry-aligned curriculum and corporate training programs.", icon: "fa-handshake-angle", color: "var(--color-primary-500)" }
        ];
        
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        container.style.gap = 'var(--space-4)';
        
        container.innerHTML = achievements.map(ach => `
            <div style="
                background: white; 
                padding: var(--space-5); 
                border: 1px solid var(--color-neutral-200); 
                border-radius: var(--radius-lg);
                display: flex;
                flex-direction: column;
                gap: var(--space-3);
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            " onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 20px -3px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.05)';">
                <div style="
                    background: ${ach.color}15; 
                    width: 56px; 
                    height: 56px; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: ${ach.color}; 
                    font-size: 1.5rem;
                ">
                    <i class="fa-solid ${ach.icon}"></i>
                </div>
                <h4 style="margin: 0; font-size: var(--text-lg); color: var(--color-primary-900);">${ach.title}</h4>
                <p style="margin: 0; font-size: var(--text-sm); color: var(--color-neutral-600); line-height: 1.5;">${ach.desc}</p>
            </div>
        `).join('');
    }

    function populateEvents(u) {
        const container = document.getElementById('eventsList');
        if (!container) return;
        
        // Standard exciting events for the model project
        const events = [
            { title: "TechFest 2026 (National Tech Symposium)", date: "Next Month", tag: "Technical", desc: "A 3-day mega technical festival featuring 24-hour hackathons, robotics competitions, and coding challenges with students from across the country.", color: "var(--color-primary-600)" },
            { title: "Annual Cultural Extravaganza", date: "In 2 Months", tag: "Cultural", desc: "The biggest cultural celebration of the year featuring music concerts, dance battles, fashion shows, and celebrity guest performances.", color: "var(--color-accent-600)" },
            { title: "Mega Job Fair & Recruitment Drive", date: "Next Week", tag: "Placements", desc: "Over 50+ top multinational companies visiting the campus for direct hiring, internships, and networking.", color: "var(--color-success-600)" },
            { title: "Global Alumni Meet & Greet", date: "In 3 Months", tag: "Networking", desc: "A grand reunion connecting current students with highly successful alumni from all over the world for mentorship and networking.", color: "var(--color-warm-600)" },
            { title: "Inter-University National Sports Meet", date: "Next Semester", tag: "Sports", desc: "A massive multi-day sports tournament featuring track and field, basketball, cricket, and indoor games with rival universities.", color: "var(--color-primary-800)" },
            { title: "AI & Future Tech Summit", date: "This Weekend", tag: "Workshop", desc: "Exclusive guest lectures, hands-on workshops, and seminars by industry leaders in Artificial Intelligence and Cloud Computing.", color: "var(--color-neutral-800)" }
        ];
        
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
        container.style.gap = 'var(--space-4)';
        
        container.innerHTML = events.map(ev => `
            <div style="
                background: white; 
                border: 1px solid var(--color-neutral-200); 
                border-radius: var(--radius-lg);
                display: flex;
                flex-direction: column;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                overflow: hidden;
            " onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 20px -3px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.05)';">
                
                <div style="
                    background: ${ev.color}15; 
                    padding: var(--space-4);
                    border-bottom: 1px solid var(--color-neutral-100);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span style="background: ${ev.color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${ev.tag}</span>
                    <span style="color: ${ev.color}; font-size: 13px; font-weight: 600;"><i class="fa-regular fa-calendar-check" style="margin-right: 4px;"></i> ${ev.date}</span>
                </div>
                
                <div style="padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2);">
                    <h4 style="margin: 0; font-size: var(--text-lg); color: var(--color-primary-900);">${ev.title}</h4>
                    <p style="margin: 0; font-size: var(--text-sm); color: var(--color-neutral-600); line-height: 1.5;">${ev.desc}</p>
                </div>
            </div>
        `).join('');
    }

    async function initLiveAPIs(u) {
        // Init Weather
        const weatherWidget = document.getElementById('weatherWidget');
        if (weatherWidget && window.WeatherAPI) {
            weatherWidget.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--color-primary-500); padding: 20px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p style="margin-top: 10px;">Fetching live climate data...</p></div>`;
            const weatherData = await window.WeatherAPI.fetchCampusWeather(u.location);
            window.WeatherAPI.renderWeatherWidget('weatherWidget', weatherData);
        }

        // Bind Nearby Buttons
        const nearbyContainer = 'nearbyList';
        const nearbyBtns = [
            { id: 'btnNearbyTransit', type: 'transit', icon: 'fa-train' },
            { id: 'btnNearbyHospital', type: 'hospital', icon: 'fa-hospital' },
            { id: 'btnNearbyHostel', type: 'hotel', icon: 'fa-hotel' },
            { id: 'btnNearbyAirport', type: 'airport', icon: 'fa-plane' }
        ];

        nearbyBtns.forEach(btn => {
            const el = document.getElementById(btn.id);
            if (el && window.NearbyAPI) {
                el.addEventListener('click', async () => {
                    document.getElementById(nearbyContainer).innerHTML = `<div style="grid-column: 1 / -1; width: 100%; text-align: center; color: var(--color-primary-500); padding: 40px 20px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p style="margin-top: 10px;">Searching area...</p></div>`;
                    const places = await window.NearbyAPI.fetchNearbyPlaces(u.location, btn.type);
                    window.NearbyAPI.renderNearbyList(nearbyContainer, places, btn.icon);
                });
            }
        });
        
        // Auto-load Transit on initial open
        const firstBtn = document.getElementById('btnNearbyTransit');
        if (firstBtn) firstBtn.click();
    }

    function showError(msg) {
        document.body.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px;">
                <h1 style="font-family: var(--font-heading); color: var(--color-primary-900); margin-bottom: 16px;">Oops!</h1>
                <p style="color: var(--color-neutral-600); margin-bottom: 24px;">${msg}</p>
                <a href="search.html" style="padding: 10px 20px; background: var(--color-primary-700); color: white; text-decoration: none; border-radius: 6px;">Back to Search</a>
            </div>
        `;
    }

    // Auto-trigger shortlist if redirected from login
    if (urlParams.get('action') === 'shortlist') {
        // Wait a short moment for auth to be fully loaded, then trigger click
        setTimeout(() => {
            const btn = document.querySelector('.btn-shortlist-action');
            if (btn) {
                // Remove the param so it doesn't re-trigger on refresh
                const newUrl = new URL(window.location);
                newUrl.searchParams.delete('action');
                window.history.replaceState({}, '', newUrl);
                
                btn.click();
            }
        }, 1000); // 1s delay to ensure supabase-client is initialized
    }
});
