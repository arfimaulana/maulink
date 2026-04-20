import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBSzEwGjOdSJE6lM1ItMyngr11nsSi35eg",
  authDomain: "maulink-68893.firebaseapp.com",
  projectId: "maulink-68893",
  storageBucket: "maulink-68893.firebasestorage.app",
  messagingSenderId: "795496677869",
  appId: "1:795496677869:web:a7a65702701dc3e51527e4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
