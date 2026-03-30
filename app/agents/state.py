from typing import TypedDict, List, Dict, Any

class AgentState(TypedDict, total=False):
    file_path: str
    raw_text: str
    structured_json: Dict[str, Any]
    normalized_skills: List[Dict[str, Any]]
    final_output: Dict[str, Any]
    errors: List[str]
