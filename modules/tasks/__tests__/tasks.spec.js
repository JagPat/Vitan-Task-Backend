const request = require('supertest');

const { app, startServer } = require('../../../../backend/server-modular');

let server;
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  server = await startServer();
});

afterAll(async () => {
  if (server && server.close) await new Promise((r) => server.close(r));
});

describe('Tasks module CRUD (with mock-safe fallback)', () => {
  const base = request(app);
  let createdId;

  test('POST /api/modules/tasks creates a task', async () => {
    const res = await base
      .post('/api/modules/tasks')
      .send({ title: `Jest Task ${Date.now()}`, priority: 'high' })
      .set('Content-Type', 'application/json');
    expect(res.statusCode).toBe(201);
    expect(res.body?.success).toBe(true);
    createdId = res.body?.data?.id;
    expect(createdId).toBeTruthy();
  });

  test('GET /api/modules/tasks lists created task', async () => {
    const res = await base.get('/api/modules/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body?.success).toBe(true);
    const list = res.body?.data || [];
    const found = list.find(t => String(t.id) === String(createdId));
    expect(found).toBeTruthy();
  });

  test('GET /api/modules/tasks/:id returns the task', async () => {
    const res = await base.get(`/api/modules/tasks/${createdId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(String(res.body?.data?.id)).toBe(String(createdId));
  });

  test('PUT /api/modules/tasks/:id updates the task', async () => {
    const res = await base
      .put(`/api/modules/tasks/${createdId}`)
      .send({ status: 'completed' })
      .set('Content-Type', 'application/json');
    expect(res.statusCode).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.status).toBe('completed');
  });

  test('DELETE /api/modules/tasks/:id soft-deletes the task', async () => {
    const res = await base.delete(`/api/modules/tasks/${createdId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.status).toBe('deleted');

    const list = await base.get('/api/modules/tasks');
    const remains = (list.body?.data || []).find(t => String(t.id) === String(createdId));
    expect(remains).toBeFalsy(); // soft-deleted tasks are hidden from list
  });
});

