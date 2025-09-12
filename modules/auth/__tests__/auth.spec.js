const request = require('supertest');
const jwt = require('jsonwebtoken');

// Ensure test-friendly env before importing server
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.EXPOSE_OTP = 'true';
process.env.AUTH_JWT_SECRET = process.env.AUTH_JWT_SECRET || 'test-secret';

const { app, startServer } = require('../../../../backend/server-modular');

let server;

beforeAll(async () => {
  // Boot the modular server so modules mount their routes
  server = await startServer();
});

afterAll(async () => {
  if (server && server.close) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('Auth module - OTP flow', () => {
  const base = request(app);
  const testEmail = `jest_${Date.now()}@example.com`;

  test('POST /api/modules/auth/otp/request returns 202', async () => {
    const res = await base
      .post('/api/modules/auth/otp/request')
      .send({ email: testEmail })
      .set('Content-Type', 'application/json');
    expect([200, 202]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('success');
  });

  test('Dev OTP can be fetched and verified', async () => {
    // Fetch dev OTP (EXPOSE_OTP=true in tests)
    const dbg = await base.get(`/api/modules/auth/debug/otp?email=${encodeURIComponent(testEmail)}`);
    expect(dbg.statusCode).toBe(200);
    expect(dbg.body?.data?.exists).toBe(true);
    const otp = dbg.body?.data?.otp;
    expect(typeof otp).toBe('string');

    // Verify
    const verify = await base
      .post('/api/modules/auth/otp/verify')
      .send({ email: testEmail, code: otp })
      .set('Content-Type', 'application/json');
    expect(verify.statusCode).toBe(200);
    expect(verify.body?.success).toBe(true);
    expect(verify.body?.data?.user?.verified).toBe(true);
  });

  test('OTP verify fails with invalid code', async () => {
    const res = await base
      .post('/api/modules/auth/otp/verify')
      .send({ email: testEmail, code: '000000' })
      .set('Content-Type', 'application/json');
    expect([400, 500]).toContain(res.statusCode);
    expect(res.body?.success).toBe(false);
  });
});

describe('Auth module - JWT and Admin APIs', () => {
  const base = request(app);

  test('GET /api/modules/auth/me requires JWT', async () => {
    const noTok = await base.get('/api/modules/auth/me');
    expect(noTok.statusCode).toBe(401);

    const token = jwt.sign({ userId: 'jest', email: 'jest@local', role: 'user', loginMethod: 'test' }, process.env.AUTH_JWT_SECRET, { expiresIn: '1h' });
    const ok = await base.get('/api/modules/auth/me').set('Authorization', `Bearer ${token}`);
    expect(ok.statusCode).toBe(200);
    expect(ok.body?.success).toBe(true);
    expect(ok.body?.data?.email).toBe('jest@local');
  });

  test('GET /api/modules/auth/admin/stats with super_admin token', async () => {
    const token = jwt.sign({ userId: 'jest', email: 'jest@local', role: 'super_admin', loginMethod: 'test' }, process.env.AUTH_JWT_SECRET, { expiresIn: '1h' });
    const res = await base.get('/api/modules/auth/admin/stats').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data).toHaveProperty('totalUsers');
  });
});
