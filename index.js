require('dotenv').config();
const express = require('express');
const pg = require('pg');
const path = require('path');

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.LOCAL
    ? false
    : { rejectUnauthorized: false }
});

const app = express();
app.use(express.urlencoded({ extended: true }));

// Configuración de vistas y archivos estáticos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Función para listar personajes
async function listCharacters(req, res) {
  try {
    const { rows: characters } = await pool.query(
      'SELECT * FROM characters ORDER BY id ASC'
    );
    res.render('index', { characters });
  } catch (err) {
    console.error('Error al listar personajes:', err);
    res.status(500).send('Error al cargar la lista de personajes.');
  }
}

// Rutas
app.get('/', listCharacters);
app.get('/characters', listCharacters);

// Formulario para crear nuevo personaje
app.get('/characters/new', (req, res) => {
  res.render('detail', { character: null });
});

// Crear personaje
app.post('/characters', async (req, res) => {
  try {
    const { name, description } = req.body;
    await pool.query(
      'INSERT INTO characters (name, description) VALUES ($1, $2)',
      [name, description || '']
    );
    res.redirect('/');
  } catch (err) {
    console.error('Error en POST /characters:', err);
    res.status(500).send('No se pudo crear el personaje.');
  }
});

// Ver detalle y editar personaje
app.get('/characters/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM characters WHERE id = $1',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).send('Personaje no encontrado');
    res.render('detail', { character: rows[0] });
  } catch (err) {
    console.error('Error en GET /characters/:id:', err);
    res.status(500).send('Error al obtener el personaje.');
  }
});

// Actualizar personaje
app.post('/characters/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    await pool.query(
      'UPDATE characters SET name = $1, description = $2 WHERE id = $3',
      [name, description || '', req.params.id]
    );
    res.redirect('/');
  } catch (err) {
    console.error('Error en POST /characters/:id:', err);
    res.status(500).send('No se pudo actualizar el personaje.');
  }
});

// Eliminar personaje
app.post('/characters/:id/delete', async (req, res) => {
  try {
    await pool.query('DELETE FROM characters WHERE id = $1', [req.params.id]);
    res.redirect('/');
  } catch (err) {
    console.error('Error en POST /characters/:id/delete:', err);
    res.status(500).send('No se pudo eliminar el personaje.');
  }
});

// Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});