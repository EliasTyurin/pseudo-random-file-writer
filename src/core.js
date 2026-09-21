import { randomBytes } from 'node:crypto';
import { open, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

/**
 * Generate a Buffer of pseudorandom bytes using the standard library's
 * cryptographic random source. Using node:crypto means we rely only on the
 * platform's CSPRNG, which is appropriate for test data: it is fast enough
 * for file generation and does not pull in third-party code.
 *
 * @param {number} size - number of bytes to generate
 * @returns {Buffer}
 */
export function generateBytes(size) {
  if (!Number.isInteger(size) || size < 0) {
    throw new RangeError('size must be a non-negative integer');
  }
  return randomBytes(size);
}

/**
 * Write a file filled with pseudorandom bytes.
 *
 * The write is performed through a file handle opened with 'w' mode so the
 * file is truncated if it already exists. Directories are created lazily for
 * the target path because the primary use case is creating test trees in
 * locations that may not exist yet.
 *
 * @param {string} filePath - absolute or relative path to write
 * @param {number} size - number of random bytes to write
 * @param {Buffer|Uint8Array} [bytes] - optional bytes to write; if omitted,
 *   random bytes are generated. Supplying bytes allows deterministic tests.
 * @returns {Promise<{ bytesWritten: number, path: string }>}
 */
export async function writeRandomFile(filePath, size, bytes) {
  if (typeof filePath !== 'string' || filePath.length === 0) {
    throw new TypeError('filePath must be a non-empty string');
  }
  if (!Number.isInteger(size) || size < 0) {
    throw new RangeError('size must be a non-negative integer');
  }

  let data;
  if (bytes !== undefined) {
    if (!(bytes instanceof Uint8Array)) {
      throw new TypeError('bytes must be a Uint8Array when provided');
    }
    if (bytes.byteLength < size) {
      throw new RangeError('bytes must contain at least size elements');
    }
    data = bytes.subarray(0, size);
  } else {
    data = generateBytes(size);
  }

  const absolutePath = resolve(filePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  const handle = await open(absolutePath, 'w');
  try {
    await handle.writeFile(data);
  } finally {
    await handle.close();
  }

  return { bytesWritten: data.byteLength, path: absolutePath };
}
