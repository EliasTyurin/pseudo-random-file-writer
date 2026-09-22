# Pseudo Random File Writer

Generates and writes files filled with pseudorandom bytes of a specified size for testing storage and transfer.

```js
import { writeRandomFile, generateBytes } from 'pseudo-random-file-writer';

// Write 1 MiB of random data
await writeRandomFile('./output/test.bin', 1024 * 1024);

// Generate random bytes without writing to disk
const buffer = generateBytes(256);
```

The library exports two functions:

- `generateBytes(size)` — returns a `Buffer` of `size` cryptographically secure pseudorandom bytes.
- `writeRandomFile(filePath, size, bytes?)` — writes `size` pseudorandom bytes to `filePath`, creating parent directories as needed. If the optional `bytes` argument is supplied, it writes the first `size` bytes of that `Uint8Array` instead of generating random data.

## Why this library exists

Testing file storage and transfer code often requires files with known sizes and unknown-but-realistic contents. Hand-crafting large buffers or relying on shell commands ties tests to a particular environment. This library gives a small, dependency-free way to create those files from JavaScript. The main trade-off is that random data is not compressible, so a 10 GB file really occupies 10 GB on disk; this is intentional because many storage tests need exactly that property.

## Edge case to be aware of

`writeRandomFile` truncates the target file if it already exists. If you need to append to an existing file or preserve its contents, that is outside the scope of this library.
