/**
 * @file auth.service.test.js
 * @description Tests unitarios para AuthService.
 * Responsabilidad: Verificar la lógica de negocio de autenticación en aislamiento.
 */

const authService = require('../../src/services/auth.service');
const userRepository = require('../../src/repositories/user.repository');
const userDTO = require('../../src/dtos/user.dto');
const jwt = require('jsonwebtoken');
const tokenBlocklist = require('../../src/utils/tokenBlocklist');

// Mockear dependencias
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/dtos/user.dto');
jest.mock('jsonwebtoken');
jest.mock('../../src/utils/tokenBlocklist');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('debería asignar rol "admin" si es el primer usuario (Happy 1)', async () => {
      const userData = { name: 'Ana', email: 'ana@test.com', password: 'Password123!' };
      const createdUser = { ...userData, _id: '123', role: 'admin' };
      
      userRepository.countTotal.mockResolvedValue(0);
      userRepository.create.mockResolvedValue(createdUser);
      userDTO.toResponseDTO.mockReturnValue({ ...createdUser, password: undefined });

      const result = await authService.register(userData);

      expect(userRepository.countTotal).toHaveBeenCalledTimes(1);
      expect(userRepository.create).toHaveBeenCalledWith({ ...userData, role: 'admin' });
      expect(result.role).toBe('admin');
    });

    it('debería asignar rol "user" si ya existen otros usuarios (Happy 2)', async () => {
      const userData = { name: 'Pepe', email: 'pepe@test.com', password: 'Password123!' };
      const createdUser = { ...userData, _id: '456', role: 'user' };
      
      userRepository.countTotal.mockResolvedValue(1);
      userRepository.create.mockResolvedValue(createdUser);
      userDTO.toResponseDTO.mockReturnValue({ ...createdUser, password: undefined });

      const result = await authService.register(userData);

      expect(userRepository.countTotal).toHaveBeenCalledTimes(1);
      expect(userRepository.create).toHaveBeenCalledWith({ ...userData, role: 'user' });
      expect(result.role).toBe('user');
    });
  });

  describe('login', () => {
    const credentials = { email: 'ana@test.com', password: 'Password123!' };
    const mockUser = {
      _id: '123',
      email: 'ana@test.com',
      role: 'admin',
      isActive: true,
      comparePassword: jest.fn()
    };

    it('debería devolver token y datos si las credenciales son correctas (Happy 3)', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(true);
      jwt.sign.mockReturnValue('fake-jwt-token');
      userDTO.toResponseDTO.mockReturnValue({ _id: '123', email: 'ana@test.com', role: 'admin' });

      const result = await authService.login(credentials);

      expect(result).toHaveProperty('token', 'fake-jwt-token');
      expect(result).toHaveProperty('user');
      expect(mockUser.comparePassword).toHaveBeenCalledWith(credentials.password);
    });

    it('debería lanzar error UNAUTHORIZED si el email no existe (Sad 4)', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(credentials)).rejects.toThrow('Credenciales inválidas');
      await expect(authService.login(credentials)).rejects.toMatchObject({ code: 'UNAUTHORIZED', statusCode: 401 });
    });

    it('debería lanzar error UNAUTHORIZED si la password es incorrecta (Sad 5)', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(false);

      await expect(authService.login(credentials)).rejects.toThrow('Credenciales inválidas');
      await expect(authService.login(credentials)).rejects.toMatchObject({ code: 'UNAUTHORIZED', statusCode: 401 });
    });

    it('debería lanzar error FORBIDDEN si el usuario está inactivo (Sad 6)', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findByEmail.mockResolvedValue(inactiveUser);

      await expect(authService.login(credentials)).rejects.toThrow('Tu cuenta ha sido desactivada');
      await expect(authService.login(credentials)).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
    });
  });

  describe('logout', () => {
    it('debería agregar el token a la blocklist y devolver true (Happy 7)', async () => {
      const token = 'some-token';
      const result = await authService.logout(token);
      
      expect(tokenBlocklist.add).toHaveBeenCalledWith(token);
      expect(result).toBe(true);
    });
  });

  describe('getMe', () => {
    it('debería devolver los datos del usuario si el ID es válido y está activo (Happy 8)', async () => {
      const user = { _id: '123', isActive: true };
      userRepository.findById.mockResolvedValue(user);
      userDTO.toResponseDTO.mockReturnValue({ _id: '123' });

      const result = await authService.getMe('123');
      expect(result).toEqual({ _id: '123' });
    });

    it('debería lanzar error NOT_FOUND si no existe o está inactivo (Sad 9)', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(authService.getMe('invalid')).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });

      userRepository.findById.mockResolvedValue({ _id: '123', isActive: false });
      await expect(authService.getMe('123')).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
    });
  });

  describe('updateMe', () => {
    const userId = '123';
    const updateData = { name: 'Nuevo Nombre', email: 'nuevo@test.com' };

    it('debería actualizar campos permitidos (Happy 10)', async () => {
      userRepository.update.mockResolvedValue({ _id: userId, ...updateData });
      userDTO.toResponseDTO.mockReturnValue({ _id: userId, ...updateData });

      const result = await authService.updateMe(userId, updateData);
      expect(userRepository.update).toHaveBeenCalledWith(userId, expect.objectContaining(updateData));
      expect(result.name).toBe('Nuevo Nombre');
    });

    it('debería permitir actualizar password (Happy 11)', async () => {
      const passUpdate = { password: 'NewPassword123!' };
      userRepository.update.mockResolvedValue({ _id: userId });
      userDTO.toResponseDTO.mockReturnValue({ _id: userId });

      await authService.updateMe(userId, passUpdate);
      expect(userRepository.update).toHaveBeenCalledWith(userId, { password: 'NewPassword123!' });
    });

    it('debería lanzar error VALIDATION_ERROR si no hay campos válidos (Sad 12)', async () => {
      await expect(authService.updateMe(userId, { invalid: 'field' }))
        .rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 400 });
    });

    it('debería ignorar el campo role si se intenta cambiar (Sad 13)', async () => {
      userRepository.update.mockResolvedValue({ _id: userId });
      await authService.updateMe(userId, { name: 'Test', role: 'admin' });
      
      expect(userRepository.update).toHaveBeenCalledWith(userId, { name: 'Test' });
    });

    it('debería lanzar error NOT_FOUND si el repositorio devuelve null (Sad 14)', async () => {
      userRepository.update.mockResolvedValue(null);
      await expect(authService.updateMe(userId, { name: 'Test' }))
        .rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
    });
  });

  describe('deleteMe', () => {
    // deleteMe delega en UserService. No podemos requerirlo directamente en el test porque UserService
    // rqueriría a su vez a AuthService en una circular si no fuera por el lazy load (require('./user.service')).
    // Mockeamos el require interno si es necesario o simplemente verificamos que authService
    // llama a userService.deleteUser.
    
    it('debería delegar la eliminación en UserService (Happy 15)', async () => {
      const userService = require('../../src/services/user.service');
      jest.mock('../../src/services/user.service', () => ({
        deleteUser: jest.fn().mockResolvedValue({ message: 'OK' })
      }));
      
      const result = await authService.deleteMe('123');
      expect(userService.deleteUser).toHaveBeenCalledWith('123');
      expect(result).toEqual({ message: 'OK' });
    });

    it('debería propagar errores de UserService (Sad 16)', async () => {
      const userService = require('../../src/services/user.service');
      const error = new Error('Error en UserService');
      error.code = 'BAD_REQUEST';
      userService.deleteUser.mockRejectedValue(error);

      await expect(authService.deleteMe('123')).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
  });
});
