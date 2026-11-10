// nri.js - Logic for the NRI Landing Page

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof fetchUniversities !== 'function') {
        console.error("fetchUniversities not loaded!");
        return;
    }

    const grid = document.getElementById('nriGrid');
    
    try {
        const data = await fetchUniversities();
        
        // Filter for premium/top universities likely to have NRI quotas
        // In a real app, we'd have a specific `nri_quota` boolean in the DB.
        // For MVP, we filter for Deemed Universities or NAAC A++/A+ institutions.
        const nriUniversities = data.filter(uni => {
            const isDeemed = uni.category && uni.category.toLowerCase().includes('deemed');
            const hasHighNaac = uni.smartData && uni.smartData.naacGrade && 
                               (uni.smartData.naacGrade.includes('A++') || uni.smartData.naacGrade.includes('A+'));
            return isDeemed || hasHighNaac;
        }).slice(0, 9); // Show top 9
        
        if (nriUniversities.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1 / -1; padding: var(--space-8); text-align: center; background: white; border-radius: var(--radius-md);">No premium institutions found at this time.</div>';
            return;
        }
        
        grid.innerHTML = '';
        nriUniversities.forEach(uni => {
            if (typeof createInstitutionCard === 'function') {
                grid.innerHTML += createInstitutionCard(uni);
            }
        });
        
    } catch (error) {
        console.error("Error loading NRI data", error);
        grid.innerHTML = '<div style="grid-column: 1 / -1; color: red; text-align: center;">Failed to load university data.</div>';
    }
});
