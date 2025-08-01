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
    }
  ) => Promise<{ data: any; error: any }>
  signIn: (email: string, password: string) => Promise<{ data: { profile: Profile | null }; error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        if (event === "SIGNED_IN") {
          await new Promise((resolve) => setTimeout(resolve, 500))
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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()

      if (error) {
        if (error.code === "PGRST116" || error.message.includes("does not exist")) {
          console.warn("Database tables not set up yet. Please run the setup scripts.")
          setProfile(null)
          return
        }

        if (error.message.includes("infinite recursion")) {
          console.error("RLS policy recursion detected. Database needs to be fixed.")
          setProfile(null)
          return
        }

        if (error.code === "42P01") {
          console.warn("Profiles table does not exist. Please set up the database.")
          setProfile(null)
          return
        }

        if (error.message.includes("multiple") || error.message.includes("JSON object requested")) {
          const { data: firstRow, error: fallbackError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .limit(1)
            .single()

          if (!fallbackError && firstRow) {
            setProfile(firstRow)
            return
          }
        }

        throw error
      }

      if (!data) {
        console.log("No profile found for user, this is expected for new users")
        setProfile(null)
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
    }
  ): Promise<{ data: any; error: any }> => {
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
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            email,
            full_name: `${userData.firstName} ${userData.lastName}`,
            first_name: userData.firstName,
            last_name: userData.lastName,
            username: userData.username,
            user_type: userData.userType,
          })

        if (profileError) {
          console.error("Error inserting profile during sign up:", profileError)
        }
      }

      return { data, error: null }
    } catch (error) {
      console.error("Signup error:", error)
      return { data: null, error }
    }
  }

  const signIn = async (email: string, password: string) => {
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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", signInData.user.id)
        .maybeSingle()

      if (error) {
        if (error.message.includes("multiple") || error.message.includes("JSON object requested")) {
          const { data: firstRow, error: fallbackError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", signInData.user.id)
            .limit(1)
            .single()

          if (fallbackError) throw fallbackError

          setUser(signInData.user)
          setProfile(firstRow)
          setLoading(false)
          return { data: { profile: firstRow }, error: null }
        }

        throw error
      }

      if (!data) {
        const meta = signInData.user.user_metadata as any
        const fullName = meta?.full_name || [meta?.first_name, meta?.last_name].filter(Boolean).join(" ") || null

        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: signInData.user.id,
            email: signInData.user.email!,
            full_name: fullName,
            first_name: meta?.first_name ?? null,
            last_name: meta?.last_name ?? null,
            username: meta?.username ?? null,
            user_type: meta?.user_type ?? "viewer",
          })
          .select()
          .single()

        if (insertError) throw insertError

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
    try {
      await supabase.auth.signOut()
    } finally {
      setUser(null)
      setProfile(null)
      setLoading(false)
    }
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
