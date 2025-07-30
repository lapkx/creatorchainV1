import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get("videoId")

  if (!videoId) {
    return NextResponse.json({ verified: false, error: "Video ID is required" }, { status: 400 })
  }

  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      {
        verified: false,
        error: "YouTube API key not configured. Please add YOUTUBE_API_KEY to your environment variables.",
      },
      { status: 500 },
    )
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics,snippet&key=${apiKey}`,
    )

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({
        verified: false,
        error: "Video not found or is private/deleted",
      })
    }

    const video = data.items[0]
    const stats = video.statistics
    const snippet = video.snippet

    // Calculate engagement score
    const viewCount = Number.parseInt(stats.viewCount || "0")
    const likeCount = Number.parseInt(stats.likeCount || "0")
    const commentCount = Number.parseInt(stats.commentCount || "0")
    const engagement = viewCount + likeCount * 10 + commentCount * 5 // Weighted engagement

    return NextResponse.json({
      verified: true,
      engagement,
      videoData: {
        title: snippet.title,
        channelTitle: snippet.channelTitle,
        viewCount: stats.viewCount || "0",
        likeCount: stats.likeCount || "0",
        commentCount: stats.commentCount || "0",
        publishedAt: snippet.publishedAt,
        description: snippet.description?.substring(0, 200) + "..." || "",
      },
    })
  } catch (error) {
    console.error("YouTube API error:", error)

    return NextResponse.json(
      {
        verified: false,
        error: error instanceof Error ? error.message : "Failed to verify video",
      },
      { status: 500 },
    )
  }
}
