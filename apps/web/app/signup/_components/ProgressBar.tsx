'use client';

export const ProgressBar = ({
  step,
  total,
  isSubmitting,
  onComplete,
}: {
  step: number;
  total: number;
  isSubmitting: boolean;
  onComplete?: () => void;
}) => {
  const width = isSubmitting ? '100%' : `${((step - 1) / total) * 100}%`;

  return (
    <div className="bg-secondary/50 absolute top-0 right-0 left-0 h-3">
      <div
        className="bg-primary h-full transition-all duration-500 ease-in-out"
        style={{ width }}
        onTransitionEnd={isSubmitting ? onComplete : undefined}
      />
    </div>
  );
};
