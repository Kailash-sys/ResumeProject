from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Project(BaseModel):
    name: str = Field(description="Name of the project")
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)

class Experience(BaseModel):
    company: str
    role: str
    duration: str
    responsibilities: List[str]

class Education(BaseModel):
    institution: str
    degree: str
    field: str
    year: str

class Skill(BaseModel):
    name: str = Field(description="The name of the skill, e.g., Python, React, Project Management")
    category: Optional[str] = Field(None, description="The category, e.g., Backend, Frontend, Soft Skill")
    years_of_experience: Optional[float] = None

class ResumeParseResult(BaseModel):
    personal_info: Dict[str, Any] = Field(description="Dictionary containing name, email, phone, location")
    experience: List[Experience] = Field(description="List of work experiences")
    education: List[Education] = Field(description="List of educational degrees")
    skills: List[Skill] = Field(description="List of extracted skills")
    projects: Optional[List[Project]] = Field(default_factory=list, description="List of projects")
    languages: Optional[List[str]] = Field(default_factory=list, description="Languages known by the candidate")

class MatchRequest(BaseModel):
    candidate_id: int
    job_description: str
    experience_years: Optional[str] = None
    languages_known: Optional[str] = None
    projects_required: Optional[str] = None
    company_size: Optional[str] = None
    company_type: Optional[str] = None

class BatchMatchRequest(BaseModel):
    candidate_ids: List[int]
    job_description: str
    experience_years: Optional[str] = None
    languages_known: Optional[str] = None
    projects_required: Optional[str] = None
    company_size: Optional[str] = None
    company_type: Optional[str] = None
    
class MatchResult(BaseModel):
    candidate_id: Optional[int] = None
    candidate_name: Optional[str] = None
    score: float
    label: str
    reasoning: str
    missing_skills: List[str]

# --- HR Login and Jobs Schemas ---
class HRSup(BaseModel):
    name: str
    email: str
    password: str
    company_name: str

class HRLogin(BaseModel):
    email: str
    password: str

class JobCreate(BaseModel):
    hr_id: int
    title: str
    description: str
    experience_years: Optional[str] = None
    languages_known: Optional[str] = None
    projects_required: Optional[str] = None
    company_type: Optional[str] = None

class JobResponse(JobCreate):
    id: int
