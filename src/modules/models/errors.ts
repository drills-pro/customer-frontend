import { problemErrorKey } from '@/shared/api/errors';

/** `code` of a problem+json body of the promote route or of a failed promotion (`promotion_error_code`). Values mirror core-api
 * (model_registry/constants.py, and deployments/constants.py for what a deploy refuses with). */
export const ProblemCode = {
  LiveVersion: 'live_version',
  PromotionInProgress: 'promotion_in_progress',
  NotDeployable: 'not_deployable',
  DeployRisk: 'deploy_risk_unacknowledged',
  TooManyDeployments: 'too_many_deployments',
  NoServableModel: 'no_servable_model',
  Stopped: 'deployment_stopped',
  DeploymentExists: 'deployment_exists',
} as const;

const BY_CODE: Record<string, string> = {
  [ProblemCode.LiveVersion]: 'models.error.live',
  [ProblemCode.PromotionInProgress]: 'models.error.inProgress',
  [ProblemCode.NotDeployable]: 'models.error.notDeployable',
  [ProblemCode.DeployRisk]: 'models.error.risk',
  [ProblemCode.TooManyDeployments]: 'models.error.tooMany',
  [ProblemCode.NoServableModel]: 'models.error.noModel',
  [ProblemCode.Stopped]: 'models.error.stopped',
  [ProblemCode.DeploymentExists]: 'models.error.exists',
};

/** Locale key for an error of the promote request: the problem `code` first, then the app-wide fallbacks. */
export const modelErrorKey = problemErrorKey(BY_CODE);

/** Locale key for why a promotion failed, from the `promotion_error_code` on the version (the server's text is never shown). */
export const promotionFailureKey = (code: string | null | undefined) => (code && BY_CODE[code]) || 'models.error.promotionFailed';
