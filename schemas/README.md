# JSON Schemas — EGY-Sentinel AML

These 5 schemas are the **contracts** between every module in the system.
They MUST be locked by **Day 1 at 12:30** or the whole team is blocked.

## How to lock them

1. You (Farah, Tech Lead) and DS-1 sit down together (Zoom, Discord, or in person).
2. Open each file in this folder and review/edit together.
3. Once both of you agree, commit and tag:

```cmd
git add schemas/
git commit -m "feat: lock JSON schemas for all inter-module contracts"
git tag -a v0.1-schemas-locked -m "Day 1: schemas locked — team unblocked"
git push origin v0.1-schemas-locked
```

4. Announce in Slack: "Schemas locked at v0.1-schemas-locked. Pull `dev` and review."

## The 5 schemas

| File | Used by | Description |
|------|---------|-------------|
| `account.json` | DS-2 (graph), DS-3 (ML), AI-5 (API) | A node in the transaction graph |
| `transaction.json` | DS-1 (data), DS-2 (graph), AI-5 (API) | An edge in the transaction graph (one PaySim row) |
| `alert.json` | AI-2 (Alert Agent), AI-3 (Case Builder) | Output of the Alert Agent |
| `case_report.json` | AI-3 (Case Builder), AI-4 (Explanation) | Output of the Case Builder Agent |
| `explanation.json` | AI-4 (Explanation), AI-5 (API) | Output of the Explanation Agent |

## Rules for changing a schema after it's locked

- **Don't.** If you must, follow this process:
  1. Open a PR with the change.
  2. In the PR description, tag every teammate whose code consumes this schema.
  3. Wait for their acknowledgement.
  4. Bump the schema version (e.g., `alert.json` → `alert_v2.json`).
  5. Farah merges only after all consumers have updated their code.

- **Unauthorized schema changes = Day 5 integration hell.** Don't be that person.
