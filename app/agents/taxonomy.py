from app.agents.state import AgentState

def taxonomy_agent(state: AgentState):
    """
    Skill Normalization Agent that maps extracted skills to canonical entries.
    Here we implement a mock mapper or minimal approach.
    """
    structured_json = state.get("structured_json", {})
    raw_skills = structured_json.get("skills", [])
    
    normalized_skills = []
    
    # Simple Mock Taxonomy Database for mapping
    # E.g. JS -> JavaScript, k8s -> Kubernetes
    taxonomy_map = {
        "js": "JavaScript",
        "react.js": "React",
        "k8s": "Kubernetes",
        "ml": "Machine Learning",
        "nlp": "Natural Language Processing",
        "aws": "Amazon Web Services"
    }
    
    for skill in raw_skills:
        name = skill.get("name", "")
        # Normalization
        canonical_name = taxonomy_map.get(name.lower(), name)
        
        normalized_skills.append({
            "name": canonical_name,
            "original_term": name,
            "category": skill.get("category", "General"),
            "years_of_experience": skill.get("years_of_experience")
        })
        
    return {"normalized_skills": normalized_skills}
