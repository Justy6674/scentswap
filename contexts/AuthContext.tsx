import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { User } from '@/types';
import { db } from '@/lib/database';
import { isAdmin as checkIsAdmin } from '@/lib/admin';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'scentswap_user';

async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function setStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch {
    }
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

async function deleteStorageItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch {
    }
    return;
  }
  return SecureStore.deleteItemAsync(key);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      const storedUser = await getStorageItem(USER_STORAGE_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAdmin(checkIsAdmin(parsedUser.email));
        db.setCurrentUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { user: signedInUser, error } = await db.signIn(email, password);
    if (error) {
      return { error };
    }
    if (signedInUser) {
      setUser(signedInUser);
      setIsAdmin(checkIsAdmin(signedInUser.email));
      await setStorageItem(USER_STORAGE_KEY, JSON.stringify(signedInUser));
    }
    return { error: null };
  }

  async function signUp(email: string, password: string, fullName: string): Promise<{ error: string | null }> {
    const { user: newUser, error } = await db.signUp(email, password, fullName);
    if (error) {
      return { error };
    }
    if (newUser) {
      setUser(newUser);
      setIsAdmin(checkIsAdmin(newUser.email));
      await setStorageItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    }
    return { error: null };
  }

  async function signOut(): Promise<void> {
    await db.signOut();
    setUser(null);
    setIsAdmin(false);
    await deleteStorageItem(USER_STORAGE_KEY);
  }

  async function updateUser(updates: Partial<User>): Promise<{ error: string | null }> {
    if (!user) return { error: 'No user logged in' };
    const updatedUser = await db.updateUser(user.id, updates);
    if (!updatedUser) {
      return { error: 'Failed to update user' };
    }
    setUser(updatedUser);
    await setStorageItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    return { error: null };
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
