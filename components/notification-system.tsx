"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { NotificationService } from "@/lib/notifications"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCheck } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
  data?: Record<string, any>
}

export function NotificationSystem() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!user) return

    // Load initial notifications
    loadNotifications()

    // Subscribe to real-time notifications
    const channel = supabase.channel(`notifications:${user.id}`)

    channel
      .on("broadcast", { event: "notification" }, (payload) => {
        // Add new notification to the list
        const newNotification = {
          id: Date.now().toString(), // Temporary ID
          type: payload.payload.type,
          title: payload.payload.title,
          message: payload.payload.message,
          read: false,
          created_at: new Date().toISOString(),
          data: payload.payload.data,
        }

        setNotifications((prev) => [newNotification, ...prev])
        setUnreadCount((prev) => prev + 1)

        // Show browser notification if permission granted
        if (Notification.permission === "granted") {
          new Notification(payload.payload.title, {
            body: payload.payload.message,
            icon: "/favicon.ico",
          })
        }
      })
      .subscribe()

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission()
    }

    return () => {
      channel.unsubscribe()
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return

    const { data } = await NotificationService.getNotifications(user.id)
    if (data) {
      setNotifications(data)
      const unread = data.filter((n) => !n.read).length
      setUnreadCount(unread)
    }
  }

  const markAsRead = async (notificationId: string) => {
    await NotificationService.markAsRead(notificationId)
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await NotificationService.markAllAsRead(user!.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reward_earned":
        return "🎉"
      case "milestone_reached":
        return "🏆"
      case "share_verified":
        return "✅"
      case "campaign_update":
        return "📢"
      default:
        return "🔔"
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (!user) return null

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No notifications yet</div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!notification.read ? "bg-blue-50" : ""}`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{notification.title}</p>
                      {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full ml-2" />}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{formatTimeAgo(notification.created_at)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 10 && (
          <div className="p-4 border-t text-center">
            <Button variant="ghost" size="sm" className="text-xs">
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
