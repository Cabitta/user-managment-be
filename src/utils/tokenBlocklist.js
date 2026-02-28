// Responsabilidad: Gestionar una lista negra (blocklist) de tokens JWT invalidados.
// Se usa para el proceso de Logout, ya que los JWT no tienen estado.

'use strict';

class TokenBlocklist {
  constructor() {
    this.blocklist = new Set();
  }

  /**
   * Agrega un token a la lista negra.
   * @param {string} token 
   */
  add(token) {
    this.blocklist.add(token);
  }

  /**
   * Verifica if un token está en la lista negra.
   * @param {string} token 
   * @returns {boolean}
   */
  has(token) {
    return this.blocklist.has(token);
  }
}

// Exportamos una única instancia (Singleton)
module.exports = new TokenBlocklist();
