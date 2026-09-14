import { GenericRadiusProvider } from '../GenericRadiusProvider';

export class HuaweiRadiusAdapter extends GenericRadiusProvider {
  protected getAccessProfileAttributes(accessProfile?: string): string[][] {
    // Placeholder for Huawei VSAs
    return [];
  }
}
