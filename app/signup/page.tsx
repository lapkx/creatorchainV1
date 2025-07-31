"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Zap, Users, Gift } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { signUp, loading } = useAuth()
  const defaultType = searchParams.get("type") || "creator"
  const [userType, setUserType] = useState(defaultType)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const username = formData.get("username") as string

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsSubmitting(false)
      return
    }

    const { data, error } = await signUp(email, password, {
      userType: userType as "creator" | "viewer",
      firstName,
      lastName,
      username,
    })

    if (error) {
      setError(error.message)
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)

    if (data && !data.session) {
      setSuccess("Account created! Please check your email to confirm your account.")
      return
    }

    router.push(userType === "creator" ? "/creator/dashboard" : "/viewer/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              CreatorChain
            </span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Join CreatorChain</h1>
          <p className="text-gray-600">Choose your account type to get started</p>
        </div>

        <Tabs value={userType} onValueChange={setUserType} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="creator" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Creator</span>
            </TabsTrigger>
            <TabsTrigger value="viewer" className="flex items-center space-x-2">
              <Gift className="w-4 h-4" />
              <span>Viewer</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="creator">
            <Card>
              <CardHeader>
                <CardTitle>Create Creator Account</CardTitle>
                <CardDescription>Start rewarding your audience for sharing your content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {success && (
                    <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">{success}</div>
                  )}
                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" name="firstName" placeholder="John" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" name="lastName" placeholder="Doe" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" name="username" placeholder="@johndoe" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" required />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" required />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the{" "}
                      <Link href="/terms" className="text-purple-600 hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-purple-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Creating Account..."
                      : `Create ${userType === "creator" ? "Creator" : "Viewer"} Account`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="viewer">
            <Card>
              <CardHeader>
                <CardTitle>Create Viewer Account</CardTitle>
                <CardDescription>Start earning rewards by sharing your favorite content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {success && (
                    <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">{success}</div>
                  )}
                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="viewerFirstName">First Name</Label>
                      <Input id="viewerFirstName" name="firstName" placeholder="Jane" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="viewerLastName">Last Name</Label>
                      <Input id="viewerLastName" name="lastName" placeholder="Smith" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="viewerEmail">Email</Label>
                    <Input id="viewerEmail" name="email" type="email" placeholder="jane@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="viewerUsername">Username</Label>
                    <Input id="viewerUsername" name="username" placeholder="@janesmith" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="viewerPassword">Password</Label>
                    <Input id="viewerPassword" name="password" type="password" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="viewerConfirmPassword">Confirm Password</Label>
                    <Input id="viewerConfirmPassword" name="confirmPassword" type="password" required />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="viewerTerms" required />
                    <Label htmlFor="viewerTerms" className="text-sm">
                      I agree to the{" "}
                      <Link href="/terms" className="text-purple-600 hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-purple-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Creating Account..."
                      : `Create ${userType === "creator" ? "Creator" : "Viewer"} Account`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
