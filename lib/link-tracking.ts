import { createServerClient } from "./supabase-server"

export class LinkTrackingService {
  private static generateLinkCode(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  static async generateReferralLink(contentId: string, viewerId: string): Promise<{ link: string; error?: string }> {
    try {
      const serverClient = createServerClient()

      // Check if referral link already exists
      const { data: existing } = await serverClient
        .from("referral_links")
        .select("*")
        .eq("content_id", contentId)
        .eq("viewer_id", viewerId)
        .single()

      if (existing) {
        return { link: existing.full_url }
      }

      // Generate new link code
      const linkCode = this.generateLinkCode()
      const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/share/${linkCode}`

      // Create referral link
      const { data, error } = await serverClient
        .from("referral_links")
        .insert({
          content_id: contentId,
          viewer_id: viewerId,
          link_code: linkCode,
          full_url: fullUrl,
        })
        .select()
        .single()

      if (error) throw error

      return { link: fullUrl }
    } catch (error) {
      console.error("Error generating referral link:", error)
      return { link: "", error: "Failed to generate referral link" }
    }
  }

  static async trackClick(
    linkCode: string,
    metadata: {
      ipAddress?: string
      userAgent?: string
      referer?: string
      country?: string
      city?: string
      deviceType?: string
      browser?: string
    },
  ): Promise<{ success: boolean; contentUrl?: string }> {
    try {
      const serverClient = createServerClient()

      // Get referral link
      const { data: referralLink, error: linkError } = await serverClient
        .from("referral_links")
        .select(`
          *,
          content (
            content_url,
            title,
            platform
          )
        `)
        .eq("link_code", linkCode)
        .single()

      if (linkError || !referralLink) {
        return { success: false }
      }

      // Record click
      await serverClient.from("link_clicks").insert({
        referral_link_id: referralLink.id,
        ip_address: metadata.ipAddress,
        user_agent: metadata.userAgent,
        referer: metadata.referer,
        country: metadata.country,
        city: metadata.city,
        device_type: metadata.deviceType,
        browser: metadata.browser,
      })

      // Update click count
      await serverClient
        .from("referral_links")
        .update({
          clicks: referralLink.clicks + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", referralLink.id)

      return {
        success: true,
        contentUrl: referralLink.content.content_url,
      }
    } catch (error) {
      console.error("Error tracking click:", error)
      return { success: false }
    }
  }

  static async recordShare(
    referralLinkId: string,
    platform: string,
    shareData: {
      shareUrl?: string
      shareId?: string
    },
  ): Promise<{ success: boolean }> {
    try {
      const serverClient = createServerClient()

      await serverClient.from("social_shares").insert({
        referral_link_id: referralLinkId,
        platform,
        share_url: shareData.shareUrl,
        share_id: shareData.shareId,
      })

      return { success: true }
    } catch (error) {
      console.error("Error recording share:", error)
      return { success: false }
    }
  }

  static async getAnalytics(contentId: string, creatorId: string) {
    try {
      const serverClient = createServerClient()

      // Verify creator owns content
      const { data: content } = await serverClient
        .from("content")
        .select("id")
        .eq("id", contentId)
        .eq("creator_id", creatorId)
        .single()

      if (!content) {
        throw new Error("Unauthorized")
      }

      // Get referral links with analytics
      const { data: analytics } = await serverClient
        .from("referral_links")
        .select(`
          *,
          profiles (username, first_name, last_name),
          link_clicks (
            id,
            clicked_at,
            country,
            device_type,
            browser
          ),
          social_shares (
            id,
            platform,
            shared_at,
            verified,
            engagement_count
          )
        `)
        .eq("content_id", contentId)

      return { data: analytics, error: null }
    } catch (error) {
      console.error("Error getting analytics:", error)
      return { data: null, error: "Failed to get analytics" }
    }
  }
}
