#!/bin/sh
# Project rules that oxlint cannot express. Each rule: pattern, files, why. Mark a deliberate exception with `lint-ok`.
fail=0
rule() { # name, pattern, grep path args..., message
  name=$1; pat=$2; msg=$3; shift 3
  hits=$(grep -rnE "$pat" "$@" --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v 'lint-ok')
  if [ -n "$hits" ]; then echo "[$name] $msg"; echo "$hits"; echo; fail=1; fi
}

# 1. Themed Chakra components only (Select, Input, Textarea, Checkbox, Switch, Button, Link, Menu). Chakra's *.HiddenInput/HiddenSelect are fine.
rule native '<(select|option|input|textarea|button|a)[ >/]|NativeSelect' "Native element: use the Chakra component (SimpleSelect for selects)." src

# 2. Colors come from theme tokens. Hex belongs in tokens.json, the tenant templates and the mascot.
rule hex '#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b' "Raw hex color: use a theme token (bg=\"surface-raised\", color=\"fg.muted\")." src/app src/components src/demo/App.tsx

# 3. Env and network go through one place each.
rule env 'import\.meta\.env' "Read env in src/app/config.ts only." src/app src/components src/demo
rule fetch '\bfetch\(' "Call the API through src/app/api.ts." src/app src/components src/demo

# 4. No escape hatches around the design system.
rule important '!important' "No !important: fix the token or recipe instead." src/app src/components src/demo
rule inline-style 'style=\{\{' "No inline style: use style props or a token." src/app src/components src/demo

# 5. Secrets never ride in VITE_ variables.
rule vite-secret 'VITE_[A-Z_]*(SECRET|PASSWORD|PRIVATE|TOKEN)' "VITE_* is public in the bundle." src .env.example Dockerfile .github

# 6. Customer-facing text never names internal systems or the tech stack.
hits=$(grep -rniE 'zitadel|postgres|fastapi|core-api|traefik|kubernetes|flux|VITE_|/v1/|\.env|stack ?trace' src/locales | grep -v 'lint-ok')
if [ -n "$hits" ]; then echo "[internal-names] Locale text must not name backend systems, endpoints or env vars."; echo "$hits"; echo; fail=1; fi

# 7. Icons come from lucide-react only.
rule icons "from '(react-icons|@chakra-ui/icons|@heroicons|@mui/icons-material|@phosphor-icons)" "Use lucide-react for icons." src

exit $fail
