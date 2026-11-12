/** Neon bigint IDs often arrive as strings — normalize for comparisons/lookups. */
export function toId(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : parseInt(String(value), 10)
  return Number.isFinite(n) ? n : null
}

export function sameId(a: unknown, b: unknown): boolean {
  const left = toId(a)
  const right = toId(b)
  return left != null && right != null && left === right
}
