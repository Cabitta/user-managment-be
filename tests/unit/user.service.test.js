/**
 * @file user.service.test.js
 * @description Tests unitarios para UserService.
 * Responsabilidad: Verificar la lógica de gestión de usuarios y reglas de protección.
 */

const userService = require('../../src/services/user.service');
const userRepository = require('../../src/repositories/user.repository');
const userDTO = require('../../src/dtos/user.dto');

// Mockear dependencias
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/dtos/user.dto');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    const mockRepoResult = {
      data: [{ _id: '1' }, { _id: '2' }],
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 }
    };

    it('debería devolver lista paginada con valores por defecto (Happy 1)', async () => {
      userRepository.findAll.mockResolvedValue(mockRepoResult);
      userDTO.toResponseDTO.mockImplementation(user => user);

      const result = await userService.getAllUsers({});

      expect(userRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10, role: undefined, search: undefined });
      expect(result.data).toHaveLength(2);
    });

    it('debería filtrar por role (Happy 2)', async () => {
      userRepository.findAll.mockResolvedValue(mockRepoResult);
      await userService.getAllUsers({ role: 'admin' });
      expect(userRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
    });

    it('debería filtrar por search (Happy 3)', async () => {
      userRepository.findAll.mockResolvedValue(mockRepoResult);
      await userService.getAllUsers({ search: 'ana' });
      expect(userRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({ search: 'ana' }));
    });

    it('debería recortar limit a 100 si es mayor (Happy 4)', async () => {
      userRepository.findAll.mockResolvedValue(mockRepoResult);
      await userService.getAllUsers({ limit: 200 });
      expect(userRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
    });

    it('debería ajustar limit a 1 si es menor a 1 (Happy 5)', async () => {
      userRepository.findAll.mockResolvedValue(mockRepoResult);
      await userService.getAllUsers({ limit: 0 });
      expect(userRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 1 }));
    });

    it('debería ajustar page a 1 si es menor a 1 (Happy 6)', async () => {
      userRepository.findAll.mockResolvedValue(mockRepoResult);
      await userService.getAllUsers({ page: -5 });
      expect(userRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });
  });

  describe('getUserById', () => {
    it('debería devolver el usuario si existe (Happy 7)', async () => {
      const mockUser = { _id: '123' };
      userRepository.findById.mockResolvedValue(mockUser);
      userDTO.toResponseDTO.mockReturnValue(mockUser);

      const result = await userService.getUserById('123');
      expect(result).toEqual(mockUser);
    });

    it('debería lanzar NOT_FOUND si no existe (Sad 8)', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(userService.getUserById('404')).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
    });
  });

  describe('updateUser', () => {
    const userId = '123';
    const updateData = { name: 'Admin Edit', role: 'admin' };

    it('debería permitir actualizar cualquier campo permitido como Admin (Happy 9)', async () => {
      userRepository.update.mockResolvedValue({ _id: userId, ...updateData });
      userDTO.toResponseDTO.mockImplementation(user => user);

      const result = await userService.updateUser(userId, updateData);
      expect(userRepository.update).toHaveBeenCalledWith(userId, updateData);
      expect(result.role).toBe('admin');
    });

    it('debería permitir cambiar el role (Happy 10)', async () => {
      userRepository.update.mockResolvedValue({ _id: userId, role: 'admin' });
      await userService.updateUser(userId, { role: 'admin' });
      expect(userRepository.update).toHaveBeenCalledWith(userId, { role: 'admin' });
    });

    it('debería lanzar VALIDATION_ERROR si no hay campos válidos (Sad 11)', async () => {
      await expect(userService.updateUser(userId, { unknown: 'field' }))
        .rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 400 });
    });

    it('debería lanzar NOT_FOUND si el usuario no existe (Sad 12)', async () => {
      userRepository.update.mockResolvedValue(null);
      await expect(userService.updateUser(userId, { name: 'Test' }))
        .rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
    });
  });

  describe('deleteUser', () => {
    const userId = '123';

    it('debería permitir eliminar un usuario con rol "user" (Happy 13)', async () => {
      userRepository.findById.mockResolvedValue({ _id: userId, role: 'user', isActive: true });
      
      const result = await userService.deleteUser(userId);
      
      expect(userRepository.softDelete).toHaveBeenCalledWith(userId);
      expect(result.message).toContain('correctamente');
    });

    it('debería permitir eliminar un admin si hay otros activos (Happy 14)', async () => {
      userRepository.findById.mockResolvedValue({ _id: userId, role: 'admin', isActive: true });
      userRepository.countActiveAdmins.mockResolvedValue(2);
      
      const result = await userService.deleteUser(userId);
      
      expect(userRepository.softDelete).toHaveBeenCalledWith(userId);
      expect(result.message).toContain('correctamente');
    });

    it('debería permitir eliminar a un usuario inactivo sin importar el rol (Happy 15)', async () => {
      userRepository.findById.mockResolvedValue({ _id: userId, role: 'admin', isActive: false });
      
      await userService.deleteUser(userId);
      expect(userRepository.softDelete).toHaveBeenCalledWith(userId);
    });

    it('debería lanzar NOT_FOUND si el usuario no existe (Sad 16)', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(userService.deleteUser(userId)).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
    });

    it('debería lanzar BAD_REQUEST si es el último admin activo (Sad 17)', async () => {
      userRepository.findById.mockResolvedValue({ _id: userId, role: 'admin', isActive: true });
      userRepository.countActiveAdmins.mockResolvedValue(1);
      
      await expect(userService.deleteUser(userId))
        .rejects.toMatchObject({ code: 'BAD_REQUEST', statusCode: 400 });
      
      expect(userRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
