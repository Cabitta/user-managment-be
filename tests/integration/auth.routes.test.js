/**
 * @file auth.routes.test.js
 * @description Tests de integración para las rutas de autenticación (/api/auth).
 * Responsabilidad: Verificar el flujo completo HTTP -> Middleware -> Service -> DB.
 */

const request = require('supertest');
const app = require('../../src/app');
const db = require('../helpers/db');
const { createUser, createAdmin, generateToken } = require('../helpers/factories');
const User = require('../../src/models/user.model');

describe('Auth Routes', () => {
  beforeAll(async () => await db.connect());
  beforeEach(async () => await db.clearDatabase());
  afterAll(async () => await db.disconnect());

  describe('POST /api/auth/register', () => {
    const validUser = {
      name: 'Ana García',
      email: 'ana@example.com',
      password: 'MiPassword123!'
    };

    it('debería registrar al primer usuario como admin (Caso 1)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('admin');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('debería registrar al segundo usuario como user (Caso 2)', async () => {
      await createUser(); // Crear el primero (será admin)
      
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'pepe@example.com' });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('user');
    });

    it('debería fallar si el email ya existe (Caso 3)', async () => {
      await createUser({ email: validUser.email });

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('debería fallar si falta el nombre (Caso 4)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, name: '' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('debería fallar si la password es muy corta (Caso 9)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: 'Short1' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('debería fallar si la password no tiene mayúscula (Caso 11)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: 'mypassword123' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('debería loguear correctamente y devolver un token (Caso 13)', async () => {
      const password = 'MiPassword123!';
      const user = await createUser({ password });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
    });

    it('debería fallar si el usuario está inactivo (Caso 16)', async () => {
      const password = 'MiPassword123!';
      const user = await createUser({ password, isActive: false });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('debería fallar con password incorrecta (Caso 15)', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('debería cerrar sesión correctamente (Caso 20)', async () => {
      const user = await createUser();
      const token = generateToken(user);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('debería fallar sin token (Caso 21)', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(401);
    });

    it('debería fallar con token inválido/expirado', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer token-invalido');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/auth/me', () => {
    it('debería obtener el perfil propio (Caso 23)', async () => {
      const user = await createUser();
      const token = generateToken(user);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(user.email);
    });
  });

  describe('PUT /api/auth/me', () => {
    it('debería actualizar el nombre (Caso 26)', async () => {
      const user = await createUser();
      const token = generateToken(user);

      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Nuevo Nombre' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Nuevo Nombre');
    });

    it('debería fallar si solo se intenta cambiar el rol sin campos válidos (Caso 37)', async () => {
      const user = await createUser({ role: 'user' });
      const token = generateToken(user);

      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/auth/me', () => {
    it('debería permitir que un usuario se elimine a sí mismo (Caso 39)', async () => {
      const user = await createUser({ role: 'user' });
      const token = generateToken(user);

      const res = await request(app)
        .delete('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      
      const dbUser = await User.findById(user._id);
      expect(dbUser.isActive).toBe(false);
    });

    it('debería fallar si el último admin intenta eliminarse (Caso 41)', async () => {
      const admin = await createAdmin(); // Solo hay uno
      const token = generateToken(admin);

      const res = await request(app)
        .delete('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });
  });
});
