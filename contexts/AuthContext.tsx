import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User } from '@/types';
import { db } from '@/lib/database';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'scentswap_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      const storedUser = await SecureStore.getItemAsync(USER_STORAGE_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
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
      await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(signedInUser));
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
      await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(newUser));
    }
    return { error: null };
  }

  async function signOut(): Promise<void> {
    await db.signOut();
    setUser(null);
    await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
  }

  async function updateUser(updates: Partial<User>): Promise<{ error: string | null }> {
    if (!user) return { error: 'No user logged in' };
    const updatedUser = await db.updateUser(user.id, updates);
    if (!updatedUser) {
      return { error: 'Failed to update user' };
    }
    setUser(updatedUser);
    await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    return { error: null };
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, updateUser }}>
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
