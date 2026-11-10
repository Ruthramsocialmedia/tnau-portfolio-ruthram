// navbar.js - Main navigation component

document.addEventListener('DOMContentLoaded', () => {
    const navbarPlaceholder = document.getElementById('main-navbar');
    
    if (navbarPlaceholder) {
        // Determine active page
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        
        const isActive = (href) => {
            return page === href ? 'class="active" style="color: var(--color-primary-900); font-weight: 700; background: var(--color-primary-50); white-space: nowrap;"' : 'style="white-space: nowrap;"';
        };

        const navbarHTML = `
            <div class="navbar">
                <div class="container">
                    <a href="index.html" class="nav-brand" style="white-space: nowrap; flex-shrink: 0;">
                        <i class="fa-solid fa-seedling"></i> TNAU Agri Portal
                    </a>
                    <div class="nav-links">
                        <a href="index.html" ${isActive('index.html')}>Home</a>
                        <a href="search.html" ${isActive('search.html')}>Institutions</a>
                        <a href="map.html" ${isActive('map.html')}>Agro-Climatic Map</a>
                        <a href="compare.html" ${isActive('compare.html')}>Compare</a>
                        <a href="https://tnau-ruthram.netlify.app/" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;"><i class="fa-solid fa-vr-cardboard"></i> 360° Tour</a>
                        <a href="nri.html" ${isActive('nri.html')}>Admissions / NRI</a>
                        <!-- Custom Language Widget -->
                        <div class="custom-lang-wrapper notranslate" id="customLangWrapper" style="margin-left: 4px; flex-shrink: 0;">
                            <button class="custom-lang-btn" id="customLangBtn" aria-label="Select Language">
                                <i class="fa-solid fa-language" style="font-size: 1.2rem;"></i> <span id="currentLangLabel">EN</span>
                            </button>
                            <div class="custom-lang-dropdown">
                                <div class="custom-lang-item active" data-lang="en" data-short="EN"><i class="fa-solid fa-globe"></i> English</div>
                                <div class="custom-lang-item" data-lang="ta" data-short="TA"><i class="fa-solid fa-language"></i> Tamil</div>
                                <div class="custom-lang-item" data-lang="hi" data-short="HI"><i class="fa-solid fa-language"></i> Hindi</div>
                                <div class="custom-lang-item" data-lang="te" data-short="TE"><i class="fa-solid fa-language"></i> Telugu</div>
                                <div class="custom-lang-item" data-lang="ml" data-short="ML"><i class="fa-solid fa-language"></i> Malayalam</div>
                                <div class="custom-lang-item" data-lang="kn" data-short="KN"><i class="fa-solid fa-language"></i> Kannada</div>
                                <div class="custom-lang-item" data-lang="bn" data-short="BN"><i class="fa-solid fa-language"></i> Bengali</div>
                            </div>
                        </div>
                        <div id="google_translate_element"></div>
                        <div class="custom-lang-wrapper notranslate" id="textSizeWrapper" style="margin-left: 4px; flex-shrink: 0;">
                            <button class="custom-lang-btn" id="textSizeBtn" aria-label="Text Size" style="width: 38px; height: 38px; border-radius: 50%; padding: 0; background: var(--color-neutral-100); color: var(--color-neutral-600);">
                                <i class="fa-solid fa-text-height"></i>
                            </button>
                            <div class="custom-lang-dropdown" style="min-width: 130px;">
                                <div class="custom-lang-item text-size-btn" data-size="14px">A- Small</div>
                                <div class="custom-lang-item text-size-btn active" data-size="16px">A Normal</div>
                                <div class="custom-lang-item text-size-btn" data-size="18px">A+ Large</div>
                            </div>
                        </div>
                        <button id="highContrastToggle" aria-label="Toggle High Contrast" style="width: 38px; height: 38px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--color-neutral-100); color: var(--color-neutral-600); transition: all 0.3s; margin-left: 4px; flex-shrink: 0;"><i class="fa-solid fa-circle-half-stroke"></i></button>
                        <a href="login.html" class="btn btn-primary btn-sm" style="border-radius: var(--radius-full); padding: 7px 18px; color: #ffffff; margin-left: 6px; white-space: nowrap; flex-shrink: 0;">Login</a>
                    </div>
                    <!-- Mobile Hamburger (Hidden on Desktop) -->
                    <button class="mobile-menu-btn" aria-label="Toggle Menu" style="display: none; font-size: var(--text-2xl); color: var(--color-primary-800); width: 40px; height: 40px; border-radius: 50%; background: var(--color-neutral-100); align-items: center; justify-content: center;">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                </div>
            </div>
            
            <!-- Mobile Menu Overlay -->
            <div class="mobile-menu-overlay" style="display: none; position: fixed; top: 70px; left: 0; right: 0; bottom: 0; background: var(--color-white); z-index: var(--z-50, 50); padding: var(--space-6); flex-direction: column; gap: var(--space-4); overflow-y: auto;">
                <a href="index.html" style="font-size: var(--text-lg); padding: var(--space-3) 0; border-bottom: 1px solid var(--color-neutral-200);">Home</a>
                <a href="search.html" style="font-size: var(--text-lg); padding: var(--space-3) 0; border-bottom: 1px solid var(--color-neutral-200);">Institutions</a>
                <a href="map.html" style="font-size: var(--text-lg); padding: var(--space-3) 0; border-bottom: 1px solid var(--color-neutral-200);">Agro-Climatic Map</a>
                <a href="compare.html" style="font-size: var(--text-lg); padding: var(--space-3) 0; border-bottom: 1px solid var(--color-neutral-200);">Compare</a>
                <a href="https://tnau-ruthram.netlify.app/" target="_blank" style="font-size: var(--text-lg); padding: var(--space-3) 0; border-bottom: 1px solid var(--color-neutral-200);"><i class="fa-solid fa-vr-cardboard"></i> 360° Virtual Tour</a>
                <a href="nri.html" style="font-size: var(--text-lg); padding: var(--space-3) 0; border-bottom: 1px solid var(--color-neutral-200);">Admissions / NRI</a>
                
                <!-- Mobile Language Select -->
                <div style="margin-top: var(--space-2);" class="notranslate">
                    <p style="font-size: var(--text-sm); color: var(--color-neutral-500); margin-bottom: var(--space-2);">Language</p>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="mobileLangContainer">
                        <button class="mobile-lang-btn active" data-lang="en">EN</button>
                        <button class="mobile-lang-btn" data-lang="ta">TA</button>
                        <button class="mobile-lang-btn" data-lang="hi">HI</button>
                        <button class="mobile-lang-btn" data-lang="te">TE</button>
                        <button class="mobile-lang-btn" data-lang="ml">ML</button>
                        <button class="mobile-lang-btn" data-lang="kn">KN</button>
                        <button class="mobile-lang-btn" data-lang="bn">BN</button>
                    </div>
                </div>

                <a href="login.html" class="btn btn-primary" style="margin-top: auto; width: 100%; text-align: center;">Login</a>
            </div>
        `;
        
        // Add minimal mobile menu styles to head if they don't exist
        if (!document.getElementById('mobile-menu-styles')) {
            const style = document.createElement('style');
            style.id = 'mobile-menu-styles';
            style.textContent = `
                @media (max-width: 1023px) {
                    .nav-links { display: none !important; }
                    .mobile-menu-btn { display: inline-flex !important; }
                }
            `;
            document.head.appendChild(style);
        }

        navbarPlaceholder.outerHTML = navbarHTML;
        
        // Setup mobile menu logic
        const mobileBtn = document.querySelector('.mobile-menu-btn');
        const mobileMenu = document.querySelector('.mobile-menu-overlay');
        const mobileIcon = mobileBtn?.querySelector('i');
        
        if (mobileBtn && mobileMenu) {
            mobileBtn.addEventListener('click', () => {
                const isOpen = mobileMenu.style.display === 'flex';
                mobileMenu.style.display = isOpen ? 'none' : 'flex';
                if (mobileIcon) {
                    mobileIcon.className = isOpen ? 'fa-solid fa-bars' : 'fa-solid fa-xmark';
                }
            });
        }

        // Setup High Contrast Logic
        const hcBtn = document.getElementById('highContrastToggle');
        if (hcBtn) {
            if (localStorage.getItem('highContrast') === 'true') {
                document.body.classList.add('high-contrast');
            }
            hcBtn.addEventListener('click', () => {
                const isHC = document.body.classList.toggle('high-contrast');
                localStorage.setItem('highContrast', isHC);
            });
        }

        // ─── GOOGLE TRANSLATE BYPASSER CSS ───
        if (!document.getElementById('gt-bypasser-styles')) {
            const style = document.createElement('style');
            style.id = 'gt-bypasser-styles';
            style.textContent = `
                /* Hide Google Translate Banner & Toolbar */
                .goog-te-banner-frame, .skiptranslate, .VIpgJd-ZVi9od-ORHb-OEVmcd, .VIpgJd-ZVi9od-l4eHX-hSRGPd, .VIpgJd-ZVi9od-ORHb-bN97Pc { display: none !important; }
                /* Hide Tooltip & Balloon */
                #goog-gt-tt, .goog-te-balloon-frame { display: none !important; visibility: hidden !important; pointer-events: none !important; }
                /* Remove Text Highlight */
                .goog-text-highlight { background: none !important; box-shadow: none !important; }
                /* Prevent Page Shift */
                body { top: 0 !important; }
                /* Hide the default widget */
                .goog-te-gadget, #google_translate_element { width: 0; height: 0; overflow: hidden; opacity: 0; pointer-events: none; position: absolute; }
                
                /* Custom Language Dropdown Styles */
                .custom-lang-wrapper { position: relative; display: inline-flex; align-items: center; }
                .custom-lang-btn {
                    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
                    padding: 8px 16px; border-radius: var(--radius-full);
                    background: var(--color-neutral-100); color: var(--color-neutral-700);
                    font-weight: 600; cursor: pointer; transition: all 0.3s; border: none; font-family: inherit;
                }
                .custom-lang-btn:hover { background: var(--color-primary-100); color: var(--color-primary-700); }
                .custom-lang-dropdown {
                    position: absolute; top: calc(100% + 10px); right: 0;
                    background: var(--color-white); border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-lg); border: 1px solid var(--color-neutral-200);
                    min-width: 160px; opacity: 0; visibility: hidden;
                    transform: translateY(10px); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 1000; overflow: hidden;
                }
                .custom-lang-wrapper.active .custom-lang-dropdown {
                    opacity: 1; visibility: visible; transform: translateY(0);
                }
                .custom-lang-item {
                    display: flex; align-items: center; gap: 10px;
                    padding: 10px 16px; color: var(--color-neutral-700);
                    cursor: pointer; transition: background 0.2s; font-weight: 500; font-size: 14px;
                }
                .custom-lang-item:hover { background: var(--color-primary-50); color: var(--color-primary-700); }
                .custom-lang-item.active { background: var(--color-primary-100); color: var(--color-primary-800); }
                
                /* Mobile Language Buttons */
                .mobile-lang-btn {
                    padding: 8px 12px; border: 1px solid var(--color-neutral-300); border-radius: var(--radius-md);
                    background: var(--color-white); font-weight: 500; cursor: pointer; transition: all 0.2s; color: var(--color-neutral-700);
                }
                .mobile-lang-btn.active { background: var(--color-primary-600); color: var(--color-white); border-color: var(--color-primary-600); }
                
                @media (max-width: 1023px) {
                    .custom-lang-wrapper { display: none !important; }
                }
            `;
            document.head.appendChild(style);
            
            // Body top reset observer
            const observer = new MutationObserver(() => {
                if (document.body.style.top !== '0px' && document.body.style.top !== '') {
                    document.body.style.top = '0px';
                }
            });
            observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
        }

        // Setup Custom Language Logic
        const langWrapper = document.getElementById('customLangWrapper');
        const langBtn = document.getElementById('customLangBtn');
        const langItems = document.querySelectorAll('.custom-lang-item');
        const langLabel = document.getElementById('currentLangLabel');
        const mobileLangBtns = document.querySelectorAll('.mobile-lang-btn');

        function changeLanguage(code, shortLabel, isInit = false) {
            // Update UI Desktop
            langItems.forEach(i => i.classList.remove('active'));
            const activeDesktop = Array.from(langItems).find(i => i.getAttribute('data-lang') === code);
            if (activeDesktop) activeDesktop.classList.add('active');
            if (langLabel && shortLabel) langLabel.textContent = shortLabel;
            if (langWrapper) langWrapper.classList.remove('active');
            
            // Update UI Mobile
            mobileLangBtns.forEach(i => i.classList.remove('active'));
            const activeMobile = Array.from(mobileLangBtns).find(i => i.getAttribute('data-lang') === code);
            if (activeMobile) activeMobile.classList.add('active');

            // Dispatch global event for other components (like AI Guide) to sync
            document.dispatchEvent(new CustomEvent('siteLanguageChanged', { detail: { lang: code } }));

            if (isInit) return; // Prevent infinite reloads on initial page load

            if (code === 'en') {
                const cookies = document.cookie.split("; ");
                for (let c of cookies) {
                    const [name] = c.split("=");
                    if (name.includes('googtrans')) {
                        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
                        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname;
                    }
                }
                window.location.reload();
            } else {
                const googleSelect = document.querySelector('.goog-te-combo');
                if (googleSelect) {
                    googleSelect.value = code;
                    googleSelect.dispatchEvent(new Event('change'));
                } else {
                    // Fallback if Google Translate hasn't fully loaded yet
                    document.cookie = 'googtrans=/en/' + code + '; path=/; domain=' + window.location.hostname;
                    document.cookie = 'googtrans=/en/' + code + '; path=/; domain=.' + window.location.hostname;
                    document.cookie = 'googtrans=/en/' + code + '; path=/';
                    window.location.reload();
                }
            }
        }

        if (langBtn && langWrapper) {
            // Restore current language on load
            const match = document.cookie.match(/googtrans=\/en\/(\w+)/);
            const currentLang = match ? match[1] : 'en';
            
            const activeItem = Array.from(langItems).find(i => i.getAttribute('data-lang') === currentLang);
            if(activeItem) {
                const shortLabel = activeItem.getAttribute('data-short');
                changeLanguage(currentLang, shortLabel, true);
            }

            langBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                langWrapper.classList.toggle('active');
                // Close text size wrapper if open
                const textSizeWrapper = document.getElementById('textSizeWrapper');
                if (textSizeWrapper) textSizeWrapper.classList.remove('active');
            });
            
            document.addEventListener('click', (e) => {
                if (!langWrapper.contains(e.target)) {
                    langWrapper.classList.remove('active');
                }
            });
            
            langItems.forEach(item => {
                item.addEventListener('click', () => {
                    const code = item.getAttribute('data-lang');
                    const shortLabel = item.getAttribute('data-short');
                    changeLanguage(code, shortLabel);
                });
            });
            
            mobileLangBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const code = btn.getAttribute('data-lang');
                    const shortLabel = btn.textContent.trim();
                    changeLanguage(code, shortLabel);
                });
            });
        }

        // Initialize Google Translate Widget
        if (!document.getElementById('google-translate-script')) {
            window.googleTranslateElementInit = function() {
                new google.translate.TranslateElement({
                    pageLanguage: 'en',
                    includedLanguages: 'en,ta,hi,te,ml,kn,bn',
                    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false
                }, 'google_translate_element');
            };
            
            const gtScript = document.createElement('script');
            gtScript.id = 'google-translate-script';
            gtScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            document.body.appendChild(gtScript);
        }

        // Setup Text Size Logic
        const textSizeWrapper = document.getElementById('textSizeWrapper');
        const textSizeBtn = document.getElementById('textSizeBtn');
        const sizeBtns = document.querySelectorAll('.text-size-btn');

        if (textSizeBtn && textSizeWrapper) {
            // Restore current size on load
            const currentSize = localStorage.getItem('accessibilityTextSize') || '16px';
            document.documentElement.style.fontSize = currentSize;
            
            sizeBtns.forEach(btn => {
                if (btn.getAttribute('data-size') === currentSize) {
                    sizeBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });

            textSizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                textSizeWrapper.classList.toggle('active');
                // Close language wrapper if open
                if (langWrapper) langWrapper.classList.remove('active');
            });
            
            document.addEventListener('click', (e) => {
                if (!textSizeWrapper.contains(e.target)) {
                    textSizeWrapper.classList.remove('active');
                }
            });
            
            sizeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const newSize = btn.getAttribute('data-size');
                    document.documentElement.style.fontSize = newSize;
                    localStorage.setItem('accessibilityTextSize', newSize);
                    
                    sizeBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    textSizeWrapper.classList.remove('active');
                });
            });
        }
    }

    // FIX: Signal to auth.js that navbar is fully rendered — replaces unreliable setTimeout
    document.dispatchEvent(new CustomEvent('navbarReady'));
});
