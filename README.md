# CareerPass — Frontend

> 대학생 취업 준비를 돕는 AI 코칭 플랫폼 **CareerPass**의 웹 클라이언트. Google 로그인, 음성 모의면접, AI 자소서 피드백, 전공/자격증 로드맵 추천 화면을 제공합니다.

## 기술 스택

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix%20UI-161618?style=for-the-badge&logo=radixui&logoColor=white)
![Tailwind-style Utils](https://img.shields.io/badge/clsx%20%2B%20tailwind--merge-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)
![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white)
![Google OAuth](https://img.shields.io/badge/Google%20OAuth2-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logo=chartdotjs&logoColor=white)

## 주요 기능

- **Google OAuth2 로그인** — `AuthCallback.tsx`에서 인가코드(`code`)를 받아 백엔드 `/auth/token`으로 교환, 발급된 JWT를 `authToken.ts`로 `localStorage`에 저장
- **랜딩 / 로그인 전·후 분기 라우팅** — `App.tsx`가 `/me` 호출 결과로 로그인 상태를 판별해 랜딩(`CareerPassLanding`) ↔ 로그인 후 앱(`CareerPackApp`) 화면을 전환, 비로그인 접근 시 `LoginRequired`/`ProfileRequired`로 가드
- **AI 음성 모의면접** — `InterviewAI.tsx`: `MediaRecorder`로 마이크 권한 요청 및 답변 녹음 → `FormData`로 백엔드에 업로드 → STT 텍스트, 점수, 강점/개선점/리스크 등 AI 분석 결과를 단계별(준비→면접→분석→결과) UI로 표시, 면접 제목 인라인 수정 기능 포함
- **AI 자기소개서 피드백** — `ResumeAI.tsx`: 자소서 입력 → AI 피드백/재생성 결과를 마크다운(`react-markdown`)으로 렌더링
- **전공/자격증 로드맵** — `RoadmapView`, `SubjectRoadmapView`, `CertificationRoadmapView` 등에서 학과·직무 선택에 따라 동적으로 추천 로드맵 카드 표시
- **마이페이지/학습 프로필** — `LearningProfile.tsx`, `ProfileSection.tsx`로 닉네임/전공/목표직무 관리
- **공용 UI 컴포넌트 시스템** — Radix UI 기반의 자체 디자인 시스템(`src/components/ui/*`) 약 30종 (dialog, drawer, sidebar, carousel 등)

## 내가 맡은 역할 / 기여한 부분

CareerPass 팀 프로젝트에서 **프론트엔드 개발을 주도**했습니다.

- `src/api.js`의 전체 API 클라이언트 설계 및 작성 — JWT Bearer 토큰 첨부, FormData/JSON 바디 분기, 에러 응답 파싱을 공통 `fetchApi` 함수로 통합
- Google OAuth2 로그인 연동 — `LoginPage`, `AuthCallback`, `authToken.ts`를 구현해 인가코드 교환 → 토큰 저장 → 로그인 상태 복원까지의 전체 플로우 구성
- 로그인 상태에 따른 페이지 라우팅/가드 로직(`App.tsx`)과 대시보드 연동 (`feat: connect login to dashboard routing`)
- AI 면접 기능(`InterviewAI.tsx`)의 녹음 → 업로드 → 분석 결과 표시까지 UI/상태 관리 구현, 면접 세션 시작/종료/이력 조회 API 연동
- 백엔드·AI 서버와의 실제 연동 테스트 및 트러블슈팅 — Google 로그인 400 에러, API 호출 하드코딩 제거, 서버 연결 안정화

## 기술적으로 어려웠던 점과 해결 방법

### 1. FormData 전송 시 Content-Type 충돌
음성 파일 업로드 시 공통 API 함수가 모든 요청에 `Content-Type: application/json`을 자동으로 붙이고 있어서, 멀티파트 업로드가 깨지는 문제가 있었습니다.
→ `src/api.js`의 `fetchApi`에서 요청 바디가 `FormData` 인스턴스인지 검사해 분기하고, `FormData`인 경우 `Content-Type` 헤더를 명시적으로 삭제해 브라우저가 자동으로 boundary를 포함한 헤더를 설정하도록 했습니다.

### 2. Google OAuth2 로그인이 팀원 환경에서만 실패
같은 코드인데 특정 팀원 기기에서만 Google 로그인이 동작하지 않는 문제(`fix: google login not working on teammate device`)가 있었습니다.
→ 원인은 `.env`에 커밋된 로컬 전용 Google API 자격증명/리다이렉트 URI가 팀원마다 달랐던 것이었습니다. `.env` 파일을 git 추적에서 제외하고(`chore: stop tracking .env file`) 환경변수 키 중복도 정리해, 각자 로컬 환경에 맞는 클라이언트 ID를 사용하도록 구조를 바꿨습니다.

### 3. 인가코드 ↔ 토큰 교환 시 400 에러
로그인 콜백에서 백엔드로 인가코드를 보낼 때 요청 형식이 백엔드 기대 스펙과 달라 400 에러가 반복적으로 발생했습니다(`api.js, LoginPage.tsx, app.tsx 수정 후 400 에러 해결`).
→ 백엔드 `AuthController`의 `/auth/token` 스펙을 다시 확인해 요청 바디 키 이름(`code`)과 응답 필드(`accessToken`)를 맞추고, 로그인 상태 판별을 토큰 존재 여부가 아니라 `/me` API 응답 성공 여부로 변경해 토큰이 만료/위조된 경우에도 정확히 비로그인으로 처리되게 했습니다.

### 4. 면접 단계별 상태와 타이머/녹음 리소스 정리
면접은 준비 → 진행 → 분석 → 결과의 여러 단계를 거치며 `MediaRecorder`, `MediaStream`, 타이머(`setInterval`)를 단계마다 생성·해제해야 했습니다. 화면 전환 시 녹음이 끊기지 않거나 마이크가 계속 켜진 채로 남는 문제가 있었습니다.
→ `mediaRecorderRef`, `audioStreamRef`, `timerRef` 등을 `useRef`로 관리해 리렌더링과 무관하게 리소스를 추적하고, 단계 전환 시점마다 명시적으로 정리(stop/clear)하도록 구현했습니다.

## 설치 및 실행 방법

### 사전 요구사항
- Node.js 18+
- npm

### 환경 변수
프로젝트 루트에 `.env` 파일을 생성합니다.

```
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

### 설치 및 실행

```bash
npm install
npm run dev      # 개발 서버 (Vite)
npm run build    # 프로덕션 빌드
```
