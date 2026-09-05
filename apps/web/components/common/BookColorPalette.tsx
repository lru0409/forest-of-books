import { BOOK_COLORS, cn } from '@/lib';

interface BookColorPaletteProps {
  value: string | null;
  onChange: (color: string) => void;
  colors?: string[];
}

export function BookColorPalette({ value, onChange, colors = BOOK_COLORS }: BookColorPaletteProps) {
  return (
    <div className="grid grid-cols-4 gap-2.5 p-1" role="group" aria-label="색상 선택">
      {colors.map((color) => {
        const isSelected = color === value;
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-pressed={isSelected}
            aria-label={color}
            className={cn(
              'size-9 cursor-pointer rounded-full transition-transform',
              isSelected ? 'ring-primary ring-2 ring-offset-2' : 'hover:scale-110',
            )}
            style={{ backgroundColor: color }}
          />
        );
      })}
    </div>
  );
}
