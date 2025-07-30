import { createClient } from "@supabase/supabase-js"

interface TableCheck {
  name: string
  exists: boolean
  error?: string
}

export async function checkDatabaseTables(): Promise<TableCheck[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return []
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const tables = ["profiles", "content", "share_links", "share_clicks", "user_points", "notifications"]

  const results: TableCheck[] = []

  for (const tableName of tables) {
    try {
      const { error } = await supabase.from(tableName).select("*").limit(0)
      results.push({
        name: tableName,
        exists: !error,
        error: error?.message,
      })
    } catch (error) {
      results.push({
        name: tableName,
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return results
}

export function checkEnvironmentVariables() {
  const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

  const optionalVars = ["YOUTUBE_API_KEY"]

  const results = {
    required: {} as Record<string, boolean>,
    optional: {} as Record<string, boolean>,
  }

  for (const varName of requiredVars) {
    results.required[varName] = !!process.env[varName]
  }

  for (const varName of optionalVars) {
    results.optional[varName] = !!process.env[varName]
  }

  return results
}
