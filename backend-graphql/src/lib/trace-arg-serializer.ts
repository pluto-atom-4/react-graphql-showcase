const MAX_DEPTH = 4;
const MAX_ARRAY_ITEMS = 20;
const MAX_OBJECT_KEYS = 20;
const MAX_STRING_LENGTH = 200;
const MAX_OUTPUT_LENGTH = 1000;
const REDACTED = '[REDACTED]';
const SENSITIVE_KEY_PATTERN = /(password|passwordHash|token|authorization|cookie|secret|api[-_]?key)/i;

export interface SerializedTraceArgs {
  serialized: string;
  redacted: boolean;
  truncated: boolean;
}

export function serializeTraceArgs(input: unknown): SerializedTraceArgs {
  let redacted = false;
  let truncated = false;
  const seen = new WeakSet<object>();

  const truncateString = (value: string): string => {
    if (value.length <= MAX_STRING_LENGTH) {
      return value;
    }

    truncated = true;
    return `${value.slice(0, MAX_STRING_LENGTH)}…`;
  };

  const walk = (value: unknown, depth: number, key?: string): unknown => {
    if (key && SENSITIVE_KEY_PATTERN.test(key)) {
      redacted = true;
      return REDACTED;
    }

    if (typeof value === 'string') {
      return truncateString(value);
    }

    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      return value;
    }

    if (typeof value === 'bigint') {
      return `${value.toString()}n`;
    }

    if (value === undefined) {
      return '[undefined]';
    }

    if (typeof value === 'function') {
      return `[function ${value.name || 'anonymous'}]`;
    }

    if (typeof value === 'symbol') {
      return value.toString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: truncateString(value.message),
        stack: value.stack ? truncateString(value.stack) : undefined,
      };
    }

    if (depth >= MAX_DEPTH) {
      truncated = true;
      return '[MaxDepth]';
    }

    if (Array.isArray(value)) {
      const items = value.slice(0, MAX_ARRAY_ITEMS).map((item) => walk(item, depth + 1));
      if (value.length > MAX_ARRAY_ITEMS) {
        truncated = true;
        items.push(`[+${value.length - MAX_ARRAY_ITEMS} more items]`);
      }
      return items;
    }

    if (typeof value === 'object') {
      if (seen.has(value as object)) {
        truncated = true;
        return '[Circular]';
      }

      seen.add(value as object);
      const entries = Object.entries(value as Record<string, unknown>);
      const normalized: Record<string, unknown> = {};

      for (const [entryKey, entryValue] of entries.slice(0, MAX_OBJECT_KEYS)) {
        normalized[entryKey] = walk(entryValue, depth + 1, entryKey);
      }

      if (entries.length > MAX_OBJECT_KEYS) {
        truncated = true;
        normalized.__truncated__ = `+${entries.length - MAX_OBJECT_KEYS} more keys`;
      }

      seen.delete(value as object);
      return normalized;
    }

    return String(value);
  };

  const normalized = walk(input, 0);
  let serialized = JSON.stringify(normalized);

  if (!serialized) {
    serialized = 'null';
  }

  if (serialized.length > MAX_OUTPUT_LENGTH) {
    truncated = true;
    serialized = `${serialized.slice(0, MAX_OUTPUT_LENGTH)}…`;
  }

  return {
    serialized,
    redacted,
    truncated,
  };
}
