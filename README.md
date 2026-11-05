# 가챠 서울 · Frontend

Figma의 가챠 → 지역 지도 → 장소 → 3D 퀘스트 → 완료·보상 흐름을 구현할 웹 프론트 프로젝트입니다.
원격 저장소: https://github.com/gacha-Seoul/FE

## 실행

Node.js 24 권장. npm과 package-lock.json을 사용합니다.

```sh
npm install
npm run dev -- --host 127.0.0.1
npm run build
npm run lint
```

## 기술 구성

| 역할 | 선택 | 이유 |
|---|---|---|
| 언어 | TypeScript | 장소·퀘스트·대화·게임 이벤트의 데이터 구조를 명시 |
| 화면 | React 19 | Figma 화면과 게임 HUD를 컴포넌트로 구성 |
| 개발·빌드 | Vite | 브라우저 중심 웹앱의 빠른 개발과 정적 배포 |
| 화면 이동 | React Router | 가챠·지역·장소 경로와 뒤로가기 연결 |
| 상태 | Zustand | 이동·대화·완료 상태를 UI와 3D 장면에서 공유 |
| 3D | Three.js + React Three Fiber 9 + Drei 10 | React 안에서 3D 자산과 카메라 제어 |
| 스타일 | CSS | Figma 스타일과 한컴 폰트를 직접 적용 |
| 검사 | TypeScript + Oxlint | 타입 및 코드 정적 검사 |

React 19와 Fiber 9의 호환 관계는 [공식 문서](https://r3f.docs.pmnd.rs/getting-started/introduction)를 기준으로 맞췄습니다. 개발 환경 요구사항은 [Vite 문서](https://vite.dev/guide/)를 참고합니다. 실제 설치 버전은 package-lock.json에 고정됩니다.

## 현재 준비된 범위

- **랜딩(`/`)**: gui 디자인 톤(색·폰트·전통 문양·가챠 기계·캐릭터)으로 만든 소개 페이지, 한/영 전환. `src/features/landing/`
- **가챠 메인(`/gacha`)**: Figma 1-1 가챠 화면, 1-2 결과 팝업, 장소 화면, 퀘스트 NPC 대화를 서울 가챠 API(Spring)에 연결.
  코드는 `src/features/gacha/`, 기존 시작 화면은 `/dev`. 자세한 내용은 아래 **가챠 화면** 참고.

- Q5 전통시장 복습 화면 `/review/market`과 CrewAI 평가 서비스 추가.
  실행·에이전트 설계는 [docs/Q5_AGENT.md](docs/Q5_AGENT.md), 계약은 [docs/API.md](docs/API.md) 참고.
  Q1~Q4 및 보상 API 연결 전이므로 독립된 복습 화면으로 실행합니다.

- 기본 웹 화면과 `/play/myongji` 게임 화면, 없는 경로 처리.
- 게임 화면은 별도 코드 청크로 지연 로딩.
- 시작 버튼 전에는 카메라 조작 잠금, 시작하면 테스트 장면 조작 가능.
- 실제 지역 맵 대신 연결 확인용 바닥·상자·구체만 표시.
- 게임 상태, 장소 데이터, 맵 형식과 퀘스트 타입 정의.
- 한컴 훈민정음 가로쓰기 전체 글리프 WOFF2 및 원본 TTF 연결.

Figma 최종 디자인, 실제 맵, 보행·충돌, Q1~Q4 NPC 대화, 음성 API, 보상 저장은 아직 구현하지 않았습니다.

## 폴더

```text
src/
  app/                       앱 라우팅
  pages/                     홈·게임 화면
  features/game/
    components/              3D 렌더러
    data/                    장소와 맵 설정
    store/                   일시적인 게임 상태
    types.ts                 장소·맵·퀘스트 타입
  styles/                    전역 스타일
public/
  fonts/                     한컴 폰트·CSS·확인 페이지
  models/                    맵 자산 배치 위치
```

구현 순서와 연결 규칙은 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), 폰트는 [FONTS.md](FONTS.md)를 참고합니다.

## 가챠 화면 (`/gacha`, `src/features/gacha`)

```sh
npm run assets   # Figma 이미지/SVG → public/assets (링크 만료 2026-11-13 무렵, 받은 뒤 커밋)
npm run dev      # /api → VITE_API_PROXY(기본 http://localhost:8080), /api/review → 127.0.0.1:8001
```

- **서버 없이 확인**: `http://localhost:5173/gacha?mock` → 목 데이터 모드(코인 10개, 5개 구 모두 뽑기 가능, 퀘스트 대화는 규칙 기반 가짜 응답). 브라우저에 기억되며 `?mock=off`로 끔. `src/features/gacha/api/mock.ts`
- `?new` : 저장된 사용자 무시하고 새 사용자로 시작
- `http://localhost:5173/gacha?demo` : `POST /api/demo/start`로 새 사용자 + 첫 가챠(서대문구) 후 결과 팝업부터 시작 (발표용)
- 사용자 ID는 localStorage(`gacha-seoul:userId`)에 저장. 404면 새로 생성.
- 화면은 Figma 프레임(1280×832)을 화면 크기에 맞춰 확대·축소. 스타일은 `.gacha-app` 아래로만 적용.

| 화면 | API |
|---|---|
| 진입 | `GET /api/users/{id}` → 없으면 `POST /api/users` |
| 가챠 메인 (코인·지역 상태) | `GET /api/users/{id}/map` |
| 가챠 뽑기 (requestId UUID, 네트워크 오류 시 같은 ID로 재시도) | `POST /api/users/{id}/gacha` |
| 결과 팝업 / 해금 지역 카드 | 가챠 응답 `region` / `GET /api/regions/{id}?userId=` |
| 장소 화면 | `GET /api/stages/{id}?userId=` |
| 퀘스트 대화 | `POST /api/quests/{id}/start`, `POST /api/quests/{id}/chat` |
| 표현 카드 | `POST /api/quests/{id}/phrase-card` |

프론트 쪽 규칙: 도전 중(UNLOCKED) 지역이 있으면 가챠 버튼을 잠금(기획 1-1 재뽑기 불가, `GachaApp.tsx`의 `challenging`).
장소 화면·대화 화면은 Figma 디자인 전이라 기존 톤으로 임시 구성. 3D 장면(`/play/:placeId`) 연결은 아직 안 함.
