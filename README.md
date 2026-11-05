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
