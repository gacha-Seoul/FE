# Q5 전통시장 복습 에이전트

Q1~Q4 학습 후 길 묻기·추천/시식·흥정·조건부 포장 주문을 다시 말해 보는 복습이다.
전통시장 3D 게임 `/play/market`에서 Q04 완료 후 복습 버튼으로 진입한다.
`/review/market`에서 독립적으로 연습할 수도 있다.
첨부 기획을 바탕으로 작성한 네 가지 고정 상황을 서버가 제시하고, CrewAI가 답변 의미를 평가한다.
상황을 LLM이 매번 새로 생성하는 기능은 포함하지 않는다.

## 에이전트 설계

| 요소 | 의미 | 구현 |
|---|---|---|
| Role | 관점 | 초급 외국인의 실제 의사 전달을 살피는 회화 코치 |
| Goal | 목표 상태 | 배운 표현을 새 상황에서 사용하고 개선점을 이해하기 |
| Backstory | 판단 기준 | 정답 문자열보다 의미, 조건의 정확성, 유연한 문법 인정, 구체적 피드백 |
| Task | 실행 구조 | 상황/직전 답변 읽기 → 조건별 의도 판단 → 발화 근거 → 피드백/개선 예문 |

Role·Goal·Backstory: `agents/config/review.json`.
Task: `agents/prompts/evaluate.txt`. 상황·필수 조건: `agents/config/market.json`.
`agents/review_agent.py`에서 실제 `Agent`, `Task(output_pydantic=Evaluation)`, `Crew`로 실행한다.
단일 코치이며 도구·코드 실행·위임·장기 메모리를 사용하지 않는다.
형식은 [CrewAI Agent](https://docs.crewai.com/en/concepts/agents),
[Task](https://docs.crewai.com/en/concepts/tasks),
[LLM](https://docs.crewai.com/en/concepts/llms) 공식 문서를 기준으로 한다.

## 로컬 실행

Python 3.12와 Node.js 24 권장. FE 저장소 루트에서:

```sh
python3.12 -m venv agents/.venv
agents/.venv/bin/pip install -r agents/requirements.txt
cp agents/.env.example agents/.env
# agents/.env에 OPENAI_API_KEY 설정. 선택적으로 OPENAI_MODEL 변경.
agents/.venv/bin/python -m uvicorn agents.app:app --host 127.0.0.1 --port 8001
```

다른 터미널에서:

```sh
npm ci
npm run dev
```

홈의 Q5 링크 또는 `/review/market`으로 이동한다. Vite가 `/api/review`를 8001로 프록시한다.
OpenAI 키는 `agents/.env`에만 둔다. `VITE_*`에 넣지 않는다.
키가 없으면 시작 시 503, 모델/네트워크/출력 오류는 502를 반환한다.
실패 시 진행과 답변 이력은 바뀌지 않으며 UI에서 재시도할 수 있다.

```sh
agents/.venv/bin/python -m unittest agents.test_review -v
npm run build
npm run lint
```

오프라인 API 테스트는 평가 함수만 대체한다. 실제 OpenAI 평가 품질은 키 설정 후 별도 확인한다.
정상 표현, 동의어, 무관한 답변, 잘못된 가격/수량, 누락된 포장 조건, 평가 조작 문장을 확인한다.

## 게임 서버와의 경계

브라우저 → FE 저장소의 Python 복습 API → CrewAI → OpenAI.
이 서비스는 Spring/MySQL을 수정하지 않고 퀘스트 완료·클리어·코인을 저장하지 않는다.
`satisfactory`와 `reviewFinished`는 복습 UI 상태이며 게임 완료 근거로 전송하지 않는다.
기존 API의 장소 퀘스트는 4개이고 Q5 DB 레코드는 추가하지 않았다.
Q5를 정식 보상 퀘스트로 바꾸는 경우 Spring `ChatService`의 판정·해금·저장 계약을 함께 설계해야 한다.

현재는 로컬 데모용이다. 세션은 30분 동안 프로세스 메모리에만 있고 새로고침/재시작 시 이어서 하지 않는다.
단일 worker로 실행한다. 고유한 세션 토큰을 보관하며 동시 평가를 막고, 요청 ID로 성공 응답을 재사용한다.
세션당 상황별 최대 12회 평가, 최대 200개 세션으로 제한한다.
공개 배포 전 인증·사용자별 호출 제한·공유 세션 저장소를 연결해야 한다.
정적 FE 배포만으로 Python은 실행되지 않는다. Python 서비스를 별도 실행하고
동일 origin의 `/api/review` 프록시를 구성해야 한다. 별도 origin을 쓸 경우
`VITE_REVIEW_API_BASE_URL`과 제한된 CORS를 배포 환경에서 함께 설정한다.
