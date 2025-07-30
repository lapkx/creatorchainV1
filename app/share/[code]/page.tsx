import { LinkTrackingService } from "@/lib/link-tracking"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

interface SharePageProps {
  params: {
    code: string
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { code } = params
  const headersList = headers()

  // Get client metadata
  const userAgent = headersList.get("user-agent") || ""
  const referer = headersList.get("referer") || ""
  const forwardedFor = headersList.get("x-forwarded-for") || ""
  const ipAddress = forwardedFor.split(",")[0] || headersList.get("x-real-ip") || ""

  // Simple device/browser detection
  const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? "mobile" : "desktop"
  const browser = userAgent.includes("Chrome")
    ? "chrome"
    : userAgent.includes("Firefox")
      ? "firefox"
      : userAgent.includes("Safari")
        ? "safari"
        : "other"

  // Track the click
  const result = await LinkTrackingService.trackClick(code, {
    ipAddress,
    userAgent,
    referer,
    deviceType,
    browser,
  })

  if (!result.success || !result.contentUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Not Found</h1>
          <p className="text-gray-600 mb-8">This referral link is invalid or has expired.</p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            Go to CreatorChain
          </a>
        </div>
      </div>
    )
  }

  // Redirect to the actual content
  redirect(result.contentUrl)
}
