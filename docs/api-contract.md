# API contract the customer frontend needs

Every endpoint this frontend calls, or needs before a button can work. It is the list to build core-api against.

- **102 endpoints.** 41 are served by core-api and called for real today: organizations, invitations, search, the catalog, projects and the dashboard (moving a project to another organization answers 501 there for now). 53 are answered by the in-app mock (`src/api/mock/`), which is the executable version of this document. 8 need a system the mock cannot stand in for and are not called yet.
- **Shapes.** The request and response types are in `src/features/<area>/api/types.ts`. They are the contract; this file is the index.
- **Conventions.** snake_case fields, lower-case enum values, ISO 8601 timestamps, numbers with the unit in the name (`size_bytes`, `latency_p95_ms`, `cost_per_day_usd`) and `null` where a value does not apply. Errors answer `{ "detail": "…" }` with 404 for a missing record, 409 for a conflict (taken name, wrong state), 422 for invalid input and 403 for a missing role. A record asked for under the wrong parent is a 404.

The **core-api** column says whether the path exists there today. **live** means the frontend calls core-api for it. "path" means it exists but its response lacks fields the page needs, so the frontend still uses the mock. core-api's own tracker, `core-api/docs/api-progress.md`, has the detail.

## Open questions for the backend

1. **Organization.** The UI has organizations the user switches between, each with a plan, members and billing. core-api's user API has a header-scoped tenant and teams, and tenant routes are admin-only. The contract below assumes an organization is a tenant the user can list and switch.
2. **Account → Team** shows the current organization's members. It uses the organization member endpoints and has none of its own.
3. **API keys** appear under both the account and a project. They are one resource with an optional `project_id`.
4. **Passwords and two-factor** belong to the identity provider in production. `POST /v1/users/me/password` is mocked so that "last changed" is real state; whether it stays an API route is the backend's call.

## Current user

| Endpoint                                   | Used by                                                 | core-api               |
| ------------------------------------------ | ------------------------------------------------------- | ---------------------- |
| `GET /v1/users/me`                         | user menu, profile page                                 | path                   |
| `PATCH /v1/users/me`                       | save profile                                            | path                   |
| `DELETE /v1/users/me/avatar`               | remove photo (button not wired yet)                     | new                    |
| `DELETE /v1/users/me`                      | delete account; 409 while the user owns an organization | new                    |
| `GET /v1/users/me/security`                | password age, 2FA state, SSO connections                | new (`/idps` is close) |
| `POST /v1/users/me/password`               | change password                                         | new                    |
| `GET /v1/users/me/sessions`                | active sessions                                         | new                    |
| `DELETE /v1/users/me/sessions/{id}`        | sign out a session                                      | new                    |
| `GET /v1/users/me/notification-settings`   | notification toggles                                    | new                    |
| `PATCH /v1/users/me/notification-settings` | change toggles, body `{ "<id>": true }`                 | new                    |
| `GET /v1/notifications`                    | header bell                                             | new                    |
| `POST /v1/notifications/read`              | mark all read when the bell opens                       | new                    |
| `GET /v1/api-keys?project_id=`             | account page, project settings                          | new                    |
| `POST /v1/api-keys`                        | generate; the secret is returned once                   | new                    |
| `DELETE /v1/api-keys/{id}`                 | revoke                                                  | new                    |

## Organizations

| Endpoint                                                     | Used by                                                                       | core-api |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------- | -------- |
| `GET /v1/organizations`                                      | switcher, list, every page's current organization                             | **live** |
| `POST /v1/organizations`                                     | create; 409 on a taken slug                                                   | **live** |
| `GET /v1/organizations/{id}`                                 | one organization                                                              | **live** |
| `PATCH /v1/organizations/{id}`                               | name, slug, description, colour, default visibility, require 2FA, domain join | **live** |
| `DELETE /v1/organizations/{id}`                              | delete; owner only                                                            | **live** |
| `POST /v1/organizations/{id}/leave`                          | leave; 409 for the owner                                                      | **live** |
| `POST /v1/organizations/{id}/transfer-ownership`             | body `{ member_id }`; the caller becomes admin                                | **live** |
| `GET /v1/organizations/{id}/members`                         | members page, Account → Team                                                  | **live** |
| `POST /v1/organizations/{id}/invitations`                    | body `{ emails, role }`; 409 past the plan's seats                            | **live** |
| `PATCH /v1/organizations/{id}/members/{member_id}`           | change role                                                                   | **live** |
| `DELETE /v1/organizations/{id}/members/{member_id}`          | remove a member or revoke an invitation                                       | **live** |
| `POST /v1/organizations/{id}/invitations/{member_id}/resend` | resend an invitation                                                          | **live** |
| `GET /v1/invitations`                                        | invitations addressed to the caller                                           | **live** |
| `POST /v1/invitations/{id}/accept`                           | join                                                                          | **live** |
| `POST /v1/invitations/{id}/decline`                          | decline                                                                       | **live** |
| `GET /v1/organizations/{id}/billing`                         | plan, credits, renewal, card; header credits badge                            | new      |
| `GET /v1/organizations/{id}/invoices`                        | invoices                                                                      | new      |
| `GET /v1/search?organization_id=&q=`                         | command palette: projects, runs, deployments                                  | **live** |

Billing and invoices are still mocked. An organization carries its own `summary` (project, member, invitation, running-training and deployment counts, credits used) and its plan `limits`, so a list of organizations is one request. There is no separate summary endpoint.

## Projects

| Endpoint                                              | Used by                                                     | core-api |
| ----------------------------------------------------- | ----------------------------------------------------------- | -------- |
| `GET /v1/projects?organization_id=`                   | list, sidebar, clone candidates                             | **live** |
| `POST /v1/projects`                                   | wizard; 409 on a name taken in the organization             | **live** |
| `GET /v1/projects/{id}`                               | header, overview (pipeline, best model, README)             | **live** |
| `PATCH /v1/projects/{id}`                             | name, description, `readme_markdown`                        | **live** |
| `PATCH /v1/projects/{id}/visibility`                  | visibility                                                  | **live** |
| `POST /v1/projects/{id}/archive`                      | archive; pauses its live deployments (core-api doesn't yet) | **live** |
| `POST /v1/projects/{id}/unarchive`                    | unarchive                                                   | **live** |
| `POST /v1/projects/{id}/transfer`                     | body `{ organization_id }`; core-api answers 501 for now    | **live** |
| `DELETE /v1/projects/{id}`                            | delete with everything inside it                            | **live** |
| `GET /v1/projects/{id}/usage`                         | resource usage card; every period in one answer             | **live** |
| `GET /v1/projects/{id}/members`                       | members card, overview team                                 | **live** |
| `POST /v1/projects/{id}/invitations`                  | body `{ email, role }`                                      | **live** |
| `PUT /v1/projects/{id}/members/{user_id}`             | change role                                                 | **live** |
| `DELETE /v1/projects/{id}/members/{user_id}`          | remove                                                      | **live** |
| `GET /v1/projects/{id}/integrations`                  | GitHub, Slack, webhooks, S3 sync                            | **live** |
| `PUT /v1/projects/{id}/integrations/{integration_id}` | body `{ enabled }`                                          | **live** |

## Datasets, under `/v1/projects/{id}/datasets`

| Endpoint                                          | Used by                                                                                                                  | core-api                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| `GET` (`?status=`)                                | list, training wizard                                                                                                    | path                     |
| `POST`                                            | **live** from the dashboard upload as `?name=`; **mocked** from the project page as a JSON body `{ name, split, files }` | path                     |
| `POST /{dataset_id}/upload-zip`                   | dashboard upload                                                                                                         | **live**                 |
| `POST /{dataset_id}/tabular`                      | dashboard upload                                                                                                         | **live**                 |
| `GET /{dataset_id}`                               | header, status, health checks                                                                                            | new                      |
| `POST /{dataset_id}/import`                       | fill from a bucket, body `{ bucket_uri }`                                                                                | new (`import-hf` exists) |
| `GET /{dataset_id}/preview` (`?label=&split=&q=`) | image and text preview                                                                                                   | path                     |
| `GET /{dataset_id}/statistics`                    | class and split distribution, composition                                                                                | new                      |
| `GET /{dataset_id}/quality`                       | quality findings                                                                                                         | new                      |
| `GET /{dataset_id}/versions`                      | versions tab                                                                                                             | path                     |
| `GET /{dataset_id}/manifest`                      | "Download" on the dataset                                                                                                | path                     |
| `POST /{dataset_id}/reprocess`                    | "Retry processing"                                                                                                       | new                      |

The two forms of `POST` are the one place the frontend calls the same path two ways. When core-api accepts the JSON body, the dashboard upload can move to it and the `?name=` form can go.

## Training runs, under `/v1/projects/{id}/training-runs`

| Endpoint                         | Used by                                           | core-api |
| -------------------------------- | ------------------------------------------------- | -------- |
| `GET`                            | list                                              | path     |
| `POST`                           | start a run; the server names it and estimates it | path     |
| `POST /estimate`                 | wizard time and cost, as the sliders move         | new      |
| `GET /{run_id}`                  | detail                                            | path     |
| `POST /{run_id}/cancel`          | stop; 409 once finished                           | path     |
| `GET /{run_id}/logs` (`?level=`) | logs tab                                          | path     |
| `GET /{run_id}/metrics`          | loss and accuracy charts                          | new      |

A run reports its own live `status`, `progress`, `step`, `epoch` and `eta_seconds`. The frontend polls a running run every second and works nothing out itself.

## Models, under `/v1/projects/{id}/models`

| Endpoint                   | Used by                                                    | core-api |
| -------------------------- | ---------------------------------------------------------- | -------- |
| `GET`                      | list                                                       | path     |
| `GET /{model_id}`          | detail: metrics, versions, per-class accuracy, lineage     | new      |
| `GET /{model_id}/files`    | files tab                                                  | new      |
| `POST /{model_id}/promote` | promote a version; the previous production one is archived | path     |
| `POST /{model_id}/archive` | archive a version                                          | new      |
| `POST /{model_id}/predict` | playground                                                 | new      |

## Deployments, under `/v1/projects/{id}/deployments`

| Endpoint                                 | Used by                                                  | core-api |
| ---------------------------------------- | -------------------------------------------------------- | -------- |
| `GET`                                    | list                                                     | path     |
| `POST`                                   | "Deploy" on a model, body `{ model_id }`                 | path     |
| `GET /{deployment_id}`                   | detail                                                   | path     |
| `PATCH /{deployment_id}`                 | name, pinned or latest, replicas, instance type, scaling | new      |
| `DELETE /{deployment_id}`                | delete                                                   | new      |
| `POST /{deployment_id}/pause`            | pause                                                    | new      |
| `POST /{deployment_id}/resume`           | resume                                                   | new      |
| `POST /{deployment_id}/redeploy`         | redeploy                                                 | new      |
| `GET /{deployment_id}/metrics`           | hourly request volume                                    | new      |
| `GET /{deployment_id}/logs` (`?status=`) | request log                                              | new      |
| `GET /{deployment_id}/api-key`           | masked key, created, last used                           | new      |
| `POST /{deployment_id}/api-key/rotate`   | rotate; the key is returned once                         | new      |
| `POST /{deployment_id}/test`             | "Send request"                                           | path     |

A deployment that is not serving reports `null` for its traffic numbers. The frontend polls a deployment every three seconds while it is `deploying`.

## Catalogs and the dashboard

| Endpoint                                                    | Used by                                   | core-api |
| ----------------------------------------------------------- | ----------------------------------------- | -------- |
| `GET /v1/catalog/task-types`                                | project wizard, project filter            | **live** |
| `GET /v1/catalog/regions`                                   | project wizard                            | **live** |
| `GET /v1/catalog/project-templates?task_type=`              | project wizard                            | **live** |
| `GET /v1/catalog/architectures?task_type=`                  | training wizard                           | **live** |
| `GET /v1/catalog/compute-options?purpose=training\|serving` | training wizard, deployment instance type | **live** |
| `GET /v1/catalog/plans`                                     | create organization                       | **live** |
| `GET /v1/dashboard`                                         | dashboard page                            | **live** |

`GET /v1/dashboard` is missing fields the page shows as placeholders, listed in `src/features/dashboard/placeholders.ts`: metric trends and sparklines, deployment p95 and error rate, and training progress, epoch and ETA.

## Not called yet: needs a system outside the API

These buttons still say "not available". Each needs a route, but the mock has no handler for them.

| Endpoint                                                        | Button                 | Needs                                        |
| --------------------------------------------------------------- | ---------------------- | -------------------------------------------- |
| `POST /v1/users/me/avatar-upload-url`                           | upload photo           | object storage (the path exists in core-api) |
| `POST /v1/users/me/two-factor`                                  | enable 2FA             | identity provider                            |
| `GET /v1/organizations/{id}/invoices/{invoice_id}/download`     | download invoice       | billing provider                             |
| `POST /v1/organizations/{id}/billing/plan`                      | change or upgrade plan | billing provider                             |
| `POST /v1/organizations/{id}/billing/payment-method-session`    | update card            | billing provider                             |
| `GET /v1/projects/{id}/datasets/{dataset_id}/download`          | download dataset       | object storage                               |
| `GET /v1/projects/{id}/models/{model_id}/files/{name}/download` | download model or file | object storage                               |
| `GET /v1/projects/{id}/deployments/{deployment_id}/logs/export` | export request log     | log store                                    |

Signing in and out belong to the identity provider and are not API routes.

## Moving an endpoint from the mock to core-api

1. Make core-api's answer match the type in `src/features/<area>/api/types.ts`.
2. Register the endpoint's handler in `src/api/mock/handlers/<area>.ts` with `retiredRoute(...)` instead of `route(...)`. The app then sends the request to core-api. The mock still answers it under `VITE_API_MOCK=all`, which the e2e suite runs with, and `pnpm contract:export` keeps recording it.
3. If the mock still answers a different call on the same path, pass `{ live: true }` on the endpoint function instead (see `datasetsApi.createDataset`).
4. If still-mocked endpoints sit under the record (a project's datasets under a project), copy the live record into the mock as it arrives (`mirrorToMock`, `src/api/mock/mirror.ts`).
