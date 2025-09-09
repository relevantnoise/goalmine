export default async function handler(req, res) {
  // List available environment variables (safely, without exposing values)
  const envVars = Object.keys(process.env)
    .filter(key => key.includes('SUPABASE') || key.includes('VITE'))
    .map(key => ({
      name: key,
      exists: !!process.env[key],
      length: process.env[key] ? process.env[key].length : 0
    }));
  
  return res.status(200).json({ 
    envVars,
    timestamp: new Date().toISOString()
  });
}