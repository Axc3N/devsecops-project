const express = require('express'); 

const helmet = require('helmet'); 

const cors = require('cors'); 

const rateLimit = require('express-rate-limit'); 

const mariadb = require('mariadb'); 

const { body, param, validationResult } = require('express-validator'); 

require('dotenv').config(); 

 

const app = express(); 

const PORT = process.env.PORT || 3000; 

 

// === SECURITE === 

app.use(helmet()); 

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost' })); 

app.use(express.json({ limit: '1mb' })); 

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); 

 

// === BASE DE DONNEES === 

const pool = mariadb.createPool({ 

  host: process.env.DB_HOST || 'mariadb', 

  port: process.env.DB_PORT || 3306, 

  user: process.env.DB_USER || 'app_user', 

  password: process.env.DB_PASSWORD, 

  database: process.env.DB_NAME || 'devsecops', 

  connectionLimit: 5, 

}); 

 

// === INITIALISATION TABLE === 

async function initDB() { 

  const conn = await pool.getConnection(); 

  await conn.query(` 

    CREATE TABLE IF NOT EXISTS users ( 

      id INT AUTO_INCREMENT PRIMARY KEY, 

      name VARCHAR(100) NOT NULL, 

      email VARCHAR(255) NOT NULL UNIQUE, 

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 

    ) 

  `); 

  conn.release(); 

} 

initDB().catch(console.error); 

 

// === VALIDATION === 

const userValidation = [ 

  body('name').trim().isLength({ min: 2, max: 100 }).escape(), 

  body('email').isEmail().normalizeEmail(), 

]; 

const idValidation = [param('id').isInt({ min: 1 })]; 

 

function handleValidation(req, res, next) { 

  const errors = validationResult(req); 

  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); 

  next(); 

} 

 

// === ROUTES CRUD === 

// CREATE 

app.post('/api/users', userValidation, handleValidation, async (req, res) => { 

  try { 

    const conn = await pool.getConnection(); 

    const result = await conn.query( 

      'INSERT INTO users (name, email) VALUES (?, ?)', 

      [req.body.name, req.body.email] 

    ); 

    conn.release(); 

    res.status(201).json({ id: Number(result.insertId), name: req.body.name, email: req.body.email }); 

  } catch (err) { 

    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' }); 

    res.status(500).json({ error: 'Internal server error' }); 

  } 

}); 

 

// READ ALL 

app.get('/api/users', async (req, res) => { 

  try { 

    const conn = await pool.getConnection(); 

    const rows = await conn.query('SELECT * FROM users ORDER BY id DESC'); 

    conn.release(); 

    res.json(rows); 

  } catch (err) { res.status(500).json({ error: 'Internal server error' }); } 

}); 

 

// READ ONE 

app.get('/api/users/:id', idValidation, handleValidation, async (req, res) => { 

  try { 

    const conn = await pool.getConnection(); 

    const rows = await conn.query('SELECT * FROM users WHERE id = ?', [req.params.id]); 

    conn.release(); 

    if (rows.length === 0) return res.status(404).json({ error: 'User not found' }); 

    res.json(rows[0]); 

  } catch (err) { res.status(500).json({ error: 'Internal server error' }); } 

}); 

 

// UPDATE 

app.put('/api/users/:id', [...idValidation, ...userValidation], handleValidation, async (req, res) => { 

  try { 

    const conn = await pool.getConnection(); 

    const result = await conn.query( 

      'UPDATE users SET name = ?, email = ? WHERE id = ?', 

      [req.body.name, req.body.email, req.params.id] 

    ); 

    conn.release(); 

    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' }); 

    res.json({ id: Number(req.params.id), name: req.body.name, email: req.body.email }); 

  } catch (err) { res.status(500).json({ error: 'Internal server error' }); } 

}); 

 

// DELETE 

app.delete('/api/users/:id', idValidation, handleValidation, async (req, res) => { 

  try { 

    const conn = await pool.getConnection(); 

    const result = await conn.query('DELETE FROM users WHERE id = ?', [req.params.id]); 

    conn.release(); 

    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' }); 

    res.json({ message: 'User deleted' }); 

  } catch (err) { res.status(500).json({ error: 'Internal server error' }); } 

}); 

 

// HEALTH CHECK 

app.get('/api/health', (req, res) => res.json({ status: 'ok' })); 

 

app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 

module.exports = app; 