---
name: deploy-k8s
description: Use when changing the Dockerfile, nginx.conf, build args, env vars, the GitHub workflow, or anything that must match ../k8s.
---

# Build and deploy contract

`.github/workflows/docker-publish.yml`: push builds `ghcr.io/drills-pro/customer-frontend/frontend:<sha>`; on `main` it calls
`drills-pro/k8s/.github/workflows/bump-image.yml` with `app: frontend-user` and the **digest** (`build-push-action` output; a tag alone fails).
That commits the pin to `../k8s/apps/frontend-user/kustomization.yaml`, and Flux rolls it out. Needs repo secret `K8S_REPO_PAT`.

Must stay in sync with `../k8s/apps/frontend-user`:

- nginx listens on **3000** (Deployment, Service, probes hit `/`); SPA fallback `try_files $uri /index.html`.
- Host `app.drills.pro`; its callback and logout URLs are registered in the Zitadel app.
- Pull secret `ghcr-pull`; image path must not change.

New `VITE_*` var: add `ARG` in the Dockerfile, a line in the workflow `build-args`, and `.env.example`. They are public by construction.
Never edit or push `../k8s` unprompted.
