# apps/web — Next.js FE

루트 CLAUDE.md도 함께 참고.

## 핵심 결정

- **App Router만 사용** (Pages Router 사용 금지). Next.js 16 기준.
- **Server Components 기본**. 클라이언트 상태·이벤트 필요할 때만 `"use client"` 추가.
- **반응형**: Tailwind의 mobile-first 방식을 따름. base 스타일 = 모바일, `sm:` / `md:` / `lg:`로 tablet/PC 스타일 추가. 디자인 기획은 PC 레이아웃 우선이지만 코드는 모바일부터 작성.

## 디렉토리 구조

```
app/              라우트 (레이아웃, 페이지, loading, error)
components/       공유 UI 컴포넌트
components/ui/    shadcn/ui 자동 생성 컴포넌트 (직접 편집 가능)
lib/              유틸, 헬퍼, 상수
```

## 기술 스택

| 역할            | 도구                               |
| --------------- | ---------------------------------- |
| UI 컴포넌트     | shadcn/ui + Radix UI               |
| 스타일링        | Tailwind CSS v4                    |
| 상태관리 (전역) | Zustand ❓ 미설치                  |
| 서버 상태       | TanStack Query ❓ 미설치           |
| 폼 & 유효성     | React Hook Form + Zod ❓ 미설치    |
| 테스트          | Vitest + Testing Library ❓ 미설치 |
| E2E             | Playwright ❓ 미설치               |

## shadcn/ui 컴포넌트 추가

```bash
pnpm dlx shadcn@latest add <component>   # apps/web 디렉토리에서 실행
```

`components/ui/`에 자동 생성됨. 프로젝트 필요에 따라 직접 수정 가능.

## Tailwind CSS v4 주의

- v4 문법 사용 (`@import "tailwindcss"` 등). v3 문법 혼용 금지.
- 유틸리티 클래스 조합 시 `cn()` (`lib/utils.ts`) 사용.

## 웹 표준 & 접근성

- 시맨틱 HTML 태그 우선 (`<main>`, `<nav>`, `<article>` 등)
- 인터랙티브 요소에 `aria-*` 속성 명시
- 이미지 `alt` 필수

## 성능 목표

- 주요 페이지 LCP 3초 이내
- Vercel Analytics로 Core Web Vitals 수집
