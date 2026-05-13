'use client';

import { useState, useEffect } from 'react';

export const ProgressBar = ({
  step,
  total,
  isCompleted,
}: {
  step: number;
  total: number;
  isCompleted: boolean;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const width = isCompleted ? '100%' : mounted ? `${((step - 1) / total) * 100}%` : '0%';

  return (
    <div className="bg-secondary/50 absolute top-0 right-0 left-0 h-2">
      <div
        className="bg-primary h-full transition-all duration-500 ease-in-out"
        style={{ width }}
      />
    </div>
  );
};
