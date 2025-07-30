import { supabase } from "./supabase"

export async function checkDatabaseStatus(): Promise<Record<string, boolean>> {
  const requiredTables = ["profiles", "content", "rewards", "shares", "viewer_rewards"]

  const status: Record<string, boolean> = {}

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select("*").limit(1)
      status[table] = !error
    } catch (error) {
      status[table] = false
    }
  }

  return status
}

export function isDatabaseReady(status: Record<string, boolean>): boolean {
  return Object.values(status).every(Boolean)
}
