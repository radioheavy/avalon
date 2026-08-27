import type { JsonValue } from '@/types/prompt';

/** Stable JSON serialization, independent of object insertion order. */
export function stableStringify(value: JsonValue | unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`;
}

/** Small synchronous hash suitable for local revision identity (not security). */
export function stableHash(value: JsonValue | unknown): string {
  const input = typeof value === 'string' ? value : stableStringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function createRevisionId(sourceHash: string, projectionHash: string, number: number): string {
  return `rev-${number}-${stableHash(`${sourceHash}:${projectionHash}:${number}`).slice(-8)}`;
}

