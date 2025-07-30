import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tableName = searchParams.get("table")

  if (!tableName) {
    return NextResponse.json({ error: "Table name is required" }, { status: 400 })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Missing Supabase environment variables" }, { status: 500 })
  }

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { error } = await supabase.from(tableName).select("*").limit(0)

    return NextResponse.json({
      table: tableName,
      exists: !error,
      error: error?.message || null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        table: tableName,
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
