require('dotenv').config();
const express = require('express');
const pg = require('pg');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.LOCAL ? false : { rejectUnauthorized: false }
});

const app = express();

// Configuración de Multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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

// Crear personaje (con imagen)
app.post('/characters', upload.single('image'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const imagePath = req.file ? '/uploads/' + req.file.filename : null;

    await pool.query(
      'INSERT INTO characters (name, description, image_url) VALUES ($1, $2, $3)',
      [name, description || '', imagePath]
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

// Actualizar personaje (con imagen)
app.post('/characters/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, description } = req.body;
    let imageUrl = req.body.existingImage;

    if (req.file) {
      imageUrl = '/uploads/' + req.file.filename;
    }

    await pool.query(
      'UPDATE characters SET name = $1, description = $2, image_url = $3 WHERE id = $4',
      [name, description || '', imageUrl, req.params.id]
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
    const { rows } = await pool.query('SELECT image_url FROM characters WHERE id = $1', [req.params.id]);
    
    if (rows[0].image_url) {
      const imagePath = path.join(__dirname, 'public', rows[0].image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await pool.query('DELETE FROM characters WHERE id = $1', [req.params.id]);
    res.redirect('/');
  } catch (err) {
    console.error('Error en POST /characters/:id/delete:', err);
    res.status(500).send('No se pudo eliminar el personaje.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});