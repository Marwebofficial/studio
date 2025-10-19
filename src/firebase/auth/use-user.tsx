'use client';

import { useMemo } from 'react';
import { useFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, Firestore } from 'firebase/firestore';

export interface UserHookResult {
  user: any | null;
  isAdmin: boolean;
  isUserLoading: boolean;
  userError: Error | null;
}

export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError, firestore } = useFirebase();
  
  const adminDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore as Firestore, 'admins', user.uid);
  }, [user, firestore]);

  const { data: adminData, isLoading: isAdminLoading } = useDoc(adminDocRef);

  const isAdmin = useMemo(() => !!adminData, [adminData]);

  const isLoading = isUserLoading || (user ? isAdminLoading : false);

  return { user, isAdmin, isUserLoading: isLoading, userError };
};
