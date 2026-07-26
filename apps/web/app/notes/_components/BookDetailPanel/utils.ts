export function formatRatingLabel(value: number) {
  return value % 1 === 0 ? String(value) : value.toFixed(1);
}
