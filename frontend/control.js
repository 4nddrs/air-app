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

function renderSeatMapFromNave(filas, columnas, asientosBD) {
    const seatMapContainer = document.getElementById("seat-map");
    
    seatMapContainer.innerHTML = "";
  
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
    for (let i = 1; i <= filas; i++) {
      const rowDiv = document.createElement("div");
      rowDiv.classList.add("row");
  
      const leftColumn = document.createElement("div");
      leftColumn.classList.add("column-left");
  
      const rightColumn = document.createElement("div");
      rightColumn.classList.add("column-right");
  
      const centralDiv = document.createElement("div");
      centralDiv.classList.add("central");
      centralDiv.innerText = i;
  
      for (let j = 0; j < columnas; j++) {
        const letra = letras[j];
        const numero_asiento = `${letra}${i.toString().padStart(2, '0')}`;
  
        const div = document.createElement("div");
        div.classList.add("seat");

        console.log("🟢 Asientos recibidos (antes de render):", asientosBD);
console.log("Tipo:", Array.isArray(asientosBD), "| Longitud:", asientosBD.length);

  
        // Buscar el asiento en la base de datos
        const asientoBD = asientosBD.find(a => a.numero_asiento === numero_asiento);
  
        if (asientoBD.estado === "Vendido" || asientoBD.estado === "Reservado") {
            div.classList.add("unavailable");
          } else {
            // Solo marcamos como prenium si está libre
            if (asientoBD.tipo_asiento === "Ejecutiva") {
              div.classList.add("prenium");
            } else if (asientoBD.tipo_asiento === "Economica") {
              div.classList.add("standard");
            } else {
              div.classList.add("prenium"); // fallback
            }
          }
  
        div.innerHTML = `<span>${numero_asiento}</span>`;
  
        if (j < columnas / 2) {
          leftColumn.appendChild(div);
        } else {
          rightColumn.appendChild(div);
        }
      }
  
      rowDiv.appendChild(leftColumn);
      rowDiv.appendChild(centralDiv);
      rowDiv.appendChild(rightColumn);
      seatMapContainer.appendChild(rowDiv);
    }
  }
  
  
  

  document.getElementById("flight-select").addEventListener("change", async () => {
    const flightSelect = document.getElementById("flight-select");
    const airplaneSelect = document.getElementById("airplane-select");
    
    const idVuelo = flightSelect.value;
    if (!idVuelo) {
      console.warn("⚠️ No se ha seleccionado vuelo.");
      return;
    }
  
    console.log("✈️ ID vuelo seleccionado:", idVuelo);
  
    try {
      // 1. Traer datos de la nave
      const naveRes = await fetch(`http://localhost:3000/api/vuelo/nave/${idVuelo}`);
      const nave = await naveRes.json();

      
  
      // 2. Traer datos de los asientos
      const asientosRes = await fetch(`http://localhost:3000/api/asientos/${idVuelo}`);
      const asientosBD = await asientosRes.json();
  
      // 3. Mostrar info del avión en el <select>
      airplaneSelect.innerHTML = "";
      const opt = document.createElement("option");
      opt.textContent = `${nave.tipo} (${nave.filas}x${nave.columnas})`;
      airplaneSelect.appendChild(opt);
  
      // 4. Renderizar el mapa de asientos combinando BD + nave
      renderSeatMapFromNave(nave.filas, nave.columnas, asientosBD);
  
    } catch (err) {
      console.error("❌ Error al cargar avión y asientos:", err);
    }
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





  