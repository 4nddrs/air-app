const pool = require("../config/db");

const obtenerNaves = async (req, res) => {
  try {
    const resultado = await pool.query("SELECT * FROM naves");
    res.json(resultado.rows);
  } catch (error) {
    console.error("❌ Error al obtener naves:", error);
    res.status(500).json({ error: "Error al obtener naves" });
  }
};

module.exports = {
  obtenerNaves,
};
