const SAMPLE = "YOUR_";

function firstSet(...values: Array<string | undefined>) {
  for (const value of values) {
    const trimmed = value?.trim() ?? "";
    if (trimmed) return trimmed;
  }
  return "";
}

export function supabaseUrl() {
  return firstSet(process.env.VITE_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabaseAnonKey() {
  return firstSet(process.env.VITE_SUPABASE_ANON_KEY, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function portalEnvironmentLabel() {
  const value = firstSet(process.env.VITE_APP_ENV);
  if (!value || /^(prod|production)$/i.test(value)) return "";
  return value;
}

export function isSupabaseConfigured() {
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  return url.startsWith("https://") && !url.includes(SAMPLE) && key.length > 30 && !key.includes(SAMPLE);
}
