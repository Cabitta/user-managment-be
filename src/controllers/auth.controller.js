// Responsabilidad: Mapear las peticiones HTTP de autenticación a la lógica de negocio.
// Parsea el body, llama al servicio y envía la respuesta JSON.

'use strict';

const authService = require('../services/auth.service');

class AuthController {
  /**
   * Maneja el registro de nuevos usuarios.
   */
  async register(req, res) {
    const { name, email, password } = req.body;

    // 1. Llamar al servicio para registrar (el servicio se encarga del rol y DTO)
    const newUser = await authService.register({ name, email, password });

    // 2. Responder con el usuario creado (DTO ya aplicado)
    res.status(201).json({
      success: true,
      data: newUser,
    });
  }

  /**
   * Maneja el inicio de sesión.
   */
  async login(req, res) {
    const { email, password } = req.body;

    // 1. Llamar al servicio para loguear
    const result = await authService.login({ email, password });

    // 2. Responder con el token y los datos del usuario
    res.status(200).json({
      success: true,
      token: result.token,
      data: result.user,
    });
  }

  /**
   * Maneja el cierre de sesión inhabilitando el token actual.
   */
  async logout(req, res) {
    // 1. Extraer el token del header (ya validado por el middleware authenticate)
    const token = req.headers.authorization.split(' ')[1];

    // 2. Llamar al servicio para invalidar el token
    await authService.logout(token);

    // 3. Responder con mensaje satisfactorio
    res.status(200).json({
      success: true,
      message: 'Sesión cerrada satisfactoriamente',
    });
  }

  /**
   * Obtiene el perfil del usuario autenticado.
   */
  async getMe(req, res) {
    const result = await authService.getMe(req.user.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  }

  /**
   * Actualiza el perfil del usuario autenticado.
   */
  async updateMe(req, res) {
    const result = await authService.updateMe(req.user.id, req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  }
}

module.exports = new AuthController();
