import { Genre } from '@repo/db';

const EXTRA_NOVEL_MIDDLE_CATEGORIES = new Set(['여성문학', '테마문학', '세계의 문학']);

/**
 * 알라딘 categoryName은 "국내도서|외국도서>대분류>중분류>소분류" 형태의 문자열.
 * 대분류(top)로 1차 판별하고 "소설/시/희곡"처럼 형식이 섞인 대분류만 하위 세그먼트로 재분류한다.
 */
export function mapAladinCategoryToGenre(categoryName: string): Genre | null {
  const segments = categoryName
    .split('>')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) return null;

  const top = segments[1] ?? '';

  if (top.includes('소설') || top.includes('시') || top.includes('희곡')) {
    const middle = segments[2] ?? '';
    if (middle === '시') return 'POETRY';
    if (middle === '희곡') return 'OTHER';
    if (
      middle.includes('소설') ||
      middle.includes('판타지') ||
      EXTRA_NOVEL_MIDDLE_CATEGORIES.has(middle)
    ) {
      return 'NOVEL';
    }
    return 'OTHER';
  }
  if (top.includes('에세이')) return 'ESSAY';
  if (
    top.includes('인문학') ||
    top.includes('고전') ||
    top.includes('종교') ||
    top.includes('인물') ||
    top.includes('평전')
  ) {
    return 'HUMANITIES';
  }
  if (top.includes('사회과학')) return 'SOCIAL_POLITICS';
  if (top.includes('경제경영')) return 'ECONOMICS_BUSINESS';
  if (
    top.includes('자기계발') ||
    top.includes('좋은부모') ||
    top.includes('건강') ||
    top.includes('취미') ||
    top.includes('요리') ||
    top.includes('살림')
  ) {
    return 'SELF_DEVELOPMENT';
  }
  if (top.includes('과학') || top.includes('컴퓨터') || top.includes('모바일')) {
    return 'SCIENCE_TECHNOLOGY';
  }
  if (top.includes('역사')) return 'HISTORY';
  if (top.includes('예술') || top.includes('대중문화')) return 'ART_CULTURE';
  if (top.includes('여행')) return 'TRAVEL';
  if (top.includes('유아') || top.includes('어린이') || top.includes('청소년')) {
    return 'CHILDREN_TEEN';
  }
  if (top.includes('만화')) return 'COMICS';

  return 'OTHER';
}
