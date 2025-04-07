const { Pool } = require('pg');

// Configura tu conexión a PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'AirDB',
  password: '1234',
  port: 5432, // puerto por defecto de PostgreSQL
});

// Verifica la conexión
pool.connect()
  .then(() => console.log('🟢 Conectado a PostgreSQL'))
  .catch(err => console.error('🔴 Error al conectar a PostgreSQL:', err));

// Exporta el pool para usar en otros archivos
module.exports = pool;