import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const { currentUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // For public page viewing 
  const [publicUserId, setPublicUserId] = useState(null);
  
  const activeUserId = publicUserId || currentUser?.uid;

  useEffect(() => {
    if (!activeUserId) {
      setProfile(null);
      setLinks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const profileRef = doc(db, 'users', activeUserId);
    const linksRef = collection(db, 'users', activeUserId, 'links');

    const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() });
      } else {
        setProfile({
          name: '',
          subLabel: '',
          avatarUrl: '',
          socials: { instagram: '', facebook: '', x: '', linkedin: '' }
        });
      }
    });

    const unsubscribeLinks = onSnapshot(linksRef, (snapshot) => {
      const linksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by createdAt descending locally or via query. Local is fine for simple lists.
      linksData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setLinks(linksData);
      setLoading(false);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeLinks();
    };
  }, [activeUserId]);

  const updateProfile = async (data) => {
    if (!currentUser) return;
    const ref = doc(db, 'users', currentUser.uid);
    await setDoc(ref, data, { merge: true });
  }

  const addLink = async (data) => {
    if (!currentUser) return;
    const ref = collection(db, 'users', currentUser.uid, 'links');
    await addDoc(ref, { ...data, createdAt: new Date() });
  }

  const updateLink = async (linkId, data) => {
    if (!currentUser) return;
    const ref = doc(db, 'users', currentUser.uid, 'links', linkId);
    await updateDoc(ref, data);
  }

  const deleteLinkItem = async (linkId) => {
    if (!currentUser) return;
    const ref = doc(db, 'users', currentUser.uid, 'links', linkId);
    await deleteDoc(ref);
  }

  const value = {
    profile,
    links,
    loading,
    setPublicUserId,
    updateProfile,
    addLink,
    updateLink,
    deleteLinkItem,
    activeUserId
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
