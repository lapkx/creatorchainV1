import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tableName = searchParams.get("table")

  if (!tableName) {
    return NextResponse.json({ error: "Table name is required" }, { status: 400 })
  }

  try {
    // Try to query the table with a limit of 0 to check if it exists
    const { error } = await supabase.from(tableName).select("*").limit(0)

    return NextResponse.json({
      exists: !error,
      table: tableName,
      error: error?.message || null,
    })
  } catch (error) {
    return NextResponse.json({
      exists: false,
      table: tableName,
      error: "Failed to check table existence",
    })
  }
}
