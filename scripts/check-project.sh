#!/bin/sh
# Project rules that oxlint cannot express. Each rule: pattern, files, why. Mark a deliberate exception with `lint-ok`.
fail=0
rule() { # name, pattern, grep path args..., message
  name=$1; pat=$2; msg=$3; shift 3
  hits=$(grep -rnE "$pat" "$@" --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v 'lint-ok')
  if [ -n "$hits" ]; then echo "[$name] $msg"; echo "$hits"; echo; fail=1; fi
}

APP='src/modules src/shared src/components src/showcase src/main.tsx src/router.tsx src/root-route.tsx'

# 1. Themed Chakra components only (Select, Input, Textarea, Checkbox, Switch, Button, Link, Menu). Chakra's *.HiddenInput/HiddenSelect are fine.
rule native '<(select|option|input|textarea|button|a)[ >/]|NativeSelect' "Native element: use the Chakra component (SimpleSelect for selects)." src

# 2. Colors come from theme tokens. Hex belongs in tokens.json, the tenant templates and the mascot.
rule hex '#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b' "Raw hex color: use a theme token (bg=\"surface-raised\", color=\"fg.muted\")." src/modules src/shared src/components src/showcase/App.tsx src/showcase/Showcase.tsx src/main.tsx src/router.tsx src/root-route.tsx

# 3. Env and network go through one place each.
rule env 'import\.meta\.env' "Read env in src/config.ts only." $APP
rule fetch '\bfetch\(' "Call the API through src/shared/api/client.ts." src/modules src/components src/showcase src/main.tsx src/router.tsx src/root-route.tsx src/shared/auth src/shared/ui src/shared/api/query.ts src/shared/api/errors.ts

# 4. No escape hatches around the design system.
rule important '!important' "No !important: fix the token or recipe instead." $APP
rule inline-style 'style=\{\{' "No inline style: use style props or a token." $APP

# 5. Secrets never ride in VITE_ variables.
rule vite-secret 'VITE_[A-Z_]*(SECRET|PASSWORD|PRIVATE|TOKEN)' "VITE_* is public in the bundle." src .env.example Dockerfile .github

# 6. Customer-facing text never names internal systems or the tech stack.
hits=$(grep -rniE 'zitadel|postgres|fastapi|core-api|traefik|kubernetes|flux|VITE_|/v1/|\.env|stack ?trace' src/locales | grep -v 'lint-ok')
if [ -n "$hits" ]; then echo "[internal-names] Locale text must not name backend systems, endpoints or env vars."; echo "$hits"; echo; fail=1; fi

# 7. Imports: the @/ alias, never ../ ; shared knows no module; modules depend one way and meet only through each other's index.
rule relative "from '\.\./" "Use the @/ alias instead of a parent-relative import." src
rule shared-modules "@/modules/" "src/shared must not import from modules." src/shared
for m in auth workspaces members projects datasets training; do
  case $m in
    auth) banned='workspaces|members|projects|datasets|training' ;;
    workspaces) banned='members|projects|datasets|training' ;;
    members) banned='projects|datasets|training' ;;
    projects) banned='datasets|training' ;;
    datasets) banned='members|training' ;;
    training) banned='members' ;;
  esac
  for o in auth workspaces members projects datasets training; do
    [ "$o" = "$m" ] && continue
    rule "deep-$m-$o" "@/modules/$o/" "Import another module through its index: '@/modules/$o'." src/modules/$m
  done
  [ -n "$banned" ] && rule "direction-$m" "@/modules/($banned)['/]" "$m imports a module outside its allowed dependency direction." src/modules/$m
done

# 8. Icons come from pixelarticons only.
rule icons "from '(react-icons|@chakra-ui/icons|@heroicons|@mui/icons-material|@phosphor-icons|lucide-react)" "Use pixelarticons/react for icons." src

# 9. The app is bilingual, so e2e never selects or asserts by visible text.
rule e2e-text 'getByText|getByLabel|getByPlaceholder|getByTitle|toHaveText|toContainText|getByRole\([^)]*name' "e2e asserts by data-testid, never by text." e2e

exit $fail
