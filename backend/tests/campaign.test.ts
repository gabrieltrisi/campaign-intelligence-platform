import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../src/server';
import { prisma } from '../src/utils/prisma';

describe('Campaign Routes', () => {
  async function createAuthenticatedUser() {
    const user = await prisma.user.create({
      data: {
        name: 'Gabriel Trisi',
        email: `gabriel-${Date.now()}-${Math.random()}@test.com`,
        password: 'hashed-password-for-test',
      },
    });

    const jwtSecret = process.env.JWT_SECRET || 'test-secret';

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      jwtSecret,
      {
        expiresIn: '1d',
      }
    );

    return token;
  }

  beforeEach(async () => {
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should not allow access without token', async () => {
    const response = await request(app).get('/campaigns');

    expect(response.status).toBe(401);
  });

  it('should create a campaign successfully', async () => {
    const token = await createAuthenticatedUser();

    const response = await request(app)
      .post('/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Meta Black Friday',
        cost: 1000,
        revenue: 5000,
        fees: 200,
        expenses: 300,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data');

    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe('Meta Black Friday');
    expect(response.body.data.grossProfit).toBe(4000);
    expect(response.body.data.realProfit).toBe(3500);
    expect(response.body.data.roas).toBe(5);
  });

  it('should list campaigns with metrics', async () => {
    const token = await createAuthenticatedUser();

    const createResponse = await request(app)
      .post('/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Google Ads',
        cost: 2000,
        revenue: 8000,
        fees: 500,
        expenses: 500,
      });

    expect(createResponse.status).toBe(201);

    const response = await request(app)
      .get('/campaigns')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);

    expect(response.body.data[0]).toHaveProperty('grossProfit');
    expect(response.body.data[0]).toHaveProperty('realProfit');
    expect(response.body.data[0]).toHaveProperty('roas');
  });

  it('should delete a campaign successfully', async () => {
    const token = await createAuthenticatedUser();

    const createResponse = await request(app)
      .post('/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Instagram Campaign',
        cost: 1000,
        revenue: 3000,
        fees: 100,
        expenses: 100,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toHaveProperty('data');
    expect(createResponse.body.data).toHaveProperty('id');

    const campaignId = createResponse.body.data.id;

    const deleteResponse = await request(app)
      .delete(`/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);
  });
});
