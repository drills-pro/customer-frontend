import type { DeploymentSchema } from '@/modules/deployments/api';

/** The request headers a call sends. The key is a placeholder: the real key is shown once when it is created, never here. */
export const KEY_PLACEHOLDER = 'YOUR_API_KEY';

export interface CallExample {
  /** The URL of POST /v1/predict on the public API. */
  endpoint: string;
  curl: string;
  python: string;
  javascript: string;
  /** The request body: the caller's data in `input`. */
  request: unknown;
  /** What comes back: a prediction envelope with the output shape. */
  response: unknown;
}

/** The public call for a deployment: the same request in curl, Python and JavaScript, built from the API base the app talks to. The
 * body is `input` when given (what the Test tab sends), else a placeholder per input field. */
export function buildCall(apiUrl: string, projectId: string, schema: DeploymentSchema, input?: unknown): CallExample {
  const endpoint = `${apiUrl.replace(/\/+$/, '')}/v1/predict`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${KEY_PLACEHOLDER}`,
    'X-Project-Id': projectId,
    'X-Model-Id': schema.model_id,
    'X-Model-Revision': schema.model_revision,
    'Content-Type': 'application/json',
  };
  const body = input ?? { input: Object.fromEntries(Object.keys(schema.input).map((field) => [field, '<your data>'])) };
  const request = body;
  const response = {
    id: '<prediction id>',
    status: 'succeeded',
    model: { id: schema.model_id, revision: schema.model_revision },
    output: schema.output,
    usage: { latency_ms: 42 },
    metadata: {},
    error: null,
    expired: false,
  };

  const headerLines = Object.entries(headers).map(([k, v]) => `  -H '${k}: ${v}' \\`);
  const curl = [`curl -X POST '${endpoint}' \\`, ...headerLines, `  -d '${JSON.stringify(body)}'`].join('\n');
  const python = [
    'import requests',
    '',
    'res = requests.post(',
    `    ${JSON.stringify(endpoint)},`,
    `    headers=${pythonDict(headers)},`,
    `    json=${pythonDict(body)},`,
    ')',
    'print(res.json())',
  ].join('\n');
  const javascript = [
    `const res = await fetch(${JSON.stringify(endpoint)}, {`, // lint-ok: text of a snippet the user copies, not a call from the app
    '  method: "POST",',
    `  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, '\n  ')},`,
    `  body: JSON.stringify(${JSON.stringify(body, null, 2).replace(/\n/g, '\n  ')}),`,
    '});',
    'console.log(await res.json());',
  ].join('\n');

  return { endpoint, curl, python, javascript, request, response };
}

/** A Python dict literal for a JSON value: the same keys and strings, with Python's null, true and false. */
function pythonDict(value: unknown): string {
  return JSON.stringify(value, null, 4)
    .replace(/\bnull\b/g, 'None')
    .replace(/\btrue\b/g, 'True')
    .replace(/\bfalse\b/g, 'False');
}
