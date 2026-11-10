// certificate.js - Generates the Virtual Visit Certificate

document.addEventListener('DOMContentLoaded', () => {
    const btnCertificate = document.getElementById('btnCertificate');
    
    if (btnCertificate) {
        btnCertificate.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (typeof html2pdf === 'undefined') {
                if (typeof showToast === 'function') showToast("PDF generation library failed to load. Please try again.", "error");
                return;
            }

            // Get user's name if logged in
            let studentName = "Student";
            if (window.db) {
                const { data: { session } } = await window.db.auth.getSession();
                if (session && session.user.user_metadata && session.user.user_metadata.full_name) {
                    studentName = session.user.user_metadata.full_name;
                }
            }

            const uniName = document.getElementById('heroName').textContent || "the Institution";

            const originalText = btnCertificate.innerHTML;
            btnCertificate.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
            btnCertificate.disabled = true;

            // Create an invisible div for the certificate
            const certDiv = document.createElement('div');
            certDiv.style.width = '800px';
            certDiv.style.height = '600px';
            certDiv.style.padding = '40px';
            certDiv.style.background = '#ffffff';
            certDiv.style.border = '10px solid var(--color-primary-900)';
            certDiv.style.position = 'absolute';
            certDiv.style.left = '-9999px';
            certDiv.style.top = '-9999px';
            certDiv.style.fontFamily = 'Inter, sans-serif';
            certDiv.style.textAlign = 'center';
            certDiv.style.boxSizing = 'border-box';
            
            certDiv.innerHTML = `
                <div style="border: 2px solid var(--color-warm-500); height: 100%; padding: 40px; display: flex; flex-direction: column; justify-content: center; position: relative;">
                    <div style="position: absolute; top: 20px; left: 0; width: 100%; text-align: center;">
                        <i class="fa-solid fa-graduation-cap" style="font-size: 40px; color: var(--color-primary-900);"></i>
                    </div>
                    
                    <h1 style="font-family: Satoshi, sans-serif; font-size: 48px; color: var(--color-primary-900); margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">Certificate of Completion</h1>
                    <h2 style="font-size: 24px; color: var(--color-warm-600); font-weight: 500; margin-bottom: 40px; text-transform: uppercase; letter-spacing: 4px;">Virtual Campus Visit</h2>
                    
                    <p style="font-size: 18px; color: #555; margin-bottom: 10px;">This certifies that</p>
                    <p style="font-family: Satoshi, sans-serif; font-size: 36px; color: #111; font-weight: 700; margin-bottom: 20px; border-bottom: 1px solid #ccc; display: inline-block; padding-bottom: 5px;">${studentName}</p>
                    
                    <p style="font-size: 18px; color: #555; margin-bottom: 10px;">has successfully completed a comprehensive 360° virtual exploration of</p>
                    <p style="font-size: 28px; color: var(--color-primary-900); font-weight: 700; margin-bottom: 40px;">${uniName}</p>
                    
                    <div style="display: flex; justify-content: space-between; margin-top: auto; padding-top: 20px;">
                        <div style="text-align: center;">
                            <p style="font-size: 14px; font-weight: bold; border-top: 1px solid #333; padding-top: 5px; width: 150px; margin: 0 auto;">Date of Visit</p>
                            <p style="font-size: 16px;">${new Date().toLocaleDateString()}</p>
                        </div>
                        
                        <div style="text-align: center;">
                            <i class="fa-solid fa-circle-check" style="font-size: 40px; color: var(--color-warm-500); margin-bottom: 10px;"></i>
                            <p style="font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 1px;">Verified by AI Campus Guide</p>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(certDiv);

            try {
                const opt = {
                    margin:       0,
                    filename:     `${studentName.replace(/\s+/g, '_')}_Virtual_Visit_Certificate.pdf`,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2 },
                    jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
                };

                await html2pdf().set(opt).from(certDiv).save();

            } catch (err) {
                console.error("Certificate generation failed", err);
                if (typeof showToast === 'function') showToast("Failed to generate certificate.", "error");
            } finally {
                document.body.removeChild(certDiv);
                btnCertificate.innerHTML = originalText;
                btnCertificate.disabled = false;
            }
        });
    }
});
