import {
  Award,
  Bug,
  Frown,
  Heart,
  Hourglass,
  Library,
  MessageCircle,
  NotebookPen,
  ScrollText,
  UtensilsCrossed,
  Users,
  Utensils,
} from 'lucide-react';

import type { Badge } from '../types/badge';

// 보류
// - 로판덕후/추리광/SF 탐험가: 특정 장르 등록 비중 압도적
// - 장문가: 노트 평균 글자수 상위권
// - 호평가: 높은 별점(4~5점) 위주로 많이 부여
// - 고전러버: 출간 20년 이상 된 책 비율 높음
// - 얼리어답터: 출간 1개월 이내 신간 등록 비율 높음

export const MOCK_BADGES: Badge[] = [
  {
    id: 'first-complete',
    icon: Award,
    bgGradient: 'linear-gradient(135deg, #F5C669 0%, #C17F1B 100%)',
    glowColor: '#F5C669',
    title: '첫 완독',
    description: '책 1권을 완독했어요.',
  },
  {
    id: 'avid-reader',
    icon: Library,
    bgGradient: 'linear-gradient(135deg, #8FC0E8 0%, #3D6690 100%)',
    glowColor: '#8FC0E8',
    title: '다독가',
    description: '책 15권 이상을 등록했어요.',
  },
  {
    id: 'book-worm',
    icon: Bug,
    bgGradient: 'linear-gradient(135deg, #B9E07A 0%, #6B9A2E 100%)',
    glowColor: '#B9E07A',
    title: '책벌레',
    description: '책 30권 이상을 등록했어요.',
  },
  {
    id: 'reviewer',
    icon: NotebookPen,
    bgGradient: 'linear-gradient(135deg, #6FDCC9 0%, #217F72 100%)',
    glowColor: '#6FDCC9',
    title: '리뷰어',
    description: '한줄평을 10개 이상 남겼어요.',
  },
  {
    id: 'omnivore-reader',
    icon: UtensilsCrossed,
    bgGradient: 'linear-gradient(135deg, #E8845A 0%, #B8451F 100%)',
    glowColor: '#E8845A',
    title: '잡식독서가',
    description: '다양한 장르의 책을 골고루 읽었어요.',
  },
  {
    id: 'picky-reader',
    icon: Utensils,
    bgGradient: 'linear-gradient(135deg, #B47FD9 0%, #6B3FA0 100%)',
    glowColor: '#B47FD9',
    title: '편식가',
    description: '한 장르에 푹 빠져 있어요.',
  },
  {
    id: 'social-butterfly',
    icon: Users,
    bgGradient: 'linear-gradient(135deg, #E38FCB 0%, #8A3773 100%)',
    glowColor: '#E38FCB',
    title: '인싸',
    description: '팔로워 수가 10명 이상이에요.',
  },
  {
    id: 'like-fairy',
    icon: Heart,
    bgGradient: 'linear-gradient(135deg, #F08AB0 0%, #A82F5A 100%)',
    glowColor: '#F08AB0',
    title: '좋아요 요정',
    description: '좋아요를 많이 눌렀어요.',
  },
  {
    id: 'comment-rich',
    icon: MessageCircle,
    bgGradient: 'linear-gradient(135deg, #9CA8B8 0%, #4A5568 100%)',
    glowColor: '#9CA8B8',
    title: '댓글부자',
    description: '댓글을 많이 남겼어요.',
  },
  {
    id: 'first-sentence-killer',
    icon: Hourglass,
    bgGradient: 'linear-gradient(135deg, #CBA6A6 0%, #6E4A4A 100%)',
    glowColor: '#CBA6A6',
    title: '첫 문장 킬러',
    description: '읽는 중인 책이 오래도록 멈춰 있어요.',
  },
  {
    id: 'harsh-critic',
    icon: Frown,
    bgGradient: 'linear-gradient(135deg, #E88080 0%, #942424 100%)',
    glowColor: '#E88080',
    title: '혹평가',
    description: '낮은 별점을 여러 번 남겼어요.',
  },
  {
    id: 'critic',
    icon: ScrollText,
    bgGradient: 'linear-gradient(135deg, #9BA0DE 0%, #43478C 100%)',
    glowColor: '#9BA0DE',
    title: '평론가',
    description: '별점과 한줄평을 꾸준히 남겼어요.',
  },
];
