"""
EGY-Sentinel AML — Project Scaffolding Script
=============================================
Run once on Day 1 to create the full folder structure.
Works on Windows, macOS, and Linux (no shell commands, pure Python).

Usage:
    python setup_project.py

Idempotent: safe to run multiple times — existing files are skipped.
"""

from pathlib import Path

# Project root = the directory you run this script from
ROOT = Path.cwd()

# ─────────────────────────────────────────────────────────────────────────────
# 1. DIRECTORIES TO CREATE
# ─────────────────────────────────────────────────────────────────────────────
DIRECTORIES = [
    "schemas",                # JSON schema contracts (locked on Day 1)
    "data/sample",            # PaySim 50K stratified sample
    "notebooks",              # Jupyter notebooks (DS + Agentic tracks)
    "demo",                   # Next.js frontend (AI-5 owns this)
    "egysentinel",            # Main Python package
    "egysentinel/api",        # FastAPI service layer
    "egysentinel/agents",     # GLM-powered agentic AI layer
    "egysentinel/detect",     # Pattern detection modules
    "egysentinel/score",      # Risk scoring modules
    "egysentinel/graph",      # Graph construction + Neo4j loader
]

# ─────────────────────────────────────────────────────────────────────────────
# 2. ROOT-LEVEL FILES (filename -> content)
# ─────────────────────────────────────────────────────────────────────────────
ROOT_FILES = {
    "README.md": (
        "# EGY-Sentinel AML\n\n"
        "AI-Powered Financial Surveillance & Fraud Intelligence System.\n\n"
        "## Quick Start\n\n"
        "```bash\n"
        "python -m venv venv\n"
        "venv\\Scripts\\activate         # Windows\n"
        "# source venv/bin/activate     # macOS / Linux\n"
        "pip install -r requirements.txt\n"
        "```\n\n"
        "## Project Structure\n\n"
        "- `egysentinel/` — main Python package (api, agents, detect, score, graph)\n"
        "- `notebooks/`   — Jupyter notebooks (DS track + Agentic track)\n"
        "- `demo/`        — Next.js frontend (AI-5)\n"
        "- `schemas/`     — JSON schemas (contracts between modules)\n"
        "- `data/sample/` — PaySim 50K stratified sample\n"
    ),
    ".gitignore": (
        "# Python\n"
        "__pycache__/\n"
        "*.pyc\n"
        "*.pyo\n"
        ".env\n"
        ".venv/\n"
        "venv/\n"
        ".ipynb_checkpoints/\n\n"
        "# Node / Next.js\n"
        "node_modules/\n"
        ".next/\n\n"
        "# Data (do not commit large files)\n"
        "data/sample/*.csv\n"
        "data/llm_cache/\n"
        "models/*.joblib\n\n"
        "# OS / IDE\n"
        ".DS_Store\n"
        "*.log\n"
        ".vscode/\n"
        ".idea/\n"
    ),
    "requirements.txt": (
        "# EGY-Sentinel AML — Python dependencies\n"
        "# Pin exact versions on Day 7 before Docker freeze\n\n"
        "# Data\n"
        "pandas>=2.2\n"
        "pyarrow>=15.0\n\n"
        "# Graph\n"
        "networkx>=3.2\n"
        "neo4j>=5.18\n\n"
        "# ML\n"
        "scikit-learn>=1.4\n"
        "xgboost>=2.0\n\n"
        "# Service\n"
        "fastapi>=0.110\n"
        "uvicorn[standard]>=0.27\n"
        "pydantic>=2.6\n"
        "python-multipart>=0.0.9\n\n"
        "# Agentic AI (free, no API key)\n"
        "z-ai-web-dev-sdk\n\n"
        "# Notebooks + Demo (Streamlit fallback)\n"
        "jupyterlab>=4.1\n"
        "streamlit>=1.32\n\n"
        "# Tests\n"
        "pytest>=8.0\n"
    ),
    ".env.example": (
        "# Copy to .env and fill in if needed.\n"
        "# For this capstone, GLM via z-ai-web-dev-sdk requires NO API key.\n"
        "NEO4J_URI=bolt://localhost:7687\n"
        "NEO4J_USER=neo4j\n"
        "NEO4J_PASSWORD=egysentinel\n"
    ),
}

# ─────────────────────────────────────────────────────────────────────────────
# 3. PYTHON PACKAGE FILES (path -> content)
#    Every package + sub-package needs __init__.py so Python treats it as a
#    module. We also add a short docstring to each.
# ─────────────────────────────────────────────────────────────────────────────
PACKAGE_FILES = {
    "egysentinel/__init__.py": (
        '"""EGY-Sentinel AML — main package.\n\n'
        'AI-Powered Financial Surveillance & Fraud Intelligence System.\n'
        '"""\n'
        '__version__ = "0.1.0"\n'
    ),
    "egysentinel/api/__init__.py": (
        '"""FastAPI service layer — 4 endpoints + /graph for the frontend."""\n'
    ),
    "egysentinel/agents/__init__.py": (
        '"""GLM-powered agentic AI layer (Alert, Case Builder, Explanation)."""\n'
    ),
    "egysentinel/detect/__init__.py": (
        '"""Pattern detection modules (circular, fan_out, fan_in, layering, dense_cluster)."""\n'
    ),
    "egysentinel/score/__init__.py": (
        '"""Risk scoring modules (rule_scorer, ml_scorer, combine)."""\n'
    ),
    "egysentinel/graph/__init__.py": (
        '"""Graph construction (NetworkX + Neo4j loader)."""\n'
    ),
}


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def create_directories():
    print("Creating directories...")
    for d in DIRECTORIES:
        path = ROOT / d
        path.mkdir(parents=True, exist_ok=True)
        print(f"  + {d}/")


def create_root_files():
    print("\nCreating root files...")
    for filename, content in ROOT_FILES.items():
        path = ROOT / filename
        if path.exists():
            print(f"  ~ {filename}  (already exists — skipped)")
        else:
            path.write_text(content, encoding="utf-8")
            print(f"  + {filename}")


def create_package_files():
    print("\nCreating Python package files...")
    for filepath, content in PACKAGE_FILES.items():
        path = ROOT / filepath
        if path.exists():
            print(f"  ~ {filepath}  (already exists — skipped)")
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
            print(f"  + {filepath}")


def print_summary():
    print("\n" + "=" * 56)
    print("  SCAFFOLDING COMPLETE — EGY-Sentinel AML is ready.")
    print("=" * 56)
    print(f"\n  Project root: {ROOT}")
    print("\nNext steps:")
    print("  1. cd into the project (if not already there)")
    print("  2. python -m venv venv")
    print("  3. venv\\Scripts\\activate           (Windows)")
    print("     OR  source venv/bin/activate     (macOS / Linux)")
    print("  4. pip install -r requirements.txt")
    print("  5. git init")
    print("  6. git add . && git commit -m 'chore: scaffold project'")
    print("\nHappy hacking, Farah! Go ship it.")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    create_directories()
    create_root_files()
    create_package_files()
    print_summary()
