 "use client"



import { createContext, useContext, useState, useEffect, ReactNode } from "react";

import {

    signInAnonymously,

    onAuthStateChanged,

    User,

    createUserWithEmailAndPassword,

    signInWithEmailAndPassword,

    updateProfile,

    signOut

} from "firebase/auth";

import { auth } from "../firebase";



type CurrentUserContextType = {

  currentUser: string | null;

  firebaseUser: User | null;

  loading: boolean;

  isGuest: boolean;

 

  // NEW FUNCTIONS

  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;

  loginWithEmail: (email: string, pass: string) => Promise<void>;

  logout: () => Promise<void>;

};



const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined);



export function CurrentUserProvider({ children }: { children: ReactNode }) {

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);



  const isGuest = firebaseUser ? firebaseUser.isAnonymous : true;

  const currentUser = firebaseUser?.displayName ?? (isGuest ? "Guest User" : "User");



  // 1. REGISTER (Email/Pass + Name)

  const registerWithEmail = async (name: string, email: string, pass: string) => {

    // Create account

    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);

    // Immediately set the Display Name (so the sidebar shows "Blaise" instead of "User")

    await updateProfile(userCredential.user, {

        displayName: name

    });

    // Force local update

    setFirebaseUser({ ...userCredential.user, displayName: name });

  };



  // 2. LOGIN (Email/Pass)

  const loginWithEmail = async (email: string, pass: string) => {

    await signInWithEmailAndPassword(auth, email, pass);

  };



  // 3. LOGOUT

  const logout = async () => {

    await signOut(auth);

    await signInAnonymously(auth);

  };



  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      if (user) {

        setFirebaseUser(user);

      } else {

        setFirebaseUser(null);

        signInAnonymously(auth).catch(console.error);

      }

      setLoading(false);

    });

    return () => unsubscribe();

  }, []);



  return (

    <CurrentUserContext.Provider value={{

        currentUser, firebaseUser, loading, isGuest,

        registerWithEmail, loginWithEmail, logout

    }}>

      {children}

    </CurrentUserContext.Provider>

  );

}



export function useCurrentUser() {

  const context = useContext(CurrentUserContext);

  if (!context) throw new Error("useCurrentUser must be used within a CurrentUserProvider");

  return context;

}