const express = require("express");
const cors = require("cors"); // <== 👈 Importa cors
const http = require("http");
const { Server } = require("socket.io");
const { obtenerNaves } = require("./controllers/navesController");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permite conexiones desde cualquier origen (útil en desarrollo)
    methods: ["GET", "POST"], // Permite los métodos HTTP
  },
});
app.get("/api/naves", obtenerNaves);

app.get("/", (req, res) => {
  res.send("🚀 Servidor de vuelos en ejecución");
});

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
