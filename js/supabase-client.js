// supabase-client.js - Initializes Supabase connection

if (typeof CONFIG === 'undefined') {
    console.error("CONFIG is not defined! Make sure config.js is loaded before supabase-client.js");
}

// Ensure the Supabase library is loaded
if (typeof supabase === 'undefined') {
    console.error("Supabase script not loaded! Add <script src=\"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2\"></script> to your HTML.");
}

// Initialize the Supabase client
const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// Export for module use if needed, but also attach to window for vanilla JS usage
window.db = supabaseClient;

// Shared data fetcher
window.fetchUniversities = async function() {
    // Strictly use the local data list from tn-uni-data.js if available
    if (typeof UNIVERSITIES_DATA !== 'undefined') {
        return UNIVERSITIES_DATA;
    }
    
    // Fallback to Supabase only if local data is missing
    if (window.TN_UNIVERSITIES_DATA_FETCHED) return window.TN_UNIVERSITIES_DATA_FETCHED;
    
    const { data, error } = await window.db.from('institutions').select('*');
    if (error) {
        console.error("Error fetching universities:", error);
        return [];
    }
    
    window.TN_UNIVERSITIES_DATA_FETCHED = data.map(uni => ({
        ...uni,
        smartData: uni.smart_data,
        tourUrl: uni.tour_url
    }));
    
    return window.TN_UNIVERSITIES_DATA_FETCHED;
};
