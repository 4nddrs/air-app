exports.guardarVuelo = (req, res) => {
  console.log("✈️ Recibido vuelo:", req.body);
  res.status(200).json({ mensaje: "Vuelo guardado correctamente" });
};
