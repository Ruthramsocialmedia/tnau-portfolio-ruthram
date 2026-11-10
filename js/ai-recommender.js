// ai-recommender.js - Dual Mode AI Parsing (Guided & Smart Text)

function openRecommender() {
    const modal = document.getElementById('recommender-modal');
    if (modal) {
        modal.showModal();
        resetRecommender();
    }
}

function switchAITab(tabId) {
    document.querySelectorAll('.ai-tab').forEach(t => {
        t.style.background = 'transparent';
        t.style.color = 'var(--color-neutral-600)';
        t.style.boxShadow = 'none';
    });
    
    const activeTabBtn = document.getElementById(`tab-btn-${tabId}`);
    if (activeTabBtn) {
        activeTabBtn.style.background = 'var(--color-white)';
        activeTabBtn.style.color = 'var(--color-neutral-900)';
        activeTabBtn.style.boxShadow = 'var(--shadow-sm)';
    }

    document.querySelectorAll('.ai-tab-content').forEach(c => c.style.display = 'none');
    const content = document.getElementById(`ai-recommender-${tabId}`);
    if (content) content.style.display = 'block';
    
    document.getElementById('rec-results').style.display = 'none';
}

function nextStep(step) {
    document.querySelectorAll('.rec-step').forEach(el => el.style.display = 'none');
    const nextEl = document.getElementById(`rec-step-${step}`);
    if (nextEl) nextEl.style.display = 'block';
}

function resetRecommender() {
    document.getElementById('rec-results').style.display = 'none';
    const promptInput = document.getElementById('ai-prompt');
    if (promptInput) promptInput.value = '';
    
    // Reset wizard
    document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
    nextStep(1);
    switchAITab('guided');
}

document.addEventListener('DOMContentLoaded', () => {
    const smartForm = document.getElementById('ai-recommender-smart');
    if (smartForm) {
        smartForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(smartForm);
            window.location.href = `search.html?q=${encodeURIComponent(formData.get('prompt'))}&ai=true`;
        });
    }

    const guidedForm = document.getElementById('ai-recommender-guided');
    if (guidedForm) {
        guidedForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(guidedForm);
            
            // Convert structured answers into a text prompt to use the same engine!
            let simulatedPrompt = [];
            const fields = ['course', 'careerGoal', 'studentType', 'language', 'examScore', 'state', 'distance', 'hostel', 'type', 'budget'];
            
            fields.forEach(f => {
                const val = formData.get(f);
                if (val && val !== 'Any' && val !== '') {
                    simulatedPrompt.push(`${f}: ${val}`);
                }
            });
            
            window.location.href = `search.html?q=${encodeURIComponent(simulatedPrompt.join(', '))}&ai=true`;
        });
    }
});

async function generateRecommendation(promptText) {
    const resultsDiv = document.getElementById('rec-results');
    const resultsList = document.getElementById('rec-list');
    
    resultsDiv.style.display = 'block';
    resultsList.innerHTML = '<div style="color: var(--color-neutral-600);"><i class="fa-solid fa-spinner fa-spin"></i> Our AI is analyzing your profile and scanning colleges...</div>';
    
    if (typeof UNIVERSITIES_DATA === 'undefined') {
        resultsList.innerHTML = '<div style="color: var(--color-danger-500);">Data not loaded.</div>';
        return;
    }
    
    if (typeof CONFIG === 'undefined' || !CONFIG.GEMINI_API_KEY) {
        resultsList.innerHTML = '<div style="color: var(--color-danger-500);">Gemini API Key missing in config.js</div>';
        return;
    }

    // Minify university data to save tokens
    const uniDataMin = UNIVERSITIES_DATA.map(u => ({
        id: u.id,
        name: u.name,
        loc: u.location,
        type: u.category,
        courses: u.smartData?.coursesOffered?.slice(0,5) || [],
        hostel: u.smartData?.hasHostel,
        naac: u.smartData?.naacGrade,
        fees: u.smartData?.estimatedFees
    }));

    const systemInstruction = `
    You are an expert college counsellor for Tamil Nadu students. 
    Based on the user's prompt (which contains their profile and preferences), find the top 3 matching colleges from the provided database.
    If they specify a budget, try to match it. If they specify hostel, filter for hostel=true.
    Return ONLY valid JSON in this exact format:
    {
      "matches": [
        {
          "id": integer,
          "name": "University Name",
          "whyItFits": "2-3 sentences explaining exactly why this is a great fit for their specific profile",
          "similarColleges": ["Name 1", "Name 2"]
        }
      ],
      "warnings": "Optional warning if important data is missing (e.g. 'You didn't specify an entrance score, so I assumed merit-based admission.') or if no perfect matches exist."
    }
    Database: ${JSON.stringify(uniDataMin)}
    `;

    try {
        let response;
        let retries = 1;
        let lastErrorText = '';
        
        while (retries >= 0) {
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `User Profile: ${promptText}` }]
                    }],
                    systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    },
                    generationConfig: {
                        response_mime_type: "application/json"
                    }
                })
            });

            if (response.ok) break;
            
            lastErrorText = await response.text();
            
            if (response.status === 503 && retries > 0) {
                // Wait 2 seconds before retrying
                await new Promise(r => setTimeout(r, 2000));
                retries--;
            } else {
                break;
            }
        }

        if (!response.ok) {
            let errorMsg = `Status ${response.status} - ${lastErrorText}`;
            try {
                const errObj = JSON.parse(lastErrorText);
                if (errObj.error && errObj.error.message) {
                    errorMsg = errObj.error.message;
                }
            } catch (e) {} // Not JSON
            
            if (response.status === 503) {
                errorMsg = "Our AI servers are currently experiencing high demand. Please wait a moment and try again.";
            }
            
            throw new Error(errorMsg);
        }
        
        const data = await response.json();
        
        let aiResponseText = data.candidates[0].content.parts[0].text;
        
        // Strip markdown code block formatting if present
        aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const aiJson = JSON.parse(aiResponseText);
        
        let html = '';
        
        if (aiJson.warnings) {
            html += `
            <div style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200); padding: 12px; border-radius: 8px; margin-bottom: 15px; font-size: 13px; color: var(--color-warning-800);">
                <i class="fa-solid fa-triangle-exclamation"></i> <strong>Note:</strong> ${aiJson.warnings}
            </div>`;
        }

        if (aiJson.matches && aiJson.matches.length > 0) {
            html += aiJson.matches.map(m => {
                const uni = UNIVERSITIES_DATA.find(u => u.id === m.id) || UNIVERSITIES_DATA.find(u => u.name === m.name);
                if (!uni) return '';
                
                const imgUrl = typeof getImageUrl === 'function' ? getImageUrl(uni) : (uni.image || 'assets/images/default-campus.jpg');
                const tourUrl = uni.tourUrl && uni.tourUrl !== '#' ? uni.tourUrl : `institution.html?slug=${toSlug(uni.name)}#tour`;
                
                return `
                <div style="border: 1px solid var(--color-neutral-200); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 15px; background: white;">
                    <div style="display: flex; padding: 15px; border-bottom: 1px solid var(--color-neutral-100); background: var(--color-neutral-50);">
                        <div style="width: 60px; height: 60px; border-radius: 8px; background-image: url('${imgUrl}'); background-size: cover; background-position: center; flex-shrink: 0; margin-right: 15px;"></div>
                        <div>
                            <h4 style="margin: 0; font-size: 16px; color: var(--color-primary-900);">${uni.name}</h4>
                            <div style="font-size: 13px; color: var(--color-neutral-500); margin-top: 4px;"><i class="fa-solid fa-location-dot"></i> ${uni.location}</div>
                        </div>
                    </div>
                    <div style="padding: 15px;">
                        <p style="font-size: 14px; color: var(--color-neutral-700); line-height: 1.5; margin-bottom: 15px;">
                            <strong><i class="fa-solid fa-bullseye" style="color: var(--color-success-500);"></i> Why it fits:</strong> ${m.whyItFits}
                        </p>
                        
                        <div style="font-size: 12px; color: var(--color-neutral-600); margin-bottom: 15px; padding: 8px; background: var(--color-neutral-50); border-radius: 4px;">
                            <strong>Similar Alternatives:</strong> ${m.similarColleges ? m.similarColleges.join(', ') : 'None listed'}
                        </div>
                        
                        <div style="display: flex; gap: 10px;">
                            <a href="institution.html?slug=${toSlug(uni.name)}" class="btn btn-primary btn-sm" style="flex: 1; text-align: center;">View Profile</a>
                            <a href="${tourUrl}" target="_blank" class="btn btn-outline btn-sm" style="flex: 1; text-align: center;"><i class="fa-solid fa-vr-cardboard"></i> Campus Tour</a>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
            resultsList.innerHTML = html;
        } else {
            resultsList.innerHTML = '<div style="color: var(--color-neutral-600);">No strong matches found. Try broadening your preferences.</div>';
        }
        
    } catch (error) {
        console.error("Gemini API Error:", error);
        resultsList.innerHTML = `<div style="color: var(--color-danger-500);">Failed to generate recommendation. Error: ${error.message}</div>`;
    }
}

function toSlug(name) {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}
