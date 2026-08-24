import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { uploadFiles, uploadDir, maxFileSizeBytes, maxFileCount } from './upload.js';

function makeApp() {
  const app = express();
  app.post('/upload', uploadFiles, (req, res) => {
    res.json((req.files || []).map((file) => file.filename));
  });
  return app;
}

// Files land in the real upload directory, so every test cleans up after itself.
const written = [];

function trackAndRead(filenames) {
  return filenames.map((filename) => {
    written.push(filename);
    return fs.readFileSync(path.join(uploadDir, filename), 'utf8');
  });
}

describe('uploadFiles', () => {
  afterEach(() => {
    while (written.length) {
      fs.rmSync(path.join(uploadDir, written.pop()), { force: true });
    }
  });

  it('stores the uploaded file under its original name', async () => {
    const res = await request(makeApp()).post('/upload').attach('files', Buffer.from('screenshot'), 'evidence.png');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(['evidence.png']);
    expect(trackAndRead(res.body)).toEqual(['screenshot']);
  });

  it('keeps files with the same name in one request from overwriting each other', async () => {
    const res = await request(makeApp())
      .post('/upload')
      .attach('files', Buffer.from('first'), 'evidence.png')
      .attach('files', Buffer.from('second'), 'evidence.png')
      .attach('files', Buffer.from('third'), 'evidence.png');

    expect(res.status).toBe(200);
    expect(new Set(res.body).size).toBe(3);
    expect(trackAndRead(res.body)).toEqual(['first', 'second', 'third']);
  });

  it('renames around a file already on disk', async () => {
    const app = makeApp();
    const first = await request(app).post('/upload').attach('files', Buffer.from('first'), 'evidence.png');
    const second = await request(app).post('/upload').attach('files', Buffer.from('second'), 'evidence.png');

    expect(second.body[0]).not.toBe(first.body[0]);
    expect(trackAndRead([...first.body, ...second.body])).toEqual(['first', 'second']);
  });

  it('rejects a file over the size limit as 413 rather than 500', async () => {
    const res = await request(makeApp())
      .post('/upload')
      .attach('files', Buffer.alloc(maxFileSizeBytes + 1024), 'too-big.bin');

    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: 'File is too large' });
    fs.rmSync(path.join(uploadDir, 'too-big.bin'), { force: true });
  });

  it('rejects more files than the per-request limit as 400', async () => {
    let req = request(makeApp()).post('/upload');
    for (let i = 0; i <= maxFileCount; i++) {
      req = req.attach('files', Buffer.from('x'), `evidence-${i}.png`);
    }
    const res = await req;

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Too many files uploaded' });
    for (let i = 0; i <= maxFileCount; i++) {
      fs.rmSync(path.join(uploadDir, `evidence-${i}.png`), { force: true });
    }
  });
});
