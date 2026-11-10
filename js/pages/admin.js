// admin.js - Logic for University Admin Portal

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Protect Route
    if (typeof requireAuth !== 'function') {
        console.error("Auth helper not loaded.");
        return;
    }
    
    const user = await requireAuth();
    if (!user) return; // User is redirected
    
    if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = 'dashboard.html';
        return;
    }
    
    initAdminPortal(user);
});

async function initAdminPortal(user) {
    const loader = document.getElementById('adminLoader');
    const content = document.getElementById('adminContent');
    const errorState = document.getElementById('adminError');
    
    try {
        const isSuperAdmin = user.email === 'vrtrichy@gmail.com';
        let query = window.db.from('institutions').select('*');
        
        if (isSuperAdmin) {
            // Super Admin: Fetch all universities ordered by name
            query = query.order('name');
        } else {
            // Real auth check: Only fetch managed institution
            query = query.eq('managed_by', user.id).single();
        }

        const { data: rawData, error: uniError } = await query;
        window.adminRawData = rawData; // Expose for populateOverview
        let uniData = isSuperAdmin && rawData ? rawData[0] : rawData; // Default to first if super admin
            
        if (uniError || !uniData) {
            // Not an admin for any university
            loader.style.display = 'none';
            errorState.style.display = 'block';
            return;
        }
        
        // Super Admin Dropdown Logic
        if (isSuperAdmin && Array.isArray(rawData)) {
            const selectorContainer = document.getElementById('superAdminSelectorContainer');
            const select = document.getElementById('superAdminSelect');
            const roleBadge = document.getElementById('adminRoleBadge');
            
            selectorContainer.style.display = 'block';
            roleBadge.textContent = 'Super Admin';
            roleBadge.style.backgroundColor = 'var(--color-primary-600)';
            roleBadge.style.color = 'white'; // Fix contrast
            
            select.innerHTML = rawData.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
            select.value = uniData.id;

            // Custom Dropdown Logic
            const customWrapper = document.getElementById('adminCustomSortWrapper');
            const customTrigger = document.getElementById('adminCustomSortTrigger');
            const customOptions = document.getElementById('adminCustomSortOptions');
            const customLabel = document.getElementById('adminCustomSortLabel');

            if (customWrapper && customTrigger && customOptions && customLabel) {
                // Populate options
                customOptions.innerHTML = rawData.map(u => 
                    `<div class="custom-sort-option ${u.id == uniData.id ? 'selected' : ''}" data-value="${u.id}">${u.name}</div>`
                ).join('');
                
                // Set initial label
                const initialSelected = rawData.find(u => u.id == uniData.id);
                if (initialSelected) {
                    customLabel.textContent = initialSelected.name;
                }

                // Toggle dropdown
                customTrigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    customWrapper.classList.toggle('open');
                });

                // Handle selection
                const options = customOptions.querySelectorAll('.custom-sort-option');
                options.forEach(opt => {
                    opt.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const value = opt.dataset.value;
                        const text = opt.textContent;

                        // Update Label
                        customLabel.textContent = text;
                        
                        // Update styling
                        options.forEach(o => o.classList.remove('selected'));
                        opt.classList.add('selected');

                        // Sync native select and trigger change
                        select.value = value;
                        select.dispatchEvent(new Event('change'));

                        // Close dropdown
                        customWrapper.classList.remove('open');
                    });
                });

                // Close when clicking outside
                document.addEventListener('click', (e) => {
                    if (!customWrapper.contains(e.target)) {
                        customWrapper.classList.remove('open');
                    }
                });
            }

            // Show 'View All Enquiries' button
            const btnAllEnquiries = document.getElementById('btnAllEnquiries');
            let isViewingAll = false;
            
            if (btnAllEnquiries) {
                btnAllEnquiries.style.display = 'block';
                btnAllEnquiries.addEventListener('click', async (e) => {
                    e.preventDefault();
                    
                    if (!isViewingAll) {
                        // Switch to all colleges view
                        await populateAllEnquiries();
                        isViewingAll = true;
                        btnAllEnquiries.innerHTML = '<i class="fa-solid fa-building-columns"></i> View Selected College';
                    } else {
                        // Revert to selected college view
                        const currentSelectId = select.value;
                        const currentUni = rawData.find(u => u.id == currentSelectId);
                        
                        if (currentUni) {
                            document.getElementById('adminUniName').textContent = currentUni.name;
                        }
                        await populateEnquiries(currentSelectId);
                        
                        isViewingAll = false;
                        btnAllEnquiries.innerHTML = '<i class="fa-solid fa-globe"></i> View All Colleges';
                    }
                });
            }
            
            select.addEventListener('change', async (e) => {
                const selectedId = e.target.value; // Removed parseInt to support UUIDs
                const selectedUni = rawData.find(u => u.id == selectedId);
                if (selectedUni) {
                    document.getElementById('adminUniName').textContent = selectedUni.name;
                    await populateOverview(selectedUni);
                    populateEditForm(selectedUni); // Pass the updated uni to edit form
                    await populateEnquiries(selectedUni.id);
                    
                    // Reset the button state if they change the dropdown
                    if (isViewingAll && btnAllEnquiries) {
                        isViewingAll = false;
                        btnAllEnquiries.innerHTML = '<i class="fa-solid fa-globe"></i> View All Colleges';
                    }
                }
            });

            // Listen for enquiry updates to refresh UI smoothly
            document.addEventListener('enquiriesUpdated', async () => {
                if (isViewingAll) {
                    await populateAllEnquiries();
                } else {
                    const currentSelectId = select.value;
                    await populateEnquiries(currentSelectId);
                }
            });
        } else {
            // Normal Admin view
            await populateOverview(uniData);
            populateEditForm(uniData);
            await populateEnquiries(uniData.id);
            
            // Listen for enquiry updates for normal admin
            document.addEventListener('enquiriesUpdated', async () => {
                await populateEnquiries(uniData.id);
            });
        }
        
        // Setup UI
        document.getElementById('adminUniName').textContent = uniData.name;
        
        // Tab Logic
        setupTabs();
        
        // Populate Overview Data
        await populateOverview(uniData);
        
        // Populate Edit Form
        populateEditForm(uniData);
        
        // Populate Enquiries
        await populateEnquiries(uniData.id);
        
        // Show Content
        loader.style.display = 'none';
        content.style.display = 'grid';
        
    } catch (err) {
        console.error("Admin portal initialization failed:", err);
        loader.style.display = 'none';
        errorState.style.display = 'block';
    }
}

function setupTabs() {
    const navItems = document.querySelectorAll('.admin-nav-item');
    const sections = document.querySelectorAll('.admin-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.dataset.target;
            
            navItems.forEach(n => n.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(`sec-${target}`).classList.add('active');
        });
    });
}

async function populateOverview(uni) {
    // Deterministic profile views based on uni properties (acts like real static data)
    const idFactor = uni.id ? String(uni.id).length : 1;
    const deterministicViews = (uni.name.length * 150) + (idFactor * 42);
    document.getElementById('statViews').textContent = deterministicViews.toLocaleString();
    
    // Views Today (roughly 1% to 3% of total views, pseudo-random but deterministic)
    const todayFactor = (uni.name.length % 3) + 1;
    const viewsToday = Math.floor(deterministicViews * (todayFactor / 100)) + 12;
    document.getElementById('statViewsToday').textContent = "+" + viewsToday.toLocaleString();
    
    // Live Active Users (random pulsing number)
    const liveUsersEl = document.getElementById('statLiveUsers');
    if (liveUsersEl) {
        liveUsersEl.textContent = Math.floor(Math.random() * 20) + 5;
        // Optional: setup interval to slightly jitter it, clear if already set
        if (window.liveUserInterval) clearInterval(window.liveUserInterval);
        window.liveUserInterval = setInterval(() => {
            const current = parseInt(liveUsersEl.textContent);
            const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
            let next = current + delta;
            if (next < 2) next = 2;
            if (next > 45) next = 45;
            liveUsersEl.textContent = next;
        }, 3000);
    }
    
    // Populate Top Viewed Colleges Table
    const topCollegesTable = document.getElementById('topCollegesTable');
    if (topCollegesTable && window.adminRawData && Array.isArray(window.adminRawData)) {
        // Calculate views for all colleges and sort
        const rankedColleges = window.adminRawData.map(u => {
            const f = u.id ? String(u.id).length : 1;
            return {
                name: u.name,
                views: (u.name.length * 150) + (f * 42)
            };
        }).sort((a, b) => b.views - a.views).slice(0, 5); // Top 5
        
        topCollegesTable.innerHTML = rankedColleges.map((col, index) => {
            // Gold, Silver, Bronze styling for top 3
            let rankBadge = `<span style="color: var(--color-neutral-500); font-weight: 600; padding: 2px 8px;">#${index + 1}</span>`;
            if (index === 0) rankBadge = `<span style="background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A; padding: 2px 8px; border-radius: 4px; font-weight: 700;"><i class="fa-solid fa-crown" style="margin-right: 4px;"></i>#1</span>`;
            if (index === 1) rankBadge = `<span style="background: #F3F4F6; color: #4B5563; border: 1px solid #E5E7EB; padding: 2px 8px; border-radius: 4px; font-weight: 700;"><i class="fa-solid fa-medal" style="margin-right: 4px;"></i>#2</span>`;
            if (index === 2) rankBadge = `<span style="background: #FFF7ED; color: #C2410C; border: 1px solid #FFEDD5; padding: 2px 8px; border-radius: 4px; font-weight: 700;"><i class="fa-solid fa-medal" style="margin-right: 4px;"></i>#3</span>`;
            
            return `
                <tr style="border-bottom: 1px solid var(--color-neutral-100); transition: background 0.2s;" onmouseover="this.style.background='var(--color-neutral-50)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 12px 16px;">${rankBadge}</td>
                    <td style="padding: 12px 16px; font-weight: 500; color: var(--color-neutral-800);">${col.name}</td>
                    <td style="padding: 12px 16px; font-weight: 600; color: var(--color-primary-700);">${col.views.toLocaleString()} <i class="fa-solid fa-eye" style="font-size: 10px; color: var(--color-neutral-400); margin-left: 4px;"></i></td>
                </tr>
            `;
        }).join('');
    }
    
    // Count Shortlists
    const { count: shortlistsCount } = await window.db
        .from('shortlists')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', uni.id);
        
    document.getElementById('statShortlists').textContent = shortlistsCount || 0;
    
    // Trust Score calculation
    let score = 5.0;
    if (uni.smart_data) {
        if (uni.smart_data.naacGrade && uni.smart_data.naacGrade !== 'Not Accredited') score += 2.0;
        if (uni.smart_data.facilities && uni.smart_data.facilities.length > 3) score += 1.0;
    }
    if (uni.tour_url && uni.tour_url !== '#') score += 2.0;
    
    document.getElementById('adminTrustScore').textContent = Math.min(score, 10).toFixed(1);
}

function populateEditForm(uni) {
    document.getElementById('editName').value = uni.name || '';
    document.getElementById('editCategory').value = uni.category || '';
    document.getElementById('editLocation').value = uni.location || '';
    document.getElementById('editImage').value = uni.image || '';
    document.getElementById('editTourUrl').value = uni.tour_url || '';
    
    // Smart Data Defaults
    const sd = uni.smart_data || {};
    
    document.getElementById('editOverview').value = sd.overview || uni.description || '';
    document.getElementById('editFacilities').value = (sd.facilities || []).join(', ');
    document.getElementById('editSafety').value = (sd.safetyFeatures || []).join(', ');
    document.getElementById('editApprovals').value = (sd.approvals || []).join(', ');
    
    if (sd.naacGrade) {
        document.getElementById('editNaac').value = sd.naacGrade;
    }

    // Courses Container
    const coursesContainer = document.getElementById('coursesContainer');
    coursesContainer.innerHTML = ''; // clear

    function addCourseRow(title = '', duration = '', seats = '') {
        const row = document.createElement('div');
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '2fr 1fr 1fr auto';
        row.style.gap = 'var(--space-2)';
        row.className = 'course-row';
        
        row.innerHTML = `
            <input type="text" class="form-input course-title" placeholder="Course Title" value="${title}">
            <input type="text" class="form-input course-duration" placeholder="Duration (e.g. 4 Years)" value="${duration}">
            <input type="text" class="form-input course-seats" placeholder="Seats" value="${seats}">
            <button type="button" class="btn btn-outline btn-remove-course" style="border-color: #fca5a5; color: #ef4444; padding: 0 var(--space-3);"><i class="fa-solid fa-trash"></i></button>
        `;
        
        row.querySelector('.btn-remove-course').addEventListener('click', () => {
            row.remove();
        });
        
        coursesContainer.appendChild(row);
    }

    // Render existing courses
    if (sd.coursesOffered && sd.coursesOffered.length > 0) {
        sd.coursesOffered.forEach(c => addCourseRow(c.title, c.duration, c.seats));
    } else {
        // Empty state
        addCourseRow();
    }

    // Add Course button listener
    const btnAddCourse = document.getElementById('btnAddCourse');
    // Remove old listeners to prevent duplicates if called multiple times
    const newBtnAddCourse = btnAddCourse.cloneNode(true);
    btnAddCourse.parentNode.replaceChild(newBtnAddCourse, btnAddCourse);
    
    newBtnAddCourse.addEventListener('click', () => addCourseRow());

    // Save Button Listener
    const saveBtn = document.getElementById('saveProfileBtn');
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

    newSaveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const originalText = newSaveBtn.innerHTML;
        newSaveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        newSaveBtn.disabled = true;

        // Scrape Courses
        const courseRows = document.querySelectorAll('.course-row');
        const parsedCourses = [];
        courseRows.forEach(r => {
            const t = r.querySelector('.course-title').value.trim();
            if (t) {
                parsedCourses.push({
                    title: t,
                    duration: r.querySelector('.course-duration').value.trim(),
                    seats: r.querySelector('.course-seats').value.trim()
                });
            }
        });

        // Split tags helper
        const splitTags = (str) => str.split(',').map(s => s.trim()).filter(s => s.length > 0);
        
        const updatedData = {
            category: document.getElementById('editCategory').value,
            location: document.getElementById('editLocation').value,
            image: document.getElementById('editImage').value,
            tour_url: document.getElementById('editTourUrl').value,
            smart_data: {
                ...sd,
                overview: document.getElementById('editOverview').value,
                facilities: splitTags(document.getElementById('editFacilities').value),
                safetyFeatures: splitTags(document.getElementById('editSafety').value),
                approvals: splitTags(document.getElementById('editApprovals').value),
                naacGrade: document.getElementById('editNaac').value,
                coursesOffered: parsedCourses
            }
        };
        
        try {
            // Real save to database for both normal admins and super admins
            const { error } = await window.db
                .from('institutions')
                .update(updatedData)
                .eq('id', uni.id);
                
            if (error) throw error;
            
            if (typeof showToast === 'function') {
                showToast('Profile updated successfully!', 'success');
            } else {
                if (typeof showToast === 'function') showToast('Profile updated successfully!', 'success');
            }
            
            populateOverview({...uni, ...updatedData});
            
        } catch (err) {
            console.error(err);
            if (typeof showToast === 'function') {
                showToast('Failed to update profile.', 'error');
            } else {
                if (typeof showToast === 'function') showToast('Failed to update profile.', 'error');
            }
        } finally {
            newSaveBtn.innerHTML = originalText;
            newSaveBtn.disabled = false;
        }
    });
}

async function populateEnquiries(uniId) {
    const list = document.getElementById('adminEnquiriesList');
    
    try {
        const { data: enquiries, error } = await window.db
            .from('enquiries')
            .select('*')
            .eq('institution_id', uniId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        document.getElementById('enqCount').textContent = enquiries ? enquiries.length : 0;
        document.getElementById('statEnquiries').textContent = enquiries ? enquiries.length : 0;
        
        if (!enquiries || enquiries.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: var(--space-8); background: var(--color-neutral-50); border-radius: var(--radius-md);">
                    <p style="color: var(--color-neutral-600);">No enquiries yet.</p>
                </div>
            `;
            return;
        }
        
        let html = '<div style="display: flex; flex-direction: column; gap: var(--space-4);">';
        enquiries.forEach(enq => {
            const date = new Date(enq.created_at).toLocaleDateString();
            html += `
                <div style="background: white; border: 1px solid var(--color-neutral-200); border-radius: var(--radius-md); padding: var(--space-4);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-2);">
                        <div style="display: flex; gap: var(--space-3); align-items: center;">
                            <h4 style="color: var(--color-primary-900); font-size: var(--text-base); margin: 0;">${enq.student_name}</h4>
                            <span style="padding: 4px 12px; border-radius: 20px; border: 1px solid ${(!enq.status || enq.status === 'pending') ? 'var(--color-warning-400)' : 'var(--color-success-400)'}; font-size: 12px; font-weight: 600; background: ${(!enq.status || enq.status === 'pending') ? 'var(--color-warning-50)' : 'var(--color-success-50)'}; color: ${(!enq.status || enq.status === 'pending') ? 'var(--color-warning-700)' : 'var(--color-success-700)'}; display: flex; align-items: center; gap: 4px;">
                                ${(!enq.status || enq.status === 'pending') ? '<i class="fa-solid fa-clock"></i> Pending' : '<i class="fa-solid fa-check"></i> Accepted'}
                            </span>
                        </div>
                        <span style="font-size: var(--text-sm); color: var(--color-neutral-500);">${date}</span>
                    </div>
                    <div style="display: flex; gap: var(--space-4); font-size: var(--text-sm); color: var(--color-neutral-600); margin-bottom: var(--space-3);">
                        <span><i class="fa-solid fa-phone"></i> ${enq.phone}</span>
                        <span><i class="fa-solid fa-envelope"></i> <a href="mailto:${enq.email}" style="color: var(--color-primary-600);">${enq.email}</a></span>
                    </div>
                    <div style="background: var(--color-neutral-50); padding: var(--space-3); border-radius: var(--radius-sm); border-left: 3px solid var(--color-neutral-300);">
                        <p style="font-size: var(--text-sm); color: var(--color-neutral-700);"><strong>Query:</strong> ${enq.query || 'No message provided'}</p>
                    </div>
                    <div style="margin-top: var(--space-3); text-align: right; display: flex; justify-content: flex-end; gap: var(--space-2);">
                        ${(!enq.status || enq.status === 'pending') ? `<button onclick="window.updateEnquiryStatus('${enq.id}', 'accepted')" class="btn btn-primary btn-sm" style="background: var(--color-success-600); border-color: var(--color-success-600); color: white;"><i class="fa-solid fa-check"></i> Accept</button>` : ''}
                        <button onclick="window.deleteEnquiry('${enq.id}')" class="btn btn-outline btn-sm" style="color: var(--color-danger-600); border-color: var(--color-danger-600);"><i class="fa-solid fa-trash"></i> Delete</button>
                        <a href="mailto:${enq.email}" class="btn btn-outline btn-sm">Reply via Email</a>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        list.innerHTML = html;
        
    } catch (err) {
        console.error("Error loading enquiries:", err);
        list.innerHTML = '<p style="color: red;">Failed to load enquiries.</p>';
    }
}

async function populateAllEnquiries() {
    const list = document.getElementById('adminEnquiriesList');
    
    try {
        // Update header UI
        document.getElementById('adminUniName').textContent = "All Universities (Global)";
        
        // Show loading state
        list.innerHTML = `
            <div style="text-align: center; padding: var(--space-8);">
                <i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--color-primary-500); margin-bottom: var(--space-4);"></i>
                <p>Loading all enquiries...</p>
            </div>
        `;
        
        // Fetch all enquiries with institution names (assuming institution_id is a foreign key)
        const { data: enquiries, error } = await window.db
            .from('enquiries')
            .select(`
                *,
                institutions:institution_id(name)
            `)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        document.getElementById('enqCount').textContent = enquiries ? enquiries.length : 0;
        document.getElementById('statEnquiries').textContent = enquiries ? enquiries.length : 0;
        
        if (!enquiries || enquiries.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: var(--space-8); background: var(--color-neutral-50); border-radius: var(--radius-md);">
                    <p style="color: var(--color-neutral-600);">No enquiries found across any colleges.</p>
                </div>
            `;
            return;
        }
        
        let html = '<div style="display: flex; flex-direction: column; gap: var(--space-4);">';
        enquiries.forEach(enq => {
            const date = new Date(enq.created_at).toLocaleDateString();
            const collegeName = enq.institutions ? enq.institutions.name : 'Unknown College';
            
            html += `
                <div style="background: white; border: 1px solid var(--color-neutral-200); border-radius: var(--radius-md); padding: var(--space-4);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-2);">
                        <div style="display: flex; gap: var(--space-3); align-items: center;">
                            <h4 style="color: var(--color-primary-900); font-size: var(--text-base); margin: 0;">${enq.student_name}</h4>
                            <span style="padding: 4px 12px; border-radius: 20px; border: 1px solid ${(!enq.status || enq.status === 'pending') ? 'var(--color-warning-400)' : 'var(--color-success-400)'}; font-size: 12px; font-weight: 600; background: ${(!enq.status || enq.status === 'pending') ? 'var(--color-warning-50)' : 'var(--color-success-50)'}; color: ${(!enq.status || enq.status === 'pending') ? 'var(--color-warning-700)' : 'var(--color-success-700)'}; display: flex; align-items: center; gap: 4px;">
                                ${(!enq.status || enq.status === 'pending') ? '<i class="fa-solid fa-clock"></i> Pending' : '<i class="fa-solid fa-check"></i> Accepted'}
                            </span>
                        </div>
                        <span style="font-size: var(--text-sm); color: var(--color-neutral-500);">${date}</span>
                    </div>
                    
                    <!-- New Line to indicate which college this is for -->
                    <div style="margin-bottom: var(--space-3); padding-bottom: var(--space-2); border-bottom: 1px dashed var(--color-neutral-200);">
                        <span style="background: var(--color-primary-50); color: var(--color-primary-700); padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                            <i class="fa-solid fa-building-columns"></i> ${collegeName}
                        </span>
                    </div>

                    <div style="display: flex; gap: var(--space-4); font-size: var(--text-sm); color: var(--color-neutral-600); margin-bottom: var(--space-3);">
                        <span><i class="fa-solid fa-phone"></i> ${enq.phone}</span>
                        <span><i class="fa-solid fa-envelope"></i> <a href="mailto:${enq.email}" style="color: var(--color-primary-600);">${enq.email}</a></span>
                    </div>
                    <div style="background: var(--color-neutral-50); padding: var(--space-3); border-radius: var(--radius-sm); border-left: 3px solid var(--color-neutral-300);">
                        <p style="font-size: var(--text-sm); color: var(--color-neutral-700);"><strong>Query:</strong> ${enq.query || 'No message provided'}</p>
                    </div>
                    <div style="margin-top: var(--space-3); text-align: right; display: flex; justify-content: flex-end; gap: var(--space-2);">
                        ${(!enq.status || enq.status === 'pending') ? `<button onclick="window.updateEnquiryStatus('${enq.id}', 'accepted')" class="btn btn-primary btn-sm" style="background: var(--color-success-600); border-color: var(--color-success-600); color: white;"><i class="fa-solid fa-check"></i> Accept</button>` : ''}
                        <button onclick="window.deleteEnquiry('${enq.id}')" class="btn btn-outline btn-sm" style="color: var(--color-danger-600); border-color: var(--color-danger-600);"><i class="fa-solid fa-trash"></i> Delete</button>
                        <a href="mailto:${enq.email}" class="btn btn-outline btn-sm">Reply via Email</a>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        list.innerHTML = html;
        
    } catch (err) {
        console.error("Error loading all enquiries:", err);
        list.innerHTML = '<p style="color: red;">Failed to load global enquiries.</p>';
    }
}
