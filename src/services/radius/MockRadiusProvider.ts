import { AuthRequest, AuthResponse, DisconnectRequest, RadiusProvider } from './RadiusProvider';

/**
 * Mock RADIUS Provider for development and testing.
 * Implements requirement RAD-003.
 */
export class MockRadiusProvider implements RadiusProvider {
  async authenticate(request: AuthRequest): Promise<AuthResponse> {
    console.log(`[MOCK RADIUS] Authenticating user: ${request.username}`);
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In mock mode, we generally approve if the service is called
    // (Actual room/name validation happens BEFORE this is called)
    console.log('[MOCK RADIUS] MOCK RADIUS AUTHORIZATION SUCCESS');

    return {
      success: true,
      message: 'Access-Accept',
      radiusSessionId: `mock-session-${Date.now()}`,
      attributes: {
        'Session-Timeout': 28800,
        'Filter-Id': 'HOSPITAL-GUEST'
      }
    };
  }

  async authorize(request: AuthRequest): Promise<AuthResponse> {
    return this.authenticate(request);
  }

  async disconnect(request: DisconnectRequest): Promise<boolean> {
    console.log(`[MOCK RADIUS] Disconnecting user: ${request.username} (Session: ${request.radiusSessionId})`);
    return true;
  }

  async changeAuthorization(request: any): Promise<boolean> {
    console.log('[MOCK RADIUS] CoA triggered');
    return true;
  }

  async accounting(request: import('./RadiusProvider').AccountingRequest): Promise<boolean> {
    console.log(`[MOCK RADIUS] Accounting ${request.statusType} for ${request.username}`);
    return true;
  }

  async getStatus(): Promise<'ONLINE' | 'OFFLINE' | 'MOCK'> {
    return 'MOCK';
  }
}
