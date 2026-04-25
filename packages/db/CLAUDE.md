# packages/db — Prisma + PostgreSQL

루트 CLAUDE.md도 함께 참고.

## 핵심 결정

- **Prisma Client export는 `src/client.ts` 하나뿐**. 앱에서 직접 `@prisma/client`를 import하지 않고 `@repo/db`를 통해 접근.
- DB 호스팅: **Supabase** (운영), 로컬 개발은 별도 PostgreSQL 인스턴스 사용.

## 주요 명령어

```bash
# packages/db 디렉토리에서 실행
pnpm prisma migrate dev --name <migration-name> # 마이그레이션 파일 생성 + DB 반영
pnpm prisma generate # Prisma Client 코드 재생성 (스키마 변경 후 필수)
pnpm prisma studio # 브라우저에서 DB 데이터 조회/편집
pnpm prisma db seed # 초기 테스트 데이터 삽입
```

## 스키마 변경 워크플로우

1. `prisma/schema.prisma` 수정
2. `pnpm prisma migrate dev --name <name>` 실행
3. `pnpm prisma generate` (보통 migrate dev가 자동 실행)
4. `packages/db` 재빌드

## 주의

- **마이그레이션 없이 스키마만 변경 금지** — 운영 DB와 불일치 발생
- `generated/prisma/` 디렉토리는 자동 생성 파일, 직접 편집 금지
