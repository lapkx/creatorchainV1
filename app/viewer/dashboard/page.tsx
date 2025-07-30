"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Share2,
  Gift,
  Trophy,
  Copy,
  Settings,
  LogOut,
  Zap,
  Youtube,
  Instagram,
  Music,
  Search,
  Star,
  TrendingUp,
} from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { getViewerContent } from "@/app/actions/content"
import { generateReferralLink } from "@/app/actions/tracking"
import { NotificationSystem } from "@/components/notification-system"
import { ShareTracker } from "@/components/share-tracker"

export default function ViewerDashboard() {
  const { user, profile, signOut, loading: authLoading } = useAuth()
  const [content, setContent] = useState([])
  const [contentLoading, setContentLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")

  const fetchContent = useCallback(async () => {
    const { data, error } = await getViewerContent()
    if (data) {
      setContent(data)
    }
    setContentLoading(false)
  }, [])

  useEffect(() => {
    if (user) {
      fetchContent()
    }
  }, [user, fetchContent])

  const handleSignOut = async () => {
    await signOut()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600" />
      </div>
    )
  }

  // Mock data
  const userStats = {
    totalPoints: 1247,
    totalShares: 89,
    rewardsEarned: 5,
    currentRank: 12,
  }

  const availableContent = [
    {
      id: 1,
      title: "How to Master Social Media Marketing in 2024",
      creator: "John Doe",
      platform: "YouTube",
      pointsPerShare: 15,
      totalShares: 234,
      reward: "iPhone 15 Pro",
      sharesNeeded: 500,
      myShares: 12,
      referralLink: "https://creatorchain.com/ref/abc123",
    },
    {
      id: 2,
      title: "Top 10 Content Creation Tips",
      creator: "Sarah Wilson",
      platform: "Instagram",
      pointsPerShare: 10,
      totalShares: 189,
      reward: "Course Access",
      sharesNeeded: 100,
      myShares: 8,
      referralLink: "https://creatorchain.com/ref/def456",
    },
    {
      id: 3,
      title: "Building Your Personal Brand",
      creator: "Mike Chen",
      platform: "TikTok",
      pointsPerShare: 12,
      totalShares: 156,
      reward: "Raffle Entry",
      sharesNeeded: 50,
      myShares: 25,
      referralLink: "https://creatorchain.com/ref/ghi789",
    },
  ]

  const myRewards = [
    {
      id: 1,
      title: "Exclusive Marketing Course",
      creator: "John Doe",
      earnedDate: "2024-01-15",
      status: "claimed",
      type: "digital",
    },
    {
      id: 2,
      title: "Branded Merchandise",
      creator: "Sarah Wilson",
      earnedDate: "2024-01-10",
      status: "pending",
      type: "physical",
    },
  ]

  const leaderboard = [
    { rank: 1, name: "Alex Rodriguez", points: 2340, shares: 156 },
    { rank: 2, name: "Emma Davis", points: 2180, shares: 145 },
    { rank: 3, name: "Mike Johnson", points: 1890, shares: 126 },
    { rank: 12, name: "You", points: 1247, shares: 89, isCurrentUser: true },
  ]

  const copyToClipboard = async (contentId: string) => {
    const result = await generateReferralLink(contentId)
    if (result.link) {
      navigator.clipboard.writeText(result.link)
      // You could add a toast notification here
    } else if (result.error) {
      console.error("Error generating link:", result.error)
    }
  }

  return (
    <ProtectedRoute requiredUserType="viewer">
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
              <Badge variant="secondary">Viewer Dashboard</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationSystem />
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>JS</AvatarFallback>
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
            <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.first_name}! 🎉</h1>
            <p className="text-gray-600">Keep sharing and earning rewards from your favorite creators.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{userStats.totalPoints.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+127 this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{userStats.totalShares}</div>
                <p className="text-xs text-muted-foreground">+8 this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rewards Earned</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{userStats.rewardsEarned}</div>
                <p className="text-xs text-muted-foreground">2 pending claim</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Rank</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">#{userStats.currentRank}</div>
                <p className="text-xs text-muted-foreground">↑ 3 positions</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="content">Available Content</TabsTrigger>
              <TabsTrigger value="rewards">My Rewards</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Campaigns */}
                <Card>
                  <CardHeader>
                    <CardTitle>Active Campaigns</CardTitle>
                    <CardDescription>Content you&apos;re currently promoting</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {availableContent.slice(0, 2).map((content) => (
                        <div key={content.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                                {content.platform === "YouTube" && <Youtube className="w-4 h-4 text-red-600" />}
                                {content.platform === "Instagram" && <Instagram className="w-4 h-4 text-pink-600" />}
                                {content.platform === "TikTok" && <Music className="w-4 h-4 text-black" />}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{content.title}</p>
                                <p className="text-xs text-gray-500">by {content.creator}</p>
                              </div>
                            </div>
                            <Badge variant="outline">{content.myShares} shares</Badge>
                          </div>

                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress to reward</span>
                              <span>
                                {content.myShares}/{content.sharesNeeded}
                              </span>
                            </div>
                            <Progress value={(content.myShares / content.sharesNeeded) * 100} />
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Reward: {content.reward}</span>
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(content.id)}>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy Link
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest shares and rewards</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Gift className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Reward earned!</p>
                          <p className="text-xs text-gray-500">Exclusive Marketing Course</p>
                        </div>
                        <span className="text-xs text-gray-500">2h ago</span>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Share2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">+15 points earned</p>
                          <p className="text-xs text-gray-500">Shared &quot;Social Media Marketing&quot;</p>
                        </div>
                        <span className="text-xs text-gray-500">5h ago</span>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Rank improved!</p>
                          <p className="text-xs text-gray-500">Moved up to #12</p>
                        </div>
                        <span className="text-xs text-gray-500">1d ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="content">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Available Content</CardTitle>
                    <CardDescription>Discover content to share and earn rewards</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input placeholder="Search content..." className="pl-10 w-64" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {availableContent.map((content) => (
                      <div key={content.id} className="space-y-4">
                        <Card>
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
                                  <p className="text-sm text-gray-500">by {content.creator}</p>
                                </div>
                              </div>
                              <Badge variant="outline">{content.pointsPerShare} pts/share</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-500">My Shares</p>
                                <p className="text-lg font-bold text-blue-600">{content.myShares}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Total Shares</p>
                                <p className="text-lg font-bold text-green-600">{content.totalShares}</p>
                              </div>
                            </div>

                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-2">
                                <span>Progress to {content.reward}</span>
                                <span>
                                  {content.myShares}/{content.sharesNeeded}
                                </span>
                              </div>
                              <Progress value={(content.myShares / content.sharesNeeded) * 100} />
                            </div>
                          </CardContent>
                        </Card>

                        <ShareTracker
                          referralLinkId={`ref_${content.id}`}
                          referralLink={content.referralLink}
                          contentTitle={content.title}
                          platform={content.platform}
                          pointsPerShare={content.pointsPerShare}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rewards">
              <Card>
                <CardHeader>
                  <CardTitle>My Rewards</CardTitle>
                  <CardDescription>Track your earned and pending rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {myRewards.map((reward) => (
                      <Card key={reward.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{reward.title}</h3>
                              <p className="text-sm text-gray-500">from {reward.creator}</p>
                            </div>
                            <Badge variant={reward.status === "claimed" ? "default" : "secondary"}>
                              {reward.status}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Gift className="w-4 h-4 text-purple-600" />
                              <span className="text-sm text-gray-600">
                                {reward.type === "digital" ? "Digital Reward" : "Physical Prize"}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              Earned {new Date(reward.earnedDate).toLocaleDateString()}
                            </span>
                          </div>

                          {reward.status === "pending" && <Button className="w-full mt-3">Claim Reward</Button>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leaderboard">
              <Card>
                <CardHeader>
                  <CardTitle>Leaderboard</CardTitle>
                  <CardDescription>See how you rank against other viewers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leaderboard.map((user) => (
                      <div
                        key={user.rank}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          user.isCurrentUser ? "bg-purple-50 border-purple-200" : "bg-white"
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              user.rank === 1
                                ? "bg-yellow-100 text-yellow-800"
                                : user.rank === 2
                                  ? "bg-gray-100 text-gray-800"
                                  : user.rank === 3
                                    ? "bg-orange-100 text-orange-800"
                                    : user.isCurrentUser
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-gray-50 text-gray-600"
                            }`}
                          >
                            {user.rank}
                          </div>
                          <div>
                            <p className={`font-medium ${user.isCurrentUser ? "text-purple-900" : ""}`}>{user.name}</p>
                            <p className="text-sm text-gray-500">{user.shares} shares</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${user.isCurrentUser ? "text-purple-600" : "text-gray-900"}`}>
                            {user.points.toLocaleString()} pts
                          </p>
                          {user.rank <= 3 && (
                            <Trophy
                              className={`w-4 h-4 ml-auto ${
                                user.rank === 1
                                  ? "text-yellow-500"
                                  : user.rank === 2
                                    ? "text-gray-400"
                                    : "text-orange-400"
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    ))}
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
