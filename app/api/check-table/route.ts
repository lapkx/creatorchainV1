import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tableName = searchParams.get("table")

  if (!tableName) {
    return NextResponse.json({ error: "Table name is required" }, { status: 400 })
  }

  try {
    const { error } = await supabase.from(tableName).select("*").limit(1)

    return NextResponse.json({
      table: tableName,
      exists: !error,
    })
  } catch (error) {
    return NextResponse.json({
      table: tableName,
      exists: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
