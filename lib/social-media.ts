interface YouTubeConfig {
  apiKey: string
}

interface YouTubeVideoData {
  title: string
  channelTitle: string
  viewCount: string
  likeCount: string
  commentCount: string
  publishedAt: string
  description: string
}

export class SocialMediaService {
  private static config: YouTubeConfig = {
    apiKey: process.env.YOUTUBE_API_KEY || "",
  }

  static async verifyYouTubeShare(
    videoId: string,
    shareUrl: string,
  ): Promise<{
    verified: boolean
    engagement?: number
    error?: string
    videoData?: YouTubeVideoData
  }> {
    try {
      if (!this.config.apiKey) {
        return {
          verified: false,
          error: "YouTube API not configured. Please add YOUTUBE_API_KEY to environment variables.",
        }
      }

      // Validate video ID format
      if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return { verified: false, error: "Invalid YouTube video ID format" }
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics,snippet&key=${this.config.apiKey}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      )

      if (!response.ok) {
        if (response.status === 403) {
          return { verified: false, error: "YouTube API quota exceeded or invalid API key" }
        }
        if (response.status === 400) {
          return { verified: false, error: "Invalid request to YouTube API" }
        }
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        return { verified: false, error: `YouTube API error: ${data.error.message}` }
      }

      if (!data.items || data.items.length === 0) {
        return { verified: false, error: "Video not found, private, or deleted" }
      }

      const video = data.items[0]
      const stats = video.statistics
      const snippet = video.snippet

      // Check if video is available
      if (!stats || !snippet) {
        return { verified: false, error: "Video statistics not available" }
      }

      // Calculate weighted engagement score
      const viewCount = Number.parseInt(stats.viewCount || "0")
      const likeCount = Number.parseInt(stats.likeCount || "0")
      const commentCount = Number.parseInt(stats.commentCount || "0")

      // Weighted scoring: views + (likes * 10) + (comments * 5)
      const engagement = viewCount + likeCount * 10 + commentCount * 5

      return {
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
      }
    } catch (error) {
      console.error("Error verifying YouTube share:", error)
      return {
        verified: false,
        error: error instanceof Error ? error.message : "Verification failed",
      }
    }
  }

  static async verifyShare(
    platform: string,
    shareId: string,
    shareUrl: string,
  ): Promise<{
    verified: boolean
    engagement?: number
    error?: string
    videoData?: YouTubeVideoData
  }> {
    switch (platform.toLowerCase()) {
      case "youtube":
        return this.verifyYouTubeShare(shareId, shareUrl)
      default:
        // For non-YouTube platforms, return mock verification for now
        return {
          verified: true,
          engagement: Math.floor(Math.random() * 100) + 10,
        }
    }
  }

  static extractVideoId(url: string): string | null {
    if (!url || typeof url !== "string") {
      return null
    }

    // Clean the URL
    url = url.trim()

    // YouTube URL patterns
    const patterns = [
      // Standard watch URL
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      // Short URL
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      // Embed URL
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      // Old format
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      // Mobile URL
      /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      // Gaming URL
      /(?:gaming\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }

  static isValidYouTubeUrl(url: string): boolean {
    return this.extractVideoId(url) !== null
  }

  static getVideoThumbnail(videoId: string, quality: "default" | "medium" | "high" | "maxres" = "medium"): string {
    return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`
  }
}
