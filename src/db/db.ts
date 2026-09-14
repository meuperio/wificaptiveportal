import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, addDoc, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const DbClient = {
  async getRoom(roomNumber: string, lastName: string) {
    const q = query(collection(db, 'rooms'), where('room_number', '==', roomNumber), where('patient_last_name', '==', lastName));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() as any } as any;
  },

  async getRoomByNumber(roomNumber: string) {
    const q = query(collection(db, 'rooms'), where('room_number', '==', roomNumber));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() as any } as any;
  },

  async logAuthAttempt(data: any) {
    await addDoc(collection(db, 'authLogs'), data);
  },

  async createWifiSession(data: any) {
    await addDoc(collection(db, 'sessions'), data);
  },

  async getAuthAttemptsByRoom(roomNumber: string) {
    const q = query(collection(db, 'authLogs'), where('room_number', '==', roomNumber));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
  },

  async getActiveSessionsByRoom(roomId: string) {
    const q = query(collection(db, 'sessions'), where('room_id', '==', String(roomId)), where('session_status', '==', 'ACTIVE'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
  },

  async getAdmin(username: string) {
    const q = query(collection(db, 'admins'), where('username', '==', username));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() as any } as any;
  },

  async getAdminById(id: string | number) {
    const q = query(collection(db, 'admins'), where('id', '==', Number(id)));
    const snap = await getDocs(q);
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() as any } as any;
    
    const docSnap = await getDoc(doc(db, 'admins', String(id)));
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() as any } as any;
    return null;
  },

  async getAdmins() {
    const snap = await getDocs(collection(db, 'admins'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
  },

  async addAdmin(adminData: any) {
    const snap = await getDocs(collection(db, 'admins'));
    const nextId = snap.docs.length > 0 ? Math.max(...snap.docs.map(d => (d.data() as any).id || 0)) + 1 : 1;
    const docRef = await addDoc(collection(db, 'admins'), { ...adminData, id: nextId });
    return { id: docRef.id, ...adminData };
  },

  async updateAdmin(id: string | number, data: any) {
    const q = query(collection(db, 'admins'), where('id', '==', Number(id)));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(doc(db, 'admins', snap.docs[0].id), data);
      return;
    }
    await updateDoc(doc(db, 'admins', String(id)), data);
  },

  async deleteAdmin(id: string | number) {
    const q = query(collection(db, 'admins'), where('id', '==', Number(id)));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await deleteDoc(doc(db, 'admins', snap.docs[0].id));
      return;
    }
    await deleteDoc(doc(db, 'admins', String(id)));
  },

  async getRooms() {
    const snap = await getDocs(collection(db, 'rooms'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
  },

  async updateRoom(id: string, data: any) {
    await updateDoc(doc(db, 'rooms', id), data);
  },

  async updateRoomStatus(id: string, status: string) {
    await updateDoc(doc(db, 'rooms', id), { status });
  },

  async addRoom(roomData: any) {
    const docRef = await addDoc(collection(db, 'rooms'), roomData);
    return { id: docRef.id, ...roomData };
  },

  async getSessions() {
    const snap = await getDocs(collection(db, 'sessions'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
  },

  async getSession(id: string) {
    const snap = await getDoc(doc(db, 'sessions', id));
    return snap.exists() ? { id: snap.id, ...snap.data() as any } : null;
  },

  async getAllAuthAttempts() {
    const snap = await getDocs(collection(db, 'authLogs'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
  },

  async getAllAuditLogs() {
    const snap = await getDocs(collection(db, 'auditLogs'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
  },

  async disconnectSession(id: string) {
    await updateDoc(doc(db, 'sessions', id), { session_status: 'DISCONNECTED' });
  },

  async updateSessionAccounting(radiusSessionId: string, data: any) {
    const q = query(collection(db, 'sessions'), where('radius_session_id', '==', radiusSessionId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(doc(db, 'sessions', snap.docs[0].id), data);
    }
  },

  async blockDevice(macAddress: string, reason: string) {
    await addDoc(collection(db, 'blockedDevices'), { mac: macAddress, reason, blocked_at: new Date().toISOString() });
  },

  async isDeviceBlocked(macAddress: string) {
    const q = query(collection(db, 'blockedDevices'), where('mac', '==', macAddress));
    const snap = await getDocs(q);
    return !snap.empty;
  },

  async unblockDevice(macAddress: string) {
    const q = query(collection(db, 'blockedDevices'), where('mac', '==', macAddress));
    const snap = await getDocs(q);
    const deletePromises = snap.docs.map(d => deleteDoc(doc(db, 'blockedDevices', d.id)));
    await Promise.all(deletePromises);
  },

  async logAudit(data: any) {
    await addDoc(collection(db, 'auditLogs'), data);
  },

  async getSettings() {
    const snap = await getDoc(doc(db, 'settings', 'global'));
    if (!snap.exists()) {
      return {
        hospitalName: 'Manila Doctors Hospital',
        portalTitle: 'Patient Wi-Fi Portal',
        termsText: 'By connecting to this network, you agree to our acceptable use policy. This network is monitored.',
        primaryColor: '#005baa',
        radiusSecret: 'testing123',
        radiusCoaPort: 3799,
        bandwidthPolicies: {
          STANDARD: { upKbps: 5120, downKbps: 5120 },
          PREMIUM: { upKbps: 20480, downKbps: 20480 },
          VIP: { upKbps: 51200, downKbps: 102400 }
        }
      };
    }
    return snap.data() as any;
  },

  async updateSettings(data: any) {
    await updateDoc(doc(db, 'settings', 'global'), data);
    return data;
  },
  async purgeOldData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString();
    
    const authLogsSnap = await getDocs(query(collection(db, 'authLogs'), where('timestamp', '<', cutoff)));
    for (const logDoc of authLogsSnap.docs) {
      await deleteDoc(doc(db, 'authLogs', logDoc.id));
    }
    
    const auditLogsSnap = await getDocs(query(collection(db, 'auditLogs'), where('timestamp', '<', cutoff)));
    for (const logDoc of auditLogsSnap.docs) {
      await deleteDoc(doc(db, 'auditLogs', logDoc.id));
    }
    
    return { authLogsDeleted: authLogsSnap.docs.length, auditLogsDeleted: auditLogsSnap.docs.length };
  }

};
