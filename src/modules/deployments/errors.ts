import { ApiError } from '@/shared/api/client';
import { errorKey } from '@/shared/api/errors';
import { ProblemCode } from '@/modules/deployments/constants';

const BY_CODE: Record<ProblemCode, string> = {
  [ProblemCode.NotDeployable]: 'deployments.error.notDeployable',
  [ProblemCode.DeployRisk]: 'deployments.error.risk',
  [ProblemCode.TooManyDeployments]: 'deployments.error.tooMany',
  [ProblemCode.DeploymentExists]: 'deployments.error.exists',
  [ProblemCode.IdempotencyMismatch]: 'deployments.error.keyReused',
  [ProblemCode.InvalidTransition]: 'deployments.error.invalidTransition',
  [ProblemCode.NotActive]: 'deployments.error.notActive',
  [ProblemCode.Stopped]: 'deployments.error.stopped',
  [ProblemCode.NoServableModel]: 'deployments.error.noModel',
  [ProblemCode.BodyTooLarge]: 'deployments.error.tooLarge',
  [ProblemCode.BodyNotJson]: 'deployments.error.notJson',
  [ProblemCode.BodyNotObject]: 'deployments.error.notObject',
  [ProblemCode.ModelRejectedInput]: 'deployments.error.rejected',
  [ProblemCode.UpstreamError]: 'deployments.error.upstream',
  [ProblemCode.UpstreamTimeout]: 'deployments.error.timeout',
  [ProblemCode.RateLimited]: 'deployments.error.rateLimited',
  [ProblemCode.TooManyInflight]: 'deployments.error.rateLimited',
};

const isCode = (code: string | undefined): code is ProblemCode => code !== undefined && code in BY_CODE;

/** Locale key for a deployment error: the problem `code` first (server text is never shown), then the app-wide fallbacks. */
export function deploymentErrorKey(e: unknown): string {
  if (e instanceof ApiError && isCode(e.code)) return BY_CODE[e.code];
  return errorKey(e);
}

export const isNotFound = (e: unknown) => e instanceof ApiError && e.status === 404;
/** The run has no test split: the deploy goes through only once the person accepts that its scores are unchecked. */
export const isRisk = (e: unknown) => e instanceof ApiError && e.code === ProblemCode.DeployRisk;
