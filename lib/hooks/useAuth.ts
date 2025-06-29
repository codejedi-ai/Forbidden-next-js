'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth, checkFirebaseConfig } from '../firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!checkFirebaseConfig()) {
      // Demo mode - check for demo user in localStorage
      const demoUser = localStorage.getItem('demoUser')
      if (demoUser) {
        setUser(JSON.parse(demoUser))
      }
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!checkFirebaseConfig()) {
      // Demo mode - accept any email/password
      const demoUser = {
        uid: 'demo-user',
        email,
        emailVerified: true,
      }
      localStorage.setItem('demoUser', JSON.stringify(demoUser))
      setUser(demoUser as User)
      return
    }

    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string) => {
    if (!checkFirebaseConfig()) {
      // Demo mode - accept any email/password
      const demoUser = {
        uid: 'demo-user',
        email,
        emailVerified: true,
      }
      localStorage.setItem('demoUser', JSON.stringify(demoUser))
      setUser(demoUser as User)
      return
    }

    await createUserWithEmailAndPassword(auth, email, password)
  }

  const signOut = async () => {
    if (!checkFirebaseConfig()) {
      // Demo mode
      localStorage.removeItem('demoUser')
      setUser(null)
      return
    }

    await firebaseSignOut(auth)
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
}