const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors"); // 👉 AÑADIDO
const pool = require("./config/db");

const app = express();

// 👉 Habilita CORS para todas las rutas REST
app.use(cors());

const server = http.createServer(app);

// 👉 También habilita CORS para WebSocket
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Verificación de conexión con PostgreSQL
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Error al conectar a PostgreSQL:", err);
  } else {
    console.log("🟢 Conexión a PostgreSQL exitosa:", res.rows[0]);
  }
});

app.get("/", (req, res) => {
  res.send("🚀 Servidor de vuelos en ejecución");
});

// ---------------- Rutas REST ----------------
app.get("/api/vuelos", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
  v.id_vuelo, 
  v.fecha, 
  d1.nombre AS origen, 
  d2.nombre AS destino, 
  r.costo, 
  n.modelo
FROM vuelos v
JOIN rutas r ON v.id_ruta = r.id_ruta
JOIN destinos d1 ON r.origen = d1.id_destino
JOIN destinos d2 ON r.destino = d2.id_destino
JOIN naves n ON v.id_nave = n.id_nave

    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener vuelos:", err);
    res.status(500).send("Error del servidor");
  }
});

app.get("/api/naves", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM naves");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener naves:", err);
    res.status(500).send("Error del servidor");
  }
});

app.get("/api/asientos/:id_vuelo", async (req, res) => {
  const { id_vuelo } = req.params;
  try {
    const result = await pool.query(`
      SELECT a.numero_asiento, a.clase, rv.estado
      FROM reservas_ventas rv
      JOIN asientos a ON rv.id_asiento = a.id_asiento
      WHERE rv.id_vuelo = $1
    `, [id_vuelo]);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener asientos:", err);
    res.status(500).send("Error del servidor");
  }
});

// ---------------- WebSocket ----------------
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado vía WebSocket");

  socket.on("ordenVuelo", async (data) => {
    console.log("📦 Orden recibida:", data);
    try {
      const { tipo, pasaporte, nombre, detalle } = data;

      await pool.query(
        `INSERT INTO ordenes_vuelo (tipo, pasaporte, nombre, detalle)
         VALUES ($1, $2, $3, $4)`,
        [tipo, pasaporte, nombre, detalle]
      );

      console.log("✅ Orden guardada en la base de datos");
    } catch (err) {
      console.error("❌ Error al guardar orden:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado");
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
