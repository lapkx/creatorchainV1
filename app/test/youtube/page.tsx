"use client"

import { YouTubeVerificationDemo } from "@/components/youtube-verification-demo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Youtube, AlertTriangle, CheckCircle } from "lucide-react"

export default function YouTubeTestPage() {
  const isApiConfigured = !!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || !!process.env.YOUTUBE_API_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
            <Youtube className="w-8 h-8 text-red-600" />
            <span>YouTube Verification Test</span>
          </h1>
          <p className="text-gray-600">
            Test the YouTube API integration with real video URLs and see verification results in real-time.
          </p>
        </div>

        {/* Configuration Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuration Status</CardTitle>
            <CardDescription>Check if your environment is properly configured</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Youtube className="w-4 h-4 text-red-600" />
                  <span>YouTube API Key</span>
                </span>
                <Badge variant={isApiConfigured ? "default" : "destructive"}>
                  {isApiConfigured ? "Configured" : "Missing"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>App URL</span>
                <Badge variant={appUrl ? "default" : "secondary"}>{appUrl || "Not set"}</Badge>
              </div>

              {!isApiConfigured && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>YouTube API Key Required:</strong> Get your API key from{" "}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Google Cloud Console
                    </a>{" "}
                    and add it as <code>YOUTUBE_API_KEY</code> in your environment variables.
                  </AlertDescription>
                </Alert>
              )}

              {isApiConfigured && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    YouTube API is configured and ready for testing!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Demo Component */}
        <YouTubeVerificationDemo />

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
            <CardDescription>Follow these steps to test YouTube verification</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click one of the sample YouTube URLs or paste your own</li>
              <li>The system will extract the video ID and verify it with YouTube API</li>
              <li>You'll see real-time verification status and video statistics</li>
              <li>Verified videos show engagement scores calculated from views, likes, and comments</li>
              <li>Failed verifications will show specific error messages</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
