"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredUserType?: "creator" | "viewer"
  redirectTo?: string
}

export function ProtectedRoute({ children, requiredUserType, redirectTo = "/login" }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo)
        return
      }

      if (requiredUserType && profile?.user_type !== requiredUserType) {
        // Redirect to appropriate dashboard based on user type
        const dashboardPath = profile?.user_type === "creator" ? "/creator/dashboard" : "/viewer/dashboard"
        router.push(dashboardPath)
        return
      }
    }
  }, [user, profile, loading, requiredUserType, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user || (requiredUserType && profile?.user_type !== requiredUserType)) {
    return null
  }

  return <>{children}</>
}
