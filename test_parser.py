from app.agents.orchestrator import run_resume_pipeline
from app.agents.parser import extract_text
import sys
import unittest.mock

sample_text = """
John Doe
johndoe@example.com | 555-123-4567 | New York, NY

Experience:
Software Engineer at TechCorp (2020-2023)
- Built Python microservices.
- Managed AWS RDS and Kubernetes clusters.

Education:
B.S. Computer Science from University of XYZ

Projects:
E-commerce website: Built with React and Node.js.
"""

with unittest.mock.patch('app.agents.parser.extract_text', return_value=sample_text):
    with unittest.mock.patch('os.path.exists', return_value=True):
        res = run_resume_pipeline("dummy.pdf")
        import pprint
        pprint.pprint(res)
