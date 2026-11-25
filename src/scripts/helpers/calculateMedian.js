export function calculateMedian(numbers) {
  if (numbers.length === 0) return 0;
  const compare = (a, b) => a - b;
  const sorted = numbers.toSorted?.(compare) ?? numbers.slice().sort(compare);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
