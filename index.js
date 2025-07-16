require('dotenv').config();
const express = require('express');
const pg = require('pg');
const path = require('path');
const multer = require('multer');
const { Pool } = pg;

// Configuración de la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.LOCAL ? false : { rejectUnauthorized: false }
});

const app = express();

// Configuración de Multer (almacenamiento en memoria)
const upload = multer({ storage: multer.memoryStorage() });

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rutas
// Listar personajes
app.get('/', async (req, res) => {
  try {
    const { rows: characters } = await pool.query('SELECT * FROM characters ORDER BY id ASC');
    res.render('index', { characters });
  } catch (err) {
    console.error('Error al listar personajes:', err);
    res.status(500).send('Error al cargar la lista de personajes.');
  }
});

// Mostrar formulario para nuevo personaje
app.get('/characters/new', (req, res) => {
  res.render('detail', { character: null });
});

// Crear nuevo personaje
app.post('/characters', upload.single('image'), async (req, res) => {
  try {
    const { name, description } = req.body;
    let imageUrl = null;

    if (req.file) {
      // Convertir imagen a base64 para desarrollo
      imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    await pool.query(
      'INSERT INTO characters (name, description, image_url) VALUES ($1, $2, $3)',
      [name, description || '', imageUrl]
    );
    res.redirect('/');
  } catch (err) {
    console.error('Error al crear personaje:', err);
    res.status(500).send(`Error al crear personaje: ${err.message}`);
  }
});

// Mostrar formulario de edición
app.get('/characters/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM characters WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).send('Personaje no encontrado');
    res.render('detail', { character: rows[0] });
  } catch (err) {
    console.error('Error al obtener personaje:', err);
    res.status(500).send('Error al cargar el personaje.');
  }
});

// Actualizar personaje
app.post('/characters/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, description } = req.body;
    let imageUrl = req.body.existingImage;

    if (req.file) {
      imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    await pool.query(
      'UPDATE characters SET name = $1, description = $2, image_url = $3 WHERE id = $4',
      [name, description || '', imageUrl, req.params.id]
    );
    res.redirect('/');
  } catch (err) {
    console.error('Error al actualizar personaje:', err);
    res.status(500).send('Error al actualizar el personaje.');
  }
});

// Eliminar personaje
app.post('/characters/:id/delete', async (req, res) => {
  try {
    await pool.query('DELETE FROM characters WHERE id = $1', [req.params.id]);
    res.redirect('/');
  } catch (err) {
    console.error('Error al eliminar personaje:', err);
    res.status(500).send('Error al eliminar el personaje.');
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});