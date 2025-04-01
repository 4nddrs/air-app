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

document.getElementById("buy-btn").addEventListener("click", () => {
    enviarDatosAlServidor("compra");
});

document.getElementById("reserve-btn").addEventListener("click", () => {
    enviarDatosAlServidor("reserva");
});

function enviarDatosAlServidor(tipo) {
    const pasaporte = document.getElementById("customer-passport").value;
    const nombre = document.getElementById("customer-name").value;
    const detalle = document.getElementById("detail-output").textContent;

    if (!pasaporte || !nombre) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    const datos = {
        tipo: tipo, // "compra" o "reserva"
        pasaporte: pasaporte,
        nombre: nombre,
        detalle: detalle // por ejemplo: "Seat: C01, Flight: New-York - Montreal, Total: $300"
    };

    socket.emit("ordenVuelo", datos);
    console.log("📨 Datos enviados al servidor:", datos);
}
