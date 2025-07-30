"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Users, Gift, Eye, Share2, Trophy, Settings, LogOut, Zap, Youtube, Instagram, Music } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { getCreatorContent } from "@/app/actions/content"
import { NotificationSystem } from "@/components/notification-system"

export default function CreatorDashboard() {
  const { user, profile, signOut } = useAuth()
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (user) {
      fetchContent()
    }
  }, [user])

  const fetchContent = async () => {
    if (!user) return

    const { data, error } = await getCreatorContent(user.id)
    if (data) {
      setContent(data)
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  // Mock data
  const stats = {
    totalContent: 12,
    totalShares: 2847,
    activeViewers: 156,
    rewardsDistributed: 89,
  }

  const recentContent = [
    {
      id: 1,
      title: "How to Master Social Media Marketing in 2024",
      platform: "YouTube",
      shares: 234,
      viewers: 45,
      rewards: 12,
      status: "active",
    },
    {
      id: 2,
      title: "Top 10 Content Creation Tips",
      platform: "Instagram",
      shares: 189,
      viewers: 32,
      rewards: 8,
      status: "active",
    },
    {
      id: 3,
      title: "Building Your Personal Brand",
      platform: "TikTok",
      shares: 156,
      viewers: 28,
      rewards: 6,
      status: "paused",
    },
  ]

  const topViewers = [
    { name: "Sarah Johnson", shares: 45, points: 890, avatar: "/placeholder.svg?height=32&width=32" },
    { name: "Mike Chen", shares: 38, points: 760, avatar: "/placeholder.svg?height=32&width=32" },
    { name: "Emma Davis", shares: 32, points: 640, avatar: "/placeholder.svg?height=32&width=32" },
    { name: "Alex Rodriguez", shares: 29, points: 580, avatar: "/placeholder.svg?height=32&width=32" },
  ]

  return (
    <ProtectedRoute requiredUserType="creator">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  CreatorChain
                </span>
              </Link>
              <Badge variant="secondary">Creator Dashboard</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationSystem />
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
              <Avatar>
                <AvatarImage src={profile?.avatar_url || "/placeholder.svg?height=32&width=32"} />
                <AvatarFallback>
                  {profile?.first_name?.[0]}
                  {profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.first_name}! 👋</h1>
            <p className="text-gray-600">Here's what's happening with your content today.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalContent}</div>
                <p className="text-xs text-muted-foreground">+2 from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalShares.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+12% from last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Viewers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeViewers}</div>
                <p className="text-xs text-muted-foreground">+8 new this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rewards Given</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rewardsDistributed}</div>
                <p className="text-xs text-muted-foreground">$2,340 value</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="viewers">Viewers</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Content */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Recent Content</CardTitle>
                      <CardDescription>Your latest content performance</CardDescription>
                    </div>
                    <Button asChild>
                      <Link href="/creator/content/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Content
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentContent.map((content) => (
                        <div key={content.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                              {content.platform === "YouTube" && <Youtube className="w-5 h-5 text-red-600" />}
                              {content.platform === "Instagram" && <Instagram className="w-5 h-5 text-pink-600" />}
                              {content.platform === "TikTok" && <Music className="w-5 h-5 text-black" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{content.title}</p>
                              <p className="text-xs text-gray-500">{content.platform}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{content.shares} shares</p>
                            <Badge variant={content.status === "active" ? "default" : "secondary"} className="text-xs">
                              {content.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Viewers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Viewers</CardTitle>
                    <CardDescription>Your most active content sharers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topViewers.map((viewer, index) => (
                        <div key={viewer.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold">
                              {index + 1}
                            </div>
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={viewer.avatar || "/placeholder.svg"} />
                              <AvatarFallback>
                                {viewer.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{viewer.name}</p>
                              <p className="text-xs text-gray-500">{viewer.shares}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{viewer.points} pts</p>
                            <Trophy className="w-4 h-4 text-yellow-500 ml-auto" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="content">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Content Management</CardTitle>
                    <CardDescription>Manage your content and reward campaigns</CardDescription>
                  </div>
                  <Button asChild>
                    <Link href="/creator/content/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Content
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentContent.map((content) => (
                      <Card key={content.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                                {content.platform === "YouTube" && <Youtube className="w-6 h-6 text-red-600" />}
                                {content.platform === "Instagram" && <Instagram className="w-6 h-6 text-pink-600" />}
                                {content.platform === "TikTok" && <Music className="w-6 h-6 text-black" />}
                              </div>
                              <div>
                                <h3 className="font-semibold">{content.title}</h3>
                                <p className="text-sm text-gray-500">{content.platform}</p>
                              </div>
                            </div>
                            <Badge variant={content.status === "active" ? "default" : "secondary"}>
                              {content.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">{content.shares}</p>
                              <p className="text-xs text-gray-500">Shares</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">{content.viewers}</p>
                              <p className="text-xs text-gray-500">Active Viewers</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-purple-600">{content.rewards}</p>
                              <p className="text-xs text-gray-500">Rewards Given</p>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              View Analytics
                            </Button>
                            <Button variant="outline" size="sm">
                              {content.status === "active" ? "Pause" : "Activate"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="viewers">
              <Card>
                <CardHeader>
                  <CardTitle>Viewer Management</CardTitle>
                  <CardDescription>Track and manage your active viewers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topViewers.map((viewer, index) => (
                      <Card key={viewer.name}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={viewer.avatar || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {viewer.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">{viewer.name}</h3>
                                <p className="text-sm text-gray-500">Rank #{index + 1}</p>
                              </div>
                            </div>
                            <Trophy className="w-6 h-6 text-yellow-500" />
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-lg font-bold text-blue-600">{viewer.shares}</p>
                              <p className="text-xs text-gray-500">Total Shares</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-purple-600">{viewer.points}</p>
                              <p className="text-xs text-gray-500">Points Earned</p>
                            </div>
                          </div>

                          <Progress value={(viewer.points / 1000) * 100} className="mb-2" />
                          <p className="text-xs text-gray-500">{1000 - viewer.points} points to next reward tier</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rewards">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Reward Management</CardTitle>
                    <CardDescription>Configure and track your reward campaigns</CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Reward
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">iPhone 15 Pro Giveaway</h3>
                            <p className="text-sm text-gray-500">Physical Prize • 500 shares required</p>
                          </div>
                          <Badge>Active</Badge>
                        </div>
                        <Progress value={75} className="mb-2" />
                        <p className="text-xs text-gray-500">3 of 4 prizes remaining</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">Exclusive Course Access</h3>
                            <p className="text-sm text-gray-500">Digital Reward • 100 shares required</p>
                          </div>
                          <Badge variant="secondary">Paused</Badge>
                        </div>
                        <Progress value={45} className="mb-2" />
                        <p className="text-xs text-gray-500">Unlimited prizes available</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">Monthly Raffle Entry</h3>
                            <p className="text-sm text-gray-500">Raffle System • 50 points per ticket</p>
                          </div>
                          <Badge>Active</Badge>
                        </div>
                        <Progress value={90} className="mb-2" />
                        <p className="text-xs text-gray-500">234 tickets submitted this month</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
