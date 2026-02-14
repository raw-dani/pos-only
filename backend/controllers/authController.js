const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  console.log('DEBUG LOGIN - Login endpoint called with:', req.body);
  let connection;

  try {
    const { username, password } = req.body;
    console.log('Login attempt for:', username);

    // Create direct MySQL connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pos_invoice'
    });

    // Query user with role
    const [rows] = await connection.execute(
      `SELECT u.*, r.name as role_name FROM Users u
       LEFT JOIN Roles r ON u.roleId = r.id
       WHERE u.username = ? AND u.isActive = 1`,
      [username]
    );

    console.log('Query result:', rows);

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    console.log('Found user:', user.username, 'Role:', user.role_name);

    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', { expiresIn: '8h' });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
};