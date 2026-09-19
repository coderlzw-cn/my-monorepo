interface AuthUserClaims {
  id: string;
  username: string;
  systemRoleKey: string;
}

interface AuthTokenClaims extends AuthUserClaims {
  jti?: string;
  exp?: number;
}

interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
}
