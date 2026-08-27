import { JsonValue, JsonObject } from '@/types/prompt';

/**
 * Immutably set a value at a given path in a JSON object
 */
export function setValueAtPath(
  obj: JsonObject,
  path: string[],
  value: JsonValue
): JsonObject {
  const setNestedValue = (current: JsonValue, remainingPath: string[]): JsonValue => {
    if (remainingPath.length === 0) return value;

    const [head, ...tail] = remainingPath;
    if (Array.isArray(current)) {
      const index = Number(head);
      if (!Number.isInteger(index) || index < 0) return current;
      const next = [...current];
      const fallback: JsonValue = tail.length > 0 && /^\d+$/.test(tail[0]) ? [] : {};
      next[index] = setNestedValue(next[index] ?? fallback, tail);
      return next;
    }

    const record = current && typeof current === 'object' ? current as JsonObject : {};
    const fallback: JsonValue = tail.length > 0 && /^\d+$/.test(tail[0]) ? [] : {};
    return {
      ...record,
      [head]: setNestedValue(record[head] ?? fallback, tail),
    };
  };

  const result = setNestedValue(obj, path);
  return result && typeof result === 'object' && !Array.isArray(result)
    ? result as JsonObject
    : obj;
}

/**
 * Immutably delete a value at a given path in a JSON object
 */
export function deleteValueAtPath(
  obj: JsonObject,
  path: string[]
): JsonObject {
  const deleteNestedValue = (current: JsonValue, remainingPath: string[]): JsonValue => {
    if (remainingPath.length === 0) return current;
    const [head, ...tail] = remainingPath;

    if (Array.isArray(current)) {
      const index = Number(head);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) return current;
      const next = [...current];
      if (tail.length === 0) next.splice(index, 1);
      else next[index] = deleteNestedValue(next[index], tail);
      return next;
    }

    if (!current || typeof current !== 'object') return current;
    const record = current as JsonObject;
    if (!(head in record)) return record;
    if (tail.length === 0) {
      const next = { ...record };
      delete next[head];
      return next;
    }
    return { ...record, [head]: deleteNestedValue(record[head], tail) };
  };

  return deleteNestedValue(obj, path) as JsonObject;
}

/**
 * Get a value at a given path in a JSON object
 */
export function getValueAtPath(
  obj: JsonObject,
  path: string[]
): JsonValue | undefined {
  if (path.length === 0) {
    return obj;
  }

  let current: JsonValue = obj;
  for (const key of path) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    if (Array.isArray(current)) {
      const index = parseInt(key, 10);
      if (isNaN(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
    } else {
      current = (current as JsonObject)[key];
    }
  }
  return current;
}

/**
 * Get the type of a JSON value
 */
export function getValueType(
  value: JsonValue
): 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object' {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value as 'string' | 'number' | 'boolean' | 'object';
}

/**
 * Convert path array to string for comparison
 */
export function pathToString(path: string[]): string {
  return path.map((segment) => segment.replace(/~/g, '~0').replace(/\//g, '~1')).join('/');
}

/**
 * Convert path string back to array
 */
export function stringToPath(pathString: string): string[] {
  return pathString
    ? pathString.split('/').map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
    : [];
}
