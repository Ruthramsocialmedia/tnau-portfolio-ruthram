// config.js - Environment Variables and API Keys

const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: "https://qfhrcvbdralqiyojtjuz.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaHJjdmJkcmFscWl5b2p0anV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDE4MDksImV4cCI6MjA5NjgxNzgwOX0.IPAlNii8LIWQWr--ruW1xJxNda9HeCoIGPgemWSqHY8",
    
    // Google Maps
    GOOGLE_MAPS_API_KEY: "",
    
    // AI API Key (For Phase 3 features like College Finder & Course Explainer)
    GEMINI_API_KEY: "AQ.Ab8RN6KQZ7frwFsq9F6Oh_9qoDKMYVnifixW6lntbEKjD0ZtfA",

    // Admin Bypass \u2014 FIX: Single source of truth, was hardcoded in 3 separate files.
    // Note: Supabase RLS handles actual data security. This controls UI routing only.
    ADMIN_BYPASS_EMAIL: "vrtrichy@gmail.com"
};
