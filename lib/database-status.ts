import { createClient } from "@/lib/supabase"

export interface TableInfo {
  name: string
  exists: boolean
  description: string
}

export const requiredTables: TableInfo[] = [
  { name: "profiles", exists: false, description: "User profile information" },
  { name: "content", exists: false, description: "Creator content and campaigns" },
  { name: "share_links", exists: false, description: "Trackable share links" },
  { name: "share_clicks", exists: false, description: "Click tracking data" },
  { name: "user_points", exists: false, description: "User point balances" },
  { name: "point_transactions", exists: false, description: "Point transaction history" },
]

export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from(tableName).select("*").limit(1)

    return !error
  } catch {
    return false
  }
}

export async function checkAllTables(): Promise<TableInfo[]> {
  const results = await Promise.all(
    requiredTables.map(async (table) => ({
      ...table,
      exists: await checkTableExists(table.name),
    })),
  )

  return results
}

export function checkEnvironmentVariables() {
  return {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}
