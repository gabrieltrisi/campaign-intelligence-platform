import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../src/server';
import { prisma } from '../src/utils/prisma';

describe('Auth Routes', () => {
  beforeEach(async () => {
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should register a new user successfully', async () => {
    const response = await request(app).post('/auth/register').send({
      name: 'Gabriel Trisi',
      email: 'gabriel@test.com',
      password: '123456',
    });

    expect(response.status).toBe(201);

    expect(response.body).toHaveProperty('message');

    const user = response.body.user || response.body.data;

    expect(user).toBeDefined();
    expect(user).toHaveProperty('id');
    expect(user.email).toBe('gabriel@test.com');
  });

  it('should not allow duplicate email registration', async () => {
    await request(app).post('/auth/register').send({
      name: 'Gabriel Trisi',
      email: 'gabriel@test.com',
      password: '123456',
    });

    const response = await request(app).post('/auth/register').send({
      name: 'Gabriel Trisi',
      email: 'gabriel@test.com',
      password: '123456',
    });

    expect(response.status).toBe(409);

    expect(response.body).toHaveProperty('message', 'E-mail ja cadastrado');
  });

  it('should login successfully and return JWT token', async () => {
    await request(app).post('/auth/register').send({
      name: 'Gabriel Trisi',
      email: 'gabriel@test.com',
      password: '123456',
    });

    const response = await request(app).post('/auth/login').send({
      email: 'gabriel@test.com',
      password: '123456',
    });

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty('token');

    expect(typeof response.body.token).toBe('string');
  });

  it('should not login with invalid password', async () => {
    await request(app).post('/auth/register').send({
      name: 'Gabriel Trisi',
      email: 'gabriel@test.com',
      password: '123456',
    });

    const response = await request(app).post('/auth/login').send({
      email: 'gabriel@test.com',
      password: 'senha-errada',
    });

    expect(response.status).toBe(401);

    expect(response.body).toHaveProperty('message', 'Credenciais invalidas');
  });

  it('should validate required login fields', async () => {
    const response = await request(app).post('/auth/login').send({
      email: '',
      password: '',
    });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty('message');
  });
});
