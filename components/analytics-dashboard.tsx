"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { getContentAnalytics } from "@/app/actions/tracking"
import {
  Eye,
  Share2,
  Users,
  TrendingUp,
  Globe,
  Smartphone,
  Monitor,
  Chrome,
  ChromeIcon as Firefox,
  AppleIcon as Safari,
} from "lucide-react"

interface AnalyticsProps {
  contentId: string
}

export function AnalyticsDashboard({ contentId }: AnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [contentId])

  const loadAnalytics = async () => {
    const { data, error } = await getContentAnalytics(contentId)
    if (data) {
      setAnalytics(processAnalyticsData(data))
    }
    setLoading(false)
  }

  const processAnalyticsData = (rawData: any[]) => {
    const totalClicks = rawData.reduce((sum, link) => sum + link.clicks, 0)
    const totalShares = rawData.reduce((sum, link) => sum + link.social_shares.length, 0)
    const totalViewers = rawData.length

    // Process device data
    const deviceData = rawData
      .flatMap((link) => link.link_clicks)
      .reduce((acc: any, click: any) => {
        const device = click.device_type || "unknown"
        acc[device] = (acc[device] || 0) + 1
        return acc
      }, {})

    // Process browser data
    const browserData = rawData
      .flatMap((link) => link.link_clicks)
      .reduce((acc: any, click: any) => {
        const browser = click.browser || "unknown"
        acc[browser] = (acc[browser] || 0) + 1
        return acc
      }, {})

    // Process geographic data
    const geoData = rawData
      .flatMap((link) => link.link_clicks)
      .reduce((acc: any, click: any) => {
        const country = click.country || "unknown"
        acc[country] = (acc[country] || 0) + 1
        return acc
      }, {})

    // Process platform shares
    const platformData = rawData
      .flatMap((link) => link.social_shares)
      .reduce((acc: any, share: any) => {
        const platform = share.platform
        acc[platform] = (acc[platform] || 0) + 1
        return acc
      }, {})

    // Process time series data (clicks over time)
    const timeSeriesData = rawData
      .flatMap((link) => link.link_clicks)
      .map((click: any) => ({
        date: new Date(click.clicked_at).toLocaleDateString(),
        clicks: 1,
      }))
      .reduce((acc: any, item: any) => {
        const existing = acc.find((d: any) => d.date === item.date)
        if (existing) {
          existing.clicks += 1
        } else {
          acc.push(item)
        }
        return acc
      }, [])
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
      summary: {
        totalClicks,
        totalShares,
        totalViewers,
        conversionRate: totalShares > 0 ? ((totalShares / totalClicks) * 100).toFixed(1) : 0,
      },
      devices: Object.entries(deviceData).map(([name, value]) => ({ name, value })),
      browsers: Object.entries(browserData).map(([name, value]) => ({ name, value })),
      geography: Object.entries(geoData).map(([name, value]) => ({ name, value })),
      platforms: Object.entries(platformData).map(([name, value]) => ({ name, value })),
      timeSeries: timeSeriesData,
      topViewers: rawData
        .map((link) => ({
          name: `${link.profiles.first_name} ${link.profiles.last_name}`,
          username: link.profiles.username,
          clicks: link.clicks,
          shares: link.social_shares.length,
          verified: link.social_shares.filter((s: any) => s.verified).length,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10),
    }
  }

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"]

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case "mobile":
        return <Smartphone className="w-4 h-4" />
      case "desktop":
        return <Monitor className="w-4 h-4" />
      default:
        return <Globe className="w-4 h-4" />
    }
  }

  const getBrowserIcon = (browser: string) => {
    switch (browser.toLowerCase()) {
      case "chrome":
        return <Chrome className="w-4 h-4" />
      case "firefox":
        return <Firefox className="w-4 h-4" />
      case "safari":
        return <Safari className="w-4 h-4" />
      default:
        return <Globe className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No analytics data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.totalShares.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Viewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.totalViewers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Clicks Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="clicks" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.platforms}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.platforms.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.devices.map((device: any) => (
                    <div key={device.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getDeviceIcon(device.name)}
                        <span className="capitalize">{device.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24">
                          <Progress value={(device.value / analytics.summary.totalClicks) * 100} />
                        </div>
                        <span className="text-sm font-medium">{device.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Browsers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.browsers.map((browser: any) => (
                    <div key={browser.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getBrowserIcon(browser.name)}
                        <span className="capitalize">{browser.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24">
                          <Progress value={(browser.value / analytics.summary.totalClicks) * 100} />
                        </div>
                        <span className="text-sm font-medium">{browser.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Viewers</CardTitle>
              <CardDescription>Viewers generating the most engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topViewers.map((viewer: any, index: number) => (
                  <div key={viewer.username} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{viewer.name}</p>
                        <p className="text-sm text-gray-500">@{viewer.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex space-x-4 text-sm">
                        <span>{viewer.clicks} clicks</span>
                        <span>{viewer.shares} shares</span>
                        <Badge variant={viewer.verified > 0 ? "default" : "secondary"}>
                          {viewer.verified} verified
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Where your content is being shared</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.geography.slice(0, 10).map((country: any) => (
                  <div key={country.name} className="flex items-center justify-between">
                    <span className="capitalize">{country.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32">
                        <Progress value={(country.value / analytics.summary.totalClicks) * 100} />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{country.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
