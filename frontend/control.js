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

document.addEventListener("DOMContentLoaded", () => {
    const selectClassLoad = document.getElementById("class-load");
  
    fetch("http://localhost:3000/api/naves")
      .then(response => response.json())
      .then(data => {
        console.log("📦 Naves recibidas:", data); // 👈 Agrega este log para verificar
        selectClassLoad.innerHTML = "";
  
        data.forEach(nave => {
          const option = document.createElement("option");
          option.value = nave.modelo.replace(/\s+/g, ""); // Ej: "Boeing 737" -> "Boeing737"
          option.textContent = nave.modelo;
          selectClassLoad.appendChild(option);
        });
      })
      .catch(error => {
        console.error("❌ Error al cargar naves:", error);
      });
  });





  