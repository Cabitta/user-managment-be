// Responsabilidad: Configurar y exportar la aplicación Express con middlewares globales.
// No hace listen() — eso es responsabilidad de server.js.

"use strict";

require("express-async-errors");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// --- Seguridad HTTP ---
app.use(helmet());

// --- CORS: permite requests desde cualquier origen en desarrollo ---
app.use(cors());

// --- Logging de requests HTTP en consola ---
app.use(morgan("dev"));

// --- Parseo de JSON en el body ---
app.use(express.json());

// --- Rutas (se agregarán en fases posteriores) ---
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);

// --- Manejo global de errores ---
app.use(errorHandler);

module.exports = app;
