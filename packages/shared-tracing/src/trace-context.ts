export interface TraceContext {
  traceId: string;
  parentSpanId: string;
  traceFlags: string;
  tracestate?: string;
  version: string;
}

export function parseTraceparent(header?: string): TraceContext {
  if (!header) {
    return generateTraceContext();
  }

  const parts = header.split('-');
  if (parts.length !== 4) {
    return generateTraceContext();
  }

  const [versionRaw, traceIdRaw, parentSpanIdRaw, traceFlagsRaw] = parts;
  const version = versionRaw.toLowerCase();
  const traceId = traceIdRaw.toLowerCase();
  const parentSpanId = parentSpanIdRaw.toLowerCase();
  const traceFlags = traceFlagsRaw.toLowerCase();

  if (version !== '00') {
    return generateTraceContext();
  }

  if (!isValidHex(traceId, 32) || !isValidHex(parentSpanId, 16) || !isValidHex(traceFlags, 2)) {
    return generateTraceContext();
  }

  return {
    version: '00',
    traceId,
    parentSpanId,
    traceFlags,
  };
}

export function parseTracestate(header?: string): string | undefined {
  if (!header) {
    return undefined;
  }

  return header.trim() === '' ? undefined : header;
}

export function generateTraceContext(): TraceContext {
  return {
    version: '00',
    traceId: generateTraceId(),
    parentSpanId: generateSpanId(),
    traceFlags: '01',
  };
}

export function generateTraceId(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function generateSpanId(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function formatTraceparent(context: TraceContext): string {
  return `${context.version}-${context.traceId}-${context.parentSpanId}-${context.traceFlags}`;
}

export function isValidTraceparent(header: string): boolean {
  if (!header) {
    return false;
  }

  const parts = header.split('-');
  if (parts.length !== 4) {
    return false;
  }

  const [version, traceId, parentSpanId, traceFlags] = parts;
  return (
    version === '00' &&
    isValidHex(traceId, 32) &&
    isValidHex(parentSpanId, 16) &&
    isValidHex(traceFlags, 2)
  );
}

function isValidHex(str: string, length: number): boolean {
  if (str.length !== length) {
    return false;
  }

  return /^[0-9a-f]+$/.test(str);
}
