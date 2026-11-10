// pdf-generator.js - Handles generating and downloading a summary report for an institution

document.addEventListener('DOMContentLoaded', () => {
    const btnDownloadPdf = document.getElementById('btnDownloadPdf');
    if (btnDownloadPdf) {
        btnDownloadPdf.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (typeof showToast === 'function') {
                showToast("Generating PDF Report...", "info");
            }
            
            // For MVP, we simulate a report download as a text file to avoid huge external dependencies like html2pdf
            // In a production app, we would use a server-side service or html2pdf.js here.
            
            const uniName = document.getElementById('heroName')?.textContent || 'Institution';
            const uniLocation = document.getElementById('heroLocation')?.textContent.trim() || '';
            const uniCategory = document.getElementById('heroCategory')?.textContent || '';
            const trustScore = document.getElementById('transparencyScoreVal')?.textContent || 'N/A';
            
            setTimeout(() => {
                const reportContent = `
=========================================
DETAILED INSTITUTION REPORT
=========================================
Name: ${uniName}
Location: ${uniLocation}
Category: ${uniCategory}
Transparency Score: ${trustScore}
=========================================

This is a dynamically generated report for the institution.
For more details, please contact the admissions office.

Generated on: ${new Date().toLocaleDateString()}
Provided by: University Explorer Platform
                `.trim();

                const blob = new Blob([reportContent], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${uniName.replace(/[^a-zA-Z0-9]/g, '_')}_Report.txt`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                
                if (typeof showToast === 'function') {
                    showToast("Report downloaded successfully!", "success");
                }
            }, 1500);
        });
    }
});
