import { createServerClient } from "./supabase-server"

interface FraudFlags {
  suspiciousIp?: boolean
  rapidClicks?: boolean
  botUserAgent?: boolean
  vpnDetected?: boolean
  duplicateFingerprint?: boolean
}

export class AntiBotService {
  private static readonly SUSPICIOUS_USER_AGENTS = [
    "bot",
    "crawler",
    "spider",
    "scraper",
    "automated",
    "python",
    "curl",
    "wget",
  ]

  private static readonly CLICK_RATE_LIMIT = 10 // clicks per minute
  private static readonly SHARE_RATE_LIMIT = 5 // shares per hour

  static async validateUser(
    userId: string,
    metadata: {
      ipAddress?: string
      userAgent?: string
      fingerprint?: string
    },
  ): Promise<{ isValid: boolean; riskScore: number; flags: FraudFlags }> {
    const flags: FraudFlags = {}
    let riskScore = 0

    try {
      const serverClient = createServerClient()

      // Check user agent for bot patterns
      if (metadata.userAgent) {
        const isBot = this.SUSPICIOUS_USER_AGENTS.some((pattern) => metadata.userAgent!.toLowerCase().includes(pattern))
        if (isBot) {
          flags.botUserAgent = true
          riskScore += 50
        }
      }

      // Check for rapid clicking patterns
      if (metadata.ipAddress) {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()

        const { data: recentClicks } = await serverClient
          .from("link_clicks")
          .select("id")
          .eq("ip_address", metadata.ipAddress)
          .gte("clicked_at", oneMinuteAgo)

        if (recentClicks && recentClicks.length > this.CLICK_RATE_LIMIT) {
          flags.rapidClicks = true
          riskScore += 40
        }

        // Check for suspicious IP patterns (simplified)
        const suspiciousIpPatterns = ["10.0.", "192.168.", "172.16."]
        const isSuspicious = suspiciousIpPatterns.some((pattern) => metadata.ipAddress!.startsWith(pattern))
        if (isSuspicious) {
          flags.suspiciousIp = true
          riskScore += 20
        }
      }

      // Check for duplicate fingerprints
      if (metadata.fingerprint) {
        const { data: duplicateFingerprints } = await serverClient
          .from("fraud_detection")
          .select("id")
          .eq("event_type", "fingerprint_check")
          .contains("flags", { fingerprint: metadata.fingerprint })
          .neq("user_id", userId)

        if (duplicateFingerprints && duplicateFingerprints.length > 0) {
          flags.duplicateFingerprint = true
          riskScore += 30
        }
      }

      // Record fraud detection event
      await serverClient.from("fraud_detection").insert({
        user_id: userId,
        event_type: "user_validation",
        risk_score: riskScore,
        flags,
        ip_address: metadata.ipAddress,
        user_agent: metadata.userAgent,
      })

      const isValid = riskScore < 70 // Threshold for blocking

      return { isValid, riskScore, flags }
    } catch (error) {
      console.error("Error validating user:", error)
      return { isValid: true, riskScore: 0, flags: {} } // Fail open
    }
  }

  static async checkShareRateLimit(userId: string): Promise<boolean> {
    try {
      const serverClient = createServerClient()
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      const { data: recentShares } = await serverClient
        .from("social_shares")
        .select(`
          id,
          referral_links!inner (
            viewer_id
          )
        `)
        .eq("referral_links.viewer_id", userId)
        .gte("shared_at", oneHourAgo)

      return !recentShares || recentShares.length < this.SHARE_RATE_LIMIT
    } catch (error) {
      console.error("Error checking share rate limit:", error)
      return true // Fail open
    }
  }

  static async getFraudScore(userId: string): Promise<number> {
    try {
      const serverClient = createServerClient()
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { data: fraudEvents } = await serverClient
        .from("fraud_detection")
        .select("risk_score")
        .eq("user_id", userId)
        .gte("detected_at", oneDayAgo)

      if (!fraudEvents || fraudEvents.length === 0) return 0

      const averageScore = fraudEvents.reduce((sum, event) => sum + event.risk_score, 0) / fraudEvents.length
      return Math.round(averageScore)
    } catch (error) {
      console.error("Error getting fraud score:", error)
      return 0
    }
  }
}
