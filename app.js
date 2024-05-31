const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

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

const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

module.exports = app;
