import json
import os
from pathlib import Path

from pydantic import BaseModel, ConfigDict, Field, StrictBool

ROOT = Path(__file__).resolve().parent


class CriterionEvaluation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    met: StrictBool
    evidence: str = Field(min_length=1, max_length=500)


class Evaluation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    criteria: list[CriterionEvaluation] = Field(min_length=1, max_length=10)
    feedback: str = Field(min_length=1, max_length=1000)
    improvedAnswer: str = Field(min_length=1, max_length=500)


def evaluate(scenario: dict, history: list[dict], answer: str) -> Evaluation:
    # Lazy import keeps API validation and offline tests independent of CrewAI startup.
    from crewai import Agent, Crew, LLM, Process, Task

    config = json.loads((ROOT / "config/review.json").read_text())
    coach = Agent(
        **{key: config[key] for key in ("role", "goal", "backstory")},
        llm=LLM(model=os.getenv("OPENAI_MODEL", "openai/gpt-4o-mini"),
                api_key=os.environ["OPENAI_API_KEY"], timeout=35, max_retries=0,
                temperature=0.2),
        allow_delegation=False, allow_code_execution=False,
        max_iter=2, max_retry_limit=0, max_execution_time=50, verbose=False,
    )
    task = Task(
        description=(ROOT / "prompts/evaluate.txt").read_text(),
        expected_output=config["expected_output"], agent=coach,
        output_pydantic=Evaluation,
    )
    result = Crew(agents=[coach], tasks=[task], process=Process.sequential,
                  memory=False, cache=False, verbose=False).kickoff(inputs={
        "review_data": json.dumps({"scenario": scenario, "history": history,
                                   "userAnswer": answer}, ensure_ascii=False)
    })
    if not isinstance(result.pydantic, Evaluation):
        raise ValueError("Missing structured evaluation")
    expected = {item["id"] for item in scenario["criteria"]}
    actual = [item.id for item in result.pydantic.criteria]
    if len(actual) != len(expected) or set(actual) != expected:
        raise ValueError("Invalid criterion IDs")
    return result.pydantic
