import { ApiError } from './client';

/**
 * PUT a file straight to a presigned URL (object storage, not the API), reporting progress: `fetch` cannot, XHR can.
 * The URL is the credential, so no Authorization header is sent. Rejects with ApiError (status 0 when the network failed or
 * the request was aborted through `signal`).
 */
export function putFile(url: string, file: File, onProgress: (fraction: number) => void, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new ApiError(xhr.status)));
    xhr.onerror = () => reject(new ApiError(0));
    xhr.onabort = () => reject(new ApiError(0));
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}
