// Responsabilidad: Entry point del servidor. Carga las variables de entorno,
// importa la app configurada y llama a listen() en el puerto definido.

'use strict';

require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
