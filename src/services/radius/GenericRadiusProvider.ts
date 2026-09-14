import * as radius from 'radius';
import * as dgram from 'dgram';
import { RadiusProvider, AuthRequest, AuthResponse, DisconnectRequest, AccountingRequest } from './RadiusProvider';

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

  protected getAccessProfileAttributes(accessProfile?: string, settings?: any): string[][] {
    // Override this in vendor adapters
    // Standard IETF doesn't have a single way to define bandwidth out of the box,
    // usually it's vendor specific like WISPr-Bandwidth-Max-Up, but we just return empty
    // unless specified in derived classes.
    return [];
  }

  protected async getActiveConfig() {
    try {
      const { DbClient } = await import('../../db/db.ts');
      const settings = await DbClient.getSettings();
      if (settings && settings.radiusHost) {
        return {
          host: settings.radiusHost,
          port: settings.radiusPort || 1812,
          acctPort: settings.radiusAccountingPort || 1813,
          secret: settings.radiusSecret || this.secret,
          timeoutMs: settings.radiusTimeout || 3000,
          settingsObj: settings
        };
      }
    } catch (e) {
      console.warn('[RADIUS] Using fallback configuration');
    }
    return {
      host: this.host,
      port: this.port,
      acctPort: 1813,
      secret: this.secret,
      timeoutMs: 3000,
      settingsObj: {}
    };
  }

  protected async sendUdpPacket(packet: Buffer, defaultPort: number): Promise<Buffer> {
    const config = await this.getActiveConfig();
    
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket('udp4');
      
      const timeout = setTimeout(() => {
        client.close();
        reject(new Error('RADIUS_UNAVAILABLE'));
      }, config.timeoutMs);

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

      client.send(packet, 0, packet.length, defaultPort, config.host, (err) => {
        if (err) {
          clearTimeout(timeout);
          client.close();
          reject(err);
        }
      });
    });
  }

  async authenticate(request: AuthRequest): Promise<AuthResponse> {
    const config = await this.getActiveConfig();
    console.log(`[RADIUS LIVE] Sending Access-Request to ${config.host}:${config.port}`);
    
    // Vendor-neutral RADIUS dictionary mappings
    const attributes: string[][] = [
      ['User-Name', request.username],
      ['User-Password', request.password || request.username],
      ...(request.clientMac ? [['Calling-Station-Id', request.clientMac]] : []),
      ...(request.apMac ? [['Called-Station-Id', `${request.apMac}${request.ssid ? ':' + request.ssid : ''}`]] : []),
      ...(request.clientIp ? [['Framed-IP-Address', request.clientIp]] : []),
      ...(request.sessionTimeout ? [['Session-Timeout', request.sessionTimeout.toString()]] : []),
      ...this.getAccessProfileAttributes(request.accessProfile, config.settingsObj)
    ];

    try {
      const encoded = radius.encode({
        code: 'Access-Request',
        secret: config.secret,
        attributes: attributes
      });

      const response = await this.sendUdpPacket(encoded, config.port);
      const decoded = radius.decode({ packet: response, secret: config.secret });
      
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
    const config = await this.getActiveConfig();
    console.log(`[RADIUS LIVE] Sending Disconnect-Request (CoA) for ${request.username}`);
    
    const attributes: string[][] = [
      ['User-Name', request.username],
      ...(request.radiusSessionId ? [['Acct-Session-Id', request.radiusSessionId]] : []),
      ...(request.clientIp ? [['Framed-IP-Address', request.clientIp]] : []),
    ];

    try {
      const encoded = radius.encode({
        code: 'Disconnect-Request',
        secret: config.secret,
        attributes: attributes
      });

      // RADIUS CoA typically uses port 3799
      const coaPort = (config as any).settingsObj?.radiusCoaPort || 3799;
      const response = await this.sendUdpPacket(encoded, coaPort);
      const decoded = radius.decode({ packet: response, secret: config.secret });
      
      console.log(`[RADIUS LIVE] Received ${decoded.code}`);
      return decoded.code === 'Disconnect-ACK';
    } catch (error: any) {
      console.error('[RADIUS LIVE] Error in Disconnect:', error.message);
      return false;
    }
  }

  async changeAuthorization(request: any): Promise<boolean> {
    const config = await this.getActiveConfig();
    console.log(`[RADIUS LIVE] Sending CoA-Request for ${request.username}`);
    
    const attributes: string[][] = [
      ['User-Name', request.username],
      ...(request.radiusSessionId ? [['Acct-Session-Id', request.radiusSessionId]] : []),
      ...(request.clientIp ? [['Framed-IP-Address', request.clientIp]] : []),
    ];

    try {
      const encoded = radius.encode({
        code: 'CoA-Request',
        secret: config.secret,
        attributes: attributes
      });

      // RADIUS CoA typically uses port 3799
      const coaPort = (config as any).settingsObj?.radiusCoaPort || 3799;
      const response = await this.sendUdpPacket(encoded, coaPort);
      const decoded = radius.decode({ packet: response, secret: config.secret });
      
      console.log(`[RADIUS LIVE] Received ${decoded.code}`);
      return decoded.code === 'CoA-ACK';
    } catch (error: any) {
      console.error('[RADIUS LIVE] Error in CoA-Request:', error.message);
      return false;
    }
  }

  async accounting(request: AccountingRequest): Promise<boolean> {
    const config = await this.getActiveConfig();
    console.log(`[RADIUS LIVE] Sending Accounting-Request (${request.statusType}) for ${request.username}`);
    
    // Status types in RADIUS: Start (1), Stop (2), Interim-Update (3)
    let statusTypeValue = 1;
    if (request.statusType === 'Stop') statusTypeValue = 2;
    if (request.statusType === 'Interim-Update') statusTypeValue = 3;

    const attributes: string[][] = [
      ['User-Name', request.username],
      ['Acct-Status-Type', statusTypeValue.toString()],
      ['Acct-Session-Id', request.radiusSessionId],
      ...(request.clientIp ? [['Framed-IP-Address', request.clientIp]] : []),
      ...(request.clientMac ? [['Calling-Station-Id', request.clientMac]] : []),
    ];

    try {
      const encoded = radius.encode({
        code: 'Accounting-Request',
        secret: config.secret,
        attributes: attributes
      });

      // RADIUS Accounting uses port 1813 by default
      const response = await this.sendUdpPacket(encoded, config.acctPort || 1813);
      const decoded = radius.decode({ packet: response, secret: config.secret });
      
      console.log(`[RADIUS LIVE] Received ${decoded.code}`);
      return decoded.code === 'Accounting-Response';
    } catch (error: any) {
      console.error('[RADIUS LIVE] Error in Accounting:', error.message);
      return false;
    }
  }

  async getStatus(): Promise<'ONLINE' | 'OFFLINE' | 'MOCK'> {
    // Attempt a dummy Access-Request to check status
    try {
      const config = await this.getActiveConfig();
      const encoded = radius.encode({
        code: 'Access-Request',
        secret: config.secret,
        attributes: [['User-Name', 'dummy']]
      });
      // Ping the auth port
      await this.sendUdpPacket(encoded, config.port);
      return 'ONLINE';
    } catch (e) {
      return 'OFFLINE';
    }
  }
}
