// === server.js ===
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

let usuarios = [];
let asistencias = [];
let contadorUsuarios = 1;

// Mapa de horarios por clase
const horarios = {
  "MÉTODOS NUMÉRICOS": { inicio: "07:00", fin: "09:00" },
  "ECUACIONES DIFERENCIALES": { inicio: "09:00", fin: "12:00" },
  "TUTORIAS 4": { inicio: "12:00", fin: "14:00" },
  "INGLES": { inicio: "09:00", fin: "11:00" },
  "ARQUITECTURA DE COMPUTADORAS": { inicio: "11:00", fin: "13:00" },
  "TÓPICOS AVANZADOS DE PROGRAMACIÓN": { inicio: "13:00", fin: "15:00" },
  "FUNDAMENTOS DE BASE DE DATOS": { inicio: "15:00", fin: "18:00" },
  "TALLER DE SISTEMAS OPERATIVOS": { inicio: "07:00", fin: "09:00" },
  "TALLER DE ÉTICA": { inicio: "09:00", fin: "11:00" },
};

const materiasPorDia = {
  lunes: ["MÉTODOS NUMÉRICOS", "ECUACIONES DIFERENCIALES", "TUTORIAS 4"],
  martes: ["INGLES", "ARQUITECTURA DE COMPUTADORAS", "TÓPICOS AVANZADOS DE PROGRAMACIÓN"],
  miércoles: ["FUNDAMENTOS DE BASE DE DATOS", "TALLER DE SISTEMAS OPERATIVOS"],
  jueves: ["TALLER DE ÉTICA", "ECUACIONES DIFERENCIALES", "TÓPICOS AVANZADOS DE PROGRAMACIÓN"],
  viernes: ["INGLES", "MÉTODOS NUMÉRICOS", "FUNDAMENTOS DE BASE DE DATOS"],
};

function horaStringAMinutos(horaStr) {
  const [h, m] = horaStr.split(":").map(Number);
  return h * 60 + m;
}

// Ruta para registrar usuarios
app.post("/registrar", (req, res) => {
  const { nombre, contrasena } = req.body;
  if (!nombre || !contrasena) return res.status(400).json({ error: "Datos incompletos" });

  const id = contadorUsuarios++;
  usuarios.push({ id, nombre, contrasena });
  res.json({ mensaje: "Usuario registrado", id });
});

app.get("/usuarios", (req, res) => {
  res.json(usuarios);
});

app.delete("/eliminar/:id", (req, res) => {
  const id = parseInt(req.params.id);
  usuarios = usuarios.filter((u) => u.id !== id);
  asistencias = asistencias.filter((a) => a.id !== id);
  res.json({ mensaje: "Usuario eliminado" });
});

app.delete("/borrar-asistencias", (req, res) => {
  asistencias = [];
  res.json({ mensaje: "Todas las asistencias eliminadas" });
});

// Registrar asistencia con verificación de hora
app.post("/asistencia", (req, res) => {
  const { id, contrasena, clase } = req.body;
  const usuario = usuarios.find((u) => u.id == id);
  if (!usuario || usuario.contrasena !== contrasena) {
    return res.status(401).json({ error: "ID o contraseña incorrectos" });
  }
  if (!horarios[clase]) {
    return res.status(400).json({ error: "Clase no encontrada" });
  }
  const ahora = new Date();
  const horaActualMin = ahora.getHours() * 60 + ahora.getMinutes();
  const inicio = horaStringAMinutos(horarios[clase].inicio);
  const fin = horaStringAMinutos(horarios[clase].fin);

  let estado = "";
  if (horaActualMin < inicio) {
    estado = "verde";
  } else if (horaActualMin <= inicio + 15) {
    estado = "anaranjado";
  } else if (horaActualMin > inicio + (fin - inicio) / 2) {
    estado = "rojo";
  } else {
    estado = "anaranjado";
  }

  asistencias.push({
    id: usuario.id,
    nombre: usuario.nombre,
    clase,
    fecha: ahora,
    estado,
  });

  res.json({ mensaje: "Asistencia tomada", estado });
});

app.get("/asistencias", (req, res) => {
  res.json(asistencias);
});

app.get("/hora-servidor", (req, res) => {
  const ahora = new Date();
  const horaStr = ahora.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
  res.json({ hora: horaStr });
});

// Obtener materias según el día actual
app.get("/materias-hoy", (req, res) => {
  const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const hoy = new Date();
  const diaSemana = dias[hoy.getDay()];
  const materias = materiasPorDia[diaSemana] || [];
  res.json({ dia: diaSemana, materias });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
