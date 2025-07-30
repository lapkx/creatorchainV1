"use client"

import type React from "react"

import { createContent } from "@/app/actions/content"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Plus, Trash2, Zap, Youtube, Instagram, Music, Gift, Trophy } from "lucide-react"

export default function NewContentPage() {
  const router = useRouter()
  const [rewards, setRewards] = useState([
    { id: 1, type: "physical", title: "", description: "", sharesRequired: 100, quantity: 1 },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addReward = () => {
    setRewards([
      ...rewards,
      {
        id: Date.now(),
        type: "physical",
        title: "",
        description: "",
        sharesRequired: 100,
        quantity: 1,
      },
    ])
  }

  const removeReward = (id: number) => {
    setRewards(rewards.filter((reward) => reward.id !== id))
  }

  const updateReward = (id: number, field: string, value: any) => {
    setRewards(rewards.map((reward) => (reward.id === id ? { ...reward, [field]: value } : reward)))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append("rewards", JSON.stringify(rewards))

    const result = await createContent(formData)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
    } else {
      router.push("/creator/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/creator/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                CreatorChain
              </span>
            </div>
            <Badge variant="secondary">Add New Content</Badge>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">Save Draft</Button>
            <Button>Publish Content</Button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Add New Content</h1>
          <p className="text-gray-600">Create a new reward campaign for your content</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          {/* Content Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gift className="w-5 h-5" />
                <span>Content Information</span>
              </CardTitle>
              <CardDescription>Basic information about your content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Content Title</Label>
                  <Input id="title" name="title" placeholder="e.g., How to Master Social Media Marketing" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select name="platform">
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">
                        <div className="flex items-center space-x-2">
                          <Youtube className="w-4 h-4 text-red-600" />
                          <span>YouTube</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="instagram">
                        <div className="flex items-center space-x-2">
                          <Instagram className="w-4 h-4 text-pink-600" />
                          <span>Instagram</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="tiktok">
                        <div className="flex items-center space-x-2">
                          <Music className="w-4 h-4 text-black" />
                          <span>TikTok</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Content URL</Label>
                <Input id="url" name="url" placeholder="https://youtube.com/watch?v=..." type="url" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your content and what viewers can expect..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pointsPerShare">Points per Share</Label>
                  <Input id="pointsPerShare" name="pointsPerShare" type="number" placeholder="15" min="1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaignDuration">Campaign Duration (days)</Label>
                  <Input id="campaignDuration" name="campaignDuration" type="number" placeholder="30" min="1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reward System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Reward System</span>
              </CardTitle>
              <CardDescription>Configure rewards that viewers can earn by sharing your content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {rewards.map((reward, index) => (
                <div key={reward.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Reward #{index + 1}</h3>
                    {rewards.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeReward(reward.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Reward Type</Label>
                      <Select value={reward.type} onValueChange={(value) => updateReward(reward.id, "type", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="physical">Physical Prize</SelectItem>
                          <SelectItem value="digital">Digital Reward</SelectItem>
                          <SelectItem value="raffle">Raffle Entry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Shares Required</Label>
                      <Input
                        type="number"
                        value={reward.sharesRequired}
                        onChange={(e) => updateReward(reward.id, "sharesRequired", Number.parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Reward Title</Label>
                    <Input
                      value={reward.title}
                      onChange={(e) => updateReward(reward.id, "title", e.target.value)}
                      placeholder="e.g., iPhone 15 Pro, Exclusive Course Access"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Reward Description</Label>
                    <Textarea
                      value={reward.description}
                      onChange={(e) => updateReward(reward.id, "description", e.target.value)}
                      placeholder="Describe the reward in detail..."
                      rows={2}
                    />
                  </div>

                  {reward.type !== "raffle" && (
                    <div className="space-y-2">
                      <Label>Quantity Available</Label>
                      <Input
                        type="number"
                        value={reward.quantity}
                        onChange={(e) => updateReward(reward.id, "quantity", Number.parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                  )}
                </div>
              ))}

              <Button variant="outline" onClick={addReward} className="w-full bg-transparent">
                <Plus className="w-4 h-4 mr-2" />
                Add Another Reward
              </Button>
            </CardContent>
          </Card>

          {/* Campaign Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
              <CardDescription>Additional settings for your reward campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="autoApprove" name="autoApprove" />
                <Label htmlFor="autoApprove">Auto-approve shares (recommended for faster processing)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="enableRaffle" name="enableRaffle" />
                <Label htmlFor="enableRaffle">Enable raffle system for bonus entries</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="limitPerUser" name="limitPerUser" />
                <Label htmlFor="limitPerUser">Limit one reward per user</Label>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxBudget">Maximum Campaign Budget ($)</Label>
                <Input id="maxBudget" name="maxBudget" type="number" placeholder="1000" min="0" />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" asChild>
              <Link href="/creator/dashboard">Cancel</Link>
            </Button>
            <div className="flex items-center space-x-3">
              <Button type="button" variant="outline">
                Save as Draft
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Launch Campaign"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
