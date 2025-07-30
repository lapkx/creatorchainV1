import { supabase } from "./supabase"

export class NotificationService {
  static async getNotifications(
    userId: string,
    limit = 50,
  ): Promise<{
    data: any[] | null
    error: string | null
  }> {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error("Error getting notifications:", error)
      return { data: null, error: "Failed to get notifications" }
    }
  }

  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error marking notification as read:", error)
      return false
    }
  }

  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      return false
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error("Error getting unread count:", error)
      return 0
    }
  }
}
