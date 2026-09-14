import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { mockDb } from './mockDb.ts';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const DbClient = {
  // Try Firebase, fallback to mock DB if not authenticated or configured
  async getRoom(roomNumber: string, lastName: string) {
    if (!auth.currentUser) return mockDb.rooms.find(r => r.room_number.toUpperCase() === roomNumber && r.patient_last_name.toUpperCase() === lastName);
    const q = query(collection(db, 'rooms'), where('room_number', '==', roomNumber), where('patient_last_name', '==', lastName));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  },
  
  async logAuthAttempt(data: any) {
    if (!auth.currentUser) {
       mockDb.authAttempts.push(data);
       return;
    }
    await addDoc(collection(db, 'authLogs'), data);
  },

  async createWifiSession(data: any) {
    if (!auth.currentUser) {
       mockDb.wifiSessions.push(data);
       return;
    }
    await addDoc(collection(db, 'sessions'), data);
  },

  async getAuthAttemptsByRoom(roomNumber: string) {
    if (!auth.currentUser) return mockDb.authAttempts.filter(a => a.room_number === roomNumber);
    const q = query(collection(db, 'authLogs'), where('room_number', '==', roomNumber));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getActiveSessionsByRoom(roomId: string) {
    if (!auth.currentUser) return mockDb.wifiSessions.filter(s => String(s.room_id) === String(roomId) && s.session_status === 'ACTIVE');
    const q = query(collection(db, 'sessions'), where('room_id', '==', String(roomId)), where('session_status', '==', 'ACTIVE'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getAdmin(username: string) {
    if (!auth.currentUser) return mockDb.adminUsers.find(a => a.username === username);
    const q = query(collection(db, 'admins'), where('username', '==', username));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  },

  async getRooms() {
    if (!auth.currentUser) return mockDb.rooms;
    const snap = await getDocs(collection(db, 'rooms'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async updateRoomStatus(id: string, status: string) {
    if (!auth.currentUser) {
       const room = mockDb.rooms.find(r => String(r.id) === id);
       if (room) room.status = status;
       return;
    }
    await updateDoc(doc(db, 'rooms', id), { status });
  },
  async addRoom(roomData: any) {
    if (!auth.currentUser) {
      const newRoom = {
        id: mockDb.rooms.length > 0 ? Math.max(...mockDb.rooms.map(r => r.id)) + 1 : 1,
        ...roomData
      };
      mockDb.rooms.push(newRoom);
      return newRoom;
    }
    const docRef = await addDoc(collection(db, 'rooms'), roomData);
    return { id: docRef.id, ...roomData };
  },

  async getSessions() {
    if (!auth.currentUser) return mockDb.wifiSessions;
    const snap = await getDocs(collection(db, 'sessions'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getSession(id: string) {
    if (!auth.currentUser) {
      const s = mockDb.wifiSessions.find(s => String(s.id) === id);
      return s ? { id: s.id, ...s } : null;
    }
    const snap = await getDoc(doc(db, 'sessions', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async getAllAuthAttempts() {
    if (!auth.currentUser) return mockDb.authAttempts;
    const snap = await getDocs(collection(db, 'authLogs'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getAllAuditLogs() {
    if (!auth.currentUser) return mockDb.auditLogs;
    const snap = await getDocs(collection(db, 'auditLogs'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async disconnectSession(id: string) {
    if (!auth.currentUser) {
       const session = mockDb.wifiSessions.find(s => String(s.id) === id);
       if (session) session.session_status = 'DISCONNECTED';
       return;
    }
    await updateDoc(doc(db, 'sessions', id), { session_status: 'DISCONNECTED' });
  },

  async logAudit(data: any) {
    if (!auth.currentUser) {
      mockDb.auditLogs.push(data);
      return;
    }
    await addDoc(collection(db, 'auditLogs'), data);
  },
  
  async getSettings() {
    if (!auth.currentUser) return mockDb.settings;
    const snap = await getDoc(doc(db, 'settings', 'global'));
    if (!snap.exists()) return mockDb.settings;
    return snap.data();
  },
  async updateSettings(data: any) {
    if (!auth.currentUser) {
       mockDb.settings = { ...mockDb.settings, ...data };
       return mockDb.settings;
    }
    await updateDoc(doc(db, 'settings', 'global'), data);
    return data;
  },

  async authenticateBackend() {
    if (process.env.FIREBASE_BACKEND_EMAIL && process.env.FIREBASE_BACKEND_PASSWORD) {
       try {
         await signInWithEmailAndPassword(auth, process.env.FIREBASE_BACKEND_EMAIL, process.env.FIREBASE_BACKEND_PASSWORD);
         console.log('Firebase Backend Authenticated');
       } catch (err) {
         console.error('Firebase Backend Auth Failed:', err);
       }
    } else {
       console.log('Firebase credentials not set in environment. Falling back to mock DB.');
    }
  }
};
