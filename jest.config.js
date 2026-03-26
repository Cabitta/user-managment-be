module.exports = {
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  },
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/src/config/",
    "/src/models/",
    "/src/dtos/",
    "/src/validators/",
    "server.js"
  ]
};
