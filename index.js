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

// Vistas y archivos estáticos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// --- RUTAS CRUD ---

// Listar todos los items
app.get('/', async (req, res) => {
  const { rows: items } = await pool.query('SELECT * FROM items ORDER BY id ASC');
  res.render('index', { items });
});

// Formulario para crear nuevo item
app.get('/items/new', (req, res) => {
  res.render('detail', { item: null });
});

// Crear item
app.post('/items', async (req, res) => {
  const { name, description } = req.body;
  await pool.query(
    'INSERT INTO items (name, description) VALUES ($1, $2)',
    [name, description]
  );
  res.redirect('/');
});

// Ver detalle y editar item
app.get('/items/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM items WHERE id = $1', [
    req.params.id
  ]);
  res.render('detail', { item: rows[0] });
});

// Guardar cambios en item
app.post('/items/:id', async (req, res) => {
  const { name, description } = req.body;
  await pool.query(
    'UPDATE items SET name = $1, description = $2 WHERE id = $3',
    [name, description, req.params.id]
  );
  res.redirect('/');
});

// Eliminar item
app.post('/items/:id/delete', async (req, res) => {
  await pool.query('DELETE FROM items WHERE id = $1', [req.params.id]);
  res.redirect('/');
});

// Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`)
);
