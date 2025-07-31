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
  signIn: (email: string, password:string) => Promise<{ data: { profile: Profile | null }; error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
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
        // Small delay to ensure session is fully established
        if (event === 'SIGNED_IN') {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
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
      setLoading(true)

      // Use maybeSingle to handle 0 or 1 rows gracefully
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()

      if (error) {
        // Handle specific error cases
        if (error.code === "PGRST116" || error.message.includes("does not exist")) {
          console.warn("Database tables not set up yet. Please run the setup scripts.")
          setProfile(null)
          setLoading(false)
          return
        }

        if (error.message.includes("infinite recursion")) {
          console.error("RLS policy recursion detected. Database needs to be fixed.")
          setProfile(null)
          setLoading(false)
          return
        }

        if (error.code === "42P01") {
          console.warn("Profiles table does not exist. Please set up the database.")
          setProfile(null)
          setLoading(false)
          return
        }

        // Handle multiple rows error - try to get first row as fallback
        if (error.message.includes("multiple") || error.message.includes("JSON object requested")) {
          console.warn("Multiple profile rows found for user. Using first row as fallback.")
          try {
            const { data: firstRow, error: fallbackError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userId)
              .limit(1)
              .single()

            if (!fallbackError && firstRow) {
              setProfile(firstRow)
              setLoading(false)
              return
            }
          } catch (fallbackError) {
            console.error("Fallback query also failed:", fallbackError)
          }
        }

        throw error
      }

      // Handle case where no profile exists (data is null)
      if (!data) {
        console.log("No profile found for user, this is expected for new users")
        setProfile(null)
        setLoading(false)
        return
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

      if (data.user) {
        // Ensure a profile record exists for the new user in case
        // the database trigger hasn't been set up. Use full_name to
        // remain compatible with older database schemas.
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            email,
            full_name: `${userData.firstName} ${userData.lastName}`,
            user_type: userData.userType,
          })
        if (profileError) {
          console.error("Error inserting profile during sign up:", profileError)
        }
      }

      return { error: null }
    } catch (error) {
      console.error("Signup error:", error)
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setLoading(false)
      return { data: { profile: null }, error: signInError }
    }

    if (!signInData.user) {
      setLoading(false)
      return { data: { profile: null }, error: new Error("Authentication succeeded but user not found.") }
    }

    try {
      // Use maybeSingle to handle 0 or 1 rows gracefully
      const { data, error } = await supabase.from("profiles").select("*").eq("id", signInData.user.id).maybeSingle()

      if (error) {
        // Handle multiple rows error - try to get first row as fallback
        if (error.message.includes("multiple") || error.message.includes("JSON object requested")) {
          console.warn("Multiple profile rows found for user. Using first row as fallback.")
          const { data: firstRow, error: fallbackError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", signInData.user.id)
            .limit(1)
            .single()

          if (fallbackError) {
            throw fallbackError
          }

          setUser(signInData.user)
          setProfile(firstRow)
          setLoading(false)
          return { data: { profile: firstRow }, error: null }
        }
        throw error
      }

      if (!data) {
        // No profile exists for this user, create one from auth metadata
        const meta = signInData.user.user_metadata as any
        const fullName =
          meta?.full_name ||
          [meta?.first_name, meta?.last_name].filter(Boolean).join(" ") ||
          null
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: signInData.user.id,
            email: signInData.user.email!,
            full_name: fullName,
            user_type: meta?.user_type ?? "viewer",
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        setUser(signInData.user)
        setProfile(newProfile)
        setLoading(false)
        return { data: { profile: newProfile }, error: null }
      }

      setUser(signInData.user)
      setProfile(data)
      setLoading(false)
      return { data: { profile: data }, error: null }
    } catch (error) {
      console.error("Error fetching profile after sign in:", error)
      setLoading(false)
      return { data: { profile: null }, error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error }
    } catch (error) {
      return { error }
    }
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
        resetPassword,
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
