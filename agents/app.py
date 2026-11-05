import json
import os
import secrets
from dataclasses import dataclass, field
from threading import Lock
from time import monotonic
from uuid import UUID

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator

from agents.review_agent import ROOT, evaluate

load_dotenv(ROOT / ".env")
os.environ.setdefault("CREWAI_TELEMETRY_DISABLED", "true")
os.environ.setdefault("OTEL_SDK_DISABLED", "true")
os.environ.setdefault("CREWAI_STORAGE_DIR", str(ROOT / ".runtime"))
app = FastAPI(title="Q5 한국어 복습", version="1.0.0")
SCENARIOS = json.loads((ROOT / "config/market.json").read_text())
TTL = 1800


class ReviewError(Exception):
    def __init__(self, status: int, message: str):
        self.status, self.message = status, message


@app.exception_handler(ReviewError)
async def handle_error(_: Request, error: ReviewError):
    return JSONResponse(status_code=error.status, content={"message": error.message})


@app.exception_handler(RequestValidationError)
async def handle_validation(_: Request, __: RequestValidationError):
    return JSONResponse(status_code=400, content={"message": "요청 형식을 확인해 주세요. 답변은 1~300자예요."})


class Answer(BaseModel):
    model_config = ConfigDict(extra="forbid")
    round: int = Field(ge=1, le=4)
    requestId: UUID
    message: str = Field(min_length=1, max_length=300)

    @field_validator("message")
    @classmethod
    def nonblank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Empty answer")
        return value.strip()


@dataclass
class Session:
    expires: float
    index: int = 0
    history: list[dict] = field(default_factory=list)
    responses: dict[str, tuple[int, str, dict]] = field(default_factory=dict)
    lock: Lock = field(default_factory=Lock)


sessions: dict[str, Session] = {}
sessions_lock = Lock()


def snapshot(token: str, session: Session) -> dict:
    return {"sessionId": token, "round": session.index + 1, "totalRounds": len(SCENARIOS),
            "scenario": SCENARIOS[session.index]}


@app.post("/api/review/sessions")
def start():
    if not os.getenv("OPENAI_API_KEY", "").strip():
        raise ReviewError(503, "복습 서비스의 OpenAI 키가 아직 설정되지 않았어요.")
    with sessions_lock:
        for token in list(sessions):
            if sessions[token].expires <= monotonic():
                del sessions[token]
        if len(sessions) >= 200:
            raise ReviewError(503, "복습 서비스가 혼잡해요. 잠시 후 다시 시도해 주세요.")
        token = secrets.token_urlsafe(32)
        session = Session(expires=monotonic() + TTL)
        sessions[token] = session
    return snapshot(token, session)


def get_session(token: str) -> Session:
    with sessions_lock:
        session = sessions.get(token)
    if session is None or session.expires <= monotonic():
        raise ReviewError(404, "복습 시간이 만료됐어요. 다시 시작해 주세요.")
    return session


@app.post("/api/review/sessions/{token}/answers")
def answer(token: str, body: Answer):
    session = get_session(token)
    if not session.lock.acquire(blocking=False):
        raise ReviewError(409, "이전 답변을 평가하고 있어요.")
    try:
        request_id = str(body.requestId)
        cached = session.responses.get(request_id)
        if cached:
            if cached[0] != body.round or cached[1] != body.message:
                raise ReviewError(409, "같은 요청 ID에 다른 답변을 보낼 수 없어요.")
            return cached[2]
        if body.round != session.index + 1 or session.index >= len(SCENARIOS):
            raise ReviewError(409, "현재 복습 순서와 맞지 않아요.")
        if len(session.history) >= 12:
            raise ReviewError(429, "이 상황의 연습 횟수를 다 썼어요. 복습을 다시 시작해 주세요.")
        try:
            evaluation = evaluate(SCENARIOS[session.index], session.history, body.message)
        except Exception:
            # Do not echo provider errors, prompts, answers, or credentials.
            raise ReviewError(502, "평가를 가져오지 못했어요. 같은 답변으로 다시 시도해 주세요.") from None
        satisfactory = all(item.met for item in evaluation.criteria)
        session.history.append({"answer": body.message})
        current_round = session.index + 1
        next_scenario = None
        if satisfactory:
            session.index += 1
            session.history = []
            if session.index < len(SCENARIOS):
                next_scenario = snapshot(token, session)
        response = {"round": current_round, "evaluation": evaluation.model_dump(),
                    "satisfactory": satisfactory, "reviewFinished": session.index == len(SCENARIOS),
                    "next": next_scenario}
        session.responses[request_id] = (body.round, body.message, response)
        return response
    finally:
        session.lock.release()
