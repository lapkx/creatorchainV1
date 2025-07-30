"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import type { Database } from "./supabase"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    userData: {
      userType: "creator" | "viewer"
      firstName: string
      lastName: string
      username: string
    },
  ) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        // If table doesn't exist, log warning but don't crash
        if (error.code === "PGRST116" || error.message.includes("does not exist")) {
          console.warn("Database tables not set up yet. Please run the setup scripts.")
          setProfile(null)
          setLoading(false)
          return
        }
        throw error
      }
      setProfile(data)
    } catch (error) {
      console.error("Error fetching profile:", error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    userData: {
      userType: "creator" | "viewer"
      firstName: string
      lastName: string
      username: string
    },
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userData.userType,
            first_name: userData.firstName,
            last_name: userData.lastName,
            username: userData.username,
          },
        },
      })

      if (error) throw error

      // Create profile - with error handling for missing table
      if (data.user) {
        try {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            user_type: userData.userType,
            first_name: userData.firstName,
            last_name: userData.lastName,
            username: userData.username,
          })

          if (profileError) {
            if (profileError.message.includes("does not exist")) {
              console.warn("Database tables not set up. User created but profile not saved.")
              return { error: new Error("Database not configured. Please contact support.") }
            }
            throw profileError
          }
        } catch (profileError) {
          console.error("Error creating profile:", profileError)
          return { error: profileError }
        }
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
