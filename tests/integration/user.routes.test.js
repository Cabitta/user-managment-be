/**
 * @file user.routes.test.js
 * @description Tests de integración para las rutas de administración de usuarios (/api/users).
 * Responsabilidad: Verificar que el administrador pueda gestionar usuarios y que los filtros funcionen.
 */

const request = require('supertest');
const app = require('../../src/app');
const db = require('../helpers/db');
const { createUser, createAdmin, generateToken } = require('../helpers/factories');
const User = require('../../src/models/user.model');

describe('User Routes', () => {
  beforeAll(async () => await db.connect());
  beforeEach(async () => await db.clearDatabase());
  afterAll(async () => await db.disconnect());

  describe('GET /api/users', () => {
    it('debería permitir que un admin liste usuarios (Caso 1)', async () => {
      const admin = await createAdmin();
      const token = generateToken(admin);
      await createUser(); // Otro usuario para la lista

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1); // El admin está excluido
      expect(res.body).toHaveProperty('pagination');
    });

    it('debería filtrar por rol "?role=admin" (Caso 2)', async () => {
      const admin = await createAdmin();
      const token = generateToken(admin);
      await createUser({ role: 'user' });

      const res = await request(app)
        .get('/api/users?role=admin')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0); // El único admin es el que hace la petición
    });

    it('debería filtrar por búsqueda "?search=anabella" (Caso 3)', async () => {
      const admin = await createAdmin({ name: 'Administrador' });
      const token = generateToken(admin);
      await createUser({ name: 'Anabella García', email: 'anabella@test.com' });
      await createUser({ name: 'Pepe', email: 'pepe@test.com' });

      const res = await request(app)
        .get('/api/users?search=anabella')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Anabella García');
    });

    it('debería recortar el límite a 100 si se envía algo mayor (Caso 4)', async () => {
      const admin = await createAdmin();
      const token = generateToken(admin);

      const res = await request(app)
        .get('/api/users?limit=200')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(100);
    });

    it('debería denegar el acceso a un usuario que no es admin (Caso 5)', async () => {
      const user = await createUser({ role: 'user' });
      const token = generateToken(user);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/users/:id', () => {
    it('debería obtener un usuario por ID siendo admin (Caso 7)', async () => {
      const admin = await createAdmin();
      const token = generateToken(admin);
      const user = await createUser();

      const res = await request(app)
        .get(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(user.email);
    });

    it('debería retornar 404 si el ID no existe (Caso 8)', async () => {
      const admin = await createAdmin();
      const token = generateToken(admin);

      const res = await request(app)
        .get('/api/users/664f1a2b3c4d5e6f7a8b9c0d')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('debería retornar 404 si el ID está mal formado (CastError)', async () => {
      const admin = await createAdmin();
      const token = generateToken(admin);

      const res = await request(app)
        .get('/api/users/id-invalido')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('debería permitir que el admin actualice a otro usuario (Caso 11)', async () => {
      const admin = await createAdmin();
      const token = generateToken(admin);
      const user = await createUser({ name: 'Original' });

      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Editado por Admin' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Editado por Admin');
    });

    it('debería permitir que el admin cambie el rol de un usuario (Caso 12)', async () => {
      const admin = await createAdmin();
      const token = generateToken(admin);
      const user = await createUser({ role: 'user' });

      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('admin');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('debería permitir que el admin elimine a otro usuario (Caso 16)', async () => {
      const admin = await createAdmin();
      const token = generateToken(admin);
      const user = await createUser();

      const res = await request(app)
        .delete(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      
      const deletedUser = await User.findById(user._id);
      expect(deletedUser.isActive).toBe(false);
    });

    it('no debería permitir que el admin se elimine a sí mismo si es el último (Caso 18)', async () => {
      const admin = await createAdmin(); // Solo hay uno
      const token = generateToken(admin);

      const res = await request(app)
        .delete(`/api/users/${admin._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('debería denegar la eliminación si el usuario no es admin (Caso 19)', async () => {
      const user = await createUser({ role: 'user' });
      const target = await createUser();
      const token = generateToken(user);

      const res = await request(app)
        .delete(`/api/users/${target._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
