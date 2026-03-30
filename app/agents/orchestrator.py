from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from app.agents.parser import parsing_agent
from app.agents.taxonomy import taxonomy_agent

def create_workflow():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("parser", parsing_agent)
    workflow.add_node("normalizer", taxonomy_agent)
    
    workflow.set_entry_point("parser")
    workflow.add_edge("parser", "normalizer")
    workflow.add_edge("normalizer", END)
    
    return workflow.compile()

def run_resume_pipeline(file_path: str):
    app = create_workflow()
    initial_state = {"file_path": file_path, "errors": []}
    result = app.invoke(initial_state)
    return result
