/**
 * Request and response shapes for models, as the API sends them:
 * snake_case fields, lower-case enums and ISO timestamp strings.
 */

export type ApiModelStage = 'production' | 'staging' | 'archived'

/** One trained model version. `resnet50` v1, v2 and v3 are three of these. */
export type ApiModel = {
  id: string
  project_id: string
  /** Shared across versions. */
  name: string
  version: number
  architecture: string
  framework: string
  /** The training run this version came out of. */
  run_id: string
  /** Percent, e.g. `94.2`. */
  accuracy: number
  /** Macro F1, e.g. `0.938`. */
  f1: number
  latency_p95_ms: number
  size_bytes: number
  stage: ApiModelStage
  author: string
  created_at: string
  /** The deployment serving this version, if any. */
  deployment_id: string | null
}

/** `GET /v1/projects/{id}/models/{model_id}`. */
export type ApiModelDetail = ApiModel & {
  /** The dataset the source run trained on. */
  dataset_id: string
  /** Every version of this model name, oldest first. */
  versions: ApiModel[]
  /** Weakest classes first. */
  per_class_accuracy: Array<{
    label: string
    accuracy: number
    support: number
  }>
}

/** One row of `GET …/{model_id}/files`. */
export type ApiModelFile = {
  name: string
  /** `Weights`, `Config`, `Classes`, `Tokenizer`, `Docs`. */
  type: string
  size_bytes: number
}

/** `POST …/{model_id}/predict`. */
export type ApiPrediction = {
  predictions: Array<{ label: string; confidence: number }>
  /** What drove the top prediction, weights in percent. */
  contributions: Array<{ label: string; weight: number }>
  latency_ms: number
}
