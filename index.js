require('dotenv').config();
const express = require('express');
const path    = require('path');
const { Pool } = require('pg');

const app  = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.LOCAL ? false : { rejectUnauthorized: false }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ========== HELPERS ========== */
const listCharacters = async () => {
  const { rows } = await pool.query('SELECT * FROM characters ORDER BY id DESC');
  return rows;
};

/* ========== RUTAS ========== */
/* Home / alias / list */
app.get(['/', '/characters'], async (_req, res) => {
  try {
    const characters = await listCharacters();
    res.render('index', { characters });
  } catch (err) {
    console.error('GET / —', err);
    res.status(500).send('Error interno al listar personajes');
  }
});

/* Formulario nuevo */
app.get('/characters/new', (_req, res) => res.render('form', { character: null }));

/* Crear */
app.post('/characters', async (req, res) => {
  try {
    const { name, description, image_url } = req.body;
    await pool.query(
      `INSERT INTO characters (name, description, image_url, created_at)
       VALUES ($1, $2, $3, to_char(NOW(),'YYYY-MM-DD HH24:MI:SS'))`,
      [name, description, image_url]
    );
    res.redirect('/');
  } catch (err) {
    console.error('POST /characters —', err);
    res.status(500).send('No se pudo crear el personaje');
  }
});

/* Formulario editar */
app.get('/characters/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM characters WHERE id=$1', [req.params.id]);
    res.render('form', { character: rows[0] });
  } catch (err) {
    console.error('GET /characters/:id —', err);
    res.status(500).send('Error al cargar el personaje');
  }
});

/* Actualizar */
app.post('/characters/:id', async (req, res) => {
  try {
    const { name, description, image_url } = req.body;
    await pool.query(
      `UPDATE characters
         SET name=$1, description=$2, image_url=$3
       WHERE id=$4`,
      [name, description, image_url, req.params.id]
    );
    res.redirect('/');
  } catch (err) {
    console.error('POST /characters/:id —', err);
    res.status(500).send('No se pudo actualizar');
  }
});

/* Eliminar */
app.post('/characters/:id/delete', async (req, res) => {
  try {
    await pool.query('DELETE FROM characters WHERE id=$1', [req.params.id]);
    res.redirect('/');
  } catch (err) {
    console.error('DELETE /characters/:id —', err);
    res.status(500).send('No se pudo eliminar');
  }
});

/* ─────────────── */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
