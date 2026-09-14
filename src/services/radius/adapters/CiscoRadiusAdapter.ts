import { GenericRadiusProvider } from '../GenericRadiusProvider';

export class CiscoRadiusAdapter extends GenericRadiusProvider {
  protected getAccessProfileAttributes(accessProfile?: string): string[][] {
    // Placeholder for Cisco VSAs like Cisco-AVPair for bandwidth limits
    return [];
  }
}
