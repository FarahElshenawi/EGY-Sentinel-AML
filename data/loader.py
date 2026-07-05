"""EGY-Sentinel AML — Data Loader"""
import pandas as pd
from pathlib import Path

SAMPLE_PATH = Path(__file__).parent / "sample" / "paysim_30k.csv"

def load_sample() -> pd.DataFrame:
    """Load the 30K stratified sample."""
    if not SAMPLE_PATH.exists():
        raise FileNotFoundError(f"Sample not found at {SAMPLE_PATH}. Run data/sampler.py first.")
    df = pd.read_csv(SAMPLE_PATH)
    print(f"✓ Loaded {len(df)} rows from PaySim sample")
    return df
