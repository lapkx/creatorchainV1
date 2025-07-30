const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")
const path = require("path")

// Load environment variables
require("dotenv").config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:")
  console.error("- NEXT_PUBLIC_SUPABASE_URL")
  console.error("- SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runSQLFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, "utf8")
    console.log(`Running ${path.basename(filePath)}...`)

    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error(`Error in ${path.basename(filePath)}:`, error)
      return false
    }

    console.log(`✅ ${path.basename(filePath)} completed successfully`)
    return true
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error)
    return false
  }
}

async function setupDatabase() {
  console.log("🚀 Starting database setup...")

  const scriptsDir = path.join(__dirname, "../scripts")
  const sqlFiles = [
    "01-create-tables.sql",
    "02-setup-rls.sql",
    "03-create-functions.sql",
    "04-seed-data.sql",
    "05-link-tracking-system.sql",
    "06-user-stats-function.sql",
    "07-create-user-points-table.sql",
  ]

  for (const file of sqlFiles) {
    const filePath = path.join(scriptsDir, file)
    if (fs.existsSync(filePath)) {
      const success = await runSQLFile(filePath)
      if (!success) {
        console.error(`❌ Setup failed at ${file}`)
        process.exit(1)
      }
    } else {
      console.warn(`⚠️  File not found: ${file}`)
    }
  }

  console.log("✅ Database setup completed successfully!")
  console.log("🎉 Your Creatorchain platform is ready to use!")
}

setupDatabase().catch(console.error)
