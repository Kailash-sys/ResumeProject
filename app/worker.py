from celery import Celery
from app.agents.orchestrator import run_resume_pipeline
from app.database import SessionLocal, Candidate
import os

redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
celery = Celery(__name__, broker=redis_url, backend=redis_url)

@celery.task(name="process_resume")
def _process_single_resume(file_path: str, filename: str, job_id: int = None):
    try:
        # Run the Multi-Agent orchestrator
        result = run_resume_pipeline(file_path)
        
        # Extract necessary components
        structured_info = result.get("structured_json", {})
        if "ResumeParseResult" in structured_info:
            structured_info = structured_info["ResumeParseResult"]
            
        if "errors" in result and result["errors"]:
            # Append error trace to the raw_text for debugging, but KEEP the structural fallback
            result["raw_text"] = "Parsing Errors: " + " | ".join(result["errors"]) + "\n\n" + result.get("raw_text", "")
                
        structured_info["file_path"] = file_path
        structured_info["filename"] = filename
        
        normalized_skills = result.get("normalized_skills", structured_info.get("skills", []))
        
        # Decorate the JSON with normalized info
        structured_info["normalized_skills"] = normalized_skills
        
        personal_info = structured_info.get("personal_info", {})
        if not isinstance(personal_info, dict):
             personal_info = {}
             
        # Make a better effort for unknown candidates
        name = personal_info.get("name")
        if not name: name = filename.split('.')[0]
        
        # Save parsed data to DB
        db = SessionLocal()
        candidate = Candidate(
            name=name,
            job_id=job_id,
            resume_data=structured_info,
            raw_text=result.get("raw_text", "")
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        candidate_id = candidate.id
        db.close()
            
        return {
            "candidate_id": candidate_id, 
            "status": "completed", 
            "message": f"Successfully parsed {filename}"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "failed", "error": str(e)}

@celery.task(name="process_resume")
def process_resume_task(file_path: str, filename: str, job_id: int = None):
    return _process_single_resume(file_path, filename, job_id)

@celery.task(bind=True, name="process_batch")
def process_batch_task(self, files_data: list, webhook_url: str = None, job_id: int = None):
    # files_data is a list of dicts: [{"file_path": ..., "filename": ...}, ...]
    results = []
    total = len(files_data)
    
    # Initialize state
    self.update_state(state='PROGRESS', meta={'current': 0, 'total': total, 'results': []})
    
    for i, file_data in enumerate(files_data):
        file_path = file_data.get("file_path")
        filename = file_data.get("filename")
        res = _process_single_resume(file_path, filename, job_id)
        results.append({"filename": filename, "result": res})
        
        self.update_state(state='PROGRESS', meta={'current': i + 1, 'total': total, 'results': results})
        
    final_output = {"status": "completed", "total": total, "results": results}
    
    if webhook_url:
        try:
            import urllib.request
            import json
            req = urllib.request.Request(
                webhook_url, 
                data=json.dumps({"job_id": self.request.id, **final_output}).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            urllib.request.urlopen(req, timeout=10)
        except Exception as e:
            print(f"Failed to send webhook to {webhook_url}: {e}")
            
    return final_output
