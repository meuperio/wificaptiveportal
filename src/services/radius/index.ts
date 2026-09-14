export * from './RadiusProvider';
export * from './MockRadiusProvider';

import { RadiusProvider } from './RadiusProvider';
import { MockRadiusProvider } from './MockRadiusProvider';

// Factory to get the correct provider based on configuration
export function getRadiusProvider(): RadiusProvider {
  const mode = process.env.RADIUS_MODE || 'MOCK';
  
  if (mode === 'MOCK') {
    return new MockRadiusProvider();
  }
  
  // Future: return new GenericRadiusProvider();
  return new MockRadiusProvider();
}
