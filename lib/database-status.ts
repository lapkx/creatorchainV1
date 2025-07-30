import { supabase } from "@/lib/supabase"

export interface TableStatus {
  name: string
  exists: boolean
  description: string
}

export const requiredTables: TableStatus[] = [
  { name: "profiles", exists: false, description: "User profiles and account information" },
  { name: "content", exists: false, description: "Creator content and campaigns" },
  { name: "share_links", exists: false, description: "Trackable share links" },
  { name: "share_clicks", exists: false, description: "Click tracking and analytics" },
  { name: "user_points", exists: false, description: "Point system and rewards" },
  { name: "notifications", exists: false, description: "User notifications" },
]

export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select("*").limit(1)

    return !error
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error)
    return false
  }
}

export async function checkAllTables(): Promise<TableStatus[]> {
  const results = await Promise.all(
    requiredTables.map(async (table) => ({
      ...table,
      exists: await checkTableExists(table.name),
    })),
  )

  return results
}

export function checkEnvironmentVariables() {
  const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

  const optionalEnvVars = ["YOUTUBE_API_KEY"]

  const status = {
    required: requiredEnvVars.map((name) => ({
      name,
      exists: !!process.env[name],
      description: getEnvVarDescription(name),
    })),
    optional: optionalEnvVars.map((name) => ({
      name,
      exists: !!process.env[name],
      description: getEnvVarDescription(name),
    })),
  }

  return status
}

function getEnvVarDescription(name: string): string {
  const descriptions: Record<string, string> = {
    NEXT_PUBLIC_SUPABASE_URL: "Supabase project URL",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "Supabase anonymous key",
    SUPABASE_SERVICE_ROLE_KEY: "Supabase service role key",
    YOUTUBE_API_KEY: "YouTube Data API key (optional)",
  }

  return descriptions[name] || "Environment variable"
}
