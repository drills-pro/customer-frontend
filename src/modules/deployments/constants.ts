/** The deployment page's tabs; each id is also its `deployments.detail.tab.*` key. */
export const DEPLOYMENT_TABS = ['integration', 'test'] as const;
export type DeploymentTab = (typeof DEPLOYMENT_TABS)[number];

/** The call snippets `call.ts` builds, in the order the tabs show them; each is also its `deployments.integration.lang.*` key. */
export const SNIPPET_LANGS = ['curl', 'python', 'javascript'] as const;
export type SnippetLang = (typeof SNIPPET_LANGS)[number];

/** Characters of an id shown where the full uuid would crowd the line. */
export const SHORT_ID_LENGTH = 8;
/** How many recent test calls the Test tab lists (the API's default page). */
export const TEST_CALL_LIMIT = 20;
/** Indent of the JSON the Test tab shows. */
export const JSON_INDENT = 2;

/** `code` of a problem+json body. Values mirror core-api (deployments/constants.py). Branch on these, never on the HTTP text. */
export const ProblemCode = {
  NotDeployable: 'not_deployable',
  DeployRisk: 'deploy_risk_unacknowledged',
  TooManyDeployments: 'too_many_deployments',
  DeploymentExists: 'deployment_exists',
  IdempotencyMismatch: 'idempotency_mismatch',
  InvalidTransition: 'invalid_deployment_transition',
  NotActive: 'deployment_not_active',
  Stopped: 'deployment_stopped',
  NoServableModel: 'no_servable_model',
  BodyTooLarge: 'body_too_large',
  BodyNotJson: 'body_not_json',
  BodyNotObject: 'body_not_object',
  ModelRejectedInput: 'model_rejected_input',
  UpstreamError: 'upstream_error',
  UpstreamTimeout: 'upstream_timeout',
  RateLimited: 'rate_limited',
  TooManyInflight: 'too_many_inflight',
} as const;
export type ProblemCode = (typeof ProblemCode)[keyof typeof ProblemCode];
