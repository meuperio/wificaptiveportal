import { GenericRadiusProvider } from '../GenericRadiusProvider';

export class ArubaRadiusAdapter extends GenericRadiusProvider {
  constructor(host: string, port: number, secret: string) {
    super(host, port, secret);
    // Add custom dictionary if needed for Aruba VSAs
  }

  protected getAccessProfileAttributes(accessProfile?: string): string[][] {
    if (accessProfile === 'PREMIUM') {
      // Assuming dictionary maps this to the correct vendor-specific attribute
      return [['Aruba-User-Role', 'premium_guest']];
    }
    return [['Aruba-User-Role', 'standard_guest']];
  }
}
