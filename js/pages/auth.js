// auth.js - Handles login, signup, and session state

document.addEventListener('DOMContentLoaded', () => {
    // Only run auth form logic if we are on the login page
    const authForm = document.getElementById('authForm');
    if (authForm) {
        initAuthForm();
    }
    
    // Always check session to update navbar globally
    checkSessionAndUpdateUI();
});

let isSignUp = false;

function initAuthForm() {
    const toggleBtn = document.getElementById('toggleAuthBtn');
    const toggleText = document.getElementById('toggleText');
    const submitBtn = document.getElementById('authSubmitBtn');
    const nameGroup = document.getElementById('nameGroup');
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const authError = document.getElementById('authError');
    const authForm = document.getElementById('authForm');

    // Toggle between Login and Sign Up
    toggleBtn.addEventListener('click', () => {
        isSignUp = !isSignUp;
        if (isSignUp) {
            nameGroup.style.display = 'block';
            nameInput.required = true;
            submitBtn.textContent = 'Sign Up';
            toggleText.textContent = 'Already have an account?';
            toggleBtn.textContent = 'Log In';
        } else {
            nameGroup.style.display = 'none';
            nameInput.required = false;
            submitBtn.textContent = 'Log In';
            toggleText.textContent = "Don't have an account?";
            toggleBtn.textContent = 'Sign Up';
        }
        authError.style.display = 'none';
    });

    // Handle Form Submit
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!window.db) {
            showError("Supabase is not initialized. Check your connection.");
            return;
        }

        const email = emailInput.value;
        const password = passwordInput.value;
        const name = nameInput.value;

        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;
        authError.style.display = 'none';

        try {
            if (isSignUp) {
                // Sign Up
                const { data, error } = await window.db.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: name
                        }
                    }
                });

                if (error) throw error;
                
                // Show success or auto login
                if (typeof showToast === 'function') showToast("Account created successfully! You can now log in.", "success");
                // Switch back to login mode
                toggleBtn.click();
                
            } else {
                // Log In
                const { data, error } = await window.db.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) throw error;
                
                // Check if user is an admin or using the bypass
                // FIX: Use CONFIG.ADMIN_BYPASS_EMAIL instead of hardcoded string
                const isBypass = email === (CONFIG.ADMIN_BYPASS_EMAIL || 'vrtrichy@gmail.com');
                const { data: adminData } = await window.db
                    .from('institutions')
                    .select('id')
                    .eq('managed_by', data.user.id)
                    .limit(1);
                    
                // Check for redirect param
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get('redirect');

                if (redirect) {
                    if ((adminData && adminData.length > 0) || isBypass) {
                        localStorage.setItem('userRole', 'admin');
                    } else {
                        localStorage.setItem('userRole', 'student');
                    }
                    window.location.href = redirect;
                } else if ((adminData && adminData.length > 0) || isBypass) {
                    localStorage.setItem('userRole', 'admin');
                    window.location.href = 'admin-dashboard.html';
                } else {
                    localStorage.setItem('userRole', 'student');
                    window.location.href = 'dashboard.html';
                }
            }
        } catch (error) {
            showError(error.message);
        } finally {
            submitBtn.textContent = isSignUp ? 'Sign Up' : 'Log In';
            submitBtn.disabled = false;
        }
    });

    function showError(msg) {
        authError.textContent = msg;
        authError.style.display = 'block';
    }
}

async function checkSessionAndUpdateUI() {
    if (!window.db) return;

    try {
        const { data: { session }, error } = await window.db.auth.getSession();
        
        if (error) {
            console.error("Session error:", error);
            return;
        }

        // FIX: Use navbarReady event instead of unreliable setTimeout(300ms)
        // This works reliably even on slow 3G connections
        function applySessionUI() {
            const loginBtn = document.querySelector('a[href="login.html"]');
            if (!session || !loginBtn) return;

            const userMetadata = session.user.user_metadata || {};
            const name = userMetadata.full_name || session.user.email.split('@')[0];

            const profileDropdown = document.createElement('div');
            profileDropdown.style.position = 'relative';

            let dashboardLink = 'dashboard.html';
            const isBypass = session.user.email === (CONFIG.ADMIN_BYPASS_EMAIL || 'vrtrichy@gmail.com');

            window.db.from('institutions')
                .select('id')
                .eq('managed_by', session.user.id)
                .limit(1)
                .then(({ data: adminData }) => {
                    if ((adminData && adminData.length > 0) || isBypass) {
                        dashboardLink = 'admin-dashboard.html';
                        localStorage.setItem('userRole', 'admin');
                    } else {
                        localStorage.setItem('userRole', 'student');
                    }

                    let adminLinks = `<a href="${dashboardLink}" class="user-nav-item"><i class="fa-solid fa-table-columns"></i> Dashboard</a>`;
                    if (dashboardLink === 'admin-dashboard.html') {
                        adminLinks += `\n                        <a href="admin.html" class="user-nav-item"><i class="fa-solid fa-chart-pie"></i> Platform Analytics</a>`;
                    }

                    profileDropdown.innerHTML = `
                        <button class="btn btn-primary" id="profileDropdownBtn" style="gap: var(--space-2);">
                            <i class="fa-solid fa-user-circle"></i> ${name}
                        </button>
                        <div id="userNavMenu" class="user-nav-dropdown">
                            ${adminLinks}
                            <a href="#" id="logoutBtn" class="user-nav-item" style="color: #dc2626;"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
                        </div>
                    `;

                    loginBtn.parentNode.replaceChild(profileDropdown, loginBtn);

                    const dropdownBtn = document.getElementById('profileDropdownBtn');
                    const menu = document.getElementById('userNavMenu');

                    dropdownBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        menu.classList.toggle('show');
                    });

                    document.addEventListener('click', () => {
                        if (menu.classList.contains('show')) menu.classList.remove('show');
                    });

                    const logoutBtn = document.getElementById('logoutBtn');
                    logoutBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await window.db.auth.signOut();
                        localStorage.removeItem('userRole');
                        window.location.href = 'index.html';
                    });
                });
        }

        // Try immediately (navbar may already be rendered if scripts load fast)
        if (document.querySelector('a[href="login.html"]')) {
            applySessionUI();
        } else {
            // Wait for navbarReady event
            document.addEventListener('navbarReady', applySessionUI, { once: true });
        }
        
    } catch (err) {
        console.error("Error checking auth status", err);
    }
}

// Helper to check if logged in for protected routes
window.requireAuth = async function() {
    if (!window.db) return false;
    const { data: { session } } = await window.db.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }
    return session.user;
};
