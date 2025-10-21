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
  const { user, isUserLoading: isAuthLoading, userError, firestore } = useFirebase();
  
  const adminDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore as Firestore, 'admins', user.uid);
  }, [user, firestore]);

  const { data: adminData, isLoading: isAdminLoading } = useDoc(adminDocRef);

  const isAdmin = useMemo(() => !!adminData, [adminData]);

  // The overall loading state is true if auth is loading OR if the user is logged in but the admin check is still loading.
  const isUserLoading = isAuthLoading || (user ? isAdminLoading : false);

  return { user, isAdmin, isUserLoading, userError };
};
