// user-actions.js - Handles shortlisting, comparison, and sharing actions using localStorage

let isAdminCache = false;

// FIX: Normalize names for robust comparison (handles trim, encoding, spacing differences)
function normalizeName(str) {
    return (str || '')
        .trim()
        .toLowerCase()
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ');
}

async function syncShortlistWithDatabase() {
    if (!window.db) return;
    try {
        const { data: { session } } = await window.db.auth.getSession();
        if (session && session.user) {
            // 1. Check if admin — FIX: Use CONFIG.ADMIN_BYPASS_EMAIL
            const bypassEmail = (typeof CONFIG !== 'undefined' && CONFIG.ADMIN_BYPASS_EMAIL) || 'vrtrichy@gmail.com';
            const isBypass = session.user.email === bypassEmail;
            const { data: adminData } = await window.db.from('institutions').select('id').eq('managed_by', session.user.id).limit(1);
            if (isBypass || (adminData && adminData.length > 0)) {
                isAdminCache = true;
                return; // Admins don't have shortlists
            }
            
            // 2. Fetch student shortlists
            const { data: shortlists } = await window.db.from('shortlists').select('institution_id, institutions(name)').eq('user_id', session.user.id);
            if (shortlists) {
                const ids = [];
                if (typeof UNIVERSITIES_DATA !== 'undefined') {
                    shortlists.forEach(s => {
                        if (s.institutions && s.institutions.name) {
                            // FIX: Normalize names before comparison to handle spacing/encoding differences
                            const dbName = normalizeName(s.institutions.name);
                            const uni = UNIVERSITIES_DATA.find(u => normalizeName(u.name) === dbName);
                            if (uni) ids.push(uni.id);
                        }
                    });
                }
                localStorage.setItem('shortlisted_colleges', JSON.stringify(ids));
                updateShortlistUI();
            }
        }
    } catch (err) {
        console.error("Failed to sync shortlists on load", err);
    }
}

async function toggleShortlist(collegeId) {
    const userRole = localStorage.getItem('userRole');
    if (isAdminCache || userRole === 'admin') {
        if (typeof showToast === 'function') {
            showToast("Admin accounts cannot shortlist institutions.", "info");
        } else {
            alert("Admin accounts cannot shortlist institutions.");
        }
        return;
    }

    if (window.db) {
        try {
            const { data: { session } } = await window.db.auth.getSession();
            if (!session || !session.user) {
                // Not logged in. Store intent and redirect to login
                sessionStorage.setItem('pendingShortlistAction', collegeId);
                const redirectUrl = new URL(window.location.href);
                window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl.toString())}`;
                return;
            }
            
            // Proceed with shortlist
            let shortlist = JSON.parse(localStorage.getItem('shortlisted_colleges') || '[]');
            const index = shortlist.indexOf(collegeId);
            let isAdding = index === -1;
            
            // 1. Update LocalStorage (Fallback / optimistic UI)
            if (isAdding) {
                shortlist.push(collegeId);
            } else {
                shortlist.splice(index, 1);
            }
            localStorage.setItem('shortlisted_colleges', JSON.stringify(shortlist));
            
            // 2. Update Supabase
            // Find the UUID for the college
                let uuid = null;
                if (typeof UNIVERSITIES_DATA !== 'undefined') {
                    const uni = UNIVERSITIES_DATA.find(u => u.id == collegeId);
                    if (uni) {
                        const { data: inst } = await window.db.from('institutions').select('id').eq('name', uni.name).single();
                        if (inst) uuid = inst.id;
                    }
                }
                
                if (uuid) {
                    if (isAdding) {
                        await window.db.from('shortlists').insert({
                            user_id: session.user.id,
                            institution_id: uuid
                        });
                    } else {
                        await window.db.from('shortlists').delete()
                            .eq('user_id', session.user.id)
                            .eq('institution_id', uuid);
                    }
                } else {
                    console.error("Could not find matching UUID in Supabase for collegeId:", collegeId);
                }
        } catch (err) {
            console.error("Failed to sync shortlist to database", err);
        }
        
        let shortlist = JSON.parse(localStorage.getItem('shortlisted_colleges') || '[]');
        const isAdding = shortlist.includes(collegeId);
        if (typeof showToast === 'function') {
            showToast(isAdding ? 'Added to shortlist' : 'Removed from shortlist', 'success');
        } else {
            if (typeof showToast === 'function') showToast(isAdding ? 'Added to shortlist' : 'Removed from shortlist');
        }
        updateShortlistUI();
    }
}

// FIX: addToCompare now always stores slugs — resolves numeric vs slug mismatch in compareList
function addToCompare(collegeIdOrSlug) {
    // Normalize: if numeric ID given, resolve to slug
    let slug = String(collegeIdOrSlug);
    if (/^\d+$/.test(slug) && typeof UNIVERSITIES_DATA !== 'undefined') {
        const uni = UNIVERSITIES_DATA.find(u => u.id === parseInt(slug, 10));
        if (uni && typeof toSlug === 'function') {
            slug = toSlug(uni.name);
        }
    }

    let compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
    
    if (compareList.includes(slug)) {
        if (typeof showToast === 'function') {
            showToast('Already in comparison list! <a href="compare.html" style="color: white; text-decoration: underline; margin-left: 8px; font-weight: 700;">View List</a>', 'info');
        }
        return;
    }
    
    if (compareList.length >= 3) {
        if (typeof showToast === 'function') {
            showToast('You can only compare up to 3 colleges at a time. <a href="compare.html" style="color: white; text-decoration: underline; margin-left: 8px; font-weight: 700;">Compare Now</a>', 'error');
        }
        return;
    }
    
    compareList.push(slug);
    localStorage.setItem('compareList', JSON.stringify(compareList));
    
    if (typeof showToast === 'function') {
        showToast('Added to comparison! <a href="compare.html" style="color: white; text-decoration: underline; margin-left: 8px; font-weight: 700;">Compare Now</a>', 'success');
    }
    
    if (document.getElementById('compare-count')) {
        document.getElementById('compare-count').textContent = compareList.length;
    }
}

function generateShareLink(type, uniName) {
    let urlObj = new URL(window.location.href);
    if (type.startsWith('parent')) {
        urlObj.searchParams.set('view', 'parent');
    }
    const url = urlObj.toString();
    
    let message = '';
    
    switch(type) {
        case 'parent-hostel':
            message = `Appa/Amma, see this hostel at ${uniName}: ${url}`;
            break;
        case 'parent-library':
            message = `Check out this library at ${uniName}: ${url}`;
            break;
        case 'parent-safety':
            message = `Please check this campus safety section for ${uniName}: ${url}`;
            break;
        case 'parent':
            message = `Check out ${uniName} from a parent's perspective: ${url}`;
            break;
        default:
            message = `Check out ${uniName} on the University Explorer: ${url}`;
    }
    
    // Open WhatsApp
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

function updateShortlistUI() {
    // If on dashboard, re-render shortlist
    if (typeof renderShortlist === 'function') {
        renderShortlist();
    }
    
    // Update active states on buttons
    const shortlist = JSON.parse(localStorage.getItem('shortlisted_colleges') || '[]');
    document.querySelectorAll('.btn-bookmark').forEach(btn => {
        const id = parseInt(btn.dataset.id);
        if (shortlist.includes(id)) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
        }
    });
    
    // Also update the profile page specific shortlist buttons
    document.querySelectorAll('.btn-shortlist-action').forEach(btn => {
        let id = parseInt(btn.dataset.id);
        
        // Fallback: If dataset.id is not set yet, try to find it from URL slug
        if (!id) {
            const urlParams = new URLSearchParams(window.location.search);
            const slug = urlParams.get('slug');
            if (slug && typeof UNIVERSITIES_DATA !== 'undefined') {
                const uni = UNIVERSITIES_DATA.find(u => {
                    const uSlug = typeof toSlug === 'function' ? toSlug(u.name) : u.name.replace(/\s+/g, '-').toLowerCase();
                    return uSlug === slug;
                });
                if (uni) {
                    id = uni.id;
                    btn.dataset.id = id;
                }
            }
        }
        
        if (!id) return;
        
        const icon = btn.querySelector('.shortlist-icon');
        const text = btn.querySelector('.shortlist-text');
        
        if (shortlist.includes(id)) {
            if (icon) icon.className = 'fa-solid fa-bookmark shortlist-icon';
            if (text) text.textContent = 'Saved to Shortlist';
            btn.classList.add('active');
        } else {
            if (icon) icon.className = 'fa-regular fa-bookmark shortlist-icon';
            if (text) text.textContent = 'Shortlist';
            btn.classList.remove('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    updateShortlistUI(); // Show local storage immediately (optimistic)
    await syncShortlistWithDatabase(); // Overwrite with live DB data if logged in
    
    // Auto-execute pending shortlist after successful login
    const pendingShortlistAction = sessionStorage.getItem('pendingShortlistAction');
    if (pendingShortlistAction && window.db) {
        const { data: { session } } = await window.db.auth.getSession();
        if (session && session.user) {
            sessionStorage.removeItem('pendingShortlistAction');
            // Delay slightly to ensure UI is ready
            setTimeout(() => {
                toggleShortlist(parseInt(pendingShortlistAction));
            }, 500);
        }
    }
});
