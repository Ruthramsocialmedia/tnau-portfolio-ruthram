// enquiry-form.js - Enquiry form component for the sidebar

function renderEnquiryForm(uniId, uniName) {
    // We expect showToast to be available from toast.js
    
    setTimeout(async () => {
        const form = document.getElementById('enquiryForm');
        if (form) {
            // Pre-fill user data if logged in
            try {
                if (window.db) {
                    const { data: { user } } = await window.db.auth.getUser();
                    if (user) {
                        const nameInput = form.querySelector('input[type="text"]');
                        const emailInput = form.querySelector('input[type="email"]');
                        if (nameInput && user.user_metadata?.full_name) {
                            nameInput.value = user.user_metadata.full_name;
                        }
                        if (emailInput && user.email) {
                            emailInput.value = user.email;
                        }
                    }
                }
            } catch (err) {
                console.warn("Could not fetch user session for form pre-fill");
            }

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = form.querySelector('button[type="submit"]');
                const originalText = btn.innerHTML;
                
                const name = form.querySelector('input[type="text"]').value;
                const email = form.querySelector('input[type="email"]').value.toLowerCase();
                const phone = form.querySelector('input[type="tel"]').value;
                const courseInterest = form.querySelector('select.form-select').value;
                const priorityCallback = form.querySelector('#priorityCallback').checked;
                let message = form.querySelector('textarea').value;
                
                // Append additional fields to the message for the admin dashboard
                if (courseInterest) {
                    message += `\n\nCourse Interest: ${courseInterest}`;
                }
                if (priorityCallback) {
                    message += `\n\n*** Priority Callback Requested ***`;
                }
                
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
                btn.disabled = true;
                
                try {
                    if (window.db) {
                        // Resolve the UUID from the database first
                        let dbInstId = null;
                        if (uniName) {
                            const { data: dbInst } = await window.db.from('institutions').select('id').eq('name', uniName).single();
                            if (dbInst) dbInstId = dbInst.id;
                        }
                        
                        if (!dbInstId) {
                            throw new Error("Institution not found in database. Cannot submit enquiry.");
                        }

                        const { error } = await window.db.from('enquiries').insert([{
                            institution_id: dbInstId,
                            student_name: name,
                            email: email,
                            phone: phone,
                            query: message,
                            status: 'pending'
                        }]);
                        if (error) throw error;
                    } else {
                        console.warn("Supabase not loaded. Simulating enquiry.");
                        await new Promise(r => setTimeout(r, 1000));
                    }
                    
                    if (typeof showToast === 'function') {
                        showToast('Enquiry sent successfully! The institution will contact you soon.', 'success');
                    } else {
                        if (typeof showToast === 'function') showToast('Enquiry sent successfully!', 'success');
                    }
                    form.reset();
                } catch (err) {
                    console.error("Enquiry failed", err);
                    if (typeof showToast === 'function') {
                        showToast('Failed to send enquiry. Please try again.', 'error');
                    } else {
                        if (typeof showToast === 'function') showToast('Failed to send enquiry.', 'error');
                    }
                } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            });
        }
    }, 100); // Wait for DOM injection

    return `
        <div class="sidebar-widget">
            <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-4); color: var(--color-primary-900);">Request Information</h3>
            <form id="enquiryForm">
                <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input type="text" class="form-input" required placeholder="Enter your name">
                </div>
                <div class="form-group">
                    <label class="form-label">Email Address *</label>
                    <input type="email" class="form-input" required placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number *</label>
                    <input type="tel" class="form-input" required pattern="[0-9]{10}" title="10 digit phone number" placeholder="10-digit mobile number">
                </div>
                <div class="form-group">
                    <label class="form-label">Course Interest</label>
                    <select class="form-select">
                        <option value="">Select a course category...</option>
                        <option value="engineering">Engineering / B.Tech</option>
                        <option value="arts">Arts & Science</option>
                        <option value="medical">Medical & Allied Health</option>
                        <option value="management">Management / MBA</option>
                        <option value="other">Other / Not sure</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Ask a Question / Message (Optional)</label>
                    <textarea class="form-textarea" placeholder="Any specific questions?"></textarea>
                </div>
                <div class="form-group" style="display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-2);">
                    <input type="checkbox" id="priorityCallback" style="width: auto;">
                    <label for="priorityCallback" style="font-size: var(--text-sm); color: var(--color-neutral-700); cursor: pointer;">Request a priority admission callback</label>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: var(--space-2);">
                    Submit Enquiry
                </button>
            </form>
            <p style="font-size: var(--text-xs); color: var(--color-neutral-500); text-align: center; margin-top: var(--space-4);">
                By submitting, you agree to our privacy policy.
            </p>
        </div>
    `;
}
