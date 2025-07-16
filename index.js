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

// Función para listar ítems
async function listItems(req, res) {
  try {
    const { rows: items } = await pool.query(
      'SELECT * FROM items ORDER BY id ASC'
    );
    res.render('index', {items});
  } catch (err) {
    console.error('Error al listar ítems:', err);
    res.status(500).send('Error al cargar la lista de ítems.');
  }
}

// Rutas de listado
app.get('/', listItems);
app.get('/items', listItems);

// Formulario para crear nuevo ítem
app.get('/items/new', (req, res) => {
  res.render('detail', { item: null });
});

// Crear ítem
app.post('/items', async (req, res) => {
  try {
    const name = req.body.name;
    const description = req.body.description || '';
    await pool.query(
      'INSERT INTO items (name, description) VALUES ($1, $2)',
      [name, description]
    );
    res.redirect('/');
  } catch (err) {
    console.error('Error en POST /items:', err);
    res.status(500).send('No se pudo crear el ítem.');
  }
});

// Ver detalle y editar ítem completo
app.get('/items/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM items WHERE id = $1',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).send('Ítem no encontrado');
    res.render('detail', { item: rows[0] });
  } catch (err) {
    console.error('Error en GET /items/:id:', err);
    res.status(500).send('Error al obtener el ítem.');
  }
});

// Actualizar ítem completo
app.post('/items/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    await pool.query(
      'UPDATE items SET name = $1, description = $2 WHERE id = $3',
      [name, description || '', req.params.id]
    );
    res.redirect('/');
  } catch (err) {
    console.error('Error en POST /items/:id:', err);
    res.status(500).send('No se pudo actualizar el ítem.');
  }
});

// Actualizar sólo nombre (inline)
app.post('/items/:id/name', async (req, res) => {
  try {
    const name = req.body.name;
    await pool.query(
      'UPDATE items SET name = $1 WHERE id = $2',
      [name, req.params.id]
    );
    res.redirect('/');
  } catch (err) {
    console.error('Error en POST /items/:id/name:', err);
    res.status(500).send('No se pudo actualizar el nombre.');
  }
});

// Eliminar ítem
app.post('/items/:id/delete', async (req, res) => {
  try {
    await pool.query('DELETE FROM items WHERE id = $1', [req.params.id]);
    res.redirect('/');
  } catch (err) {
    console.error('Error en POST /items/:id/delete:', err);
    res.status(500).send('No se pudo eliminar el ítem.');
  }
});

// Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`)
);
