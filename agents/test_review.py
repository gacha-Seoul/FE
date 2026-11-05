import os
import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient

from agents.app import SCENARIOS, app, sessions
from agents.review_agent import CriterionEvaluation, Evaluation, evaluate


class ReviewTests(unittest.TestCase):
    def setUp(self):
        sessions.clear()
        self.key = patch.dict(os.environ, {"OPENAI_API_KEY": "offline-test-only"})
        self.key.start()
        self.addCleanup(self.key.stop)
        self.client = TestClient(app)
        self.token = self.client.post("/api/review/sessions").json()["sessionId"]
        self.url = f"/api/review/sessions/{self.token}/answers"

    def post(self, round=1, message="전집이 어디예요?", request_id=None):
        return self.client.post(self.url, json={"round": round, "message": message,
                                              "requestId": request_id or str(uuid4())})

    @staticmethod
    def evaluation(scenario, _history, _answer):
        return Evaluation(criteria=[CriterionEvaluation(id=c["id"], met=True, evidence="테스트 발화")
                                    for c in scenario["criteria"]],
                          feedback="좋았어요! 뜻이 전달됐어요.", improvedAnswer="포장해 주세요.")

    def test_validation_and_unknown_session(self):
        self.assertEqual(self.post(message="   ").status_code, 400)
        self.assertEqual(self.post(message="가" * 301).status_code, 400)
        self.assertEqual(self.client.post("/api/review/sessions/unknown/answers", json={
            "round": 1, "message": "안녕하세요", "requestId": str(uuid4())}).status_code, 404)

    def test_missing_key(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": ""}):
            self.assertEqual(self.client.post("/api/review/sessions").status_code, 503)

    def test_provider_failure_preserves_state(self):
        with patch("agents.app.evaluate", side_effect=RuntimeError("secret-provider-error")):
            response = self.post()
        self.assertEqual(response.status_code, 502)
        self.assertNotIn("secret-provider-error", response.text)
        self.assertEqual(sessions[self.token].index, 0)
        self.assertEqual(sessions[self.token].history, [])

    def test_incomplete_retry_uses_previous_answer(self):
        evaluation = Evaluation(criteria=[CriterionEvaluation(id="location", met=False, evidence="위치 질문 없음")],
                                feedback="위치를 물어보세요.", improvedAnswer="전집이 어디예요?")
        with patch("agents.app.evaluate", return_value=evaluation):
            self.assertFalse(self.post(message="전집이요").json()["satisfactory"])
        def check_history(scenario, history, answer):
            self.assertEqual(history, [{"answer": "전집이요"}])
            return self.evaluation(scenario, history, answer)
        with patch("agents.app.evaluate", side_effect=check_history):
            self.assertTrue(self.post(message="어디 있어요?").json()["satisfactory"])

    def test_sequence_and_duplicate_request(self):
        request_id = str(uuid4())
        with patch("agents.app.evaluate", side_effect=self.evaluation) as evaluate:
            self.assertEqual(self.post(round=2).status_code, 409)
            first = self.post(request_id=request_id)
            self.assertEqual(first.json()["next"]["round"], 2)
            self.assertEqual(self.post(request_id=request_id).json(), first.json())
            self.assertEqual(evaluate.call_count, 1)
            self.assertEqual(self.post(message="다른 답변", request_id=request_id).status_code, 409)
            for round in (2, 3, 4):
                response = self.post(round=round)
                self.assertEqual(response.status_code, 200)
            self.assertTrue(response.json()["reviewFinished"])
            self.assertIsNone(response.json()["next"])
            self.assertEqual(self.post(round=4).status_code, 409)

    def test_expired_and_busy_session(self):
        session = sessions[self.token]
        with session.lock:
            self.assertEqual(self.post().status_code, 409)
        session.expires = 0
        self.assertEqual(self.post().status_code, 404)

    def test_crewai_configuration_and_reject_invalid_output(self):
        # Real Agent/Task/Crew construction; only provider execution is replaced.
        valid = self.evaluation(SCENARIOS[0], [], "전집이 어디예요?")
        with patch("crewai.Crew.kickoff", return_value=SimpleNamespace(pydantic=valid)) as kickoff:
            self.assertEqual(evaluate(SCENARIOS[0], [{"answer": "전집이요."}], "어디예요?"), valid)
            data = json.loads(kickoff.call_args.kwargs["inputs"]["review_data"])
            self.assertEqual(data["userAnswer"], "전집이요.\n어디예요?")
            self.assertEqual(data["latestAnswer"], "어디예요?")
        invalid = Evaluation(criteria=[CriterionEvaluation(id="invented", met=True, evidence="없는 조건")],
                             feedback="좋았어요", improvedAnswer="예문")
        for output in (None, invalid):
            with self.subTest(output=output):
                with patch("crewai.Crew.kickoff", return_value=SimpleNamespace(pydantic=output)):
                    with self.assertRaises(ValueError):
                        evaluate(SCENARIOS[0], [], "전집이 어디예요?")


if __name__ == "__main__":
    unittest.main()
