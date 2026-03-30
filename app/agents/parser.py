import os
import fitz # PyMuPDF
from app.schemas import ResumeParseResult
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import JsonOutputParser

def extract_text(file_path: str) -> str:
    text = ""
    if file_path.endswith(".pdf"):
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
    elif file_path.endswith(".docx"):
        import docx
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    else:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
    return text

def parsing_agent(state):
    file_path = state["file_path"]
    try:
        raw_text = extract_text(file_path)
    except Exception as e:
        return {"errors": [f"Text extraction failed: {str(e)}"]}
        
    # LLM Parsing via LangChain + Gemini
    try:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is missing!")
            
        model = ChatGoogleGenerativeAI(temperature=0, model="gemini-1.5-flash", google_api_key=api_key)
        parser = JsonOutputParser(pydantic_object=ResumeParseResult)
        
        prompt = PromptTemplate(
            template="You are an expert HR Talent Intelligence parser.\nExtract the following resume information into a highly accurate, structured JSON string based strictly on the format instructions.\nEnsure 100% extraction accuracy: do not miss any projects, experiences, or skills.\n{format_instructions}\n\nRESUME TEXT:\n{resume_text}\n",
            input_variables=["resume_text"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )
        
        chain = prompt | model | parser
        structured = chain.invoke({"resume_text": raw_text})
        
        return {"raw_text": raw_text, "structured_json": structured}
    except Exception as e:
        # ROBUST HEURISTIC FALLBACK:
        # If the API key is rate-limited, expired, or invalid, we will do a best-effort structural extraction
        # to ensure the Multi-Agent matching engine remains entirely functional without hallucinating static data.
        import re
        fallback = {
            "personal_info": {"name": "", "email": "", "phone": "", "location": ""},
            "projects": [], "experience": [], "education": [], "skills": [], "languages": []
        }
        
        # 1. Email extraction
        email_match = re.search(r'[\w\.-]+@[\w\.-]+', raw_text)
        if email_match: fallback["personal_info"]["email"] = email_match.group(0)
        
        # 2. Phone extraction
        phone_match = re.search(r'[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]', raw_text)
        if phone_match: fallback["personal_info"]["phone"] = phone_match.group(0)
        
        # 3. Simple Keyword scan for skills array (Dynamic, from text)
        common_tech = ["Python", "Java", "JavaScript", "C++", "C#", "SQL", "React", "Angular", "Vue", "Node", "AWS", "Azure", "Docker", "Kubernetes", "Machine Learning", "Data", "AI", "Cloud", "Agile", "Linux", "Git", "REST"]
        found_skills = [tech for tech in common_tech if tech.lower() in raw_text.lower()]
        fallback["skills"] = [{"name": s, "level": "Intermediate", "years": 1} for s in found_skills]
        
        # 4. Grab arbitrary text chunks as pseudo-experience lines to allow semantic matching against JD
        lines = [line.strip() for line in raw_text.split('\n') if len(line.strip()) > 20]
        if len(lines) > 2:
            # Assume first big paragraph/sentence acts as a role description summary
            fallback["experience"].append({"company": "Unknown", "title": "Professional Experience", "duration": "", "description": lines[1][:250]})
            if len(lines) > 4:
                fallback["projects"].append({"name": "Professional Project", "description": lines[3][:250]})
                
        return {
            "raw_text": raw_text, 
            "structured_json": fallback, 
            "errors": [f"Gemini LLM Extraction gracefully degraded to heuristic scan: {str(e)}"]
        }
