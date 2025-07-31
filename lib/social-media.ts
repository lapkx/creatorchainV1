export class SocialMediaVerifier {
  private static youtubeApiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY

  static async verifyYouTubeShare(url: string): Promise<{
    verified: boolean
    engagement?: number
    data?: {
      title: string
      views: string
      likes: string
      comments: string
      publishedAt: string
    }
    error?: string
  }> {
    try {
      if (!this.youtubeApiKey) {
        return { verified: false, error: "YouTube API key not configured" }
      }

      // Extract video ID from URL
      const videoId = this.extractYouTubeVideoId(url)
      if (!videoId) {
        return { verified: false, error: "Invalid YouTube URL" }
      }

      // Fetch video data from YouTube API
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,statistics&key=${this.youtubeApiKey}`
      )

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.items || data.items.length === 0) {
        return { verified: false, error: "Video not found" }
      }

      const video = data.items[0]
      const snippet = video.snippet
      const stats = video.statistics

      // Calculate engagement score
      const viewCount = parseInt(stats.viewCount || "0")
      const likeCount = parseInt(stats.likeCount || "0")
      const commentCount = parseInt(stats.commentCount || "0")

      const engagement = viewCount > 0 ? 
        Math.round(((likeCount + commentCount) / viewCount) * 10000) / 100 : 0

      return {
        verified: true,
        engagement,
        data: {
          title: snippet.title,
          views: viewCount.toLocaleString(),
          likes: likeCount.toLocaleString(),
          comments: commentCount.toLocaleString(),
          publishedAt: snippet.publishedAt,
        }
      }
    } catch (error) {
      console.error("Error verifying YouTube video:", error)
      return { verified: false, error: "Failed to verify video" }
    }
  }

  private static extractYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return null
  }
}
