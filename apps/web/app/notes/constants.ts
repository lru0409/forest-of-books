import { Circle, CheckCircle2, PauseCircle, PlayCircle } from 'lucide-react';

import { Book } from './types';

export const STATUS_CONFIG: Record<
  Book['status'],
  { label: string; icon: typeof Circle; className: string }
> = {
  not_started: {
    label: '읽지 않음',
    icon: Circle,
    className: 'border border-primary/15 bg-muted text-foreground',
  },
  reading: {
    label: '읽는 중',
    icon: PlayCircle,
    className: 'border border-transparent bg-secondary text-white',
  },
  completed: {
    label: '완독',
    icon: CheckCircle2,
    className: 'border border-transparent bg-primary text-primary-foreground',
  },
  on_hold: {
    label: '보류',
    icon: PauseCircle,
    className: 'border border-dashed border-secondary bg-transparent text-primary',
  },
};
