# apps/api — NestJS BE

루트 CLAUDE.md도 함께 참고.

## 핵심 결정

- **Feature module 단위 구조**: 기능별로 module/controller/service/dto 분리
- **DB 접근은 `@repo/db`만 사용**: Prisma Client를 직접 import하지 않고 패키지를 통해서만 접근

## API 컨벤션

- **RESTful**: 리소스는 명사 복수형 (`/users`, `/books`, `/notes`)
- HTTP 메서드 의미 준수: GET(조회), POST(생성), PATCH(부분수정), DELETE(삭제)
- 응답 시간 목표: **1초 이내**

## 인증

- JWT Access Token + Refresh Token
- OAuth: 카카오, 구글 소셜 로그인

## 보안

- HTTPS 필수 (Railway에서 자동)
- 비밀번호: bcrypt 암호화
- XSS, CSRF, CORS 대응 필수
- 환경변수로 시크릿 관리 (코드에 하드코딩 금지)

## 테스트

```bash
pnpm test              # Jest 유닛 테스트
pnpm test:e2e          # Supertest API 테스트
pnpm test:cov          # 커버리지
```

## 외부 연동

- 네이버 책 검색 API: 책 메타데이터 (제목, 저자, ISBN, 표지)
- 카카오/구글 OAuth
