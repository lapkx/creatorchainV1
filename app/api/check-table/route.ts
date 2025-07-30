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
      exists: !error,
      table: tableName,
      error: error?.message || null,
    })
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error)
    return NextResponse.json(
      {
        exists: false,
        table: tableName,
        error: "Failed to check table existence",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tables } = await request.json()

    if (!Array.isArray(tables)) {
      return NextResponse.json({ error: "Tables array is required" }, { status: 400 })
    }

    const results = await Promise.all(
      tables.map(async (tableName: string) => {
        try {
          const { error } = await supabase.from(tableName).select("*").limit(1)

          return {
            name: tableName,
            exists: !error,
            error: error?.message || null,
          }
        } catch (error) {
          return {
            name: tableName,
            exists: false,
            error: "Failed to check table",
          }
        }
      }),
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error checking tables:", error)
    return NextResponse.json(
      {
        error: "Failed to check tables",
      },
      { status: 500 },
    )
  }
}
