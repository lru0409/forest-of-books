'use client';

import Lottie from 'lottie-react';

import bookLoaderData from './book-loader.json';

// TODO: 제거

interface BookLoaderProps {
  size?: number;
  className?: string;
}

export function BookLoader({ size = 160, className }: BookLoaderProps) {
  return (
    // <div className="bg-primary-foreground flex size-25 items-center justify-center overflow-hidden rounded-full">
    <Lottie
      animationData={bookLoaderData}
      loop
      className={className}
      style={{ width: size, height: size }}
      aria-label="로딩 중"
      role="status"
    />
    // </div>
  );
}
