# forest-of-books

책을 좋아하는 사람들이 독서 경험을 기록하고 교류하는 플랫폼. 개인 학습 프로젝트로, 전체 개발 프로세스(기획→디자인→개발→테스트→배포→운영) 경험이 목표.

## 모노레포 구조

```
apps/web       Next.js 16 (FE) → Vercel 배포
apps/api       NestJS 11 (BE)  → Railway 배포
packages/db    Prisma + PostgreSQL → Supabase 호스팅
packages/eslint-config   공유 ESLint 설정
packages/typescript-config  공유 TypeScript 설정
```

## 공통 명령어

```bash
pnpm dev          # 전체 앱 개발 서버 실행
pnpm build        # 전체 빌드
pnpm lint         # 전체 린트
pnpm format       # Prettier 포맷
```

## 패키지 매니저

**pnpm 9만 사용** (npm, yarn 사용 금지). 새 패키지 설치 시:

```bash
pnpm add <pkg> --filter web      # apps/web에만
pnpm add <pkg> --filter api      # apps/api에만
pnpm add -w <pkg>                # 루트에
```

## 코드 컨벤션

- **Prettier**: singleQuote, trailingComma: all, printWidth: 100, tabWidth: 2
- **TypeScript**: strict mode, no any
- **공유 설정 패키지**: `@repo/eslint-config`, `@repo/typescript-config` 사용

## MVP 범위 (Phase 1)

- 독서 기록: 책 검색과 등록, 독서 상태 관리, 노트(위지윅)와 별점/한줄평 기록, 독서 통계
- 커뮤니티: 피드, 팔로우, 좋아요/댓글, 프로필
- 인증: 이메일/비밀번호 + 카카오·구글 OAuth

## 환경 분리

`development` / `staging` / `production` 3단계. CI/CD는 GitHub Actions.
