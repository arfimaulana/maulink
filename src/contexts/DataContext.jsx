import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc, query, limit, getDocs, getDoc } from 'firebase/firestore';
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
    let unsubProfile = null;
    let unsubLinks = null;
    let isMounted = true;

    const loadData = async () => {
      let targetUserId = activeUserId;

      if (!targetUserId) {
        if (!isMounted) return;
        setLoading(true);
        try {
          const defaultQuery = query(collection(db, 'users'), limit(1));
          const snapshot = await getDocs(defaultQuery);
          if (!snapshot.empty && isMounted) {
            targetUserId = snapshot.docs[0].id;
          } else if (isMounted) {
            setProfile(null);
            setLinks([]);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to fetch default public user", e);
          if (isMounted) {
            setProfile(null);
            setLinks([]);
            setLoading(false);
          }
          return;
        }
      }

      if (!isMounted) return;
      setLoading(true);
      
      const profileRef = doc(db, 'users', targetUserId);
      const linksRef = collection(db, 'users', targetUserId, 'links');

      unsubProfile = onSnapshot(profileRef, (docSnap) => {
        if (!isMounted) return;
        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...docSnap.data() });
        } else {
          setProfile(null);
        }
      });

      unsubLinks = onSnapshot(linksRef, (snapshot) => {
        if (!isMounted) return;
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
      });
    };

    loadData();

    return () => {
      isMounted = false;
      if (unsubProfile) unsubProfile();
      if (unsubLinks) unsubLinks();
    };
  }, [activeUserId]);

  const updateProfile = async (data) => {
    if (!currentUser) return;
    const ref = doc(db, 'users', currentUser.uid);
    await setDoc(ref, data, { merge: true });
  }

  const addLink = async (data) => {
    if (!currentUser) return;
    
    let finalCode = data.shortCode;
    if (!finalCode) {
      finalCode = Math.random().toString(36).substring(2, 8); // Auto-generate if blank
    } else {
      finalCode = finalCode.toLowerCase().replace(/[^a-z0-9-]/g, ''); // Sanitize alias
    }

    const shortRef = doc(db, 'shortcodes', finalCode);
    const shortSnap = await getDoc(shortRef);
    if (shortSnap.exists()) {
      throw new Error(`The alias "${finalCode}" is already taken!`);
    }

    const ref = collection(db, 'users', currentUser.uid, 'links');
    const newDoc = await addDoc(ref, { ...data, shortCode: finalCode, clicks: 0, createdAt: new Date() });

    await setDoc(shortRef, {
      url: data.url,
      owner: currentUser.uid,
      linkId: newDoc.id,
      clicks: 0
    });
  }

  const updateLink = async (linkId, data) => {
    if (!currentUser) return;
    const ref = doc(db, 'users', currentUser.uid, 'links', linkId);
    
    // Find existing link states so we can update the mappings dynamically
    const existingLink = links.find(l => l.id === linkId);
    let finalCode = data.shortCode;

    // Check if user is legally trying to change the shortcode to something new
    if (finalCode !== undefined && finalCode !== existingLink.shortCode) {
      if (!finalCode) {
         finalCode = Math.random().toString(36).substring(2, 8);
      } else {
         finalCode = finalCode.toLowerCase().replace(/[^a-z0-9-]/g, '');
      }

      const shortRef = doc(db, 'shortcodes', finalCode);
      const shortSnap = await getDoc(shortRef);
      if (shortSnap.exists()) throw new Error(`The alias "${finalCode}" is already taken!`);

      // Claim new code globally
      await setDoc(shortRef, {
        url: data.url || existingLink.url,
        owner: currentUser.uid,
        linkId: linkId,
        clicks: existingLink.clicks || 0
      });
      data.shortCode = finalCode;

      // Abandon old code globally so others can use it
      if (existingLink.shortCode) {
        await deleteDoc(doc(db, 'shortcodes', existingLink.shortCode));
      }
    } else if (data.url && data.url !== existingLink.url) {
      // Just re-routing existing destination code mapping safely
      if (existingLink.shortCode) {
        await updateDoc(doc(db, 'shortcodes', existingLink.shortCode), { url: data.url });
      }
    }

    await updateDoc(ref, data);
  }

  const deleteLinkItem = async (linkId) => {
    if (!currentUser) return;
    
    const existingLink = links.find(l => l.id === linkId);
    if (existingLink?.shortCode) {
      await deleteDoc(doc(db, 'shortcodes', existingLink.shortCode));
    }

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
