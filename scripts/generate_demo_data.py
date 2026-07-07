"""
EGY-Sentinel AML — Demo Dataset Generator
==========================================

Generates a small (~200-row) PaySim-format CSV with 5 planted
money-laundering patterns for demo purposes.

Planted patterns:
    1. CIRCULAR — 4 accounts, 4 transfers forming a closed loop (A->B->C->D->A)
    2. FAN_OUT  — 1 sender -> 8 receivers in one step (smurfing)
    3. DENSE_CLUSTER — 5 accounts, 12 transactions, high interconnectivity
    4. MIXED_CIRCULAR_FANOUT — 6 accounts, circular + fan-out combined
    5. MIXED_DENSE_DRAINED — 5 accounts, dense cluster with drained balances

Plus ~165 clean background transactions (normal payments, cash-ins).

The generator is deterministic (seed=42) so anyone running it gets
the exact same file. Auditors can read this script to see exactly
what patterns are planted.

Usage:
    python scripts/generate_demo_data.py
    # -> writes data/demo.csv

Output columns (PaySim format, matches schemas/transaction.json):
    step, type, amount, nameOrig, nameDest,
    oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest,
    isFraud, isFlaggedFraud
"""
from __future__ import annotations

import os
from pathlib import Path

import numpy as np
import pandas as pd

# ─── Configuration ───────────────────────────────────────────────────

SEED = 42
OUTPUT_PATH = Path(__file__).resolve().parents[1] / "data" / "demo.csv"

# Transaction types per locked transaction.json enum
TXN_TYPES = ["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"]

# PaySim step range: 1-743 (30-day simulation, hourly steps)
STEP_RANGE = (1, 743)


# ─── Helpers ─────────────────────────────────────────────────────────

def _make_txn(
    step: int,
    txn_type: str,
    amount: float,
    nameOrig: str,
    nameDest: str,
    oldbalanceOrg: float,
    newbalanceOrig: float,
    oldbalanceDest: float,
    newbalanceDest: float,
    isFraud: int = 0,
) -> dict:
    """Build a single PaySim-format transaction row."""
    return {
        "step": step,
        "type": txn_type,
        "amount": float(amount),
        "nameOrig": nameOrig,
        "nameDest": nameDest,
        "oldbalanceOrg": float(oldbalanceOrg),
        "newbalanceOrig": float(newbalanceOrig),
        "oldbalanceDest": float(oldbalanceDest),
        "newbalanceDest": float(newbalanceDest),
        "isFraud": isFraud,
        "isFlaggedFraud": 0,  # PaySim's business-rule flag, always 0 in our demo
    }


def _drain_sender(amount: float) -> tuple[float, float, float, float]:
    """Generate balance values where sender is fully drained (fraud signature).

    Returns: (oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest)
    """
    old_org = amount  # exactly enough to send
    new_org = 0.0     # drained to zero
    old_dest = 0.0    # receiver was empty (mule account)
    new_dest = amount  # receiver gets the full amount
    return old_org, new_org, old_dest, new_dest


def _normal_balances(amount: float, rng: np.random.Generator) -> tuple[float, float, float, float]:
    """Generate realistic balance values for a normal transaction."""
    old_org = float(rng.integers(int(amount), int(amount * 3) + 1))
    new_org = old_org - amount
    old_dest = float(rng.integers(0, 100000))
    new_dest = old_dest + amount
    return old_org, new_org, old_dest, new_dest


# ─── Pattern generators ──────────────────────────────────────────────

def pattern_1_circular() -> list[dict]:
    """Pattern 1: CIRCULAR — A -> B -> C -> D -> A.

    Classic layering signature. Funds move in a closed loop, each transfer
    slightly smaller (classic "skimming" signature). 4 accounts, 4 transactions.
    """
    accounts = ["C1001", "C1002", "C1003", "C1004"]
    amounts = [500000, 490000, 480000, 470000]
    steps = [100, 101, 102, 103]
    rows = []

    for i in range(4):
        orig = accounts[i]
        dest = accounts[(i + 1) % 4]
        amount = amounts[i]
        old_org, new_org, old_dest, new_dest = _drain_sender(amount)
        rows.append(_make_txn(
            step=steps[i], txn_type="TRANSFER", amount=amount,
            nameOrig=orig, nameDest=dest,
            oldbalanceOrg=old_org, newbalanceOrig=new_org,
            oldbalanceDest=old_dest, newbalanceDest=new_dest,
            isFraud=1,
        ))
    return rows


def pattern_2_fan_out() -> list[dict]:
    """Pattern 2: FAN_OUT — 1 sender -> 8 receivers in one step.

    Smurfing signature: rapid disbursement to multiple accounts to avoid
    reporting thresholds. 9 accounts, 8 transactions.
    """
    sender = "C2001"
    receivers = [f"C2{i:03d}" for i in range(201, 209)]  # C201..C208
    amount = 95000  # just below typical 100K threshold
    step = 200
    rows = []

    # Sender starts with enough to send 8 * 95000 = 760,000
    sender_balance = 760000.0
    for i, receiver in enumerate(receivers):
        old_org = sender_balance
        new_org = sender_balance - amount
        sender_balance = new_org
        old_dest = 0.0  # mule accounts
        new_dest = amount
        rows.append(_make_txn(
            step=step, txn_type="TRANSFER", amount=amount,
            nameOrig=sender, nameDest=receiver,
            oldbalanceOrg=old_org, newbalanceOrig=new_org,
            oldbalanceDest=old_dest, newbalanceDest=new_dest,
            isFraud=1,
        ))
    return rows


def pattern_3_dense_cluster() -> list[dict]:
    """Pattern 3: DENSE_CLUSTER — 5 accounts, 12 transactions, high density.

    Coordinated activity signature: a group of accounts transacting heavily
    among themselves. Density ~0.6 (12 edges / 5*4 possible = 0.6).
    """
    accounts = ["C3001", "C3002", "C3003", "C3004", "C3005"]
    # 12 transactions: each account sends to 2-3 others
    edges = [
        (0, 1), (0, 2), (0, 3),
        (1, 2), (1, 4),
        (2, 3), (2, 4),
        (3, 0), (3, 4),
        (4, 0), (4, 1), (4, 3),
    ]
    step = 300
    rows = []
    for i, (src_idx, dst_idx) in enumerate(edges):
        orig = accounts[src_idx]
        dest = accounts[dst_idx]
        amount = 150000 + (i * 5000)  # varied amounts
        old_org, new_org, old_dest, new_dest = _drain_sender(amount)
        rows.append(_make_txn(
            step=step + i, txn_type="TRANSFER", amount=amount,
            nameOrig=orig, nameDest=dest,
            oldbalanceOrg=old_org, newbalanceOrig=new_org,
            oldbalanceDest=old_dest, newbalanceDest=new_dest,
            isFraud=1,
        ))
    return rows


def pattern_4_mixed_circular_fanout() -> list[dict]:
    """Pattern 4: MIXED — circular flow + fan-out combined.

    6 accounts: C4001 sends to 3 receivers (fan-out), then each of those
    sends to the next, forming a partial cycle back to C4001.
    """
    sender = "C4001"
    intermediates = ["C4002", "C4003", "C4004"]
    final = "C4005"
    step = 400
    rows = []

    # Fan-out: C4001 -> 3 intermediates
    sender_balance = 900000.0
    for i, acc in enumerate(intermediates):
        amount = 290000
        old_org = sender_balance
        new_org = sender_balance - amount
        sender_balance = new_org
        rows.append(_make_txn(
            step=step + i, txn_type="TRANSFER", amount=amount,
            nameOrig=sender, nameDest=acc,
            oldbalanceOrg=old_org, newbalanceOrig=new_org,
            oldbalanceDest=0.0, newbalanceDest=amount,
            isFraud=1,
        ))

    # Each intermediate sends to the next, last one sends to C4005
    chain = intermediates + [final]
    for i in range(len(chain) - 1):
        orig = chain[i]
        dest = chain[i + 1]
        amount = 280000 - (i * 5000)
        old_org, new_org, old_dest, new_dest = _drain_sender(amount)
        rows.append(_make_txn(
            step=step + 3 + i, txn_type="TRANSFER", amount=amount,
            nameOrig=orig, nameDest=dest,
            oldbalanceOrg=old_org, newbalanceOrig=new_org,
            oldbalanceDest=old_dest, newbalanceDest=new_dest,
            isFraud=1,
        ))

    # C4005 sends back to C4001 (closing the loop)
    amount = 270000
    old_org, new_org, old_dest, new_dest = _drain_sender(amount)
    rows.append(_make_txn(
        step=step + 6, txn_type="CASH_OUT", amount=amount,
        nameOrig=final, nameDest=sender,
        oldbalanceOrg=old_org, newbalanceOrig=new_org,
        oldbalanceDest=old_dest, newbalanceDest=new_dest,
        isFraud=1,
    ))
    return rows


def pattern_5_mixed_dense_drained() -> list[dict]:
    """Pattern 5: MIXED — dense cluster with all senders drained.

    5 accounts, 10 transactions, all senders drained to zero (account
    takeover signature combined with dense cluster).
    """
    accounts = ["C5001", "C5002", "C5003", "C5004", "C5005"]
    edges = [
        (0, 1), (0, 2), (0, 3),
        (1, 2), (1, 4),
        (2, 3),
        (3, 4),
        (4, 0), (4, 1),
        (3, 0),
    ]
    step = 500
    rows = []
    for i, (src_idx, dst_idx) in enumerate(edges):
        orig = accounts[src_idx]
        dest = accounts[dst_idx]
        amount = 200000 + (i * 10000)
        old_org, new_org, old_dest, new_dest = _drain_sender(amount)
        rows.append(_make_txn(
            step=step + i, txn_type="TRANSFER", amount=amount,
            nameOrig=orig, nameDest=dest,
            oldbalanceOrg=old_org, newbalanceOrig=new_org,
            oldbalanceDest=old_dest, newbalanceDest=new_dest,
            isFraud=1,
        ))
    return rows


# ─── Background noise generator ──────────────────────────────────────

def generate_background(n: int, rng: np.random.Generator) -> list[dict]:
    """Generate n clean background transactions (isFraud=0).

    These are normal customer transactions: payments, cash-ins, small
    cash-outs, debits. None should trigger any detector.
    """
    rows = []
    # Use a separate account namespace (C9xxx) to avoid collision with patterns
    bg_account_pool = [f"C9{i:04d}" for i in range(9001, 9101)]  # 100 background accounts

    for _ in range(n):
        step = int(rng.integers(*STEP_RANGE))
        txn_type = str(rng.choice(TXN_TYPES, p=[0.15, 0.20, 0.05, 0.40, 0.20]))
        # Normal transactions have smaller amounts
        amount = float(rng.lognormal(mean=8.5, sigma=1.0))  # ~5K avg, max ~200K
        amount = min(amount, 200000)
        amount = round(amount, 2)

        orig = str(rng.choice(bg_account_pool))
        dest = str(rng.choice(bg_account_pool))
        while dest == orig:
            dest = str(rng.choice(bg_account_pool))

        old_org, new_org, old_dest, new_dest = _normal_balances(amount, rng)
        rows.append(_make_txn(
            step=step, txn_type=txn_type, amount=amount,
            nameOrig=orig, nameDest=dest,
            oldbalanceOrg=old_org, newbalanceOrig=new_org,
            oldbalanceDest=old_dest, newbalanceDest=new_dest,
            isFraud=0,
        ))
    return rows


# ─── Main ────────────────────────────────────────────────────────────

def generate_demo_data(output_path: Path = OUTPUT_PATH) -> pd.DataFrame:
    """Generate the full demo dataset and write to CSV.

    Returns the DataFrame (also writes to output_path).
    """
    rng = np.random.default_rng(SEED)

    # Build all 5 planted patterns
    patterns = [
        pattern_1_circular(),
        pattern_2_fan_out(),
        pattern_3_dense_cluster(),
        pattern_4_mixed_circular_fanout(),
        pattern_5_mixed_dense_drained(),
    ]
    pattern_rows = []
    for p in patterns:
        pattern_rows.extend(p)

    # Generate background noise
    n_background = 165
    background_rows = generate_background(n_background, rng)

    # Combine
    all_rows = pattern_rows + background_rows
    df = pd.DataFrame(all_rows)

    # Sort by step for chronological order
    df = df.sort_values("step").reset_index(drop=True)

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)

    print(f"Demo dataset generated: {output_path}")
    print(f"  Total rows: {len(df)}")
    print(f"  Fraud rows: {df['isFraud'].sum()}")
    print(f"  Clean rows: {(df['isFraud'] == 0).sum()}")
    print(f"  Unique accounts: {df['nameOrig'].nunique() + df['nameDest'].nunique()}")
    print(f"  Step range: {df['step'].min()} - {df['step'].max()}")
    print(f"  File size: {output_path.stat().st_size / 1024:.1f} KB")
    print()
    print("Planted patterns:")
    print("  1. CIRCULAR — C1001->C1002->C1003->C1004->C1001 (steps 100-103)")
    print("  2. FAN_OUT  — C2001 -> 8 receivers (step 200)")
    print("  3. DENSE_CLUSTER — C3001-C3005, 12 txns (steps 300-311)")
    print("  4. MIXED_CIRCULAR_FANOUT — C4001-C4005 (steps 400-406)")
    print("  5. MIXED_DENSE_DRAINED — C5001-C5005, 10 txns (steps 500-509)")

    return df


if __name__ == "__main__":
    generate_demo_data()
