export function redisOptions(environment = process.env) {
  const url = environment.REDIS_URL || environment.KV_URL;
  if (!url) {
    const error = new Error('Vercel cần REDIS_URL hoặc KV_URL để lưu phòng dùng chung.');
    error.code = 'ROOM_STORAGE_NOT_CONFIGURED';
    throw error;
  }
  try {
    const parsed = new URL(url);
    if (!['redis:', 'rediss:'].includes(parsed.protocol)) throw new Error();
  } catch {
    const error = new Error('REDIS_URL hoặc KV_URL chưa đúng định dạng.');
    error.code = 'ROOM_STORAGE_NOT_CONFIGURED';
    throw error;
  }
  const scope = environment.VERCEL_ENV === 'preview'
    ? `preview:${environment.VERCEL_GIT_COMMIT_REF || 'default'}` : environment.VERCEL_ENV || 'local';
  return { url, prefix: environment.ROOM_REDIS_PREFIX || `cbcx:rooms:v1:${scope}` };
}

export function sendJson(response, status, data) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.end(JSON.stringify(data));
}

export function storageFailure(response, error) {
  const code = error.code === 'ROOM_STORAGE_NOT_CONFIGURED' ? error.code : 'ROOM_STORAGE_UNAVAILABLE';
  sendJson(response, 503, { ok: false, code,
    error: code === 'ROOM_STORAGE_NOT_CONFIGURED'
      ? 'Máy chủ phòng chưa được thiết lập. Hãy nhờ người tổ chức hoàn tất cấu hình phòng trực tuyến.'
      : 'Máy chủ phòng tạm thời chưa sẵn sàng. Hãy thử lại sau ít phút.' });
}
