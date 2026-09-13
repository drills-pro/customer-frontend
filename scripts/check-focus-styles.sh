#!/usr/bin/env sh
# Guards the single focus treatment across the shadcn layer.
#
# Canonical focus: outline-hidden focus-visible:ring-2 focus-visible:ring-ring
# Canonical invalid: aria-invalid:border-destructive
#                    aria-invalid:focus-visible:ring-destructive
#
# Why a grep and not a lint rule: `cn` (clsx + tailwind-merge) does NOT merge
# `!`-suffixed classes, so one stray `!` permanently overrides the design system
# and is invisible in review. Likewise a `focus-visible:border-*` reintroduces
# the "border + halo" double ring this layer was cleaned up to remove.
set -e

# Only focus-context rings are constrained:
#  - a base `ring-ring/50` is fine (the slider thumb's decorative hover halo)
#  - `:ring-0` is fine anywhere: zeroing a ring is how an inner element in a
#    composite stands down so the wrapper can own the focus ring.
PATTERN='focus-visible:border-|focus-within:border-|focus-visible:ring-(3|\[3px\])|focus-visible:ring-ring/|focus-visible:ring-(indigo|sky|emerald|rose|amber|violet|slate)|focus-visible:outline-none|focus-within:ring-[1-9]'

if grep -rnE "$PATTERN" src/components/ui src/routes --include='*.tsx'; then
  echo
  echo "✗ Non-canonical focus styling found (see the patterns above)."
  echo "  Use: outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
  exit 1
fi

echo "✓ focus styling is canonical"

# Application code must not reach for `!important` utilities. `cn` cannot merge
# them, so one stray `!` silently wins over every later class, including the
# component variant it was meant to adjust. Fix the cascade instead: use the
# matching variant, or repeat the same modifier so tailwind-merge can merge.
# The shadcn layer (src/components/ui) is exempt; it owns the base styles.
APP_DIRS='src/routes src/components/dashboard src/components/breadcrumbs'

# Trailing form (`text-white!`). A `!` right before a quote or space is never
# valid JS here, so this pass can run over whole files.
TRAILING='[a-z0-9)]!("|[[:space:]]|`)'
# Leading form (`!text-white`). Restricted to class-name lines, because a bare
# `!value` negation is ordinary JS.
LEADING='(className=|class=|cn\().*("|[[:space:]])![a-z-]+("|[[:space:]])'

# shellcheck disable=SC2086
if grep -rnE "$TRAILING" $APP_DIRS --include='*.tsx' ||
  grep -rnE "$LEADING" $APP_DIRS --include='*.tsx'; then
  echo
  echo "✗ Application-level !important utility found (see above)."
  echo "  Use a component variant or the matching modifier instead."
  exit 1
fi

echo "✓ no application-level important utilities"

# There is no supported dark mode: the root forces light and no theme provider
# is mounted, so a `dark:` rule can activate from the OS preference alone and
# paint light-only tokens into a dark variant.
if grep -rn "dark:" src --include='*.tsx' --include='*.ts' --include='*.css'; then
  echo
  echo "✗ Unsupported dark: variant found (see above)."
  echo "  This app ships a light theme only; remove the dark variant."
  exit 1
fi

echo "✓ no unsupported dark variants"
