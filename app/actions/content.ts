"use server"

import { createServerClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function createContent(formData: FormData) {
  const supabase = createServerClient()

  // Get the current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const platform = formData.get("platform") as "youtube" | "instagram" | "tiktok"
  const contentUrl = formData.get("contentUrl") as string
  const pointsPerShare = Number.parseInt(formData.get("pointsPerShare") as string)
  const campaignDuration = Number.parseInt(formData.get("campaignDuration") as string)

  try {
    // Create content
    const { data: content, error: contentError } = await supabase
      .from("content")
      .insert({
        creator_id: user.id,
        title,
        description,
        platform,
        content_url: contentUrl,
        points_per_share: pointsPerShare,
        campaign_duration: campaignDuration,
      })
      .select()
      .single()

    if (contentError) throw contentError

    // Create rewards
    const rewardsData = JSON.parse(formData.get("rewards") as string)
    if (rewardsData.length > 0) {
      const rewards = rewardsData.map((reward: any) => ({
        content_id: content.id,
        type: reward.type,
        title: reward.title,
        description: reward.description,
        shares_required: reward.sharesRequired,
        quantity: reward.quantity,
      }))

      const { error: rewardsError } = await supabase.from("rewards").insert(rewards)

      if (rewardsError) throw rewardsError
    }

    revalidatePath("/creator/dashboard")
    return { success: true, contentId: content.id }
  } catch (error) {
    console.error("Error creating content:", error)
    return { error: "Failed to create content" }
  }
}

export async function getCreatorContent(creatorId: string) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("content")
      .select(`
        *,
        rewards (*),
        shares (
          id,
          viewer_id,
          share_count,
          points_earned,
          profiles (username, first_name, last_name)
        )
      `)
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error("Error fetching creator content:", error)
    return { data: null, error: "Failed to fetch content" }
  }
}

export async function getViewerContent() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("content")
      .select(`
        *,
        rewards (*),
        profiles (username, first_name, last_name),
        shares!left (
          share_count,
          points_earned,
          referral_link
        )
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error("Error fetching viewer content:", error)
    return { data: null, error: "Failed to fetch content" }
  }
}
