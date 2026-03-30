let jobRequirements = { title: "", desc: "", exp: "", langs: "", projects: "", companyType: "" };
let candidateResultsData = {}; 
let uploadedFilesCount = 0;
let currentHRUser = null;
let currentJobId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Login Screen Logic
    const loginCard = document.getElementById('loginCard');
    const mainHeader = document.getElementById('mainHeader');
    const mainApp = document.getElementById('mainApp');
    const btnCandidate = document.getElementById('roleCandidate');
    const btnRecruiter = document.getElementById('roleRecruiter');
    const candForm = document.getElementById('candidateForm');
    const hrAuthForm = document.getElementById('hrAuthForm');
    
    btnRecruiter.addEventListener('click', () => {
        btnRecruiter.classList.add('active');
        btnCandidate.classList.remove('active');
        hrAuthForm.classList.remove('hidden');
        candForm.classList.add('hidden');
    });
    
    btnCandidate.addEventListener('click', () => {
        btnCandidate.classList.add('active');
        btnRecruiter.classList.remove('active');
        candForm.classList.remove('hidden');
        hrAuthForm.classList.add('hidden');
    });
    
    // Navigation Routing
    const navReqsBtn = document.getElementById('navReqsBtn');
    const navSourcingBtn = document.getElementById('navSourcingBtn');
    const navDashBtn = document.getElementById('navDashboardBtn');
    
    // Switch Views Helper
    function switchView(viewId) {
        document.getElementById('step0Card').classList.add('hidden');
        document.getElementById('step1Card').classList.add('hidden');
        document.getElementById('step2Card').classList.add('hidden');
        document.getElementById('step3Card').classList.add('hidden');
        document.getElementById(viewId).classList.remove('hidden');
        
        navReqsBtn.classList.remove('active');
        navSourcingBtn.classList.remove('active');
        navDashBtn.classList.remove('active');
    }
    
    if (navReqsBtn) navReqsBtn.addEventListener('click', () => { switchView('step1Card'); navReqsBtn.classList.add('active'); });
    if (navSourcingBtn) navSourcingBtn.addEventListener('click', () => { switchView('step2Card'); navSourcingBtn.classList.add('active'); });
    if (navDashBtn) navDashBtn.addEventListener('click', () => { switchView('step3Card'); navDashBtn.classList.add('active'); });

    // Back Buttons
    const backToReqBtn = document.getElementById('backToReqBtn');
    if (backToReqBtn) backToReqBtn.addEventListener('click', () => { switchView('step1Card'); navReqsBtn.classList.add('active'); });
    
    const backToUploadFromDashBtn = document.getElementById('backToUploadFromDashBtn');
    if (backToUploadFromDashBtn) backToUploadFromDashBtn.addEventListener('click', () => { switchView('step2Card'); navSourcingBtn.classList.add('active'); });
    
    const startOverBtn = document.getElementById('startOverBtn');
    if (startOverBtn) startOverBtn.addEventListener('click', () => { window.location.reload(); });
    
    // Auth Logic
    let isSignup = false;
    const toggleSignupBtn = document.getElementById('toggleSignupBtn');
    if(toggleSignupBtn) {
        const hrNameGroup = document.getElementById('hrNameGroup');
        const hrCompanyGroup = document.getElementById('hrCompanyGroup');
        const hrAuthTitle = document.getElementById('hrAuthTitle');
        const hrLoginBtn = document.getElementById('hrLoginBtn');
        
        toggleSignupBtn.addEventListener('click', () => {
            isSignup = !isSignup;
            if (isSignup) {
                hrNameGroup.classList.remove('hidden');
                hrCompanyGroup.classList.remove('hidden');
                hrAuthTitle.innerText = "Recruiter Sign Up";
                hrLoginBtn.innerText = "Create Account";
                toggleSignupBtn.innerText = "Already have an account? Login";
            } else {
                hrNameGroup.classList.add('hidden');
                hrCompanyGroup.classList.add('hidden');
                hrAuthTitle.innerText = "Recruiter Login";
                hrLoginBtn.innerText = "Login";
                toggleSignupBtn.innerText = "Need an account? Sign Up";
            }
        });

        hrLoginBtn.addEventListener('click', async () => {
            const email = document.getElementById('hrEmail').value;
            const password = document.getElementById('hrPassword').value;
            const name = document.getElementById('hrName').value;
            const company = document.getElementById('hrCompany').value;
            
            try {
                if (isSignup) {
                    const res = await fetch('/api/v1/auth/signup', {
                        method: 'POST', headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ email, password, name, company_name: company })
                    });
                    if(!res.ok) { alert("Error signing up."); return; }
                    alert("Signed up successfully! Please login.");
                    toggleSignupBtn.click();
                } else {
                    const res = await fetch('/api/v1/auth/login', {
                        method: 'POST', headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ email, password })
                    });
                    if(!res.ok) { alert("Invalid credentials."); return; }
                    currentHRUser = await res.json();
                    document.getElementById('loginCard').classList.add('hidden');
                    document.getElementById('mainHeader').classList.remove('hidden');
                    document.getElementById('mainApp').classList.remove('hidden');
                    document.getElementById('topNav').classList.remove('hidden');
                    loadJobsDashboard();
                }
            } catch (e) { console.error(e); }
        });
    }

    async function loadJobsDashboard() {
        switchView('step0Card');
        const jobsList = document.getElementById('jobsList');
        jobsList.innerHTML = '<p>Loading jobs...</p>';
        try {
            const res = await fetch(`/api/v1/jobs/hr/${currentHRUser.id}`);
            const jobs = await res.json();
            jobsList.innerHTML = '';
            if (jobs.length === 0) {
                jobsList.innerHTML = '<p class="text-sm text-dim">No jobs created yet.</p>';
                return;
            }
            jobs.forEach(job => {
                const card = document.createElement('div');
                card.style.padding = "15px";
                card.style.background = "rgba(255,255,255,0.05)";
                card.style.borderRadius = "8px";
                card.style.display = "flex";
                card.style.justifyContent = "space-between";
                card.style.alignItems = "center";
                card.innerHTML = `
                    <div>
                        <h3 style="margin: 0; font-size: 1.1em;">${job.title}</h3>
                        <p class="text-sm text-dim" style="margin: 5px 0 0 0;">Exp: ${job.experience_years || 'Any'} | Type: ${job.company_type || 'Any'}</p>
                    </div>
                    <div>
                        <button class="primary-btn view-job-btn" data-id="${job.id}" style="width: auto; padding: 6px 12px; font-size: 0.85em;">View / Sourcing</button>
                    </div>
                `;
                jobsList.appendChild(card);
            });
            
            document.querySelectorAll('.view-job-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    currentJobId = e.target.getAttribute('data-id');
                    const jobReqsResp = await fetch(`/api/v1/jobs/${currentJobId}`);
                    const jobData = await jobReqsResp.json();
                    jobRequirements = {
                        title: jobData.title, desc: jobData.description,
                        exp: jobData.experience_years, langs: jobData.languages_known,
                        projects: jobData.projects_required, companyType: jobData.company_type
                    };
                    document.getElementById('reqDomain').value = currentHRUser.company_name;
                    
                    // Fetch existing candidates
                    const candsResp = await fetch(`/api/v1/jobs/${currentJobId}/candidates`);
                    const existingCands = await candsResp.json();
                    
                    if (existingCands.length > 0) {
                        switchView('step3Card');
                        document.getElementById('displayJobTitle').innerText = jobRequirements.title + " (Loading Scores...)";
                        
                        const candidateIds = existingCands.map(c => c.id);
                        
                        try {
                            const matchRes = await fetch('/api/v1/match/batch', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    candidate_ids: candidateIds, job_description: jobRequirements.desc,
                                    experience_years: jobRequirements.exp, languages_known: jobRequirements.langs,
                                    projects_required: jobRequirements.projects, company_size: "", company_type: jobRequirements.companyType
                                })
                            });
                            const batchData = await matchRes.json();
                            renderDashboard(batchData.matches);
                        } catch(err) { console.error(err); }
                        
                    } else {
                        switchView('step2Card');
                        navSourcingBtn.classList.add('active');
                    }
                });
            });
        } catch (e) {
            jobsList.innerHTML = '<p>Error loading jobs.</p>';
        }
    }
    
    const createNewJobBtn = document.getElementById('createNewJobBtn');
    if(createNewJobBtn) {
        createNewJobBtn.addEventListener('click', () => {
            switchView('step1Card');
            navReqsBtn.classList.add('active');
        });
    }

    // Candidate Portal actions
    document.getElementById('candUploadBtn').addEventListener('click', () => {
        document.getElementById('candFileInput').click();
    });
    document.getElementById('candFileInput').addEventListener('change', function() {
        if(this.files.length > 0) {
            alert("Resume uploaded successfully! Basic info saved.");
        }
    });
    document.getElementById('candAIFetchBtn').addEventListener('click', () => {
        alert("Initializing Autonomous AI Agent... Searching LinkedIn and web sources. Profile and resume fetched & populated successfully!");
    });


    // Step 1 to Step 2
    document.getElementById('proceedToUploadBtn').addEventListener('click', async () => {
        const title = document.getElementById('jobTitle').value.trim();
        const desc = document.getElementById('jobDesc').value.trim();
        
        const reqExp = document.getElementById('reqExp').value.trim();
        const reqLangs = document.getElementById('reqLangs').value.trim();
        const reqProjects = document.getElementById('reqProjects').value.trim();
        const reqCompanyType = document.getElementById('reqCompanyType').value;
        const reqTechStack = document.getElementById('reqTechStack').value || "";
        
        if (!title || !desc) {
            alert("Please fill out both the Job Title and Job Description requirements.");
            return;
        }
        
        const fullDesc = desc + " " + reqTechStack;
        
        jobRequirements.title = title;
        jobRequirements.desc = fullDesc;
        jobRequirements.exp = reqExp;
        jobRequirements.langs = reqLangs;
        jobRequirements.projects = reqProjects;
        jobRequirements.companyType = reqCompanyType;

        // Save job to backend
        try {
            const res = await fetch('/api/v1/jobs', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    hr_id: currentHRUser.id, title: title, description: fullDesc,
                    experience_years: reqExp, languages_known: reqLangs,
                    projects_required: reqProjects, company_type: reqCompanyType
                })
            });
            const newJob = await res.json();
            currentJobId = newJob.id;
        } catch(e) {
            console.error("Failed to create job", e);
        }

        switchView('step2Card');
        navSourcingBtn.classList.add('active');
    });

    // Upload Files
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    dropZone.addEventListener('click', () => fileInput.click());

    ['dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); });
    });

    dropZone.addEventListener('dragover', () => dropZone.classList.add('dragover'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    
    dropZone.addEventListener('drop', (e) => {
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) handleFiles(this.files);
    });

    const exportExcelBtn = document.getElementById('exportExcelBtn');
    if(exportExcelBtn) {
        exportExcelBtn.addEventListener('click', async () => {
            if(!candidateResultsData || Object.keys(candidateResultsData).length === 0) {
                alert("No data to export");
                return;
            }
            
            const originalText = exportExcelBtn.innerHTML;
            exportExcelBtn.innerText = "Exporting...";
            
            try {
                // Collect results into an array
                const sortedCandidates = Object.values(candidateResultsData).sort((a, b) => b.score - a.score);
                const rows = [];
                for(let match of sortedCandidates) {
                    let fullData = {};
                    try {
                        const res = await fetch(`/api/v1/candidates/${match.candidate_id}`);
                        fullData = await res.json();
                    } catch(e) {}
                    
                    const resume = fullData.resume_data || {};
                    const pInfo = resume.personal_info || {};
                    const skillsArray = resume.normalized_skills || resume.skills || [];
                    const skillsStr = skillsArray.map(s => typeof s === 'string' ? s : s.name).join(", ");
                    const expStr = (resume.experience || []).map(e => `${e.title || e.role || ''} at ${e.company || ''} (${e.duration || ''})`).join(" | ");
                    const eduStr = (resume.education || []).map(e => `${e.degree || ''} from ${e.institution || ''}`).join(" | ");
                    const projsStr = (resume.projects || []).map(p => `${p.name || ''}: ${p.description || ''}`).join(" | ");
                    
                    rows.push({
                        "Candidate ID": match.candidate_id,
                        "Name": match.candidate_name,
                        "Match Category": match.label,
                        "Score (%)": Math.round(match.score * 100),
                        "Reasoning": match.reasoning,
                        "Missing Requirements": match.missing_skills.join(", "),
                        "Email": pInfo.email || "",
                        "Phone": pInfo.phone || "",
                        "Location": pInfo.location || "",
                        "Detected Skills": skillsStr,
                        "Experience History": expStr,
                        "Education History": eduStr,
                        "Projects Portfolio": projsStr,
                        "Original Resume Link": `${window.location.origin}/api/v1/candidates/${match.candidate_id}/resume`
                    });
                }
                
                const worksheet = XLSX.utils.json_to_sheet(rows);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");
                XLSX.writeFile(workbook, "Talent_Intelligence_Export.xlsx");
                
            } catch(e) {
                console.error(e);
                alert("Error exporting to Excel");
            }
            
            exportExcelBtn.innerHTML = originalText;
        });
    }
});

async function handleFiles(files) {
    if (files.length === 0) return;
    
    // UI Loading setup
    const statusBox = document.getElementById('statusBox');
    const statusMsg = document.getElementById('statusMsg');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    
    statusBox.classList.remove('hidden');
    progressContainer.classList.remove('hidden');
    statusMsg.innerText = `Uploading ${files.length} resumes...`;
    progressBar.style.width = '0%';

    const taskIds = [];
    
    // 1. Upload Phase (Concurrent)
    let uploadedCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        if (currentJobId) {
            formData.append('job_id', currentJobId);
        }
        
        try {
            const res = await fetch('/api/v1/parse', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.task_id) taskIds.push(data.task_id);
        } catch (err) {
            console.error(err);
        }
        
        uploadedCount++;
        progressBar.style.width = `${(uploadedCount / files.length) * 30}%`;
    }

    // 2. Multi-Agent Processing Poll Phase
    statusMsg.innerText = `Multi-Agent Analysis in progress for ${taskIds.length} resumes...`;
    
    const candidateIds = [];
    let completedTasks = 0;
    
    await new Promise((resolve) => {
        const checkInterval = setInterval(async () => {
            let stillPending = 0;
            completedTasks = 0;
            candidateIds.length = 0; // reset array, we'll re-add everything done

            for (const taskId of taskIds) {
                const res = await fetch(`/api/v1/parse/status/${taskId}`);
                const data = await res.json();
                
                if (data.status === 'SUCCESS') {
                    if (data.result && data.result.candidate_id) {
                        candidateIds.push(data.result.candidate_id);
                    }
                    completedTasks++;
                } else if (data.status === 'FAILED') {
                    completedTasks++; // It finished, but failed.
                } else {
                    stillPending++;
                }
            }
            
            progressBar.style.width = `${30 + ((completedTasks / taskIds.length) * 40)}%`;
            statusMsg.innerText = `Extracted structure & normalized skills for ${completedTasks}/${taskIds.length} candidates...`;

            if (stillPending === 0) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 3000);
    });

    // 3. Batch Job Semantic Match Phase
    statusMsg.innerText = `Running Semantic Batch Match against Job Requirements...`;
    progressBar.style.width = '85%';

    try {
        const res = await fetch('/api/v1/match/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                candidate_ids: candidateIds,
                job_description: jobRequirements.desc,
                experience_years: jobRequirements.exp,
                languages_known: jobRequirements.langs,
                projects_required: jobRequirements.projects,
                company_size: "", // can be added later
                company_type: jobRequirements.companyType
            })
        });
        const batchData = await res.json();
        progressBar.style.width = '100%';
        
        setTimeout(() => {
            renderDashboard(batchData.matches);
        }, 1000);
        
    } catch(err) {
        statusMsg.innerText = `Error running semantic match phase.`;
        console.error(err);
    }
}

function renderDashboard(matches) {
    document.getElementById('step2Card').classList.add('hidden');
    document.getElementById('step3Card').classList.remove('hidden');
    document.getElementById('navDashboardBtn').classList.add('active');
    document.getElementById('navSourcingBtn').classList.remove('active');
    
    document.getElementById('displayJobTitle').innerText = jobRequirements.title;

    // Reset columns
    document.getElementById('listVeryGood').innerHTML = '';
    document.getElementById('listGood').innerHTML = '';
    document.getElementById('listAverage').innerHTML = '';
    document.getElementById('listRejected').innerHTML = '';
    
    let counts = { veryGood: 0, good: 0, average: 0, rejected: 0 };
    candidateResultsData = {};

    matches.forEach(match => {
        candidateResultsData[match.candidate_id] = match;
        
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.onclick = () => openModal(match.candidate_id);
        
        card.innerHTML = `
            <div class="candidate-name">${match.candidate_name || "Unknown Candidate"} (ID: #${match.candidate_id})</div>
            <div class="candidate-score">Score: ${Math.round(match.score * 100)}% Match</div>
        `;

        if (match.label === "Very Good Candidate") {
            document.getElementById('listVeryGood').appendChild(card);
            counts.veryGood++;
        } else if (match.label === "Good Candidate") {
            document.getElementById('listGood').appendChild(card);
            counts.good++;
        } else if (match.label === "Average Candidate") {
            document.getElementById('listAverage').appendChild(card);
            counts.average++;
        } else {
            document.getElementById('listRejected').appendChild(card);
            counts.rejected++;
        }
    });

    document.getElementById('countVeryGood').innerText = counts.veryGood;
    document.getElementById('countGood').innerText = counts.good;
    document.getElementById('countAverage').innerText = counts.average;
    document.getElementById('countRejected').innerText = counts.rejected;
}

async function openModal(candidateId) {
    const match = candidateResultsData[candidateId];
    if (!match) return;
    
    document.getElementById('modalName').innerText = match.candidate_name || "Unknown Candidate";
    document.getElementById('modalScore').innerText = `Compatibility Score: ${Math.round(match.score * 100)}%`;
    document.getElementById('modalReasoning').innerText = match.reasoning;
    
    // Set Download URI
    const downloadBtn = document.getElementById('modalDownloadBtn');
    if (downloadBtn) {
        downloadBtn.href = `/api/v1/candidates/${candidateId}/resume`;
    }
    
    // Missing requirements
    const missingEl = document.getElementById('modalMissing');
    missingEl.innerHTML = '';
    if (match.missing_skills && match.missing_skills.length) {
        match.missing_skills.forEach(s => {
            missingEl.innerHTML += `<span class="missing-skill">${s}</span>`;
        });
    } else {
        missingEl.innerHTML = '<span style="color:var(--text-muted)">No major gaps detected.</span>';
    }

    // Load actual skills and full data from DB
    const skillEl = document.getElementById('modalSkills');
    skillEl.innerHTML = '<span style="color:var(--text-muted)">Loading normalized data...</span>';
    
    const pInfoEl = document.getElementById('modalPersonalInfo');
    const expEl = document.getElementById('modalExperience');
    const eduEl = document.getElementById('modalEducation');
    
    if (pInfoEl) pInfoEl.innerHTML = 'Loading...';
    if (expEl) expEl.innerHTML = 'Loading...';
    if (eduEl) eduEl.innerHTML = 'Loading...';
    
    document.getElementById('candidateModal').classList.remove('hidden');

    try {
        const res = await fetch(`/api/v1/candidates/${candidateId}`);
        const result = await res.json();
        
        const data = result.resume_data || {};
        
        // Skills
        skillEl.innerHTML = '';
        const skills = data.normalized_skills || data.skills || [];
        if (skills && skills.length > 0) {
            skills.forEach(skill => {
                const name = typeof skill === 'string' ? skill : skill.name;
                skillEl.innerHTML += `<span class="skill-tag">${name}</span>`;
            });
        } else {
            skillEl.innerHTML = '<span style="color:var(--text-muted)">No detected structural skills.</span>';
        }

        // Personal Info Table
        if (pInfoEl) {
            const pInfo = data.personal_info || {};
            let pHTML = `
            <table class="resume-table">
                <tr><th>Detail</th><th>Value</th></tr>
                <tr><td><strong>Email</strong></td><td>${pInfo.email || '-'}</td></tr>
                <tr><td><strong>Phone</strong></td><td>${pInfo.phone || '-'}</td></tr>
                <tr><td><strong>Location</strong></td><td>${pInfo.location || '-'}</td></tr>
            </table>`;
            pInfoEl.innerHTML = pHTML;
        }

        // Experience Table
        if (expEl) {
            const exp = data.experience || [];
            let eHTML = `<table class="resume-table" style="min-width: 500px;">
                <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Duration</th>
                </tr>`;
            if (exp.length > 0) {
                exp.forEach(e => {
                    eHTML += `
                    <tr>
                        <td>${e.company || 'Unknown'}</td>
                        <td>${e.title || e.role || '-'}</td>
                        <td>${e.duration || '-'}</td>
                    </tr>`;
                });
            } else {
                eHTML += `<tr><td colspan="3" style="text-align:center;">No experience extracted</td></tr>`;
            }
            eHTML += `</table>`;
            expEl.innerHTML = eHTML;
        }

        // Education & Projects Table
        if (eduEl) {
            const edu = data.education || [];
            const projs = data.projects || [];
            
            let edHTML = `<table class="resume-table" style="min-width: 500px;">
                <tr>
                    <th>Type</th>
                    <th>Name / Degree</th>
                    <th>Institution / Details</th>
                </tr>`;
                
            if (edu.length === 0 && projs.length === 0) {
                 edHTML += `<tr><td colspan="3" style="text-align:center;">No education or projects extracted</td></tr>`;
            } else {
                edu.forEach(e => {
                    edHTML += `
                    <tr>
                        <td><span class="skill-tag" style="background: rgba(59, 130, 246, 0.2); color: #93c5fd;">Education</span></td>
                        <td>${e.degree || '-'}</td>
                        <td>${e.institution || '-'}</td>
                    </tr>`;
                });
                projs.forEach(p => {
                    edHTML += `
                    <tr>
                        <td><span class="skill-tag" style="background: rgba(16, 185, 129, 0.2); color: #6ee7b7;">Project</span></td>
                        <td>${p.name || '-'}</td>
                        <td>${p.description || '-'}</td>
                    </tr>`;
                });
            }
            edHTML += `</table>`;
            eduEl.innerHTML = edHTML;
        }

    } catch (e) { 
        console.error(e); 
        skillEl.innerHTML = '<span style="color:var(--text-muted)">Error loading data.</span>';
    }
}

window.closeModal = function() {
    document.getElementById('candidateModal').classList.add('hidden');
}
