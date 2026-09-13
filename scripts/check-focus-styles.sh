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
