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

# Colors come from the tokens in src/styles.css, which switch with the theme.
# A raw palette class (`bg-white`, `text-slate-500`, `bg-emerald-50`) stays the
# same in dark mode, and a `dark:` variant would fork the theme outside the
# tokens. `text-white` is allowed: it sits on user-chosen avatar colors.
# The appearance page is exempt: its swatches depict each theme literally.
PALETTE='(^|[^a-z-])(bg|text|border|border-[trblxy]|ring|ring-offset|divide|outline|from|via|to|fill|stroke)-(white|slate|gray|zinc|neutral|stone|indigo|emerald|amber|rose|red|green|blue|violet|sky|teal|purple|orange|yellow|cyan|pink|fuchsia|lime)(-[0-9]+)?([^a-z0-9-]|$)'

if grep -rnE "$PALETTE" src --include='*.tsx' --include='*.ts' |
  grep -v 'src/routes/_app/account/appearance.tsx' |
  grep -v 'text-white'; then
  echo
  echo "✗ Raw palette color found (see above)."
  echo "  Use a theme token instead, e.g. bg-card, text-muted-foreground, bg-success-muted."
  exit 1
fi

echo "✓ colors use theme tokens"

if grep -rnE "(^|[^a-z-])dark:[a-z[!-]" src --include='*.tsx' --include='*.ts'; then
  echo
  echo "✗ dark: variant found (see above)."
  echo "  Give the token a dark value in src/styles.css instead."
  exit 1
fi

echo "✓ no dark: variants"
