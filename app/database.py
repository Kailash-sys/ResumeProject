from sqlalchemy import create_engine, Column, Integer, String, JSON, Float, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/talentdb")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class HRUser(Base):
    __tablename__ = "hr_users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String) # Hashed password
    company_name = Column(String)

class JobRole(Base):
    __tablename__ = "job_roles"
    id = Column(Integer, primary_key=True, index=True)
    hr_id = Column(Integer, ForeignKey('hr_users.id'))
    title = Column(String)
    description = Column(String)
    experience_years = Column(String)
    languages_known = Column(String)
    projects_required = Column(String)
    company_type = Column(String)
    
class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey('job_roles.id'), nullable=True) # Link candidate to a specific job run
    name = Column(String, index=True)
    resume_data = Column(JSON) # Structured parsed JSON including normalized skills
    raw_text = Column(String)

class SkillNode(Base):
    __tablename__ = "skills_taxonomy"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    parent_id = Column(Integer, ForeignKey('skills_taxonomy.id'), nullable=True)
    synonyms = Column(JSON) # List of synonyms

class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id'))
    job_id = Column(Integer, ForeignKey('job_roles.id'))
    score = Column(Float)
    reasoning = Column(String)

def init_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
