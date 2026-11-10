// pdf-generator.js - Generates offline reports for institutions

document.addEventListener('DOMContentLoaded', () => {
    const btnDownloadPdf = document.getElementById('btnDownloadPdf');
    
    if (btnDownloadPdf) {
        btnDownloadPdf.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (typeof html2pdf === 'undefined') {
                if (typeof showToast === 'function') showToast("PDF generation library failed to load. Please try again.", "error");
                return;
            }

            const originalText = btnDownloadPdf.innerHTML;
            btnDownloadPdf.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
            btnDownloadPdf.disabled = true;

            try {
                // Ensure all tabs are visible for the PDF so content isn't hidden
                const panels = document.querySelectorAll('.tab-panel');
                panels.forEach(p => p.style.display = 'block');
                
                // Hide interactive/unnecessary elements for the report
                const elementsToHide = document.querySelectorAll('.inst-tabs, .inst-sidebar, #main-navbar, #main-footer');
                elementsToHide.forEach(el => el.style.display = 'none');
                
                // Adjust layout for PDF
                const contentArea = document.querySelector('.inst-content');
                if (contentArea) contentArea.style.width = '100%';

                const element = document.body;
                
                const opt = {
                    margin:       10,
                    filename:     `${document.title.split('|')[0].trim().replace(/\s+/g, '-')}-Report.pdf`,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2, useCORS: true },
                    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                await html2pdf().set(opt).from(element).save();

            } catch (err) {
                console.error("PDF generation failed", err);
                if (typeof showToast === 'function') showToast("Failed to generate PDF report.", "error");
            } finally {
                // Restore layout
                const panels = document.querySelectorAll('.tab-panel');
                panels.forEach(p => p.style.display = '');
                
                // Only make the active one display block
                const activeTabBtn = document.querySelector('.tab-btn.active');
                if (activeTabBtn) {
                    panels.forEach(p => p.classList.remove('active'));
                    document.getElementById(`tab-${activeTabBtn.dataset.tab}`).classList.add('active');
                }
                
                const elementsToHide = document.querySelectorAll('.inst-tabs, .inst-sidebar, #main-navbar, #main-footer');
                elementsToHide.forEach(el => el.style.display = '');
                
                const contentArea = document.querySelector('.inst-content');
                if (contentArea) contentArea.style.width = '';

                btnDownloadPdf.innerHTML = originalText;
                btnDownloadPdf.disabled = false;
            }
        });
    }
});
