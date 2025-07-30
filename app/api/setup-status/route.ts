import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

interface TableStatus {
  name: string
  exists: boolean
  description: string
}

interface EnvVar {
  name: string
  exists: boolean
  description: string
}

export async function GET() {
  try {
    console.log("Checking setup status...") // Debug log

    // Check environment variables
    const envVars: EnvVar[] = [
      {
        name: "NEXT_PUBLIC_SUPABASE_URL",
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        description: "Supabase project URL",
      },
      {
        name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        description: "Supabase anonymous key",
      },
      {
        name: "SUPABASE_SERVICE_ROLE_KEY",
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        description: "Supabase service role key",
      },
      {
        name: "YOUTUBE_API_KEY",
        exists: !!process.env.YOUTUBE_API_KEY,
        description: "YouTube Data API key (optional)",
      },
    ]

    console.log("Environment variables:", envVars) // Debug log

    // Check database tables
    const tables: TableStatus[] = [
      { name: "profiles", exists: false, description: "User profiles and account information" },
      { name: "content", exists: false, description: "Creator content and campaigns" },
      { name: "share_links", exists: false, description: "Trackable share links" },
      { name: "share_clicks", exists: false, description: "Click tracking and analytics" },
      { name: "user_points", exists: false, description: "Point system and rewards" },
      { name: "notifications", exists: false, description: "User notifications" },
    ]

    // Only check tables if we have the required env vars
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("Checking database tables with service role...") // Debug log

      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      // Check each table
      for (const table of tables) {
        try {
          console.log(`Checking table: ${table.name}`) // Debug log
          const { error } = await supabase.from(table.name).select("*").limit(0)
          table.exists = !error
          console.log(`Table ${table.name}: ${table.exists ? "EXISTS" : "NOT FOUND"}`, error?.message) // Debug log
        } catch (error) {
          console.error(`Error checking table ${table.name}:`, error)
          table.exists = false
        }
      }
    } else {
      console.log("Missing environment variables, skipping table checks") // Debug log
    }

    const result = {
      envVars,
      tables,
    }

    console.log("Final setup status result:", result) // Debug log

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in setup-status API:", error)
    return NextResponse.json(
      {
        error: "Failed to check setup status",
        details: error instanceof Error ? error.message : "Unknown error",
        envVars: [],
        tables: [],
      },
      { status: 500 },
    )
  }
}
