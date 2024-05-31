const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'deusbackend'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database');
  createAdminUser();
});

const createAdminUser = () => {
  const adminData = {
    username: 'adminkeren',
    name: 'Admin',
    email: 'admin@keren.com',
    password: 'admin123456'
  };

  bcrypt.hash(adminData.password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
      return;
    }

    const query = 'INSERT INTO users (username, name, email, password) VALUES (?, ?, ?, ?)';
    connection.query(query, [adminData.username, adminData.name, adminData.email, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error adding admin data to database:', err);
        return;
      }
      console.log('Admin data added successfully:', result);
    });
  });
};

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  connection.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    });
  });
});
router.get('/user/:id', (req, res) => {
  const userId = req.params.id; // Mendapatkan ID pengguna dari parameter rute
  const query = 'SELECT * FROM users WHERE id = ?'; // Kueri SQL untuk mendapatkan pengguna berdasarkan ID
  connection.query(query, [userId], (err, results) => { // Melakukan kueri ke database
    if (err) { // Jika terjadi kesalahan saat menjalankan kueri
      console.error('Error querying database:', err); // Log pesan kesalahan ke konsol server
      return res.status(500).json({ message: 'Internal server error' }); // Mengirim respons dengan kode status 500 dan pesan kesalahan
    }

    if (results.length === 0) { // Jika tidak ada hasil yang ditemukan untuk ID pengguna yang diberikan
      return res.status(404).json({ message: 'User not found' }); // Mengirim respons dengan kode status 404 dan pesan "User not found"
    }

    res.json(results[0]); // Mengirim respons dengan data pengguna yang pertama ditemukan (asumsi hanya satu pengguna dengan ID yang diberikan)
  });
});
router.post('/logout', (req, res) => {
  // Di sini Anda bisa melakukan apa pun yang diperlukan untuk logout
  // Misalnya, menghapus token dari sisi klien (dengan menghapus cookie atau membersihkan local storage)
  // dan juga menghapus sesi pengguna dari server jika Anda menyimpannya
  
  res.clearCookie('token'); // Menghapus cookie token dari sisi klien
  res.status(200).json({ message: 'Logout berhasil' }); // Mengirim respons berhasil logout
});

router.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'Access granted to protected resources' });
});

function verifyToken(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }
    req.user = decoded;
    next();
  });
}

module.exports = router;
