import { createServerClient } from "./supabase-server"
import { supabase } from "./supabase"

export interface NotificationData {
  type: "reward_earned" | "milestone_reached" | "share_verified" | "campaign_update"
  title: string
  message: string
  data?: Record<string, any>
}

export class NotificationServerService {
  static async createNotification(userId: string, notification: NotificationData): Promise<boolean> {
    try {
      const serverClient = createServerClient()

      const { error } = await serverClient.from("notifications").insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
      })

      if (error) throw error

      // Send real-time notification via Supabase Realtime
      await this.sendRealtimeNotification(userId, notification)

      return true
    } catch (error) {
      console.error("Error creating notification:", error)
      return false
    }
  }

  static async sendRealtimeNotification(userId: string, notification: NotificationData): Promise<void> {
    try {
      // Send via Supabase Realtime
      const channel = supabase.channel(`notifications:${userId}`)

      channel.send({
        type: "broadcast",
        event: "notification",
        payload: notification,
      })
    } catch (error) {
      console.error("Error sending realtime notification:", error)
    }
  }

  // Notification templates
  static async notifyRewardEarned(userId: string, rewardTitle: string, creatorName: string): Promise<void> {
    await this.createNotification(userId, {
      type: "reward_earned",
      title: "🎉 Reward Earned!",
      message: `Congratulations! You've earned "${rewardTitle}" from ${creatorName}`,
      data: { rewardTitle, creatorName },
    })
  }

  static async notifyMilestoneReached(userId: string, milestone: string, progress: number): Promise<void> {
    await this.createNotification(userId, {
      type: "milestone_reached",
      title: "🏆 Milestone Reached!",
      message: `You've reached ${milestone}! You now have ${progress} total shares.`,
      data: { milestone, progress },
    })
  }

  static async notifyShareVerified(userId: string, platform: string, points: number): Promise<void> {
    await this.createNotification(userId, {
      type: "share_verified",
      title: "✅ Share Verified!",
      message: `Your ${platform} share has been verified. You earned ${points} points!`,
      data: { platform, points },
    })
  }

  static async notifyCampaignUpdate(userId: string, campaignTitle: string, updateMessage: string): Promise<void> {
    await this.createNotification(userId, {
      type: "campaign_update",
      title: "📢 Campaign Update",
      message: `Update for "${campaignTitle}": ${updateMessage}`,
      data: { campaignTitle, updateMessage },
    })
  }
}
