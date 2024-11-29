const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt"); // Importar bcrypt para cifrado de contraseñas

const app = express();


const corsOptions = {
  origin: 'https://yefrasoft.github.io',  // Especifica el dominio de tu frontend
  methods: ['GET', 'POST'],  // Métodos que deseas permitir
  allowedHeaders: ['Content-Type', 'Authorization'],  // Encabezados que deseas permitir
};
// Habilitar CORS
app.use(cors(corsOptions));

// Configurar el bodyParser para analizar el cuerpo de las solicitudes POST
app.use(bodyParser.json());

// Configurar la conexión a la base de datos MySQL
const db = mysql.createConnection({
  host: "autorack.proxy.rlwy.net",
  port: 59685,
  user: "root",
  password: "BLjlbvYWmedAzxDYvmtgyAczJjNiYZaz", // Cambia esto según tu configuración
  database: "infraccion", // Nombre de tu base de datos
});

// Conectar a MySQL
db.connect((err) => {
  if (err) {
    console.log("Error al conectarse a MySQL:", err);
    return;
  }
  console.log("Conectado a MySQL En Railway");
});
// -----------------------------------------------------------

// Ruta para la creación de ciudadanos (con cifrado de contraseñas)
app.post("/api/users/create", async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res
      .status(400)
      .json({ mensaje: "Todos los campos son obligatorios" });
  }

  try {
    const query =
      "INSERT INTO ciudadanos (nombre, email, password) VALUES (?, ?, ?)";
    db.query(query, [nombre, email, password], (err, resultado) => {
      if (err) {
        console.error("Error al insertar usuario:", err);
        return res.status(500).json({ mensaje: "Error al crear el usuario" });
      }
      res.status(201).json({
        mensaje: "Usuario creado exitosamente",
        id: resultado.insertId,
      });
    });
  } catch (error) {
    console.error("Error en el registro del usuario:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});
// -----------------------------------------------------------

// Ruta para obtener los vehículos de un ciudadano específico
app.get("/api/vehiculos/:ciudadanoId", (req, res) => {
  const ciudadanoId = req.params.ciudadanoId;
  const query = "SELECT * FROM vehiculos WHERE ciudadano_id = ?";

  db.query(query, [ciudadanoId], (err, results) => {
    if (err) {
      console.error("Error al obtener vehículos:", err);
      return res.status(500).json({ mensaje: "Error al obtener vehículos" });
    }
    res.status(200).json(results);
  });
});

// Ruta para el login de ciudadanos (con verificación de contraseñas cifradas)
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  console.log(email, password);

  const query = "SELECT * FROM ciudadanos WHERE email = ?";

  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Error al consultar la base de datos:", err);
      return res.status(500).json({ message: "Error interno del servidor" });
    }

    if (results.length > 0) {
      const usuario = results[0];

      if (isMatch) {
        return res.status(200).json({ message: "Login exitoso", usuario });
      } else {
        return res
          .status(401)
          .json({ message: "Correo o contraseña incorrectos" });
      }
    } else {
      return res
        .status(401)
        .json({ message: "Correo o contraseña incorrectos" });
    }
  });
});
// -----------------------------------------------------------

// Ruta para obtener todos los vehículos
app.get("/api/vehiculos", (req, res) => {
  const query = "SELECT * FROM vehiculos";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener vehículos:", err);
      return res.status(500).json({ mensaje: "Error al obtener vehículos" });
    }
    res.status(200).json(results); // Enviar los resultados en formato JSON
  });
});

// Ruta para el login de agentes de movilidad
app.post("/api/agent/login", (req, res) => {
  const { numero_agente, password } = req.body;

  const query = "SELECT * FROM agentes_movilidad WHERE numero_agente = ?";

  db.query(query, [numero_agente], (err, results) => {
    if (err) {
      console.error("Error al consultar la base de datos:", err);
      return res.status(500).json({ message: "Error interno del servidor" });
    }

    if (results.length > 0) {
      const agente = results[0];

      if (password === agente.password) {
        return res.status(200).json({ message: "Login exitoso", agente });
      } else {
        return res
          .status(401)
          .json({ message: "Número de agente o contraseña incorrectos" });
      }
    } else {
      return res
        .status(401)
        .json({ message: "Número de agente o contraseña incorrectos" });
    }
  });
});
// -----------------------------------------------------------

// Ruta para registrar vehículos
app.post("/api/vehiculos/registrar", (req, res) => {
  const { placas, estado, marca, color, ciudadano_id } = req.body;

  if (!placas || !estado || !marca || !color || !ciudadano_id) {
    return res
      .status(400)
      .json({ mensaje: "Todos los campos son obligatorios" });
  }

  const query =
    "INSERT INTO vehiculos (placas, estado, marca, color, ciudadano_id) VALUES (?, ?, ?, ?, ?)";

  db.query(
    query,
    [placas, estado, marca, color, ciudadano_id],
    (err, resultado) => {
      if (err) {
        console.error("Error al registrar vehículo:", err);
        return res
          .status(500)
          .json({ mensaje: "Error al registrar el vehículo" });
      }
      res.status(201).json({
        mensaje: "Vehículo registrado con éxito",
        id: resultado.insertId,
      });
    }
  );
});
// -----------------------------------------------------------

// Ruta para obtener las infracciones de un agente
app.get("/api/infracciones/agente/:agenteId", (req, res) => {
  const agenteId = req.params.agenteId;

  const query = "SELECT * FROM infracciones WHERE agente_id = ?";

  db.query(query, [agenteId], (err, results) => {
    if (err) {
      console.error("Error al obtener las infracciones:", err);
      return res
        .status(500)
        .json({ message: "Error al obtener las infracciones" });
    }

    if (results.length > 0) {
      return res.status(200).json(results);
    } else {
      return res
        .status(404)
        .json({ message: "No se encontraron infracciones para este agente" });
    }
  });
});
// ----------------------aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-------------------------------------

// Ruta para eliminar una infracción por su ID
app.delete("/api/infracciones/eliminar/:id", (req, res) => {
  const infraccionId = req.params.id;
  console.log(`Intentando eliminar infracción con ID: ${infraccionId}`); // Verificación del ID recibido

  const query = "DELETE FROM infracciones WHERE id = ?";

  db.query(query, [infraccionId], (err, result) => {
    if (err) {
      console.error("Error al eliminar la infracción:", err);
      return res.status(500).json({
        mensaje: "Error al eliminar la infracción",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Infracción no encontrada" });
    }

    res.status(200).json({ mensaje: "Infracción eliminada exitosamente" });
  });
});

// Supongamos que esta función se ejecuta al registrar un nuevo vehículo
app.post("/api/infracciones/registrar", (req, res) => {
  const {
    agente_id,
    ciudadano_id,
    vehiculo_id,
    lugar,
    fecha,
    hora,
    descripcion,
    placas,
    color,
    estado,
    marca,
  } = req.body;

  // Log detallado de cada campo recibido
  console.log("Datos recibidos para registrar infracción:", {
    agente_id,
    ciudadano_id,
    vehiculo_id,
    lugar,
    fecha,
    hora,
    descripcion,
    placas,
    color,
    estado,
    marca,
  });

  if (
    !agente_id ||
    !lugar ||
    !fecha ||
    !hora ||
    !descripcion ||
    !placas ||
    !color ||
    !estado ||
    !marca
  ) {
    console.log("Datos faltantes o inválidos:", req.body);
    return res
      .status(400)
      .json({ mensaje: "Todos los campos son obligatorios" });
  }

  const insertInfraccionQuery = `
    INSERT INTO infracciones (agente_id, ciudadano_id, vehiculo_id, lugar, fecha, hora, descripcion, placas, color, estado, marca)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    agente_id,
    ciudadano_id,
    vehiculo_id,
    lugar,
    fecha,
    hora,
    descripcion,
    placas,
    color,
    estado,
    marca,
  ];

  db.query(insertInfraccionQuery, values, (err, resultado) => {
    if (err) {
      console.error("Error al registrar infracción en la base de datos:", err);
      return res.status(500).json({
        mensaje: "Error al registrar la infracción",
        error: err.message,
      });
    }

    console.log("Infracción registrada con éxito. ID:", resultado.insertId);
    res.status(201).json({
      mensaje: "Infracción registrada con éxito",
      id: resultado.insertId,
    });
  });
});

// Ruta para eliminar vehículos por su id
app.delete("/api/vehiculos/eliminar/:id", (req, res) => {
  const vehiculoId = req.params.id;

  const query = "DELETE FROM vehiculos WHERE id = ?";

  db.query(query, [vehiculoId], (err, result) => {
    if (err) {
      console.error("Error al eliminar el vehículo:", err);
      return res.status(500).json({ mensaje: "Error al eliminar el vehículo" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Vehículo no encontrado" });
    }

    res.status(200).json({ mensaje: "Vehículo eliminado exitosamente" });
  });
});
// -----------------------------------------------------------

// Iniciar el servidor en el puerto 3000
app.listen(3000, () => {
  console.log("Servidor escuchando en el puerto 3000");
});

app.put("/api/reportes/:id/estado", (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({ mensaje: "El estado es obligatorio." });
  }

  const query = "UPDATE reportes SET estado = ? WHERE id = ?";
  db.query(query, [estado, id], (err, result) => {
    if (err) {
      console.error("Error al actualizar el estado del reporte:", err);
      return res
        .status(500)
        .json({ mensaje: "Error al actualizar el estado del reporte." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Reporte no encontrado." });
    }

    res
      .status(200)
      .json({ mensaje: "Estado del reporte actualizado correctamente." });
  });
});

app.get("/api/reportes", async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM reportes");
    res.status(200).json(rows); // Devuelve todos los reportes como JSON
  } catch (error) {
    console.error("Error al obtener reportes:", error);
    res.status(500).json({ mensaje: "Error al obtener reportes" });
  }
});

app.get("/api/reportes/:id", async (req, res) => {
  const reporteId = req.params.id;
  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM reportes WHERE id = ?", [reporteId]);
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Reporte no encontrado" });
    }
    res.status(200).json(rows[0]); // Devuelve el reporte encontrado
  } catch (error) {
    console.error("Error al obtener el reporte:", error);
    res.status(500).json({ mensaje: "Error al obtener el reporte" });
  }
});

app.post("/api/reportes", async (req, res) => {
  const {
    descripcion,
    numero_exterior,
    numero_interior,
    calle,
    codigo_postal,
    estado,
  } = req.body;

  // Validación de los campos requeridos
  if (!descripcion || !numero_exterior || !calle || !codigo_postal) {
    return res.status(400).json({
      mensaje:
        "Los campos descripción, número exterior, calle y código postal son obligatorios",
    });
  }

  try {
    const query = `
      INSERT INTO reportes (descripcion, numero_exterior, numero_interior, calle, codigo_postal, estado)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db
      .promise()
      .query(query, [
        descripcion,
        numero_exterior,
        numero_interior,
        calle,
        codigo_postal,
        estado || "Pendiente",
      ]);
    res
      .status(201)
      .json({ mensaje: "Reporte creado con éxito", id: result.insertId });
  } catch (error) {
    console.error("Error al insertar el reporte:", error);
    res.status(500).json({ mensaje: "Error al insertar el reporte" });
  }
});

app.put("/api/reportes/:id", async (req, res) => {
  const reporteId = req.params.id;
  const {
    descripcion,
    numero_exterior,
    numero_interior,
    calle,
    codigo_postal,
    estado,
  } = req.body;

  try {
    const query = `
      UPDATE reportes
      SET descripcion = ?, numero_exterior = ?, numero_interior = ?, calle = ?, codigo_postal = ?, estado = ?
      WHERE id = ?
    `;
    const [result] = await db
      .promise()
      .query(query, [
        descripcion,
        numero_exterior,
        numero_interior,
        calle,
        codigo_postal,
        estado,
        reporteId,
      ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Reporte no encontrado" });
    }
    res.status(200).json({ mensaje: "Reporte actualizado con éxito" });
  } catch (error) {
    console.error("Error al actualizar el reporte:", error);
    res.status(500).json({ mensaje: "Error al actualizar el reporte" });
  }
});

app.delete("/api/reportes/:id", async (req, res) => {
  const reporteId = req.params.id;

  try {
    const query = "DELETE FROM reportes WHERE id = ?";
    const [result] = await db.promise().query(query, [reporteId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Reporte no encontrado" });
    }
    res.status(200).json({ mensaje: "Reporte eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar el reporte:", error);
    res.status(500).json({ mensaje: "Error al eliminar el reporte" });
  }
});
