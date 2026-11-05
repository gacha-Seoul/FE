# Q5 복습 API

Python 서비스 기본 주소 `http://127.0.0.1:8001`, Swagger `/docs`.
Vite 개발 서버에서 `/api/review` 프록시를 사용한다. 기존 Spring 게임 API와 별개다.
에러 형식은 `{ "message": "..." }`.

## 시작

`POST /api/review/sessions` (body 없음)

```json
{
  "sessionId": "opaque-session-token",
  "round": 1,
  "totalRounds": 4,
  "scenario": {
    "id": "Q01",
    "title": "전집 위치 묻기",
    "situation": "시장 입구예요. 호박전을 파는 전집을 찾고 있어요. 상인에게 위치를 물어보세요.",
    "npcReply": "뭐 찾으세요?",
    "criteria": [{"id": "location", "text": "전집이 어디 있는지 묻기"}]
  }
}
```

세션 유효 기간 30분. 상황/필수 조건/대화 이력은 서버가 관리한다.
클라이언트가 완료 이력이나 채점 기준을 전송하지 않는다.

## 답변 평가

`POST /api/review/sessions/{sessionId}/answers`

```json
{"round":1,"message":"전집이 어디예요?","requestId":"550e8400-e29b-41d4-a716-446655440000"}
```

message는 공백 제외 비어 있지 않은 최대 300자 문자열, requestId는 UUID.
새 답변마다 새 ID, 통신 재시도에는 같은 ID와 같은 본문을 사용한다.

```json
{
  "round": 1,
  "evaluation": {
    "criteria": [{"id":"location","met":true,"evidence":"전집이 어디예요?"}],
    "feedback": "좋았어요! 전집의 위치를 잘 물어봤어요.",
    "improvedAnswer": "호박전 파는 전집이 어디에 있어요?"
  },
  "satisfactory": true,
  "reviewFinished": false,
  "next": {"sessionId":"opaque-session-token","round":2,"totalRounds":4,"scenario":{"id":"Q02","title":"추천과 시식 부탁하기","situation":"...","npcReply":"...","criteria":[{"id":"recommendation","text":"맛있는 전 또는 추천 메뉴 묻기"},{"id":"sample","text":"시식해도 되는지 묻기"}]}}
}
```

- `satisfactory=false`: 같은 상황에서 재답변. `next=null`. 직전 답변 의도와 합쳐 평가한다.
- `satisfactory=true`: 모든 조건이 전달되었다는 모델 제안. 다음 상황을 `next`로 전달한다.
- 네 번째 상황까지 전달되면 `reviewFinished=true`, `next=null`.
- `reviewFinished`는 복습 세션 종료이며 게임 퀘스트 완료/보상이 아니다.
- 평가 실패 시 진행하지 않는다. 성공 응답을 잃어버렸다면 같은 요청 ID로 재시도한다.

| 코드 | 의미 |
|---|---|
| 400 | 빈 답변, 300자 초과, 잘못된 요청 형식 |
| 404 | 없는 세션 또는 만료 |
| 409 | 현재 순서와 다름, 종료된 세션, 동시 평가, 요청 ID를 다른 본문에 재사용 |
| 429 | 해당 상황의 평가 12회 초과 |
| 502 | OpenAI/CrewAI 평가 실패 또는 잘못된 구조화 결과 |
| 503 | OpenAI 키 미설정 또는 세션 수 한도 도달 |
