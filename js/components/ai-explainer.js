// ai-explainer.js - Handles the AI Course Explainer Modal

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('aiModal');
    const closeBtn = document.getElementById('aiModalClose');
    
    if (modal && closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Close on clicking backdrop
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});

// Global function callable from inline onclick
window.openAiExplainer = function(courseName) {
    const modal = document.getElementById('aiModal');
    const title = document.getElementById('aiCourseTitle');
    const content = document.getElementById('aiModalContent');
    
    if (!modal) return;
    
    // Show loading state
    title.textContent = courseName;
    content.innerHTML = `
        <div style="text-align: center; padding: var(--space-8);">
            <i class="fa-solid fa-spinner fa-spin fa-2xl" style="color: var(--color-primary-500);"></i>
            <p style="margin-top: var(--space-4);">Analyzing curriculum & career outcomes...</p>
        </div>
    `;
    modal.style.display = 'flex';
    
    // Simulate AI API delay
    setTimeout(() => {
        content.innerHTML = generateSimulatedAiContent(courseName);
    }, 1500);
};

function generateSimulatedAiContent(courseName) {
    const lowerCourse = courseName.toLowerCase();
    
    let salary = "₹3L - ₹6L";
    let growth = "12%";
    let careers = ["Specialist", "Analyst", "Consultant"];
    let whatIsIt = `This is a comprehensive degree focusing on the foundational and advanced concepts of ${courseName}.`;
    
    if (lowerCourse.includes("engineering") || lowerCourse.includes("tech")) {
        salary = "₹4L - ₹12L";
        growth = "22%";
        careers = ["Software Engineer", "Systems Analyst", "Technical Consultant"];
        whatIsIt = `An engineering program focusing on technical problem solving, system design, and applied sciences related to ${courseName}.`;
    } else if (lowerCourse.includes("medical") || lowerCourse.includes("mbbs") || lowerCourse.includes("nursing")) {
        salary = "₹5L - ₹15L";
        growth = "18%";
        careers = ["Clinical Practitioner", "Healthcare Administrator", "Medical Researcher"];
        whatIsIt = `A rigorous healthcare program training students in clinical practices, patient care, and medical sciences.`;
    } else if (lowerCourse.includes("management") || lowerCourse.includes("mba") || lowerCourse.includes("bba")) {
        salary = "₹4L - ₹10L";
        growth = "15%";
        careers = ["Business Analyst", "Marketing Manager", "Operations Head"];
        whatIsIt = `A business-focused program that develops leadership, strategic thinking, and organizational management skills.`;
    } else if (lowerCourse.includes("arts") || lowerCourse.includes("science")) {
        salary = "₹3L - ₹8L";
        growth = "10%";
        careers = ["Researcher", "Educator", "Subject Matter Expert"];
        whatIsIt = `A foundational academic program focusing on theoretical knowledge and research in the specific domain.`;
    }
    
    return `
        <div style="margin-bottom: var(--space-4);">
            <h4 style="color: var(--color-primary-900); font-size: var(--text-base); margin-bottom: var(--space-2);">What is it?</h4>
            <p>${whatIsIt}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-6);">
            <div style="background: var(--color-primary-50); padding: var(--space-4); border-radius: var(--radius-md); text-align: center;">
                <div style="font-size: var(--text-2xl); font-weight: 700; color: var(--color-primary-700);">${salary}</div>
                <div style="font-size: var(--text-sm); color: var(--color-primary-900);">Avg Starting Salary</div>
            </div>
            <div style="background: #ecfdf5; padding: var(--space-4); border-radius: var(--radius-md); text-align: center;">
                <div style="font-size: var(--text-2xl); font-weight: 700; color: #047857;">${growth}</div>
                <div style="font-size: var(--text-sm); color: #065f46;">10-Year Job Growth</div>
            </div>
        </div>
        
        <div>
            <h4 style="color: var(--color-primary-900); font-size: var(--text-base); margin-bottom: var(--space-2);">Top Career Paths</h4>
            <ul style="list-style-type: disc; margin-left: var(--space-4); margin-bottom: var(--space-4);">
                ${careers.map(c => `<li style="margin-bottom: 4px;">${c}</li>`).join('')}
            </ul>
        </div>
        
        <div style="background: var(--color-neutral-50); padding: var(--space-4); border-radius: var(--radius-md); border-left: 3px solid var(--color-accent-500);">
            <p style="font-size: var(--text-sm); color: var(--color-neutral-600);"><em><i class="fa-solid fa-robot"></i> <strong>AI Insight:</strong> This field is highly dependent on continuous skill development. Students should prioritize internships and real-world projects over purely academic scores.</em></p>
        </div>
    `;
}
