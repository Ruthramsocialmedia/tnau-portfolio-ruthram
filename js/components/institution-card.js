// institution-card.js - Reusable card component for TNAU Agri Portal institutions

function escapeAttr(str) {
    return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Generates the HTML for an institution card.
 * @param {Object} uni - The university/institution object from UNIVERSITIES_DATA
 * @returns {string} - HTML string representing the card
 */
function createInstitutionCard(uni) {
    if (!uni) return '';

    const slug = typeof toSlug === 'function' ? toSlug(uni.name) : uni.name.replace(/\s+/g, '-').toLowerCase();
    const city = typeof getCity === 'function' ? getCity(uni.location) : uni.location.split(',')[0].trim();
    const trustScore = typeof calculateTrustScore === 'function' ? calculateTrustScore(uni) : '9.5';
    const imgUrl = (typeof getImageUrl === 'function' ? getImageUrl(uni) : uni.image) || "college-img/amilnadu agricultural university.png";
    
    // Dedicated virtual tour check
    const hasTour = uni.tourUrl && uni.tourUrl !== '#';
    
    // User interactions state
    const visitedList = JSON.parse(localStorage.getItem('visited_virtually') || '[]');
    const hasVisited = visitedList.includes(uni.id);
    
    const shortlist = JSON.parse(localStorage.getItem('shortlisted_colleges') || '[]');
    const isShortlisted = shortlist.includes(uni.id);

    // Dynamic Category Badge & Status Governance
    let categoryBadge = `<span class="badge badge-constituent"><span class="pulse-dot"></span> <i class="fa-solid fa-building-columns"></i> Constituent</span>`;
    let statusLabel = `<span class="inst-card-status"><i class="fa-solid fa-building-columns"></i> Govt / Constituent</span>`;
    if (uni.category === "Affiliated Colleges") {
        categoryBadge = `<span class="badge badge-affiliated"><span class="pulse-dot"></span> <i class="fa-solid fa-graduation-cap"></i> Affiliated</span>`;
        statusLabel = `<span class="inst-card-status"><i class="fa-solid fa-handshake"></i> TNAU Affiliated</span>`;
    } else if (uni.category === "Research Stations") {
        categoryBadge = `<span class="badge badge-station"><span class="pulse-dot"></span> <i class="fa-solid fa-flask-vial"></i> Research Station</span>`;
        statusLabel = `<span class="inst-card-status"><i class="fa-solid fa-flask"></i> State Research Hub</span>`;
    } else if (uni.category === "Krishi Vigyan Kendras (KVKs)") {
        categoryBadge = `<span class="badge badge-kvk"><span class="pulse-dot"></span> <i class="fa-solid fa-wheat-awn"></i> KVK</span>`;
        statusLabel = `<span class="inst-card-status"><i class="fa-solid fa-seedling"></i> Farm Science Center</span>`;
    }

    // Crop extraction helper
    const extractCropChips = (mandateText) => {
        if (!mandateText) return [];
        const text = mandateText.toLowerCase();
        const chips = [];
        if (text.includes('paddy') || text.includes('rice')) chips.push({ icon: '<i class="fa-solid fa-wheat-awn"></i>', label: 'Paddy' });
        if (text.includes('coconut')) chips.push({ icon: '<i class="fa-solid fa-tree"></i>', label: 'Coconut' });
        if (text.includes('millet') || text.includes('sorghum') || text.includes('maize')) chips.push({ icon: '<i class="fa-solid fa-plant-wilt"></i>', label: 'Millets' });
        if (text.includes('sugarcane')) chips.push({ icon: '<i class="fa-solid fa-spa"></i>', label: 'Sugarcane' });
        if (text.includes('cotton')) chips.push({ icon: '<i class="fa-solid fa-cloud"></i>', label: 'Cotton' });
        if (text.includes('oilseed') || text.includes('groundnut') || text.includes('sesame')) chips.push({ icon: '<i class="fa-solid fa-droplet"></i>', label: 'Oilseeds' });
        if (text.includes('pulse') || text.includes('greengram') || text.includes('blackgram') || text.includes('redgram')) chips.push({ icon: '<i class="fa-solid fa-seedling"></i>', label: 'Pulses' });
        if (text.includes('fruit') || text.includes('horticulture') || text.includes('vegetable') || text.includes('flower')) chips.push({ icon: '<i class="fa-solid fa-apple-whole"></i>', label: 'Horticulture' });
        if (text.includes('forest') || text.includes('tree') || text.includes('agroforestry')) chips.push({ icon: '<i class="fa-solid fa-tree"></i>', label: 'Forestry' });
        if (text.includes('spice') || text.includes('pepper') || text.includes('cardamom')) chips.push({ icon: '<i class="fa-solid fa-pepper-hot"></i>', label: 'Spices' });
        if (text.includes('engineering') || text.includes('machinery') || text.includes('tractor')) chips.push({ icon: '<i class="fa-solid fa-tractor"></i>', label: 'Agri Engg' });
        if (text.includes('water') || text.includes('soil')) chips.push({ icon: '<i class="fa-solid fa-water"></i>', label: 'Soil/Water' });
        return chips.slice(0, 3);
    };

    const sd = uni.smartData || {};
    const isAcademic = uni.category && uni.category.includes("Colleges");
    const primaryBtnText = isAcademic ? "View Campus" : "View Mandate";

    // Standardized Micro-Specification Box (2 Consistent Rows for Grid Harmony)
    let specHtml = '';
    if (isAcademic) {
        const degrees = (sd.degreesOffered && sd.degreesOffered.length > 0) ? sd.degreesOffered : ['B.Sc. (Hons.) Agriculture'];
        const degreeDisplay = degrees.slice(0, 2).join(', ') + (degrees.length > 2 ? ` (+${degrees.length - 2} more)` : '');
        const accredDisplay = (sd.approvals && sd.approvals.length > 0) ? sd.approvals[0] : (uni.isGovt ? 'ICAR Accredited' : 'TNAU Affiliated');
        specHtml = `
            <div class="inst-spec-box">
                <div class="inst-spec-row">
                    <span class="inst-spec-label"><i class="fa-solid fa-graduation-cap"></i> Degrees:</span>
                    <span class="inst-spec-val" title="${escapeAttr(degrees.join(', '))}">${degreeDisplay}</span>
                </div>
                <div class="inst-spec-row">
                    <span class="inst-spec-label"><i class="fa-solid fa-award"></i> Status:</span>
                    <span class="inst-spec-val">${accredDisplay}</span>
                </div>
            </div>
        `;
    } else if (uni.category === "Research Stations") {
        const crops = extractCropChips(sd.cropMandate);
        const cropDisplay = crops.length > 0 ? crops.map(c => `${c.icon} ${c.label}`).join(' ') : '<i class="fa-solid fa-wheat-awn"></i> ' + (sd.cropMandate ? (sd.cropMandate.length > 28 ? sd.cropMandate.substring(0, 28) + '...' : sd.cropMandate) : 'Crop Breeding');
        const facDisplay = (uni.facilities && uni.facilities.length > 0) ? uni.facilities.slice(0, 2).join(', ') : 'Variety Releases & Breeder Seeds';
        specHtml = `
            <div class="inst-spec-box">
                <div class="inst-spec-row">
                    <span class="inst-spec-label"><i class="fa-solid fa-wheat-awn"></i> Focus:</span>
                    <span class="inst-spec-val" title="${escapeAttr(sd.cropMandate || '')}">${cropDisplay}</span>
                </div>
                <div class="inst-spec-row">
                    <span class="inst-spec-label"><i class="fa-solid fa-flask-vial"></i> Mandate:</span>
                    <span class="inst-spec-val" title="${escapeAttr(facDisplay)}">${facDisplay}</span>
                </div>
            </div>
        `;
    } else {
        // KVKs
        const ext = sd.extensionMandate || 'Farmer advisories & frontline demonstrations';
        const districtName = uni.district || city;
        specHtml = `
            <div class="inst-spec-box">
                <div class="inst-spec-row">
                    <span class="inst-spec-label"><i class="fa-solid fa-chalkboard-user"></i> Service:</span>
                    <span class="inst-spec-val" title="${escapeAttr(ext)}">${ext.length > 34 ? ext.substring(0, 34) + '...' : ext}</span>
                </div>
                <div class="inst-spec-row">
                    <span class="inst-spec-label"><i class="fa-solid fa-people-roof"></i> Outreach:</span>
                    <span class="inst-spec-val">Farmers of ${districtName} District</span>
                </div>
            </div>
        `;
    }

    const subtitleCode = (uni.campusCode && uni.campusCode !== uni.name) 
        ? `<div class="inst-card-subtitle" title="${escapeAttr(uni.campusCode)}"><i class="fa-solid fa-fingerprint" style="color: var(--color-primary-600); font-size: 10px; margin-right: 4px;"></i>${uni.campusCode}</div>`
        : `<div class="inst-card-subtitle" style="opacity: 0.6;"><i class="fa-solid fa-map-pin" style="font-size: 10px; margin-right: 4px;"></i>${city}, Tamil Nadu</div>`;

    return `
        <div class="inst-card" data-slug="${slug}">
            <div class="inst-card-img" style="background-image: url('${imgUrl}');">
                <div class="inst-card-badges">
                    ${categoryBadge}
                    ${hasVisited ? `<span class="badge" style="color: var(--color-primary-800);"><i class="fa-solid fa-eye"></i> Explored</span>` : ''}
                </div>
                <div class="inst-card-top-action">
                    <button class="btn-glass-bookmark ${isShortlisted ? 'active' : ''}" title="Save / Shortlist" data-id="${uni.id}" onclick="event.preventDefault(); event.stopPropagation(); toggleShortlist(${uni.id})">
                        <i class="${isShortlisted ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
                    </button>
                </div>
                ${hasTour ? `
                    <a href="https://tnau-ruthram.netlify.app/" target="_blank" class="badge-tour-bottom" onclick="event.stopPropagation();" title="Launch 360° Virtual Tour">
                        <i class="fa-solid fa-vr-cardboard"></i> 360° Tour
                    </a>` : ''}
            </div>
            <div class="inst-card-body">
                <div class="inst-card-eyebrow">
                    <span class="eyebrow-main" title="${city} • ${uni.zone || 'Tamil Nadu'}">
                        <i class="fa-solid fa-location-dot"></i> ${city} • ${uni.zone || 'Tamil Nadu'}
                    </span>
                    ${uni.established ? `<span class="eyebrow-est">Est. ${uni.established}</span>` : ''}
                </div>
                <h3 class="inst-card-title">
                    <a href="institution.html?slug=${slug}" title="${escapeAttr(uni.name)}">${uni.name}</a>
                </h3>
                ${subtitleCode}
                ${specHtml}
                <div class="inst-card-footer">
                    ${statusLabel}
                    <div class="inst-card-actions">
                        <button class="btn-action-icon" title="Add to Compare" onclick="event.preventDefault(); event.stopPropagation(); addToCompare('${slug}')">
                            <i class="fa-solid fa-code-compare"></i>
                        </button>
                        <a href="map.html?focus=${uni.id}" class="btn-action-icon" title="Locate on State Map" onclick="event.stopPropagation();">
                            <i class="fa-solid fa-map-location-dot"></i>
                        </a>
                        <button type="button" class="btn-action-primary" data-explore="${escapeAttr(uni.name)}" title="Explore Campus: 360° Tour or Street View">
                            <span>${primaryBtnText}</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generates the HTML for a compact institution row (List View).
 * @param {Object} uni - The university/institution object from UNIVERSITIES_DATA
 * @returns {string} - HTML string representing the row
 */
function createInstitutionRow(uni) {
    if (!uni) return '';
    const slug = typeof toSlug === 'function' ? toSlug(uni.name) : uni.name.replace(/\s+/g, '-').toLowerCase();
    const city = typeof getCity === 'function' ? getCity(uni.location) : uni.location.split(',')[0].trim();
    const imgUrl = (typeof getImageUrl === 'function' ? getImageUrl(uni) : uni.image) || "college-img/amilnadu agricultural university.png";
    const hasTour = uni.tourUrl && uni.tourUrl !== '#';
    const isAcademic = uni.category.includes("Colleges");
    const primaryBtnText = isAcademic ? "View Campus" : "View Mandate";
    const sd = uni.smartData || {};
    
    // Category pill
    let catClass = 'badge-constituent';
    let catLabel = 'Constituent';
    if (uni.category === "Affiliated Colleges") { catClass = 'badge-affiliated'; catLabel = 'Affiliated'; }
    else if (uni.category === "Research Stations") { catClass = 'badge-station'; catLabel = 'Station'; }
    else if (uni.category === "Krishi Vigyan Kendras (KVKs)") { catClass = 'badge-kvk'; catLabel = 'KVK'; }

    // Chips
    let chipsHtml = '';
    if (sd.degreesOffered && sd.degreesOffered.length > 0) {
        chipsHtml = sd.degreesOffered.slice(0, 2).map(d => `<span class="degree-chip"><i class="fa-solid fa-graduation-cap"></i> ${d}</span>`).join('');
    } else if (sd.cropMandate) {
        chipsHtml = `<span class="crop-chip"><i class="fa-solid fa-wheat-awn"></i> ${sd.cropMandate.length > 40 ? sd.cropMandate.substring(0, 40) + '...' : sd.cropMandate}</span>`;
    }

    return `
        <div class="inst-row" data-slug="${slug}">
            <div class="inst-row-thumb" style="background-image: url('${imgUrl}');">
                <span class="badge ${catClass}" style="position: absolute; bottom: 4px; left: 4px; font-size: 10px; padding: 2px 6px;">
                    ${uni.campusCode || catLabel}
                </span>
            </div>
            <div class="inst-row-main">
                <div class="inst-row-header">
                    <span style="font-size: 11px; background: var(--color-primary-50); color: var(--color-primary-800); padding: 2px 8px; border-radius: var(--radius-full); font-weight: 600;">${uni.zone || city}</span>
                    <span style="font-size: 12px; color: var(--color-neutral-500);"><i class="fa-solid fa-location-dot"></i> ${city}, TN</span>
                </div>
                <h3 class="inst-row-title">
                    <a href="institution.html?slug=${slug}">${uni.name}</a>
                </h3>
                <div class="inst-row-meta">
                    ${chipsHtml}
                    ${hasTour ? `<a href="https://tnau-ruthram.netlify.app/" target="_blank" onclick="event.stopPropagation();" style="background: none; border: none; cursor: pointer; color: var(--color-primary-700); font-weight: 600; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 0; text-decoration: none;" title="Launch 360° Virtual Tour"><i class="fa-solid fa-vr-cardboard"></i> 360° Tour</a>` : ''}
                </div>
            </div>
            <div class="inst-row-actions">
                <a href="map.html?focus=${uni.id}" class="btn btn-outline btn-sm" title="Locate on Map" style="padding: 7px 11px;" onclick="event.stopPropagation();">
                    <i class="fa-solid fa-map-location-dot"></i>
                </a>
                <button class="btn btn-outline btn-sm" title="Compare" onclick="event.preventDefault(); event.stopPropagation(); addToCompare('${slug}')" style="padding: 7px 11px;">
                    <i class="fa-solid fa-code-compare"></i>
                </button>
                <button type="button" class="btn btn-primary btn-sm" data-explore="${escapeAttr(uni.name)}" style="white-space: nowrap; padding: 7px 14px;" title="Explore Campus: 360° Tour or Street View">
                    ${primaryBtnText}
                </button>
            </div>
        </div>
    `;
}

// Global delegated listener for Explore buttons and Card-level profile navigation
document.addEventListener('click', (e) => {
    // 1. Explore popup (360° Virtual Tour or Street View)
    const exploreLink = e.target.closest('[data-explore]');
    if (exploreLink) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof showExplorePopup === 'function') {
            showExplorePopup(e, exploreLink.dataset.explore);
        }
        return;
    }

    // 2. Check if click is inside an institution card or row
    const card = e.target.closest('.inst-card, .inst-row');
    if (!card) return;

    // 3. If clicking interactive controls (action buttons, links, etc.), allow their own handlers to run
    const interactive = e.target.closest('button, a, input, select, textarea');
    if (interactive && card.contains(interactive)) {
        return;
    }

    // 4. Click was anywhere else on the card (image, pills/badges, description, background) -> Navigate to profile
    const slug = card.dataset.slug;
    if (slug) {
        const targetUrl = `institution.html?slug=${encodeURIComponent(slug)}`;
        if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            window.location.href = targetUrl;
        } else if (e.button === 1 || e.ctrlKey || e.metaKey) {
            window.open(targetUrl, '_blank');
        }
    }
});
