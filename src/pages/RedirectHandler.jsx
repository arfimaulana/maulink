import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2 } from 'lucide-react';

export default function RedirectHandler() {
  const { shortCode } = useParams();

  useEffect(() => {
    async function executeRedirect() {
      try {
        const shortRef = doc(db, 'shortcodes', shortCode);
        const shortSnap = await getDoc(shortRef);

        if (shortSnap.exists()) {
          const { url, owner, linkId } = shortSnap.data();

          // Attempt to register tracking clicks asynchronously before redirecting
          try {
            await Promise.all([
              updateDoc(shortRef, { clicks: increment(1) }),
              updateDoc(doc(db, 'users', owner, 'links', linkId), { clicks: increment(1) })
            ]);
          } catch (trackingError) {
            console.error("Non-fatal tracking error (likely Firebase rules): ", trackingError);
          }

          window.location.replace(url);
        } else {
          // If the shortlink doesn't exist, fall back to home
          window.location.replace('/');
        }
      } catch (err) {
        console.error("Error fetching shortlink", err);
        window.location.replace('/');
      }
    }

    executeRedirect();
  }, [shortCode]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-slate-500 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <span className="font-medium text-sm">Forwarding to destination...</span>
    </div>
  );
}
