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

- [ ] 본인 프로필일 때 email 노출
- [ ] password 수정 기능
- [ ] 뱃지 API 연동 (백엔드 뱃지 시스템 + 유저별 획득/선택 뱃지 조회, 현재 `MOCK_BADGES` 사용 중)
- [ ] 회원 탈퇴 기능
- [ ] BookList에서 아이템 클릭 시 처리
- [ ] 팔로워, 팔로잉 조회 API 연동

## 커뮤니티

- [ ] 팔로우/언팔로우 API 연동

## 운영/어드민

- [ ] 어드민 페이지: 고아 프로필 이미지 수동 정리 트리거 (`apps/api/src/upload/upload.service.ts`)
- [ ] 어드민 페이지: 만료된 이메일 인증 코드 수동 정리 트리거 (`apps/api/src/auth/email-verification.service.ts`)

---

> 참고: `packages/db/.env`에 DB 접속 정보 평문 포함 확인됨. 커밋 여부(.gitignore 처리) 별도 점검 권장.
