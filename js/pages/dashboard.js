// dashboard.js - Logic for Student Dashboard

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Protect Route
    if (typeof requireAuth !== 'function') {
        console.error("Auth helper not loaded.");
        return;
    }
    
    const user = await requireAuth();
    if (!user) return; // User is redirected
    
    // FIX: Don't trust localStorage for admin routing \u2014 it can be set by any user in DevTools.
    // Always verify against Supabase session for access control decisions.
    const bypassEmail = (typeof CONFIG !== 'undefined' && CONFIG.ADMIN_BYPASS_EMAIL) || 'vrtrichy@gmail.com';
    const isBypass = user.email === bypassEmail;
    const { data: adminCheck } = await window.db
        .from('institutions')
        .select('id')
        .eq('managed_by', user.id)
        .limit(1);
    const isRealAdmin = isBypass || (adminCheck && adminCheck.length > 0);

    if (isRealAdmin) {
        localStorage.setItem('userRole', 'admin'); // Keep in sync for UI display
        window.location.href = 'admin-dashboard.html';
        return;
    }
    localStorage.setItem('userRole', 'student'); // Keep in sync for UI display

    
    // 2. Fetch Data
    if (typeof fetchUniversities !== 'function') {
        console.error("Data fetcher not loaded.");
        return;
    }
    const allUniversities = await fetchUniversities();
    
    // 3. Tab Logic
    const tabs = document.querySelectorAll('.dashboard-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    // Global function so HTML inline onclicks can trigger tab switching
    window.switchDashboardTab = function(target) {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.style.display = 'none');
        
        const targetTab = document.querySelector(`.dashboard-tab[data-target="${target}"]`);
        if(targetTab) targetTab.classList.add('active');
        
        const targetView = document.getElementById(`${target}View`);
        if (targetView) {
            targetView.style.display = 'block';
            targetView.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    };
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            window.switchDashboardTab(tab.dataset.target);
        });
    });
    
    // 4. Load Data
    loadShortlist(user.id, allUniversities);
    loadEnquiries(user.id, allUniversities);
    loadRecommended(allUniversities);
    setupProfile(user, allUniversities);
    
    // 5. Listen for updates (e.g. enquiry deleted) to refresh UI
    document.addEventListener('enquiriesUpdated', async () => {
        await loadEnquiries(user.id, allUniversities);
    });
});

function loadRecommended(allUniversities) {
    const grid = document.getElementById('recommendedGrid');
    if (!grid) return;
    
    const prefLocation = localStorage.getItem('prefLocation');
    const prefCourse = localStorage.getItem('prefCourse');
    
    let filtered = allUniversities;
    
    // Filter by Location if set
    if (prefLocation) {
        filtered = filtered.filter(u => u.location && u.location.toLowerCase().includes(prefLocation.toLowerCase()));
    }
    
    // Fallback: If less than 6 match the location, pad with high-trust colleges
    if (filtered.length < 6) {
        const topUnis = allUniversities
            .filter(u => u.category === 'Deemed to be Universities' || u.category === 'State Universities')
            .filter(u => !filtered.find(f => f.id === u.id));
            
        filtered = [...filtered, ...topUnis];
    }
    
    const topUnis = filtered.slice(0, 6);
    
    // Update the stat card to match exactly how many are shown
    const statMatches = document.getElementById('statMatches');
    if (statMatches) statMatches.textContent = topUnis.length;
        
    grid.innerHTML = topUnis.map(u => createInstitutionCard(u)).join('');
}

function setupProfile(user, allUniversities) {
    const emailEl = document.getElementById('profileEmail');
    const nameEl = document.getElementById('profileName');
    
    if (emailEl) emailEl.textContent = user.email;
    if (nameEl) nameEl.textContent = user.user_metadata?.full_name || 'Student Explorer';
    
    // Load prefs
    const prefCourse = document.getElementById('prefCourse');
    const prefLocation = document.getElementById('prefLocation');
    const prefBudget = document.getElementById('prefBudget');
    
    if (prefCourse) prefCourse.value = localStorage.getItem('prefCourse') || '';
    if (prefLocation) prefLocation.value = localStorage.getItem('prefLocation') || '';
    if (prefBudget) prefBudget.value = localStorage.getItem('prefBudget') || '';
    
    const form = document.getElementById('profileForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            localStorage.setItem('prefCourse', prefCourse.value);
            localStorage.setItem('prefLocation', prefLocation.value);
            localStorage.setItem('prefBudget', prefBudget.value);
            
            // Re-render recommendations based on new preferences
            if (allUniversities) {
                loadRecommended(allUniversities);
            }
            
            const btn = form.querySelector('button');
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved';
            setTimeout(() => btn.innerHTML = 'Save Preferences', 2000);
        });
    }
}

async function loadShortlist(userId, allUniversities) {
    const grid = document.getElementById('shortlistGrid');
    
    try {
        if (!window.db) throw new Error("Database not initialized");
        const { data: { session } } = await window.db.auth.getSession();
        if (!session) return;

        const { data: shortlists, error } = await window.db
            .from('shortlists')
            .select(`
                institution_id,
                institutions ( name )
            `)
            .eq('user_id', session.user.id);
            
        if (error) throw error;
        
        // Match with universities data by name, and attach dbId
        const savedUnis = [];
        shortlists.forEach(s => {
            if (s.institutions && s.institutions.name) {
                const uni = allUniversities.find(u => u.name === s.institutions.name);
                if (uni) {
                    savedUnis.push({ ...uni, dbId: s.institution_id });
                }
            }
        });
        
        // Update Stat Card
        const statSaved = document.getElementById('statSaved');
        if (statSaved) statSaved.textContent = savedUnis.length;
        
        if (savedUnis.length === 0) {
            grid.innerHTML = `
                <div class="empty-dashboard" style="grid-column: 1 / -1;">
                    <i class="fa-solid fa-wand-magic-sparkles" style="font-size: var(--text-4xl); color: var(--color-primary-500); margin-bottom: var(--space-4);"></i>
                    <h3>No Saved Institutions</h3>
                    <p style="color: var(--color-neutral-600); margin-top: var(--space-2);">Not sure where to start? Let AI analyze your profile and find the perfect matches for you.</p>
                    <div style="display: flex; gap: var(--space-2); justify-content: center; margin-top: var(--space-4);">
                        <a href="index.html#ai-recommender" class="btn btn-primary"><i class="fa-solid fa-robot"></i> Use AI Recommender</a>
                        <a href="search.html" class="btn btn-outline">Browse All</a>
                    </div>
                </div>
            `;
            return;
        }
        grid.innerHTML = '';
        savedUnis.forEach(uni => {
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            
            wrapper.innerHTML = createInstitutionCard(uni);
            
            // Hide default buttons to prevent overlap with the remove button
            const defaultBtns = wrapper.querySelectorAll('.btn-bookmark, .btn-compare');
            defaultBtns.forEach(btn => btn.style.display = 'none');
            
            // Inject a remove button
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            removeBtn.style.position = 'absolute';
            removeBtn.style.top = '10px';
            removeBtn.style.right = '10px';
            removeBtn.style.background = 'white';
            removeBtn.style.border = 'none';
            removeBtn.style.color = 'var(--color-neutral-500)';
            removeBtn.style.width = '32px';
            removeBtn.style.height = '32px';
            removeBtn.style.borderRadius = '50%';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.display = 'flex';
            removeBtn.style.alignItems = 'center';
            removeBtn.style.justifyContent = 'center';
            removeBtn.style.boxShadow = 'var(--shadow-sm)';
            removeBtn.style.zIndex = '10';
            removeBtn.title = 'Remove from Shortlist';
            
            removeBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if(confirm('Remove this institution from your shortlist?')) {
                    removeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    const { error } = await window.db.from('shortlists').delete().match({
                        user_id: session.user.id,
                        institution_id: uni.dbId
                    });
                    
                    if (!error) {
                        wrapper.remove();
                        if(grid.children.length === 0) loadShortlist(userId, allUniversities); // Reload empty state
                    } else {
                        console.error("Delete error", error);
                        removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
                        if (typeof showToast === 'function') showToast("Could not remove item.", "error");
                    }
                }
            });
            
            wrapper.appendChild(removeBtn);

            // Add Notes Section
            const notesContainer = document.createElement('div');
            notesContainer.style.marginTop = 'var(--space-2)';
            notesContainer.style.padding = 'var(--space-2)';
            notesContainer.style.background = 'var(--color-neutral-50)';
            notesContainer.style.borderRadius = 'var(--radius-md)';
            notesContainer.style.border = '1px solid var(--color-neutral-200)';
            
            const savedNote = localStorage.getItem(`uni_notes_${uni.id}`) || '';
            const savedStatus = localStorage.getItem(`uni_status_${uni.id}`) || 'Exploring';
            
            let progressWidth = '25%';
            let progressColor = 'var(--color-primary-500)';
            if (savedStatus === 'Applied') progressWidth = '50%';
            else if (savedStatus === 'Admitted') { progressWidth = '100%'; progressColor = '#2ed573'; }
            else if (savedStatus === 'Rejected') { progressWidth = '100%'; progressColor = '#ff4757'; }
            
            notesContainer.innerHTML = `
                <div style="font-size: var(--text-xs); color: var(--color-neutral-600); margin-bottom: var(--space-1); display: flex; justify-content: space-between; align-items: center;">
                    <span><i class="fa-solid fa-clipboard-list"></i> Application Status</span>
                </div>
                <select class="form-select status-select" style="margin-bottom: var(--space-3); font-size: var(--text-sm); padding: 4px; border-color: var(--color-neutral-300);">
                    <option value="Exploring" ${savedStatus === 'Exploring' ? 'selected' : ''}>Exploring</option>
                    <option value="Applied" ${savedStatus === 'Applied' ? 'selected' : ''}>Application Submitted</option>
                    <option value="Admitted" ${savedStatus === 'Admitted' ? 'selected' : ''}>Admitted</option>
                    <option value="Rejected" ${savedStatus === 'Rejected' ? 'selected' : ''}>Rejected</option>
                </select>
                
                <!-- Progress Bar -->
                <div style="width: 100%; height: 6px; background: var(--color-neutral-200); border-radius: 3px; margin-bottom: var(--space-4); overflow: hidden;">
                    <div style="height: 100%; width: ${progressWidth}; background: ${progressColor}; transition: all 0.3s ease;"></div>
                </div>

                <div style="font-size: var(--text-xs); color: var(--color-neutral-600); margin-bottom: var(--space-1);"><i class="fa-solid fa-pen"></i> My Notes</div>
                <textarea class="form-textarea" style="min-height: 60px; font-size: var(--text-sm); padding: var(--space-2);" placeholder="Add personal notes here...">${savedNote}</textarea>
                <div style="display: flex; justify-content: flex-end; margin-top: var(--space-2);">
                    <button class="btn btn-sm btn-outline btn-save-note">Save Updates</button>
                </div>
            `;
            
            const saveBtn = notesContainer.querySelector('.btn-save-note');
            const textarea = notesContainer.querySelector('textarea');
            const statusSelect = notesContainer.querySelector('.status-select');
            
            saveBtn.addEventListener('click', () => {
                const note = textarea.value.trim();
                const status = statusSelect.value;
                localStorage.setItem(`uni_notes_${uni.id}`, note);
                localStorage.setItem(`uni_status_${uni.id}`, status);
                saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved';
                saveBtn.classList.remove('btn-outline');
                saveBtn.classList.add('btn-primary');
                setTimeout(() => {
                    saveBtn.innerHTML = 'Save';
                    saveBtn.classList.remove('btn-primary');
                    saveBtn.classList.add('btn-outline');
                }, 2000);
            });
            
            wrapper.appendChild(notesContainer);

            grid.appendChild(wrapper);
        });
        const btnShareShortlist = document.getElementById('btnShareShortlist');
        if (btnShareShortlist && savedUnis.length > 0) {
            btnShareShortlist.style.display = 'inline-block';
            btnShareShortlist.onclick = async () => {
                let text = "Here are my top shortlisted colleges:\n\n";
                savedUnis.forEach((u, i) => {
                    text += `${i + 1}. ${u.name} (${u.location})\n`;
                });
                text += "\nWhat do you think?";
                
                const shareData = {
                    title: "My College Shortlist",
                    text: text
                };
                
                if (navigator.share) {
                    try { await navigator.share(shareData); } catch (err) {}
                } else {
                    navigator.clipboard.writeText(text);
                    if (typeof showToast === 'function') showToast("Shortlist copied to clipboard!", "success");
                }
            };
        } else if (btnShareShortlist) {
            btnShareShortlist.style.display = 'none';
        }
        
    } catch (error) {
        console.error("Error loading shortlist", error);
        grid.innerHTML = '<p style="color: red; padding: 20px;">Failed to load your shortlist. Please try again.</p>';
    }
}

async function loadEnquiries(userId, allUniversities) {
    const container = document.getElementById('enquiriesView');
    
    try {
        const { data, error } = await window.db
            .from('enquiries')
            .select('*')
            // Match enquiries to the current user by email, since the form doesn't require login
            // A better architecture would be to have user_id on enquiries, but for now we filter by auth session email
            // Let's get the user email first
            // Wait, we need to get user email
            
        // Actually we don't have user_id in the enquiries table yet (only institution_id, student_name, email, phone, query).
        // Let's fetch the current user's email:
        const { data: { user } } = await window.db.auth.getUser();
        if (!user) return;
        
        const { data: enquiriesData, error: enquiriesError } = await window.db
            .from('enquiries')
            .select('*, institutions(name)')
            .ilike('email', user.email)
            .order('created_at', { ascending: false });
            
        if (enquiriesError) throw enquiriesError;
        
        if (!enquiriesData || enquiriesData.length === 0) {
            // Leave the empty state as is
            const statEnq = document.getElementById('statEnquiries');
            if (statEnq) statEnq.textContent = '0';
            return;
        }
        
        // Update Stat
        const statEnq = document.getElementById('statEnquiries');
        if (statEnq) statEnq.textContent = enquiriesData.length;
        
        // Build list
        let html = '<div class="enquiries-list" style="display: flex; flex-direction: column; gap: var(--space-4);">';
        
        enquiriesData.forEach(enq => {
            let uniName = 'Unknown Institution';
            if (enq.institutions && enq.institutions.name) {
                uniName = enq.institutions.name;
            } else {
                const uni = allUniversities.find(u => u.id == enq.institution_id);
                if (uni) uniName = uni.name;
            }
            const date = new Date(enq.created_at).toLocaleDateString();
            
            html += `
                <div class="enquiry-card" style="background: white; border-radius: var(--radius-md); padding: var(--space-4); box-shadow: var(--shadow-sm); border: 1px solid var(--color-neutral-200);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-2);">
                        <div style="display: flex; gap: var(--space-3); align-items: center;">
                            <h3 style="font-size: var(--text-lg); color: var(--color-primary-900); margin: 0;">${uniName}</h3>
                            <span style="padding: 4px 12px; border-radius: 20px; border: 1px solid ${(!enq.status || enq.status === 'pending') ? 'var(--color-warning-400)' : 'var(--color-success-400)'}; font-size: 12px; font-weight: 600; background: ${(!enq.status || enq.status === 'pending') ? 'var(--color-warning-50)' : 'var(--color-success-50)'}; color: ${(!enq.status || enq.status === 'pending') ? 'var(--color-warning-700)' : 'var(--color-success-700)'}; display: flex; align-items: center; gap: 4px;">
                                ${(!enq.status || enq.status === 'pending') ? '<i class="fa-solid fa-clock"></i> Pending' : '<i class="fa-solid fa-check"></i> Accepted'}
                            </span>
                        </div>
                        <span style="font-size: var(--text-sm); color: var(--color-neutral-500);">${date}</span>
                    </div>
                    <p style="color: var(--color-neutral-700); margin-bottom: var(--space-2);"><strong>Query:</strong> ${enq.query || 'No message provided'}</p>
                    <div style="display: flex; gap: var(--space-4); font-size: var(--text-sm); color: var(--color-neutral-600); flex-wrap: wrap;">
                        <span><i class="fa-solid fa-user"></i> ${enq.student_name || 'N/A'}</span>
                        <span><i class="fa-solid fa-phone"></i> ${enq.phone}</span>
                        <span><i class="fa-solid fa-envelope"></i> ${enq.email}</span>
                    </div>
                    <div style="margin-top: var(--space-3); text-align: right;">
                        <button onclick="window.deleteEnquiry('${enq.id}')" class="btn btn-outline btn-sm" style="color: var(--color-danger-600); border-color: var(--color-danger-600);"><i class="fa-solid fa-trash"></i> Delete</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error("Error loading enquiries", error);
    }
}
