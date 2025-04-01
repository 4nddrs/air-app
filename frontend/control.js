console.log("✅ El archivo conexion.js está funcionando correctamente");

// Conectar a WebSocket
const API_URL = "http://localhost:3000";
const socket = io(API_URL);

socket.on("connect", () => {
    console.log("🟢 Conectado al servidor WebSocket");
});

socket.on("disconnect", () => {
    console.log("🔴 Desconectado del servidor WebSocket");
});

