
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { Chat } from '@/lib/types';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';


export function useChats(userId?: string) {
  const firestore = useFirestore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const chatsQuery = useMemoFirebase(() => {
    if (!userId || !firestore) return null;
    const chatsColRef = collection(firestore, 'users', userId, 'chats');
    return query(chatsColRef, orderBy('createdAt', 'desc'));
  }, [userId, firestore]);

  useEffect(() => {
    if (!chatsQuery) {
      setChats([]);
      setIsLoading(!userId);
      return;
    }

    setIsLoading(true);
    
    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const loadedChats: Chat[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                messages: data.messages.map((m: any) => ({...m, createdAt: m.createdAt?.toDate()}))
            } as Chat;
        });
        setChats(loadedChats);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching chats:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [chatsQuery, userId]);

  const addChat = useCallback(async () => {
    if (!userId || !firestore) return null;
    
    const newChatData = {
      createdAt: serverTimestamp(),
      messages: [],
    };

    try {
        const chatsColRef = collection(firestore, 'users', userId, 'chats');
        const docRef = await addDoc(chatsColRef, newChatData);
        // We don't add to local state, we let the snapshot listener handle it
        return { ...newChatData, id: docRef.id, createdAt: new Date() } as Chat;
    } catch (err) {
        console.error("Error adding chat: ", err);
        setError(err as Error);
        return null;
    }
  }, [userId, firestore]);

  const updateChat = useCallback((chatId: string, updates: Partial<Chat>) => {
    if (!userId) return;
    const docRef = doc(firestore, 'users', userId, 'chats', chatId);
    const anupdates: any = { ...updates };
    if (updates.createdAt instanceof Date) {
        anupdates.createdAt = serverTimestamp();
    }
    if (updates.messages) {
        anupdates.messages = updates.messages.map(m => ({ ...m, createdAt: m.createdAt instanceof Date ? m.createdAt : serverTimestamp() }));
    }
    setDocumentNonBlocking(docRef, anupdates, { merge: true });
  }, [userId, firestore]);

  const deleteChat = useCallback((chatId: string) => {
    if (!userId) return;
    const docRef = doc(firestore, 'users', userId, 'chats', chatId);
    deleteDocumentNonBlocking(docRef);
  }, [userId, firestore]);

  return { chats, setChats, isLoading, error, addChat, updateChat, deleteChat };
}
