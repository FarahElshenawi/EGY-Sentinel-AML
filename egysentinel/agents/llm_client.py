"""Stub LLM client — AI-1 will replace with real GLM client."""
import json

class LLMClient:
    def __init__(self):
        print("⚠️ Using STUB LLM Client")
    def complete(self, system_prompt: str, user_prompt: str) -> str:
        score = 50.0
        pattern = "unknown"
        account = "UNKNOWN"
        for line in user_prompt.split("\n"):
            if "final_score" in line:
                try: score = float(line.split(":")[1].strip().rstrip(","))
                except: pass
            if "pattern_type" in line:
                try: pattern = line.split(":")[1].strip().strip('",')
                except: pass
            if "account_id" in line:
                try: account = line.split(":")[1].strip().strip('",')
                except: pass
        if score >= 85: priority, action = "critical", "freeze"
        elif score >= 65: priority, action = "high", "escalate"
        elif score >= 40: priority, action = "medium", "investigate"
        else: priority, action = "low", "monitor"
        return json.dumps({"priority": priority, "summary": f"Account {account} flagged with score {score:.0f} and {pattern} pattern.", "recommended_action": action})
