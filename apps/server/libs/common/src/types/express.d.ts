// type AuthUserPayload = AuthUserClaims & { sessionId: string };
namespace Express {
  // interface User extends AuthUserClaims {}

  interface Request {
    user?: { is: string };
    clientIp?: string;
    requestId: string;
  }
}
