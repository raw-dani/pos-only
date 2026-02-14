const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const auth = async (req, res, next) => {
  try {
    console.log('DEBUG AUTH - Headers:', req.headers);
    console.log('DEBUG AUTH - Authorization header:', req.header('Authorization'));

    const authHeader = req.header('Authorization');
    if (!authHeader) {
      console.log('DEBUG AUTH - No Authorization header');
      return res.status(401).send({ error: 'No authorization header.' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('DEBUG AUTH - Invalid authorization format');
      return res.status(401).send({ error: 'Invalid authorization format.' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('DEBUG AUTH - Token extracted:', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    console.log('DEBUG AUTH - Token decoded:', decoded);

    // Create MySQL connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pos_invoice'
    });

    // Query user with role
    const [rows] = await connection.execute(
      `SELECT u.*, r.name as role_name FROM Users u
       LEFT JOIN Roles r ON u.roleId = r.id
       WHERE u.id = ? AND u.isActive = 1`,
      [decoded.id]
    );

    await connection.end();
    console.log('DEBUG AUTH - User query result:', rows.length, 'rows');

    if (!rows || rows.length === 0) {
      console.log('DEBUG AUTH - User not found');
      throw new Error();
    }

    req.user = {
      id: rows[0].id,
      name: rows[0].name,
      username: rows[0].username,
      role: { name: rows[0].role_name }
    };
    console.log('DEBUG AUTH - Authentication successful for user:', req.user.username);
    next();
  } catch (e) {
    console.log('DEBUG AUTH - Authentication error:', e.message);
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

module.exports = auth;