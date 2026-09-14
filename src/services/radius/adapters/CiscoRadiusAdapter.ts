import { GenericRadiusProvider } from '../GenericRadiusProvider';

export class CiscoRadiusAdapter extends GenericRadiusProvider {
  protected getAccessProfileAttributes(accessProfile?: string, settings?: any): string[][] {
    const profileKey = accessProfile || 'STANDARD';
    const bandwidthStr = settings?.bandwidthProfiles?.[profileKey];
    
    const attrs: string[][] = [];
    if (bandwidthStr) {
       const downBps = (bandwidthStr.downMbps || 10) * 1000000;
       const upBps = (bandwidthStr.upMbps || 10) * 1000000;
       
       console.log(`[Cisco] Applied bandwidth profile ${profileKey}: ${downBps} bps down / ${upBps} bps up`);
       
       // Cisco-AVPair for shaping
       // e.g. subscriber:qos-policy-in=Policy_Name
       // We log the logical intent of the vendor translation.
       attrs.push(['Cisco-AVPair', `subscriber:bandwidth-down=${downBps}`]);
       attrs.push(['Cisco-AVPair', `subscriber:bandwidth-up=${upBps}`]);
    }

    return attrs;
  }
}
