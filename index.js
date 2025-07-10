const express = require('express');
const pg = require('pg');
require('dotenv').config();
dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

/* READ (todos) */
app.get('/', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM items ORDER BY id');
  res.render('index', { items: rows });
});

/* CREATE */
app.post('/add', async (req, res) => {
  await pool.query('INSERT INTO items(name) VALUES($1)', [req.body.name]);
  res.redirect('/');
});

/* UPDATE */
app.post('/edit/:id', async (req, res) => {
  await pool.query('UPDATE items SET name=$1 WHERE id=$2',
                  [req.body.name, req.params.id]);
  res.redirect('/');
});

/* DELETE */
app.post('/delete/:id', async (req, res) => {
  await pool.query('DELETE FROM items WHERE id=$1', [req.params.id]);
  res.redirect('/');
});

app.listen(process.env.PORT || 3000, '0.0.0.0');
