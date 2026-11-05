# 화면과 게임 연결 구조

## 화면 경계

React가 가챠, 지역 지도, 장소, 미션 HUD, 대화창, 완료 화면을 담당한다.
전통시장 `/play/market`은 Three.js + Spark로 SPZ를 그리고 별도 GLB로 충돌을 검사한다.
`MarketScene` 내부에서 프레임별 카메라와 키 입력을 관리하고 React에는 HUD 좌표만 약 8Hz로 전달한다.
기존 `/play/myongji`는 React Three Fiber 테스트 장면으로 유지한다.

## 플레이 흐름

가챠 → 지역 해금 → 전통시장 장소 → 3D 시장에서 플레이하기 → 시장 안내 → 입장
→ 상인에게 접근 → 대화 → 서버 완료 응답 → 다음 퀘스트 → Q04 완료
→ 사용자가 Q5 복습 또는 지도 복귀를 선택한다.
가챠 메인의 전통시장 3D로 둘러보기로도 들어갈 수 있다.
지역이 잠겨 있거나 서버에 연결되지 않으면 산책만 가능하다.

대화·일시 정지 중에는 이동과 시점 조작을 멈춘다.
목표에 접근했다는 이유만으로 완료하지 않는다. 시작 버튼, NPC 접근, 입구 복귀는 보상을 지급하지 않는다.
Q01 도착 확인도 기존 대화 API를 이용하며 이동 좌표를 인증하는 별도 API는 없다.

## 데이터와 서버

`features/gacha/api/client.ts`가 공통 Spring API 계층이다.
`GET /api/users/{id}/map`에서 서대문구 해금 여부,
`GET /api/regions/{id}`에서 시장 장소와 퀘스트,
`POST /api/quests/{id}/start`, `/chat`에서 대화·미션·코인 결과를 받는다.
`GET /api/stages/{id}`로 완료 상태를 갱신한다. 프론트에서 완료나 코인을 계산해 저장하지 않는다.
사용자 ID만 기존 localStorage에 보관하고, 카메라·대화 표시 상태는 일시적이다.

## 자산과 NPC

`features/game/data/market.ts`에 자산 경로, 시작 위치, NPC 좌표를 둔다.
`public/models/market`의 SPZ는 시각화, GLB는 벽/바닥 충돌, PNG는 시작 화면용이다.
`npm run assets:market`은 루트 원본을 수정 없이 복사하고 SHA-256 일치를 검사한다.
192만 스플랫 전체를 사용하며 샘플링과 LOD에 의한 축소는 하지 않는다.
가상 NPC는 채소 좌판, 전집, 분식집에 배치한다. Q02와 Q03은 같은 전집 상인을 사용한다.
다른 지역 맵은 `features/game/data/places.ts`에서 계속 pending 상태다.
원본 맵의 왜곡/빈 공간을 렌더러가 복원하지는 않는다.

## Q5 복습

`/review/market`은 FE 저장소의 Python CrewAI 서비스와 통신한다.
Q04의 서버 상태가 COMPLETED이면 시장 게임에 복습 버튼을 표시한다.
자동으로 이동시키지 않으며, Q5는 기존 퀘스트 4개 및 코인 계산에 포함하지 않는다.
비밀 키는 `agents/.env`에 두고 브라우저에 노출하지 않는다.
실행·설계는 [Q5_AGENT.md](Q5_AGENT.md), 복습 API는 [API.md](API.md),
시장 게임 조작·서버 경계는 [MARKET_GAME.md](MARKET_GAME.md)를 참고한다.

## 남은 범위

다른 지역의 실제 3D 맵, 음성 입력·합성, 다국어 게임 안내,
실제 LLM 모드에서의 전체 게임 품질 확인은 별도 작업이다.
