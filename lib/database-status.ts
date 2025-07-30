import { supabase } from "@/lib/supabase"

export interface TableStatus {
  name: string
  exists: boolean
  description: string
}

export const requiredTables = [
  { name: "profiles", description: "User profile information" },
  { name: "content", description: "Creator content and campaigns" },
  { name: "share_links", description: "Trackable share links" },
  { name: "share_clicks", description: "Click tracking data" },
  { name: "user_points", description: "User point balances" },
  { name: "point_transactions", description: "Point transaction history" },
]

export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select("*").limit(1)

    return !error
  } catch (err) {
    console.error(`Error checking table ${tableName}:`, err)
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

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar])
  const optional = optionalEnvVars.filter((envVar) => !process.env[envVar])

  return {
    missing,
    optional,
    allRequired: missing.length === 0,
  }
}
