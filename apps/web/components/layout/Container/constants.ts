import { BookOpen, MessageCircle, Settings, User, type LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  loggedInOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', icon: MessageCircle, label: '커뮤니티' },
  { href: '/notes', icon: BookOpen, label: '독서 노트' },
  { href: '/profile', icon: User, label: '프로필' },
  { href: '/settings', icon: Settings, label: '설정', loggedInOnly: true },
];
