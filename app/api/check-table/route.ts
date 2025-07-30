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
      error: error?.message || null,
    })
  } catch (err) {
    return NextResponse.json({
      table: tableName,
      exists: false,
      error: err instanceof Error ? err.message : "Unknown error",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tables } = await request.json()

    if (!Array.isArray(tables)) {
      return NextResponse.json({ error: "Tables must be an array" }, { status: 400 })
    }

    const results = await Promise.all(
      tables.map(async (tableName: string) => {
        try {
          const { error } = await supabase.from(tableName).select("*").limit(1)

          return {
            table: tableName,
            exists: !error,
            error: error?.message || null,
          }
        } catch (err) {
          return {
            table: tableName,
            exists: false,
            error: err instanceof Error ? err.message : "Unknown error",
          }
        }
      }),
    )

    return NextResponse.json({ results })
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
