const SENSITIVE_KEYS = [
  'authorization',
  'cookie',
  'password',
  'secret',
  'clientsecret',
  'client_secret',
  'access_token',
  'refresh_token',
  'token',
];

export const sanitizeAuditMetadata = (value: unknown): Record<string, unknown> => {
  const sanitized = sanitizeValue(value);
  return isPlainObject(sanitized) ? sanitized : {};
};

export const sanitizeAuditMessage = (
  message: unknown,
): string | null | undefined => {
  if (message === undefined) {
    return undefined;
  }

  if (message === null) {
    return null;
  }

  const text = Array.isArray(message) ? message.join(', ') : String(message);
  if (containsSensitiveText(text)) {
    return 'Audit error details redacted';
  }

  return text.slice(0, 500);
};

const sanitizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      isSensitiveKey(key) ? '[redacted]' : sanitizeValue(item),
    ]),
  );
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isSensitiveKey = (key: string): boolean => {
  const normalized = key.toLowerCase().replace(/[\s-]/g, '_');
  return SENSITIVE_KEYS.some((sensitiveKey) =>
    normalized.includes(sensitiveKey),
  );
};

const containsSensitiveText = (text: string): boolean => {
  const normalized = text.toLowerCase().replace(/[\s-]/g, '_');
  return SENSITIVE_KEYS.some((sensitiveKey) =>
    normalized.includes(sensitiveKey),
  );
};
