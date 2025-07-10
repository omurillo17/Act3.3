const express = require('express');
const pg      = require('pg');
require('dotenv').config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Railway exige SSL; desactívalo solo en local con la variable LOCAL=1
  ssl: process.env.LOCAL ? false : { rejectUnauthorized: false }
});

const app = express();
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');         // si usas otra, cámbialo


// LISTAR TODOS
app.get('/', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM items ORDER BY id');
  res.render('index', { items: rows });        // vista index.ejs
});

// DETALLE
app.get('/items/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).send('Item no encontrado');
  res.render('detail', { item: rows[0] });     // vista detail.ejs
});

// CREAR
app.post('/add', async (req, res) => {
  await pool.query('INSERT INTO items(name) VALUES ($1)', [req.body.name]);
  res.redirect('/');
});

// ACTUALIZAR
app.post('/edit/:id', async (req, res) => {
  await pool.query('UPDATE items SET name = $1 WHERE id = $2',
                   [req.body.name, req.params.id]);
  res.redirect('/');
});

// ELIMINAR
app.post('/delete/:id', async (req, res) => {
  await pool.query('DELETE FROM items WHERE id = $1', [req.params.id]);
  res.redirect('/');
});

const PORT = process.env.PORT || 3000; 
app.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`)
);
