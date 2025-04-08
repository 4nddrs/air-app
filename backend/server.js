const express = require("express");
const cors = require("cors"); // <== 👈 Importa cors
const http = require("http");
const { Server } = require("socket.io");
const pool = require("./config/db");

const app = express();
app.use(express.json()); // 👈 ¡Esto es necesario para parsear JSON del body!


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
  v.id, 
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

//app.get("/api/asientos/:id_vuelo", async (req, res) => {
  //const { id_vuelo } = req.params;
  //try {
  //  const result = await pool.query(`
  //    SELECT a.numero_asiento, a.tipo_asiento, a.estado
 //     FROM reservas rv
  //    JOIN asientos a ON rv.asiento_id = a.id
  //    WHERE a.vuelo_id = $1
  //  `, [id_vuelo]);
  //  res.json(result.rows);
  //} catch (err) {
  //  console.error("❌ Error al obtener asientos:", err);
   // res.status(500).send("Error del servidor");
  //}
//});

app.get("/api/asientos/:id_vuelo", async (req, res) => {
  const { id_vuelo } = req.params;
  try {
    const result = await pool.query(`
      SELECT a.numero_asiento, a.tipo_asiento, a.estado
      FROM asientos a
      WHERE a.vuelo_id = $1
    `, [id_vuelo]);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener asientos:", err);
    res.status(500).send("Error del servidor");
  }
});

app.get("/api/destinos", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, nombre FROM destinos ORDER BY nombre");
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
      SELECT v.id, v.fecha, d1.nombre AS origen, d2.nombre AS destino, r.precio_base, n.tipo
      FROM vuelos v
      JOIN rutas_comerciales r ON v.id_ruta = r.id
      JOIN destinos d1 ON r.origen_id = d1.id
      JOIN destinos d2 ON r.destino_id = d2.id
      JOIN naves n ON v.id_nave = n.id
      WHERE r.origen_id =$1
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
      SELECT v.id, v.fecha, d1.nombre AS origen, d2.nombre AS destino, r.precio_base, n.tipo
      FROM vuelos v
      JOIN rutas_comerciales r ON v.id_ruta = r.id
      JOIN destinos d1 ON r.origen_id = d1.id
      JOIN destinos d2 ON r.destino_id = d2.id
      JOIN naves n ON v.id_nave = n.id
      WHERE r.origen_id = $1 AND r.destino_id = $2
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
      SELECT v.id, v.fecha, d1.nombre AS origen, d2.nombre AS destino, r.precio_base, n.tipo
      FROM vuelos v
      JOIN rutas_comerciales r ON v.id_ruta = r.id
      JOIN destinos d1 ON r.origen_id = d1.id
      JOIN destinos d2 ON r.destino_id = d2.id
      JOIN naves n ON v.id_nave = n.id
      WHERE r.origen_id = $1 AND r.destino_id = $2 AND DATE(v.fecha) = $3
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
      SELECT v.id, v.fecha, d1.nombre AS origen, d2.nombre AS destino, r.precio_base, n.tipo
      FROM vuelos v
      JOIN rutas_comerciales r ON v.id_ruta = r.id
      JOIN destinos d1 ON r.origen_id = d1.id
      JOIN destinos d2 ON r.destino_id = d2.id
      JOIN naves n ON v.id_nave = n.id
      WHERE r.origen_id = $1 AND DATE(v.fecha) = $2
    `, [origen, fecha]);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al filtrar por origen y fecha:", err);
    res.status(500).send("Error del servidor");
  }
});

app.get("/api/asientos/:idVuelo", async (req, res) => {
  const { idVuelo } = req.params;

  try {
    const result = await pool.query(`
      SELECT a.id, a.numero_asiento, a.estado, a.tipo_asiento
      FROM asientos a
      WHERE a.vuelo_id = $1
    `, [idVuelo]);

    res.json(result.rows); // ✅ Devuelve los asientos incluyendo su ID
  } catch (err) {
    console.error("❌ Error al obtener asientos del vuelo:", err);
    res.status(500).send("Error del servidor");
  }
});


// ✅ Nueva ruta para obtener nave del vuelo por ID
app.get("/api/vuelo/nave/:id_vuelo", async (req, res) => {
  const { id_vuelo } = req.params;

  try {
    const result = await pool.query(`
      SELECT n.tipo, n.filas, n.columnas
      FROM vuelos v
      JOIN naves n ON v.id_nave = n.id
      WHERE v.id = $1
    `, [id_vuelo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Nave no encontrada para ese vuelo" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al obtener la nave del vuelo:", err);
    res.status(500).send("Error del servidor");
  }
});



//Buscar pasajero
app.get("/api/pasajeros/sugerencias", async (req, res) => {
  const { q } = req.query;

  try {
    const result = await pool.query(`
      SELECT pasaporte, nombre_completo
      FROM pasajeros 
      WHERE CAST(pasaporte AS TEXT) LIKE $1
      LIMIT 5
    `, [`${q}%`]);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al buscar sugerencias de pasaportes:", err);
    res.status(500).send("Error del servidor");
  }
});


//api estado asientos
app.post("/api/asientos/cambiar-estado", async (req, res) => {
  const { vuelo_id, numero_asiento, nuevo_estado } = req.body;
  console.log("📦 Info recibida:", vuelo_id, numero_asiento,nuevo_estado);
  if (!vuelo_id || !numero_asiento || !nuevo_estado) {
    return res.status(400).send("Faltan datos requeridos");
  }

  try {
    const result = await pool.query(
      `UPDATE asientos 
       SET estado = $1,
           ultima_actualizacion_epoch = EXTRACT(EPOCH FROM NOW())
       WHERE vuelo_id = $2 AND numero_asiento = $3`,
      [nuevo_estado, vuelo_id, numero_asiento]
    );

    res.json({ success: true, mensaje: "Estado actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error al actualizar estado:", err);
    res.status(500).send("Error en el servidor");
  }
});
//----------------------------------------------------------------------


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
