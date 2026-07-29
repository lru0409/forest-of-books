import { type ReactNode } from 'react';

interface RecordSectionProps {
  title: string;
  isEditing: boolean;
  hasValue: boolean;
  emptyMessage: string;
  editor: ReactNode;
  display: ReactNode;
}

export function RecordSection({
  title,
  isEditing,
  hasValue,
  emptyMessage,
  editor,
  display,
}: RecordSectionProps) {
  return (
    <section className="border-primary/20 rounded-xl border p-5">
      <h4 className="text-primary mb-2 text-base font-medium">{title}</h4>
      {isEditing ? (
        editor
      ) : hasValue ? (
        display
      ) : (
        <p className="text-secondary text-sm">{emptyMessage}</p>
      )}
    </section>
  );
}
