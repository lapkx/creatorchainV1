import { supabase } from "./supabase"

export const requiredTables = ["profiles", "content", "share_links", "share_tracking", "notifications", "user_stats"]

export async function checkDatabaseStatus(): Promise<Record<string, boolean>> {
  const status: Record<string, boolean> = {}

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select("*").limit(0)
      status[table] = !error
    } catch (error) {
      status[table] = false
    }
  }

  return status
}

export function isDatabaseReady(status: Record<string, boolean>): boolean {
  return requiredTables.every((table) => status[table] === true)
}

export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select("*").limit(0)
    return !error
  } catch (error) {
    return false
  }
}
