import { mapAladinCategoryToGenre } from './map-aladin-category-to-genre';

describe('mapAladinCategoryToGenre', () => {
  it.each([
    ['국내도서>소설/시/희곡>한국소설>한국현대소설', 'NOVEL'],
    ['국내도서>소설/시/희곡>영미소설', 'NOVEL'],
    ['국내도서>소설/시/희곡>시>한국시', 'POETRY'],
    ['국내도서>소설/시/희곡>희곡', 'OTHER'],
    ['국내도서>에세이>한국에세이', 'ESSAY'],
    ['국내도서>인문학>심리학', 'HUMANITIES'],
    ['국내도서>고전>동양고전', 'HUMANITIES'],
    ['국내도서>종교/역학>기독교', 'HUMANITIES'],
    ['국내도서>인물/평전>인물일반', 'HUMANITIES'],
    ['국내도서>사회과학>사회학', 'SOCIAL_POLITICS'],
    ['국내도서>경제경영>경영일반', 'ECONOMICS_BUSINESS'],
    ['국내도서>자기계발>성공학', 'SELF_DEVELOPMENT'],
    ['국내도서>좋은부모>임신출산', 'SELF_DEVELOPMENT'],
    ['국내도서>건강/취미>다이어트', 'SELF_DEVELOPMENT'],
    ['국내도서>요리/살림>요리', 'SELF_DEVELOPMENT'],
    ['국내도서>과학>물리학', 'SCIENCE_TECHNOLOGY'],
    ['국내도서>컴퓨터/모바일>프로그래밍', 'SCIENCE_TECHNOLOGY'],
    ['국내도서>역사>한국사', 'HISTORY'],
    ['국내도서>예술/대중문화>미술', 'ART_CULTURE'],
    ['국내도서>여행>국내여행', 'TRAVEL'],
    ['국내도서>유아>유아놀이', 'CHILDREN_TEEN'],
    ['국내도서>어린이>어린이문학', 'CHILDREN_TEEN'],
    ['국내도서>청소년>청소년소설', 'CHILDREN_TEEN'],
    ['국내도서>만화>순정만화', 'COMICS'],
    ['외국도서>소설/시/에세이>영미소설', 'NOVEL'],
    ['국내도서>소설/시/희곡>희곡>러시아소설', 'OTHER'],
    ['국내도서>소설/시/희곡>테마문학>사랑/연애/에로티시즘', 'NOVEL'],
    ['국내도서>소설/시/희곡>한국소설>러시아소설', 'NOVEL'],
    ['국내도서>소설/시/희곡>문학의 이해>소설론', 'OTHER'],
    ['국내도서>소설/시/희곡>문학 잡지>릿터', 'OTHER'],
    ['국내도서>소설/시/희곡>신춘문예작품집', 'OTHER'],
    ['국내도서>소설/시/희곡>우리나라 옛글>시가', 'OTHER'],
    ['국내도서>소설/시/희곡>여성문학', 'NOVEL'],
    ['국내도서>소설/시/희곡>테마문학>전쟁문학', 'NOVEL'],
    ['국내도서>소설/시/희곡>세계의 문학>일본문학', 'NOVEL'],
  ])('%s -> %s', (categoryName, expected) => {
    expect(mapAladinCategoryToGenre(categoryName)).toBe(expected);
  });

  it.each([['국내도서>외국어'], ['국내도서>대학교재/전문서적'], ['국내도서>기타 도서']])(
    '장르로 묶이지 않는 카테고리 %s는 OTHER를 반환한다',
    (categoryName) => {
      expect(mapAladinCategoryToGenre(categoryName)).toBe('OTHER');
    },
  );

  it('categoryName이 없으면 null을 반환한다', () => {
    expect(mapAladinCategoryToGenre('')).toBeNull();
  });
});
