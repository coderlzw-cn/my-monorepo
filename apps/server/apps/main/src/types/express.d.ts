import type { AuthUserClaims } from "@/types/auth.types";

declare global {
  type AuthUserPayload = AuthUserClaims & { sessionId: string };
  namespace Express {
    interface User extends AuthUserClaims {}

    interface Request {
      clientIp?: string;
      requestId: string;
    }
  }
}
