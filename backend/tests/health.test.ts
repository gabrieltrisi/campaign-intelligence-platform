import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../src/server';

describe('Health Check', () => {
  it('should return API status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);

    expect(response.body.status).toBe('healthy');

    expect(response.body.database).toBe('connected');
  });
});
