export * from './RadiusProvider';
export * from './MockRadiusProvider';
export * from './GenericRadiusProvider';
export * from './adapters/CiscoRadiusAdapter';
export * from './adapters/ArubaRadiusAdapter';
export * from './adapters/HuaweiRadiusAdapter';

import { RadiusProvider } from './RadiusProvider';
import { MockRadiusProvider } from './MockRadiusProvider';
import { GenericRadiusProvider } from './GenericRadiusProvider';

// Factory to get the correct provider based on configuration
export function getRadiusProvider(): RadiusProvider {
  const mode = process.env.RADIUS_MODE || 'MOCK';
  
  if (mode === 'LIVE') {
    // In a real application, these would come from the DbClient.getSettings() cache
    // For this architectural implementation, we pass environment defaults
    return new GenericRadiusProvider(
      process.env.RADIUS_HOST || '127.0.0.1',
      parseInt(process.env.RADIUS_PORT || '1812', 10),
      process.env.RADIUS_SECRET || 'testing123'
    );
  }
  
  return new MockRadiusProvider();
}
