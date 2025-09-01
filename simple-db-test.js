import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

console.log("🔧 Reading environment variables...");

let envContent;
try {
  envContent = readFileSync(".env.local", "utf8");
} catch (error) {
  console.error("❌ Could not read .env.local file:", error.message);
  process.exit(1);
}

const env = {};
envContent.split("\n").forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const [key, ...valueParts] = trimmed.split("=");
    env[key.trim()] = valueParts.join("=").trim();
  }
});

const supabaseUrl = env.SUPABASE_URL || "https://dhlcycjnzwfnadmsptof.supabase.co";
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", supabaseUrl);
console.log("Key:", supabaseKey ? "Found (" + supabaseKey.length + " chars)" : "Missing");

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  try {
    console.log("\n📊 Testing database connection...");
    
    const { data, error } = await supabase
      .from("goals")
      .select("id, title")
      .limit(3);
    
    if (error) {
      console.error("❌ Database error:", error.message);
      return;
    }
    
    console.log("✅ Connection successful!");
    console.log("✅ Found", data.length, "goals in database");
    if (data.length > 0) {
      console.log("📝 Sample goal:", data[0].title);
    }
    
    console.log("\n🎉 Your direct Supabase connection is working!");
    
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  }
}

testDatabase();
