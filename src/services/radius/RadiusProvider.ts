export interface AuthRequest {
  username: string;
  password?: string;
  clientMac?: string;
  clientIp?: string;
  ssid?: string;
  apMac?: string;
  accessProfile?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  radiusSessionId?: string;
  attributes?: Record<string, string | number>;
}

export interface DisconnectRequest {
  username: string;
  clientIp?: string;
  radiusSessionId?: string;
}

export interface RadiusProvider {
  /**
   * Authenticate a user against the RADIUS server/mock.
   */
  authenticate(request: AuthRequest): Promise<AuthResponse>;

  /**
   * Authorize a user (often combined with authenticate, but separated for conceptual clarity).
   */
  authorize(request: AuthRequest): Promise<AuthResponse>;

  /**
   * Disconnect an active session via RADIUS CoA or similar mechanism.
   */
  disconnect(request: DisconnectRequest): Promise<boolean>;

  /**
   * Change authorization for an active session.
   */
  changeAuthorization(request: any): Promise<boolean>;

  /**
   * Get the current status of the RADIUS server.
   */
  getStatus(): Promise<'ONLINE' | 'OFFLINE' | 'MOCK'>;
}
