"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Youtube, CheckCircle, XCircle, Loader2, Eye, ThumbsUp, MessageCircle, ExternalLink, Copy } from "lucide-react"
import { SocialMediaService } from "@/lib/social-media"

interface VideoVerification {
  url: string
  videoId: string | null
  status: "idle" | "verifying" | "verified" | "failed"
  result?: any
  error?: string
}

export function YouTubeVerificationDemo() {
  const [verifications, setVerifications] = useState<VideoVerification[]>([])
  const [newUrl, setNewUrl] = useState("")

  // Sample YouTube URLs for testing
  const sampleUrls = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Rick Astley - Never Gonna Give You Up
    "https://youtu.be/jNQXAC9IVRw", // Me at the zoo (first YouTube video)
    "https://www.youtube.com/watch?v=9bZkp7q19f0", // PSY - GANGNAM STYLE
    "https://www.youtube.com/embed/kJQP7kiw5Fk", // Luis Fonsi - Despacito
  ]

  const addVerification = async (url: string) => {
    const videoId = SocialMediaService.extractVideoId(url)

    const newVerification: VideoVerification = {
      url,
      videoId,
      status: videoId ? "verifying" : "failed",
      error: videoId ? undefined : "Invalid YouTube URL",
    }

    setVerifications((prev) => [newVerification, ...prev])

    if (videoId) {
      try {
        // Call our API route
        const response = await fetch(`/api/youtube/verify?videoId=${videoId}`)
        const result = await response.json()

        setVerifications((prev) =>
          prev.map((v) =>
            v.url === url
              ? {
                  ...v,
                  status: result.verified ? "verified" : "failed",
                  result: result.verified ? result : undefined,
                  error: result.verified ? undefined : result.error,
                }
              : v,
          ),
        )
      } catch (error) {
        setVerifications((prev) =>
          prev.map((v) => (v.url === url ? { ...v, status: "failed", error: "Network error" } : v)),
        )
      }
    }
  }

  const handleAddUrl = () => {
    if (newUrl.trim()) {
      addVerification(newUrl.trim())
      setNewUrl("")
    }
  }

  const handleSampleUrl = (url: string) => {
    addVerification(url)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusIcon = (status: VideoVerification["status"]) => {
    switch (status) {
      case "verifying":
        return <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      case "verified":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Youtube className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: VideoVerification["status"]) => {
    switch (status) {
      case "verifying":
        return "border-blue-200 bg-blue-50"
      case "verified":
        return "border-green-200 bg-green-50"
      case "failed":
        return "border-red-200 bg-red-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New URL */}
      <Card>
        <CardHeader>
          <CardTitle>YouTube Verification Test</CardTitle>
          <CardDescription>Test YouTube video verification with real URLs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              onKeyPress={(e) => e.key === "Enter" && handleAddUrl()}
            />
            <Button onClick={handleAddUrl} disabled={!newUrl.trim()}>
              Test URL
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Quick Test URLs:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sampleUrls.map((url, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSampleUrl(url)}
                  className="justify-start text-xs"
                >
                  <Youtube className="w-3 h-3 mr-2 text-red-600" />
                  {url.length > 40 ? url.substring(0, 40) + "..." : url}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Results */}
      <div className="space-y-4">
        {verifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Youtube className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No verifications yet. Add a YouTube URL above to test.</p>
            </CardContent>
          </Card>
        ) : (
          verifications.map((verification, index) => (
            <Card key={index} className={getStatusColor(verification.status)}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">{getStatusIcon(verification.status)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {verification.status}
                        </Badge>
                        {verification.videoId && (
                          <Badge variant="secondary" className="text-xs font-mono">
                            {verification.videoId}
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(verification.url)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="text-sm text-gray-600 mb-3 break-all">{verification.url}</div>

                    {verification.status === "verifying" && (
                      <div className="space-y-2">
                        <Progress value={undefined} className="h-1" />
                        <p className="text-xs text-blue-600">Verifying with YouTube API...</p>
                      </div>
                    )}

                    {verification.status === "failed" && verification.error && (
                      <Alert className="border-red-200 bg-red-50">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <AlertDescription className="text-red-800">{verification.error}</AlertDescription>
                      </Alert>
                    )}

                    {verification.status === "verified" && verification.result && (
                      <div className="space-y-3">
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <AlertDescription className="text-green-800">Video verified successfully!</AlertDescription>
                        </Alert>

                        {verification.result.videoData && (
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-sm mb-1">{verification.result.videoData.title}</h4>
                              <p className="text-xs text-gray-600">by {verification.result.videoData.channelTitle}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div className="space-y-1">
                                <div className="flex items-center justify-center space-x-1">
                                  <Eye className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs font-medium">Views</span>
                                </div>
                                <p className="text-sm font-bold">
                                  {Number(verification.result.videoData.viewCount).toLocaleString()}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-center space-x-1">
                                  <ThumbsUp className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs font-medium">Likes</span>
                                </div>
                                <p className="text-sm font-bold">
                                  {Number(verification.result.videoData.likeCount).toLocaleString()}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-center space-x-1">
                                  <MessageCircle className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs font-medium">Comments</span>
                                </div>
                                <p className="text-sm font-bold">
                                  {Number(verification.result.videoData.commentCount).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                              <span className="text-sm font-medium">Engagement Score:</span>
                              <span className="text-lg font-bold text-purple-600">
                                {verification.result.engagement?.toLocaleString()}
                              </span>
                            </div>

                            <Button variant="outline" size="sm" asChild className="w-full bg-transparent">
                              <a href={verification.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3 mr-2" />
                                Watch Video
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
