"use server"

import { LinkTrackingService } from "@/lib/link-tracking"
import { AntiBotService } from "@/lib/anti-bot"
import { SocialMediaService } from "@/lib/social-media"
import { NotificationService } from "@/lib/notifications"
import { NotificationServerService } from "@/lib/notifications-server"
import { createServerClient } from "@/lib/supabase-server"

export async function generateReferralLink(contentId: string) {
  const supabase = createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  // Validate user is a viewer
  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

  if (!profile || profile.user_type !== "viewer") {
    return { error: "Only viewers can generate referral links" }
  }

  // Anti-bot validation (simplified for now)
  const validation = await AntiBotService.validateUser(user.id, {
    userAgent: "browser",
    ipAddress: "127.0.0.1",
  })

  if (!validation.isValid) {
    return { error: "Account flagged for suspicious activity" }
  }

  const result = await LinkTrackingService.generateReferralLink(contentId, user.id)
  return result
}

export async function recordShare(
  referralLinkId: string,
  platform: string,
  shareData: {
    shareUrl?: string
    shareId?: string
  },
) {
  const supabase = createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  // Check rate limits
  const canShare = await AntiBotService.checkShareRateLimit(user.id)
  if (!canShare) {
    return { error: "Share rate limit exceeded. Please wait before sharing again." }
  }

  // Record the share
  const result = await LinkTrackingService.recordShare(referralLinkId, platform, shareData)

  if (result.success) {
    // For YouTube, extract video ID from URL if not provided
    let videoId = shareData.shareId
    if (platform.toLowerCase() === "youtube" && !videoId && shareData.shareUrl) {
      videoId = SocialMediaService.extractVideoId(shareData.shareUrl)
    }

    if (videoId) {
      // Verify the share asynchronously (delay to allow share to propagate)
      setTimeout(async () => {
        const verification = await SocialMediaService.verifyShare(platform, videoId!, shareData.shareUrl || "")

        if (verification.verified) {
          // Update share as verified
          await supabase
            .from("social_shares")
            .update({
              verified: true,
              engagement_count: verification.engagement || 0,
              verified_at: new Date().toISOString(),
            })
            .eq("referral_link_id", referralLinkId)
            .eq("platform", platform)

          // Award points and notify user
          const { data: referralLink } = await supabase
            .from("referral_links")
            .select(`
              viewer_id,
              content (
                points_per_share,
                title,
                profiles (first_name, last_name)
              )
            `)
            .eq("id", referralLinkId)
            .single()

          if (referralLink) {
            const points = referralLink.content.points_per_share
            const creatorName = `${referralLink.content.profiles.first_name} ${referralLink.content.profiles.last_name}`

            // Update user's shares and points
            await supabase.rpc("increment_user_stats", {
              user_id: referralLink.viewer_id,
              points_to_add: points,
              shares_to_add: 1,
            })

            // Send notification
            await NotificationServerService.notifyShareVerified(referralLink.viewer_id, platform, points)
          }
        }
      }, 10000) // 10 second delay for YouTube API
    }
  }

  return result
}

export async function getContentAnalytics(contentId: string) {
  const supabase = createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  return await LinkTrackingService.getAnalytics(contentId, user.id)
}

export async function getUserNotifications() {
  const supabase = createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  return await NotificationService.getNotifications(user.id)
}

export async function markNotificationRead(notificationId: string) {
  return await NotificationService.markAsRead(notificationId)
}

export async function markAllNotificationsRead() {
  const supabase = createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  return await NotificationService.markAllAsRead(user.id)
}
