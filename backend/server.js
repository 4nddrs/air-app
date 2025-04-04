const express = require("express");
const cors = require("cors"); // <== 👈 Importa cors
const http = require("http");
const { Server } = require("socket.io");
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

app.get("/api/destinos", async (req, res) => {
  try {
    const result = await pool.query("SELECT id_destino, nombre FROM destinos ORDER BY nombre");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener destinos:", err);
    res.status(500).send("Error del servidor");
  }
});

app.get("/api/vuelos/buscar", async (req, res) => {
  const { origen, destino, fecha } = req.query;

  let filtros = [];
  let valores = [];

  if (origen) {
    filtros.push("d1.nombre = $" + (valores.length + 1));
    valores.push(origen);
  }
  if (destino) {
    filtros.push("d2.nombre = $" + (valores.length + 1));
    valores.push(destino);
  }
  if (fecha) {
    filtros.push("v.fecha = $" + (valores.length + 1));
    valores.push(fecha);
  }

  const where = filtros.length > 0 ? "WHERE " + filtros.join(" AND ") : "";

  try {
    const result = await pool.query(
      `
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
      ${where}
      ORDER BY v.fecha
      `,
      valores
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al buscar vuelos:", err);
    res.status(500).send("Error del servidor");
  }
});


// 1. Filtrar solo por origen
app.get('/api/vuelos/origen/:id_origen', async (req, res) => {
  const { id_origen } = req.params;
  try {
    const result = await pool.query(`
      SELECT v.id_vuelo, v.fecha, d1.nombre AS origen, d2.nombre AS destino, r.costo, n.modelo
      FROM vuelos v
      JOIN rutas r ON v.id_ruta = r.id_ruta
      JOIN destinos d1 ON r.origen = d1.id_destino
      JOIN destinos d2 ON r.destino = d2.id_destino
      JOIN naves n ON v.id_nave = n.id_nave
      WHERE r.origen = $1
    `, [id_origen]);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al filtrar por origen:", err);
    res.status(500).json({ error: "Error del servidor" });

  }
});

// 2. Filtrar por origen y destino
app.get('/api/vuelos/origen-destino', async (req, res) => {
  const { origen, destino } = req.query;
  try {
    const result = await pool.query(`
      SELECT v.id_vuelo, v.fecha, d1.nombre AS origen, d2.nombre AS destino, r.costo, n.modelo
      FROM vuelos v
      JOIN rutas r ON v.id_ruta = r.id_ruta
      JOIN destinos d1 ON r.origen = d1.id_destino
      JOIN destinos d2 ON r.destino = d2.id_destino
      JOIN naves n ON v.id_nave = n.id_nave
      WHERE r.origen = $1 AND r.destino = $2
    `, [origen, destino]);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al filtrar por origen y destino:", err);
    res.status(500).send("Error del servidor");
  }
});

// 3. Filtrar por origen, destino y fecha
app.get('/api/vuelos/origen-destino-fecha', async (req, res) => {
  const { origen, destino, fecha } = req.query;
  try {
    const result = await pool.query(`
      SELECT v.id_vuelo, v.fecha, d1.nombre AS origen, d2.nombre AS destino, r.costo, n.modelo
      FROM vuelos v
      JOIN rutas r ON v.id_ruta = r.id_ruta
      JOIN destinos d1 ON r.origen = d1.id_destino
      JOIN destinos d2 ON r.destino = d2.id_destino
      JOIN naves n ON v.id_nave = n.id_nave
      WHERE r.origen = $1 AND r.destino = $2 AND DATE(v.fecha) = $3
    `, [origen, destino, fecha]);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al filtrar por origen, destino y fecha:", err);
    res.status(500).send("Error del servidor");
  }
});

// 4. Filtrar por origen y fecha
app.get('/api/vuelos/origen-fecha', async (req, res) => {
  const { origen, fecha } = req.query;
  try {
    const result = await pool.query(`
      SELECT v.id_vuelo, v.fecha, d1.nombre AS origen, d2.nombre AS destino, r.costo, n.modelo
      FROM vuelos v
      JOIN rutas r ON v.id_ruta = r.id_ruta
      JOIN destinos d1 ON r.origen = d1.id_destino
      JOIN destinos d2 ON r.destino = d2.id_destino
      JOIN naves n ON v.id_nave = n.id_nave
      WHERE r.origen = $1 AND DATE(v.fecha) = $2
    `, [origen, fecha]);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al filtrar por origen y fecha:", err);
    res.status(500).send("Error del servidor");
  }
});




// ---------------- WebSocket ----------------
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado vía WebSocket");

  socket.on("ordenVuelo", (data) => {
    console.log("📦 Orden recibida:", data);
    // Aquí puedes guardar la orden, imprimirla o hacer lógica extra
  });

  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado");
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
