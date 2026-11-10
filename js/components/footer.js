// footer.js - Main footer component

document.addEventListener('DOMContentLoaded', () => {
    const footerPlaceholder = document.getElementById('main-footer');
    
    if (footerPlaceholder) {
        const footerHTML = `
            <footer style="background: linear-gradient(180deg, var(--color-primary-900) 0%, #0f172a 100%); color: var(--color-white); padding: var(--space-16) 0 var(--space-8); margin-top: auto; border-top: 1px solid rgba(255,255,255,0.05); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);">
                <div class="container">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-8); margin-bottom: var(--space-12);">
                        
                        <!-- Col 1: Brand -->
                        <div>
                            <div class="nav-brand" style="color: var(--color-white); margin-bottom: var(--space-4);">
                                <i class="fa-solid fa-seedling"></i> TNAU Agri Portal
                            </div>
                            <p style="color: rgba(255,255,255,0.7); font-size: var(--text-sm); line-height: 1.6; margin-bottom: var(--space-4);">
                                Tamil Nadu Agricultural University statewide network — uniting 18 Constituent Colleges, 28 Affiliated Colleges, 38 Research Stations, and 15 Krishi Vigyan Kendras with virtual tours and agro-climatic intelligence.
                            </p>
                        </div>
                        
                        <!-- Col 2: Quick Links -->
                        <div>
                            <h4 style="color: var(--color-white); font-size: var(--text-lg); margin-bottom: var(--space-4);">Quick Links</h4>
                            <ul style="display: flex; flex-direction: column; gap: var(--space-3);">
                                <li><a href="search.html" class="footer-link">Search Institutions</a></li>
                                <li><a href="map.html" class="footer-link">Agro-Climatic GIS Map</a></li>
                                <li><a href="compare.html" class="footer-link">Compare Colleges</a></li>
                                <li><a href="https://tnau-ruthram.netlify.app/" target="_blank" class="footer-link"><i class="fa-solid fa-vr-cardboard"></i> 360° Coimbatore Tour</a></li>
                                <li><a href="nri.html" class="footer-link">Admissions / NRI</a></li>
                            </ul>
                        </div>
                        
                        <!-- Col 3: About -->
                        <div>
                            <h4 style="color: var(--color-white); font-size: var(--text-lg); margin-bottom: var(--space-4);">About</h4>
                            <ul style="display: flex; flex-direction: column; gap: var(--space-3);">
                                <li><a href="#" class="footer-link">About Us</a></li>
                                <li><a href="#" class="footer-link">Contact</a></li>
                                <li><a href="#" class="footer-link">Privacy Policy</a></li>
                                <li><a href="#" class="footer-link">Terms of Service</a></li>
                            </ul>
                        </div>
                        
                        <!-- Col 4: Connect -->
                        <div>
                            <h4 style="color: var(--color-white); font-size: var(--text-lg); margin-bottom: var(--space-4);">Connect</h4>
                            <div style="display: flex; gap: var(--space-3);">
                                <a href="#" class="footer-social"><i class="fa-brands fa-facebook-f"></i></a>
                                <a href="#" class="footer-social"><i class="fa-brands fa-twitter"></i></a>
                                <a href="#" class="footer-social"><i class="fa-brands fa-instagram"></i></a>
                                <a href="#" class="footer-social"><i class="fa-brands fa-linkedin-in"></i></a>
                            </div>
                            <div style="margin-top: var(--space-6); background: rgba(255,255,255,0.03); padding: var(--space-4); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05);">
                                <p style="color: rgba(255,255,255,0.9); font-size: var(--text-sm); font-weight: 500; margin-bottom: var(--space-3);">Subscribe to updates</p>
                                <div style="display: flex; border-radius: var(--radius-full); overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                                    <input type="email" placeholder="Email address" style="padding: var(--space-3) var(--space-4); border: none; outline: none; width: 100%; background: rgba(255,255,255,0.05); color: white;">
                                    <button style="background: var(--color-accent-500); color: var(--color-white); padding: var(--space-3) var(--space-5); border: none; cursor: pointer; transition: background 0.3s;" onmouseover="this.style.background='var(--color-accent-600)'" onmouseout="this.style.background='var(--color-accent-500)'">
                                        <i class="fa-solid fa-arrow-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                    
                    <!-- Bottom Bar -->
                    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: var(--space-6); display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--space-4);">
                        <p style="color: rgba(255,255,255,0.5); font-size: var(--text-sm);">
                            &copy; ${new Date().getFullYear()} Universities. All rights reserved.
                        </p>
                        <p style="color: rgba(255,255,255,0.5); font-size: var(--text-sm);">
                            Designed for Tamil Nadu Students
                        </p>
                    </div>
                </div>
            </footer>
        `;
        
        // Ensure flex layout for body to keep footer at bottom
        document.body.style.display = 'flex';
        document.body.style.flexDirection = 'column';
        document.body.style.minHeight = '100vh';
        
        footerPlaceholder.outerHTML = footerHTML;
    }
});
