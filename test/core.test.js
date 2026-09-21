import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateBytes, writeRandomFile } from '../src/core.js';

async function withTempDir(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'prfw-'));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('generateBytes returns a Buffer of the requested length', () => {
  const size = 64;
  const bytes = generateBytes(size);
  assert.ok(Buffer.isBuffer(bytes));
  assert.equal(bytes.length, size);
});

test('generateBytes returns different data on successive calls', () => {
  const a = generateBytes(1024);
  const b = generateBytes(1024);
  assert.notEqual(a.compare(b), 0);
});

test('generateBytes accepts size zero', () => {
  const bytes = generateBytes(0);
  assert.equal(bytes.length, 0);
});

test('generateBytes rejects negative sizes', () => {
  assert.throws(() => generateBytes(-1), RangeError);
});

test('generateBytes rejects non-integer sizes', () => {
  assert.throws(() => generateBytes(1.5), RangeError);
});

test('writeRandomFile writes exactly the requested number of bytes', async () => {
  await withTempDir(async (dir) => {
    const path = join(dir, 'a.bin');
    const size = 513;
    const result = await writeRandomFile(path, size);
    assert.equal(result.bytesWritten, size);
    assert.equal(result.path, path);

    const contents = await readFile(path);
    assert.equal(contents.length, size);
  });
});

test('writeRandomFile creates parent directories', async () => {
  await withTempDir(async (dir) => {
    const path = join(dir, 'nested', 'deep', 'file.bin');
    await writeRandomFile(path, 10);
    const contents = await readFile(path);
    assert.equal(contents.length, 10);
  });
});

test('writeRandomFile truncates an existing file', async () => {
  await withTempDir(async (dir) => {
    const path = join(dir, 'truncate.bin');
    await writeRandomFile(path, 100);
    await writeRandomFile(path, 5);
    const contents = await readFile(path);
    assert.equal(contents.length, 5);
  });
});

test('writeRandomFile accepts supplied bytes for deterministic output', async () => {
  await withTempDir(async (dir) => {
    const path = join(dir, 'deterministic.bin');
    const supplied = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);
    await writeRandomFile(path, 5, supplied);
    const contents = await readFile(path);
    assert.deepEqual(contents, Buffer.from([1, 2, 3, 4, 5]));
  });
});

test('writeRandomFile writes zero bytes for size zero', async () => {
  await withTempDir(async (dir) => {
    const path = join(dir, 'empty.bin');
    const result = await writeRandomFile(path, 0);
    assert.equal(result.bytesWritten, 0);
    const contents = await readFile(path);
    assert.equal(contents.length, 0);
  });
});

test('writeRandomFile rejects an empty file path', async () => {
  await assert.rejects(() => writeRandomFile('', 1), TypeError);
});

test('writeRandomFile rejects a non-string file path', async () => {
  await assert.rejects(() => writeRandomFile(123, 1), TypeError);
});

test('writeRandomFile rejects negative sizes', async () => {
  await withTempDir(async (dir) => {
    await assert.rejects(
      () => writeRandomFile(join(dir, 'x.bin'), -1),
      RangeError
    );
  });
});

test('writeRandomFile rejects non-integer sizes', async () => {
  await withTempDir(async (dir) => {
    await assert.rejects(
      () => writeRandomFile(join(dir, 'x.bin'), 2.5),
      RangeError
    );
  });
});

test('writeRandomFile rejects supplied bytes shorter than size', async () => {
  await withTempDir(async (dir) => {
    await assert.rejects(
      () => writeRandomFile(join(dir, 'x.bin'), 10, Buffer.from([1, 2, 3])),
      RangeError
    );
  });
});

test('writeRandomFile rejects non-Uint8Array bytes', async () => {
  await withTempDir(async (dir) => {
    await assert.rejects(
      () => writeRandomFile(join(dir, 'x.bin'), 5, 'not bytes'),
      TypeError
    );
  });
});
