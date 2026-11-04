# TODO

## 인증 (Auth)

- [ ] httpOnly 쿠키 기반 토큰 관리로 전환
  - access token을 httpOnly 쿠키로 발급 (`apps/api/src/auth/auth.service.ts`)
  - refresh token 발급/로테이션 추가
  - `apps/api/src/auth/guards/jwt-auth.guard.ts`에서 쿠키 기반 토큰 파싱으로 변경
  - `apps/web/store/authStore.ts`는 user 상태만 남기고 토큰은 store에서 제거 (XSS 방지)
  - `apps/web/lib/api-request.ts`: `credentials: 'include'` 기본값화, 수동 Authorization 헤더 첨부 제거
- [ ] 인증 이메일 발신 도메인 실제 값으로 교체 (`apps/api/src/auth/email-verification.service.ts`)

## 프로필

- [ ] 뱃지 API 연동 (백엔드 뱃지 시스템 + 유저별 획득/선택 뱃지 조회, 현재 `MOCK_BADGES` 사용 중)
- [ ] BookList에서 아이템 클릭 시 처리

## 테스트

- [ ] 웹 테스트 프레임워크 도입 (Vitest + Testing Library, E2E는 Playwright)
- [ ] 테스트를 turbo 파이프라인 및 GitHub Actions CI에 연결

## 공통 컴포넌트화

- [ ] 뒤로가기 버튼: 페이지 좌상단 '돌아가기' 버튼 (`settings/delete-account`, `settings/password`, `notes/add`, `profile/edit`)
- [ ] 페이지 제목 + 설명 헤더 (`settings`, `settings/password`, `settings/delete-account`, `profile/edit`, `notes/add`, `signup` 각 스텝)
- [ ] 좁은 단일 컬럼 페이지 레이아웃 래퍼 (`settings/password`, `settings/delete-account`, `notes/add`, `profile/edit`)
- [ ] 폼 필드: 라벨 + 힌트 + 에러 메시지 (`settings/password`, `settings/delete-account`, `signup`, `notes/add` 수동 등록)
- [ ] 폼 제출 에러 메시지 (`profile/edit`, `settings/password`, `settings/delete-account`)
- [ ] 알림/확인 모달 호출 중복 (`settings/delete-account`, `notes/add`, `notes` 패널 툴바, `signup`)
- [ ] 로딩 스피너 표시 (`notes`, `profile`, `notes/add` 검색, 팔로우 목록 모달)
- [ ] 프로필 아바타 원형 이미지 (`profile/[userId]` ProfileCard, `ProfileImageOverlay`, `ProfileFieldsSection`)
- [ ] 회원가입 스텝 하단 이전/다음 버튼 (`signup` 이메일·프로필 스텝)

## 운영/어드민

- [ ] 어드민 페이지: 고아 프로필 이미지 수동 정리 트리거 (`apps/api/src/upload/upload.service.ts`)
- [ ] 어드민 페이지: 만료된 이메일 인증 코드 수동 정리 트리거 (`apps/api/src/auth/email-verification.service.ts`)

- [ ] 비로그인 전환 시 로그인 시에만 보여줘야 할 다이얼로그 닫기
- [ ] 계정 연동(이메일 계정 + 소셜 등)을 도입할지 고민 필요
