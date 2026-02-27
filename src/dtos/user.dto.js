// Responsabilidad: Transformar los datos de los usuarios entre las capas de la aplicación.
// Asegura que la información sensible no salga de la API y que los datos de entrada sean consistentes.

'use strict';

/**
 * Transforma un objeto de usuario (documento de Mongoose o POJO) en un objeto seguro para enviar al cliente.
 */
const toResponseDTO = (user) => {
  if (!user) return null;

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Limpia y normaliza los datos de entrada del usuario.
 * Útil para asegurar que solo se procesen campos permitidos.
 */
const toInternalDTO = (data) => {
  if (!data) return null;

  const internalData = {};

  if (data.name) internalData.name = data.name.trim();
  if (data.email) internalData.email = data.email.toLowerCase().trim();
  if (data.password) internalData.password = data.password;
  if (data.role) internalData.role = data.role;

  return internalData;
};

module.exports = {
  toResponseDTO,
  toInternalDTO,
};
