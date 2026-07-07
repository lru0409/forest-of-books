'use client';

import { useState } from 'react';

import { Container } from '@/components/layout';
import { ViewToggle, ViewMode } from './_components/ViewToggle';

export default function NotesPage() {
  const [view, setView] = useState<ViewMode>('shelf');

  return (
    <Container>
      <div className="flex justify-center px-4 pt-4">
        <ViewToggle view={view} onChange={setView} />
      </div>
    </Container>
  );
}
