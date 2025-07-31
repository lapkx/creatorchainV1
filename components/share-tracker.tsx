"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Youtube, Copy, ExternalLink, CheckCircle } from "lucide-react"
import { recordShare } from "@/app/actions/tracking"

interface ShareTrackerProps {
  referralLinkId: string
  referralLink: string
  contentTitle: string
  platform: string
  pointsPerShare: number
}

export function ShareTracker({
  referralLinkId,
  referralLink,
  contentTitle,
  platform,
  pointsPerShare,
}: ShareTrackerProps) {
  const [shareUrl, setShareUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shareStatus, setShareStatus] = useState<"idle" | "submitted" | "verified">("idle")
  const [error, setError] = useState<string | null>(null)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    // You could add a toast notification here
  }

  const handleShareSubmit = async () => {
    if (!shareUrl.trim()) {
      setError("Please enter a share URL")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await recordShare(referralLinkId, platform, {
        shareUrl: shareUrl.trim(),
      })

      if (result.success) {
        setShareStatus("submitted")
        setShareUrl("")
        // The verification will happen automatically in the background
        setTimeout(() => {
          setShareStatus("verified")
        }, 15000) // Show as verified after 15 seconds (mock)
      } else {
        setError(result.error || "Failed to record share")
      }
    } catch (err) {
      setError("An error occurred while recording your share")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPlatformIcon = () => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return <Youtube className="w-5 h-5 text-red-600" />
      default:
        return <ExternalLink className="w-5 h-5" />
    }
  }

  const getShareInstructions = () => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return "Share this video on YouTube (comment, community post, or description) and paste the URL of your share below:"
      default:
        return "Share this content on the platform and paste the URL of your share below:"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getPlatformIcon()}
          <span>Share & Earn Points</span>
        </CardTitle>
        <CardDescription>
          Earn {pointsPerShare} points by sharing &quot;{contentTitle}&quot;
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Copy referral link */}
        <div className="space-y-2">
          <Label>Step 1: Copy your referral link</Label>
          <div className="flex items-center space-x-2">
            <Input value={referralLink} readOnly className="flex-1" />
            <Button size="sm" onClick={copyToClipboard}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={referralLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Step 2: Share instructions */}
        <div className="space-y-2">
          <Label>Step 2: Share the content</Label>
          <p className="text-sm text-gray-600">{getShareInstructions()}</p>
        </div>

        {/* Step 3: Submit share URL */}
        <div className="space-y-2">
          <Label htmlFor="shareUrl">Step 3: Paste your share URL</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="shareUrl"
              value={shareUrl}
              onChange={(e) => setShareUrl(e.target.value)}
              placeholder={platform === "youtube" ? "https://youtube.com/watch?v=..." : "Paste your share URL here"}
              disabled={shareStatus !== "idle"}
            />
            <Button onClick={handleShareSubmit} disabled={isSubmitting || shareStatus !== "idle"}>
              {isSubmitting ? "Submitting..." : "Submit Share"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Status indicator */}
        {shareStatus !== "idle" && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-blue-50">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">
                {shareStatus === "submitted" ? "Share Submitted!" : "Share Verified!"}
              </p>
              <p className="text-sm text-blue-700">
                {shareStatus === "submitted"
                  ? "We&apos;re verifying your share. You&apos;ll be notified when points are awarded."
                  : `Congratulations! You&apos;ve earned ${pointsPerShare} points.`}
              </p>
            </div>
          </div>
        )}

        {/* Platform-specific tips */}
        {platform.toLowerCase() === "youtube" && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">YouTube Sharing Tips:</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Comment on the video with your referral link</li>
              <li>• Share in a community post (if you have a channel)</li>
              <li>• Add to your video description (if you&apos;re a creator)</li>
              <li>• Share the link on your social media</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
