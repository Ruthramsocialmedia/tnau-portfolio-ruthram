// utils.js - Shared utilities across the website

/**
 * Converts a string into a URL-friendly slug.
 * e.g., "Anna University" -> "anna-university"
 */
function toSlug(name) {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/**
 * Extracts the city from a "City, State" string.
 */
function getCity(location) {
    if (!location) return '';
    return location.split(',')[0].trim();
}

/**
 * Performs a simple case-insensitive substring match.
 */
function fuzzyMatch(text, query) {
    if (!text || !query) return false;
    return text.toLowerCase().includes(query.toLowerCase());
}

/**
 * Debounces a function call.
 */
function debounce(fn, ms = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
}

/**
 * Animates a numerical counter from 0 to target.
 */
function animateCounter(element, target, duration = 1500) {
    let startTimestamp = null;
    const isPlus = element.textContent.includes('+');
    
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Easing out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentCount = Math.floor(easeOut * target);
        
        element.textContent = currentCount + (isPlus ? '+' : '');
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.textContent = target + (isPlus ? '+' : '');
        }
    };
    
    window.requestAnimationFrame(step);
}

/**
 * Calculates a 0-10 trust score based on data completeness.
 */
function calculateTrustScore(uni) {
    let score = 5.0; // Base score
    if (!uni || !uni.smartData) return score.toFixed(1);
    
    const sd = uni.smartData;
    if (sd.approvals && sd.approvals.includes("UGC Recognized")) score += 1.0;
    if (sd.approvals && sd.approvals.includes("AICTE Approved")) score += 1.0;
    if (sd.naacGrade && sd.naacGrade !== "Not Accredited") score += 1.5;
    if (uni.tourUrl) score += 1.0; // Has virtual tour
    if (sd.safetyFeatures && sd.safetyFeatures.length >= 3) score += 0.5;
    
    return Math.min(score, 10.0).toFixed(1);
}

/**
 * Calculates a transparency score out of 100% based on data availability.
 */
function calculateTransparencyScore(uni) {
    let score = 0;
    let breakdown = [];
    
    if (!uni) return { total: 0, breakdown: [] };
    const sd = uni.smartData || {};

    const criteria = [
        { label: 'Complete profile', check: !!uni.description },
        { label: 'Updated data', check: Object.keys(sd).length > 0 },
        { label: 'Virtual tour availability', check: !!uni.tourUrl || !!uni.tour_url },
        { label: 'Accreditation data', check: !!sd.naacGrade || (sd.approvals && sd.approvals.length > 0) },
        // FIX: Was hardcoded 'true' — now checks for real contact/disclosure data
        { label: 'Public disclosure links', check: !!(uni.contactUrl && uni.contactUrl !== '#') },
        { label: 'Contact verification', check: !!(sd.whatsapp || sd.phone || sd.email) },
        { label: 'Safety information', check: sd.safetyFeatures && sd.safetyFeatures.length > 0 },
        { label: 'Accessibility information', check: sd.facilities && sd.facilities.some(f => f.toLowerCase().includes('transport') || f.toLowerCase().includes('access')) }
    ];

    const pointsPerCriteria = 100 / criteria.length;

    criteria.forEach(c => {
        if (c.check) score += pointsPerCriteria;
        breakdown.push({ label: c.label, met: c.check, value: Math.round(pointsPerCriteria) });
    });

    return { total: Math.round(score), breakdown };
}

/**
 * Safely resolves an image URL for the institution.
 * FIX: Uses DEFAULT_IMAGE (valid Unsplash URL from tn-uni-data.js) instead of non-existent local path.
 */
function getImageUrl(uni) {
    const fallback = typeof DEFAULT_AGRI_IMAGE !== 'undefined'
        ? DEFAULT_AGRI_IMAGE
        : 'img-cards/101_acri-coimbatore-main-campus.jpg';

    if (!uni) return fallback;
    
    let url = uni.image; 

    if (!url && typeof UNIVERSITY_IMAGE_MAP !== 'undefined' && UNIVERSITY_IMAGE_MAP[uni.name]) {
        url = UNIVERSITY_IMAGE_MAP[uni.name];
    }
    
    if (url) {
        // Encode single quotes to %27 so they don't break CSS url('') or HTML attributes
        return url.replace(/'/g, "%27");
    }
    
    return fallback;
}

// Global function to delete enquiries
window.deleteEnquiry = async function(id) {
    if (!confirm("Are you sure you want to delete this enquiry?")) return;
    
    if (!window.db) {
        if (typeof showToast === 'function') showToast("Database connection missing", "error");
        return;
    }
    
    try {
        const { error } = await window.db.from('enquiries').delete().eq('id', id);
        if (error) throw error;
        
        if (typeof showToast === 'function') {
            showToast("Enquiry deleted successfully", "success");
        } else {
            alert("Enquiry deleted successfully");
        }
        
        // Reload the page to refresh the list easily and reliably
        // Dispatch event instead of reloading
        document.dispatchEvent(new CustomEvent('enquiriesUpdated'));
    } catch (err) {
        console.error("Error deleting enquiry:", err);
        if (typeof showToast === 'function') {
            showToast("Failed to delete enquiry", "error");
        } else {
            alert("Failed to delete enquiry");
        }
    }
};

// Global function to update enquiry status
window.updateEnquiryStatus = async function(id, newStatus) {
    if (!window.db) {
        if (typeof showToast === 'function') showToast("Database connection missing", "error");
        return;
    }
    
    try {
        const { error } = await window.db.from('enquiries').update({ status: newStatus }).eq('id', id);
        if (error) throw error;
        
        if (typeof showToast === 'function') {
            showToast(`Status updated to ${newStatus}`, "success");
        }
        
        // Dispatch event instead of reloading
        document.dispatchEvent(new CustomEvent('enquiriesUpdated'));
    } catch (err) {
        console.error("Error updating status:", err);
        if (typeof showToast === 'function') {
            showToast("Failed to update status", "error");
        } else {
            alert("Failed to update status");
        }
    }
};

// Global function to show Explore Campus popup
window.showExplorePopup = function(event, uniName) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const fallbackImg = typeof DEFAULT_AGRI_IMAGE !== 'undefined'
        ? DEFAULT_AGRI_IMAGE
        : 'img-cards/101_acri-coimbatore-main-campus.jpg';

    const uniList = (typeof UNIVERSITIES_DATA !== 'undefined' && Array.isArray(UNIVERSITIES_DATA) && UNIVERSITIES_DATA.length > 0)
        ? UNIVERSITIES_DATA
        : ((typeof window !== 'undefined' && window.UNIVERSITIES_DATA) || (typeof window !== 'undefined' && window.TNAU_MASTER_DATA) || (typeof TNAU_MASTER_DATA !== 'undefined' ? TNAU_MASTER_DATA : []));
    const uni = uniList.find(u => {
        if (!u) return false;
        if (String(u.id) === String(uniName)) return true;
        if (String(u.name || '').trim().toLowerCase() === String(uniName || '').trim().toLowerCase()) return true;
        if (u.campusCode && String(u.campusCode).trim().toLowerCase() === String(uniName || '').trim().toLowerCase()) return true;
        return false;
    });

    const chips = [];
    if (uni) {
        if (uni.category) {
            let catIcon = 'fa-building-columns';
            if (uni.category === 'Affiliated Colleges') catIcon = 'fa-graduation-cap';
            else if (uni.category === 'Research Stations') catIcon = 'fa-flask-vial';
            else if (uni.category.includes('KVK')) catIcon = 'fa-wheat-awn';
            chips.push({ icon: catIcon, label: uni.category.replace('Krishi Vigyan Kendras (KVKs)', 'KVK') });
        }
        const cityRaw = String(uni.district || uni.location || '').split(',')[0].trim();
        if (cityRaw && cityRaw !== 'Tamil Nadu' && cityRaw.toLowerCase() !== 'unknown') chips.push({ icon: 'fa-location-dot', label: cityRaw });
        if (uni.zone) chips.push({ icon: 'fa-mountain-sun', label: uni.zone.replace(' Zone', '') });
        if (uni.status) chips.push({ icon: 'fa-shield-halved', label: uni.status.includes('ICAR') ? 'ICAR Accredited' : (uni.isGovt ? 'Government' : 'Affiliated') });
    }

    let popup = document.getElementById('explore-campus-modal');

    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'explore-campus-modal';
        popup.setAttribute('role', 'dialog');
        popup.setAttribute('aria-modal', 'true');
        popup.setAttribute('aria-labelledby', 'explore-modal-title');

        popup.innerHTML = `
            <div class="explore-backdrop"></div>
            <div class="explore-panel">
                <div class="explore-media">
                    <img class="explore-media-img" alt="" loading="lazy" decoding="async"
                        onerror="this.onerror=null; this.src='${fallbackImg}';">
                    <div class="explore-media-scrim"></div>
                    <div class="explore-media-top">
                        <span class="explore-tag"><i class="fa-solid fa-vr-cardboard"></i> 360&deg; Campus</span>
                        <button type="button" class="explore-close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="explore-media-info">
                        <h3 id="explore-modal-title"></h3>
                        <div class="explore-chips"></div>
                    </div>
                </div>
                <div class="explore-body">
                    <p class="explore-sub">Experience the campus in immersive 360&deg; virtual reality</p>
                    <div class="explore-options">
                        <button type="button" class="explore-option" data-explore-mode="tour">
                            <span class="explore-option-icon vr"><i class="fa-solid fa-vr-cardboard"></i></span>
                            <span style="flex-grow: 1;"><strong>Launch 360&deg; Virtual Tour</strong><span>Immersive campus walkthrough &amp; aerial views</span></span>
                            <i class="fa-solid fa-arrow-right" style="color: #93C5FD; font-size: 1.1rem; margin-left: auto;"></i>
                        </button>
                    </div>
                    <div class="explore-modal-footer" style="margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.12); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <a id="explore-modal-profile-link" href="#" style="color: #93C5FD; font-size: 13px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                            <i class="fa-solid fa-circle-info"></i> View Full Institution Profile & Programs &rarr;
                        </a>
                        <span class="explore-hint" style="margin: 0;">Press <kbd>Esc</kbd> to close</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(popup);

        popup._close = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            popup.classList.remove('is-open');
            document.removeEventListener('keydown', popup._onKey);
        };

        popup._onKey = (e) => {
            if (e.key === 'Escape') popup._close();
        };

        const modeNote = (msg) => {
            if (typeof showToast === 'function') showToast(msg, 'info');
            else alert(msg);
        };

        popup.querySelector('.explore-backdrop').addEventListener('click', popup._close);
        popup.querySelector('.explore-close').addEventListener('click', popup._close);
        popup.querySelector('[data-explore-mode="tour"]').addEventListener('click', (e) => {
            e.preventDefault();
            window.open('https://tnau-ruthram.netlify.app/', '_blank');
        });
    }

    const imgUrl = (typeof getImageUrl === 'function' && uni) ? getImageUrl(uni) : (uni ? uni.image : fallbackImg);
    popup.querySelector('.explore-media-img').src = imgUrl || fallbackImg;
    popup.querySelector('.explore-media-img').alt = `Explore ${uniName} campus`;
    popup.querySelector('#explore-modal-title').textContent = uniName;
    popup.currentUniName = uniName;
    popup.currentTourUrl = uni ? (uni.tourUrl || uni.tour_url || null) : null;
    popup.currentStreetUrl = uni ? (uni.streetViewUrl || uni.street_view_url || null) : null;

    const profileLink = popup.querySelector('#explore-modal-profile-link');
    if (profileLink) {
        if (uni) {
            const slug = typeof toSlug === 'function' ? toSlug(uni.name) : uni.name.replace(/\s+/g, '-').toLowerCase();
            profileLink.href = `institution.html?slug=${slug}`;
            profileLink.style.display = 'inline-flex';
        } else {
            profileLink.style.display = 'none';
        }
    }

    const chipsWrap = popup.querySelector('.explore-chips');
    chipsWrap.innerHTML = '';
    chips.forEach(c => {
        const chip = document.createElement('span');
        chip.className = 'explore-chip';
        chip.innerHTML = `<i class="fa-solid ${c.icon}"></i>${c.label.replace(/</g, '&lt;')}`;
        chipsWrap.appendChild(chip);
    });

    popup.classList.add('is-open');
    document.addEventListener('keydown', popup._onKey);
    popup.querySelector('.explore-close').focus();
};

