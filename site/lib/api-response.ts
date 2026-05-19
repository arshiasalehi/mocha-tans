export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiError = {
  ok: false;
  code: string;
  message: string;
};

export function jsonSuccess<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ ok: true, data } satisfies ApiSuccess<T>, init);
}

export function jsonError(code: string, message: string, status = 400): Response {
  return Response.json({ ok: false, code, message } satisfies ApiError, { status });
}
