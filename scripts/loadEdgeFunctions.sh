#!/usr/bin/env bash
# Publish local Edge Functions to the Supabase project.
# Reads SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_DB_URL
# from config/supabase.local.properties. Does not print those values.

set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
properties="$root/config/supabase.local.properties"
functions_dir="$root/supabase/functions"
config_file="$root/supabase/config.toml"

if [[ ! -f "$properties" ]]; then
  echo "Missing config/supabase.local.properties" >&2
  exit 1
fi

read_property() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" "$properties" | tail -n 1 || true)"
  if [[ -z "$line" ]]; then
    echo "Missing ${key} in config/supabase.local.properties" >&2
    exit 1
  fi
  printf '%s' "${line#*=}"
}

supabase_url="$(read_property SUPABASE_URL)"
service_role_key="$(read_property SUPABASE_SERVICE_ROLE_KEY)"
database_url="$(read_property SUPABASE_DB_URL)"
access_token="$(grep -E '^SUPABASE_ACCESS_TOKEN=' "$properties" | tail -n 1 || true)"
access_token="${access_token#SUPABASE_ACCESS_TOKEN=}"
if [[ -z "$access_token" && -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  access_token="$SUPABASE_ACCESS_TOKEN"
fi

supabase_url="${supabase_url%/}"
host="${supabase_url#https://}"
host="${host#http://}"
host="${host%%/*}"
project_ref="${host%%.*}"

if [[ "$supabase_url" != https://*.supabase.co || ${#service_role_key} -lt 20 || "$database_url" != postgresql://* ]]; then
  echo "The properties file does not have a project URL, service role key, and database URL." >&2
  exit 1
fi

if [[ ! "$access_token" =~ ^sbp_(oauth_|v0_)?[a-f0-9]{40}$ ]]; then
  echo "Function upload needs a Supabase personal access token." >&2
  echo "The service role key is rejected by the deploy API (JWT failed verification)." >&2
  echo "Add SUPABASE_ACCESS_TOKEN to config/supabase.local.properties, then run this script again." >&2
  exit 1
fi

if ! db_error="$(PGSSLMODE=require psql "$database_url" -v ON_ERROR_STOP=1 -q -tAc 'select 1' 2>&1)"; then
  printf '%s\n' "$db_error" | sed -E 's#://[^@/ ]+@#://***@#g' >&2
  echo "Database connection failed. Edge Functions were not uploaded." >&2
  exit 1
fi

verify_jwt_for() {
  local slug="$1"
  local value
  value="$(awk -v slug="$slug" '
    $0 ~ "^\\[functions\\." slug "\\]" { in_block = 1; next }
    in_block && /^\[/ { in_block = 0 }
    in_block && /^verify_jwt[[:space:]]*=/ {
      split($0, parts, "=")
      gsub(/[[:space:]]/, "", parts[2])
      print parts[2]
      exit
    }
  ' "$config_file")"
  if [[ "$value" == "false" ]]; then
    printf 'false'
  else
    printf 'true'
  fi
}

upload_function() {
  local slug="$1"
  local function_dir="$functions_dir/$slug"
  local verify_jwt metadata response_file http_status
  verify_jwt="$(verify_jwt_for "$slug")"
  metadata="$(printf '{"entrypoint_path":"index.ts","name":"%s","verify_jwt":%s}' "$slug" "$verify_jwt")"
  response_file="$(mktemp)"

  local -a form=(-F "metadata=${metadata};type=application/json")
  local file relative
  while IFS= read -r -d '' file; do
    relative="${file#"$function_dir"/}"
    form+=(-F "file=@${file};filename=${relative};type=application/typescript")
  done < <(find "$function_dir" -type f ! -name '.DS_Store' -print0)

  # The deploy API stores uploaded files under source/. An import of
  # ./_shared/file.ts then resolves to source/_shared/file.ts.
  if grep -R -q -E '\./_shared/' "$function_dir" --include='*.ts'; then
    local shared_root="$functions_dir/_shared"
    while IFS= read -r -d '' file; do
      relative="_shared/${file#"$shared_root"/}"
      form+=(-F "file=@${file};filename=${relative};type=application/typescript")
    done < <(find "$shared_root" -type f ! -name '.DS_Store' -print0)
  fi

  http_status="$(
    curl --silent --show-error --output "$response_file" --write-out '%{http_code}' \
      --request POST \
      --header "Authorization: Bearer ${access_token}" \
      --header "User-Agent: joova-load-edge-functions" \
      "${form[@]}" \
      "https://api.supabase.com/v1/projects/${project_ref}/functions/deploy?slug=${slug}"
  )"

  if [[ "$http_status" != "201" && "$http_status" != "200" ]]; then
    echo "Upload failed for ${slug} (${http_status})." >&2
    sed -E 's/eyJ[A-Za-z0-9_-]{8,}/[redacted]/g' "$response_file" >&2
    rm -f "$response_file"
    exit 1
  fi

  rm -f "$response_file"
  echo "Uploaded ${slug}."
}

shopt -s nullglob
uploaded=0
for function_dir in "$functions_dir"/*/; do
  slug="$(basename "$function_dir")"
  if [[ ! -f "$function_dir/index.ts" ]]; then
    continue
  fi
  upload_function "$slug"
  uploaded=$((uploaded + 1))
done

if [[ "$uploaded" -eq 0 ]]; then
  echo "No Edge Functions found in supabase/functions." >&2
  exit 1
fi

echo "Uploaded ${uploaded} Edge Function(s)."
