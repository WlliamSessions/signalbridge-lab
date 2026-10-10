
export function isAuthorized(request: Request): boolean {
  const authorization = request.headers.get("authorization");

  const expectedToken = process.env.SIGNALBRIDGE_API_KEY;

  if (!expectedToken) {
    return false;
  }

  return authorization === `Bearer ${expectedToken}`;
}
