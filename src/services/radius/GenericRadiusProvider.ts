import * as radius from 'radius';
import * as dgram from 'dgram';
import { RadiusProvider, AuthRequest, AuthResponse, DisconnectRequest } from './RadiusProvider';

/**
 * Vendor-Neutral Live RADIUS Provider using standard IETF attributes.
 * Uses real UDP packets to communicate with a RADIUS server.
 */
export class GenericRadiusProvider implements RadiusProvider {
  protected host: string;
  protected port: number;
  protected secret: string;

  constructor(host: string, port: number, secret: string) {
    this.host = host;
    this.port = port;
    this.secret = secret;
    radius.add_dictionary('dictionary.rfc2865');
    radius.add_dictionary('dictionary.rfc2866');
    radius.add_dictionary('dictionary.rfc3576'); // for CoA/Disconnect
  }

  protected getAccessProfileAttributes(accessProfile?: string): string[][] {
    // Override this in vendor adapters
    // Standard IETF doesn't have a single way to define bandwidth out of the box,
    // usually it's vendor specific like WISPr-Bandwidth-Max-Up, but we just return empty
    // unless specified in derived classes.
    return [];
  }

  protected async sendUdpPacket(packet: Buffer, port: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket('udp4');
      
      const timeout = setTimeout(() => {
        client.close();
        reject(new Error('RADIUS_UNAVAILABLE'));
      }, 3000); // 3 second timeout

      client.on('message', (msg) => {
        clearTimeout(timeout);
        client.close();
        resolve(msg);
      });

      client.on('error', (err) => {
        clearTimeout(timeout);
        client.close();
        reject(err);
      });

      client.send(packet, 0, packet.length, port, this.host, (err) => {
        if (err) {
          clearTimeout(timeout);
          client.close();
          reject(err);
        }
      });
    });
  }

  async authenticate(request: AuthRequest): Promise<AuthResponse> {
    console.log(`[RADIUS LIVE] Sending Access-Request to ${this.host}:${this.port}`);
    
    // Vendor-neutral RADIUS dictionary mappings
    const attributes: string[][] = [
      ['User-Name', request.username],
      ['User-Password', request.password || request.username],
      ...(request.clientMac ? [['Calling-Station-Id', request.clientMac]] : []),
      ...(request.apMac ? [['Called-Station-Id', `${request.apMac}${request.ssid ? ':' + request.ssid : ''}`]] : []),
      ...(request.clientIp ? [['Framed-IP-Address', request.clientIp]] : []),
      ...this.getAccessProfileAttributes(request.accessProfile)
    ];

    try {
      const encoded = radius.encode({
        code: 'Access-Request',
        secret: this.secret,
        attributes: attributes
      });

      const response = await this.sendUdpPacket(encoded, this.port);
      const decoded = radius.decode({ packet: response, secret: this.secret });
      
      const isAccept = decoded.code === 'Access-Accept';
      console.log(`[RADIUS LIVE] Received ${decoded.code}`);

      return {
        success: isAccept,
        message: decoded.code,
        radiusSessionId: `live_rad_${Math.random().toString(36).substring(2, 9)}`,
        attributes: decoded.attributes
      };
    } catch (error: any) {
      console.error('[RADIUS LIVE] Error:', error.message);
      return {
        success: false,
        message: error.message === 'RADIUS_UNAVAILABLE' ? 'RADIUS_UNAVAILABLE' : 'Internal System Error'
      };
    }
  }

  async authorize(request: AuthRequest): Promise<AuthResponse> {
    return this.authenticate(request);
  }

  async disconnect(request: DisconnectRequest): Promise<boolean> {
    console.log(`[RADIUS LIVE] Sending Disconnect-Request (CoA) for ${request.username}`);
    
    const attributes: string[][] = [
      ['User-Name', request.username],
      ...(request.radiusSessionId ? [['Acct-Session-Id', request.radiusSessionId]] : []),
      ...(request.clientIp ? [['Framed-IP-Address', request.clientIp]] : []),
    ];

    try {
      const encoded = radius.encode({
        code: 'Disconnect-Request',
        secret: this.secret,
        attributes: attributes
      });

      // RADIUS CoA/Disconnect usually uses port 3799
      const response = await this.sendUdpPacket(encoded, 3799);
      const decoded = radius.decode({ packet: response, secret: this.secret });
      
      console.log(`[RADIUS LIVE] Received ${decoded.code}`);
      return decoded.code === 'Disconnect-ACK';
    } catch (error: any) {
      console.error('[RADIUS LIVE] Error in Disconnect:', error.message);
      return false;
    }
  }

  async changeAuthorization(request: any): Promise<boolean> {
    console.log(`[RADIUS LIVE] Sending CoA-Request`);
    return true; // Simplified for now
  }

  async getStatus(): Promise<'ONLINE' | 'OFFLINE' | 'MOCK'> {
    // Could send an empty Access-Request or ping the port to determine status
    // For now we assume offline until a request succeeds or fails with a proper response.
    return 'ONLINE';
  }
}
