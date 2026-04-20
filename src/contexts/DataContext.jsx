import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc, query, limit, getDocs } from 'firebase/firestore';
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
    let unsubscribeProfile = () => {};
    let unsubscribeLinks = () => {};

    const loadData = async () => {
      let targetUserId = activeUserId;

      // If no specific user is requested, blindly fetch the first user in the database to display at the root domain
      if (!targetUserId) {
        setLoading(true);
        try {
          const defaultQuery = query(collection(db, 'users'), limit(1));
          const snapshot = await getDocs(defaultQuery);
          if (!snapshot.empty) {
            targetUserId = snapshot.docs[0].id;
          } else {
            setProfile(null);
            setLinks([]);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to fetch default public user", e);
          setProfile(null);
          setLinks([]);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      const profileRef = doc(db, 'users', targetUserId);
      const linksRef = collection(db, 'users', targetUserId, 'links');

      unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...docSnap.data() });
        } else {
          setProfile(null);
        }
      }, (error) => {
        console.error("Profile fetch error:", error);
        setProfile(null);
      });

      unsubscribeLinks = onSnapshot(linksRef, (snapshot) => {
        const linksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        linksData.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });
        setLinks(linksData);
        setLoading(false);
      }, (error) => {
        console.error("Links fetch error:", error);
        setLoading(false);
      });
    };

    loadData();

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
