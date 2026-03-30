import re
import numpy as np
from typing import Any
from app.schemas import MatchResult
from sqlalchemy.orm import Session
from app.database import Candidate
from sentence_transformers import SentenceTransformer, util

# Load the model globally to avoid loading it per request
try:
    _model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Failed to load SentenceTransformer: {e}")
    _model = None

def match_candidate_to_job(candidate: Candidate, request: Any) -> MatchResult:
    """
    This is the core Semantic AI Matching Logic using Vector Embeddings.
    Extracts potential requirements from the job description and 
    compares them dynamically with the candidate's normalized skills and extracted data using Sentence Transformers.
    """
    job_description = request.job_description
    
    normalized_skills = candidate.resume_data.get("normalized_skills", candidate.resume_data.get("skills", []))
    if isinstance(normalized_skills, list):
        skill_names = [skill.get("name", "").lower() if isinstance(skill, dict) else str(skill).lower() for skill in normalized_skills]
    else:
        skill_names = []
        
    experience_data = candidate.resume_data.get("experience", [])
    languages_data = candidate.resume_data.get("languages", [])
    projects_data = candidate.resume_data.get("projects", [])
    
    cand_text = " ".join(skill_names) + " " + " ".join([str(e) for e in experience_data]) + " " + " ".join([str(p) for p in projects_data])
    
    # 1. Semantic Similarity using Sentence Transformers
    base_score = 0.5 # Default middle score
    if _model and cand_text.strip() and job_description.strip():
        # Encode
        jd_embedding = _model.encode(job_description, convert_to_tensor=True)
        cand_embedding = _model.encode(cand_text, convert_to_tensor=True)
        # Cosine similarity
        cos_score = util.cos_sim(jd_embedding, cand_embedding).item()
        base_score = max(0.0, min(1.0, cos_score))
    else:
        # Fallback to simple matching if model fails or text is empty
        common_tech_skills = {"python", "react", "kubernetes", "javascript", "cloud", "aws", "azure", "docker", "sql", "java", "agile", "scrum"}
        job_words = set(re.findall(r'\b[a-z\+\#]{2,}\b', job_description.lower()))
        job_reqs = job_words.intersection(common_tech_skills)
        if not job_reqs: job_reqs = {"skills"}
        matched = sum(1 for req in job_reqs if req in cand_text.lower())
        base_score = matched / len(job_reqs)

    # 2. Advanced Criteria Bonus Logic
    bonus_score = 0.0
    total_bonus_available = 0.0
    reasoning_addons = []
    
    if getattr(request, 'experience_years', None) and request.experience_years.strip():
        total_bonus_available += 1.0
        if len(experience_data) > 0:
            bonus_score += 1.0
            reasoning_addons.append("Experience duration appears to align with expectations.")
        else:
            reasoning_addons.append("Candidate might lack requested experience length.")
            
    if getattr(request, 'languages_known', None) and request.languages_known.strip():
        req_langs = [l.strip().lower() for l in request.languages_known.split(',')]
        total_bonus_available += len(req_langs)
        matched_langs = 0
        cand_text_lower = cand_text.lower()
        for rl in req_langs:
            if rl in cand_text_lower:
                matched_langs += 1
                bonus_score += 1.0
        if matched_langs > 0:
            reasoning_addons.append(f"Matched {matched_langs} requested languages.")
            
    if getattr(request, 'projects_required', None) and request.projects_required.strip():
        total_bonus_available += 1.0
        if len(projects_data) > 0 or "project" in cand_text.lower():
            bonus_score += 1.0
            reasoning_addons.append("Found relevant project portfolio.")
            
    if getattr(request, 'company_type', None) and request.company_type.strip():
        total_bonus_available += 0.5
        if "company" in cand_text.lower():
            bonus_score += 0.5
            
    # Calculate final score: weighted average of semantic semantic score and bonus criteria
    if total_bonus_available > 0:
        final_score = (base_score * 0.7) + ((bonus_score / total_bonus_available) * 0.3)
    else:
        final_score = base_score
        
    reasoning = f"Semantic Match Score calculated via Vector Embeddings. Compatibility: {int(base_score*100)}% base text match."
    if reasoning_addons:
        reasoning += " " + " ".join(reasoning_addons)
        
    missing_skills = []
    if final_score < 0.5:
         missing_skills.append("JD alignment is generally low.")
        
    # Categories Adjusted for Embeddings (Embeddings usually sit between 0.3-0.8)
    if final_score >= 0.75:
        label = "Very Good Candidate"
    elif final_score >= 0.55:
        label = "Good Candidate"
    elif final_score >= 0.40:
        label = "Average Candidate"
    else:
        label = "Rejected"
    
    return MatchResult(
        candidate_id=candidate.id,
        candidate_name=candidate.name,
        score=final_score,
        label=label,
        reasoning=reasoning,
        missing_skills=missing_skills
    )

