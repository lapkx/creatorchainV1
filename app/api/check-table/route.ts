import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tableName = searchParams.get("table")

  if (!tableName) {
    return NextResponse.json({ error: "Table name is required" }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase.from(tableName).select("*").limit(1)

    return NextResponse.json({ exists: !error })
  } catch (error) {
    return NextResponse.json({ exists: false, error: error.message })
  }
}
