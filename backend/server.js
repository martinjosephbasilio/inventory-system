const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'inr_packaging_secret_key_2026';

app.use(cors());
app.use(bodyParser.json());

// ============= AUTHENTICATION MIDDLEWARE =============
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

// ============= AUTH API =============

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  const { username, password, full_name, email } = req.body;
  
  try {
    const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.query(
      'INSERT INTO users (username, password, full_name, email, role, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [username, hashedPassword, full_name, email, 'user', 'pending']
    );
    
    res.json({ success: true, message: 'Registration successful! Please wait for admin approval.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const user = result.rows[0];
    
    if (user.status === 'pending') {
      return res.status(401).json({ error: '⏳ Your account is pending approval. Please wait for the administrator to approve your account.' });
    }
    
    if (user.status === 'rejected') {
      return res.status(401).json({ error: '❌ Your account has been rejected. Please contact the administrator for assistance.' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name, status: user.status },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= PROFILE ENDPOINT - UPDATED (kaya na ang username, full_name, email) =============
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const { full_name, username, email } = req.body;
  const userId = req.user.id;
  
  try {
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    // Update username
    if (username !== undefined && username !== req.user.username) {
      // Validate username format
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscore' });
      }
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ error: 'Username must be 3-20 characters' });
      }
      
      // Check if username already exists
      const existingUser = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }
    
    // Update email
    if (email !== undefined) {
      if (email) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }
        
        // Check if email already exists
        const existingEmail = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
        if (existingEmail.rows.length > 0) {
          return res.status(400).json({ error: 'Email already in use' });
        }
      }
      updates.push(`email = $${paramCount++}`);
      values.push(email || null);
    }
    
    // Update full name
    if (full_name !== undefined) {
      if (full_name.length < 2 || full_name.length > 50) {
        return res.status(400).json({ error: 'Full name must be 2-50 characters' });
      }
      updates.push(`full_name = $${paramCount++}`);
      values.push(full_name);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`;
    await pool.query(query, values);
    
    // Get updated user data
    const updatedUser = await pool.query('SELECT id, username, full_name, email, role, status, created_at, last_login FROM users WHERE id = $1', [userId]);
    
    // Generate new token with updated info
    const newToken = jwt.sign(
      { 
        id: updatedUser.rows[0].id, 
        username: updatedUser.rows[0].username, 
        role: updatedUser.rows[0].role, 
        full_name: updatedUser.rows[0].full_name, 
        status: updatedUser.rows[0].status 
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      token: newToken,
      user: updatedUser.rows[0]
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: err.message });
  }
});

// Change password
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { current_password, new_password } = req.body;
  const userId = req.user.id;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    
    const validPassword = await bcrypt.compare(current_password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    const samePassword = await bcrypt.compare(new_password, user.password);
    if (samePassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }
    
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============= ADMIN USER MANAGEMENT ENDPOINTS =============

app.get('/api/auth/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const result = await pool.query('SELECT id, username, full_name, email, role, status, created_at, last_login FROM users ORDER BY status DESC, id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/pending-count', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const result = await pool.query("SELECT COUNT(*) FROM users WHERE status = 'pending'");
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/auth/users/:id/approve', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    await pool.query("UPDATE users SET status = 'approved' WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: 'User approved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/auth/users/:id/reject', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    await pool.query("UPDATE users SET status = 'rejected' WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: 'User rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/auth/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= FORGOT PASSWORD ENDPOINTS =============

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP`);
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000);
    
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );
    
    res.json({ 
      success: true, 
      message: 'Password reset link generated',
      reset_token: resetToken
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, new_password } = req.body;
  
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_expires > NOW()',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    const user = result.rows[0];
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ============= KEEP CONNECTION ALIVE =============
setInterval(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection alive');
  } catch (err) {
    console.error('❌ Database connection lost:', err.message);
  }
}, 30000);

// ============= INITIALIZE DATABASE =============
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'pending',
        reset_token VARCHAR(255),
        reset_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);
    
    await pool.query(`UPDATE users SET status = 'approved' WHERE status IS NULL`);
    await pool.query(`UPDATE users SET email = 'admin@inrpackaging.com' WHERE username = 'admin' AND email IS NULL`);
    
    const adminCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (username, password, full_name, email, role, status) VALUES ($1, $2, $3, $4, $5, $6)',
        ['admin', hashedPassword, 'Administrator', 'admin@inrpackaging.com', 'admin', 'approved']
      );
      console.log('✅ Default admin user created (admin/admin123)');
    }
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        pack_size INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        cost_pack DECIMAL(10,2) NOT NULL,
        cost_base DECIMAL(10,2) NOT NULL,
        sell_pack DECIMAL(10,2) NOT NULL,
        sell_base DECIMAL(10,2) NOT NULL,
        reorder_level INT NOT NULL
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movements (
        id SERIAL PRIMARY KEY,
        datetime TIMESTAMP NOT NULL,
        type VARCHAR(10) NOT NULL,
        item_id VARCHAR(50) NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        unit VARCHAR(20) NOT NULL,
        base_delta INT NOT NULL,
        note TEXT,
        sell_price DECIMAL(10,2),
        total_sales DECIMAL(10,2),
        customer_name VARCHAR(255)
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        description VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        note TEXT
      )
    `);
    
    const itemsCount = await pool.query('SELECT COUNT(*) FROM items');
    if (parseInt(itemsCount.rows[0].count) === 0) {
      const defaultItems = [
        ['ITM-00001', 'Corrugated Box Small', 100, 'Both', 500.00, 5.00, 600.00, 6.00, 500],
        ['ITM-00002', 'Sauce Bag', 100, 'Both', 800.00, 8.00, 1000.00, 10.00, 500],
        ['ITM-00003', 'Plastic Packaging Roll', 50, 'Both', 400.00, 8.00, 500.00, 10.00, 200],
        ['ITM-00004', 'Shipping Box Large', 50, 'Both', 1000.00, 20.00, 1200.00, 24.00, 100],
        ['ITM-00005', 'Bubble Wrap Roll', 20, 'Both', 600.00, 30.00, 750.00, 37.50, 50]
      ];
      
      for (const item of defaultItems) {
        await pool.query(
          `INSERT INTO items (id, name, pack_size, type, cost_pack, cost_base, sell_pack, sell_base, reorder_level) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          item
        );
      }
      console.log(`✅ ${defaultItems.length} default items created.`);
    }
    
    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
  }
} 
// Health check endpoint para sa UptimeRobot
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============= PROTECTED API ROUTES =============

// ITEMS API
app.get('/api/items', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', authenticateToken, async (req, res) => {
  const { id, name, pack_size, type, cost_pack, cost_base, sell_pack, sell_base, reorder_level } = req.body;
  try {
    await pool.query(
      'INSERT INTO items VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, name, pack_size, type, cost_pack, cost_base, sell_pack, sell_base, reorder_level]
    );
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/items/:id', authenticateToken, async (req, res) => {
  const { name, pack_size, type, cost_pack, cost_base, sell_pack, sell_base, reorder_level } = req.body;
  try {
    await pool.query(
      'UPDATE items SET name=$1, pack_size=$2, type=$3, cost_pack=$4, cost_base=$5, sell_pack=$6, sell_base=$7, reorder_level=$8 WHERE id=$9',
      [name, pack_size, type, cost_pack, cost_base, sell_pack, sell_base, reorder_level, req.params.id]
    );
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM items WHERE id=$1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MOVEMENTS API
app.post('/api/movements', authenticateToken, async (req, res) => {
  const { datetime, type, item_id, item_name, quantity, unit, base_delta, note, sell_price, total_sales, customer_name } = req.body;
  try {
    let finalCustomerName = customer_name;
    if (type === 'IN') {
      finalCustomerName = null;
    }
    
    await pool.query(
      `INSERT INTO movements (datetime, type, item_id, item_name, quantity, unit, base_delta, note, sell_price, total_sales, customer_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [datetime, type, item_id, item_name, quantity, unit, base_delta, note, sell_price, total_sales, finalCustomerName]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/movements', authenticateToken, async (req, res) => {
  const { startDate, endDate, itemId, type } = req.query;
  let query = 'SELECT * FROM movements WHERE 1=1';
  let params = [];
  let paramIndex = 1;

  if (startDate) {
    query += ` AND datetime >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }
  if (endDate) {
    query += ` AND datetime <= $${paramIndex}`;
    params.push(endDate + ' 23:59:59');
    paramIndex++;
  }
  if (itemId) {
    query += ` AND item_id = $${paramIndex}`;
    params.push(itemId);
    paramIndex++;
  }
  if (type) {
    query += ` AND type = $${paramIndex}`;
    params.push(type);
    paramIndex++;
  }
  query += ' ORDER BY datetime DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/movements/:id', authenticateToken, async (req, res) => {
  const { datetime, type, item_id, item_name, quantity, unit, base_delta, note, sell_price, total_sales, customer_name } = req.body;
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `UPDATE movements SET 
        datetime = $1, 
        type = $2, 
        item_id = $3, 
        item_name = $4, 
        quantity = $5, 
        unit = $6, 
        base_delta = $7, 
        note = $8, 
        sell_price = $9, 
        total_sales = $10, 
        customer_name = $11
      WHERE id = $12 RETURNING id`,
      [datetime, type, item_id, item_name, quantity, unit, base_delta, note, sell_price, total_sales, customer_name || null, id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Movement not found' });
    }
    
    res.json({ updated: true, id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/movements/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM movements WHERE id = $1 RETURNING id', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Movement not found' });
    }
    
    res.json({ deleted: true, id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STOCK API
app.get('/api/stock', authenticateToken, async (req, res) => {
  try {
    const items = await pool.query('SELECT * FROM items');
    const stockData = [];

    for (const item of items.rows) {
      const result = await pool.query(
        `SELECT COALESCE(SUM(CASE WHEN type='IN' THEN base_delta ELSE -base_delta END), 0) as current_stock 
         FROM movements WHERE item_id = $1`,
        [item.id]
      );
      const current_stock_base = parseInt(result.rows[0].current_stock) || 0;
      stockData.push({
        ...item,
        current_stock_base,
        boxes: Math.floor(current_stock_base / item.pack_size),
        pcs: current_stock_base % item.pack_size
      });
    }
    res.json(stockData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DASHBOARD API
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const totalIn = await pool.query("SELECT COALESCE(SUM(base_delta), 0) as total FROM movements WHERE type='IN'");
    const totalOut = await pool.query("SELECT COALESCE(SUM(base_delta), 0) as total FROM movements WHERE type='OUT'");
    const expenses = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses');
    const sales = await pool.query("SELECT COALESCE(SUM(total_sales), 0) as total FROM movements WHERE type='OUT'");

    res.json({
      total_in_base: parseInt(totalIn.rows[0].total) || 0,
      total_out_base: parseInt(totalOut.rows[0].total) || 0,
      total_expenses: parseFloat(expenses.rows[0].total) || 0,
      gross_sales: parseFloat(sales.rows[0].total) || 0,
      profit: (parseFloat(sales.rows[0].total) || 0) - (parseFloat(expenses.rows[0].total) || 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EXPENSES API
app.get('/api/expenses', authenticateToken, async (req, res) => {
  const { startDate, endDate, category } = req.query;
  let query = 'SELECT * FROM expenses WHERE 1=1';
  let params = [];
  let paramIndex = 1;

  if (startDate) {
    query += ` AND date >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }
  if (endDate) {
    query += ` AND date <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }
  if (category && category !== 'All') {
    query += ` AND category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }
  query += ' ORDER BY date DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', authenticateToken, async (req, res) => {
  const { date, description, category, amount, note } = req.body;
  try {
    await pool.query(
      'INSERT INTO expenses (date, description, category, amount, note) VALUES ($1, $2, $3, $4, $5)',
      [date, description, category, amount, note]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/expenses/:id', authenticateToken, async (req, res) => {
  const { date, description, category, amount, note } = req.body;
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `UPDATE expenses SET 
        date = $1, 
        description = $2, 
        category = $3, 
        amount = $4, 
        note = $5
      WHERE id = $6 RETURNING id`,
      [date, description, category, amount, note, id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json({ updated: true, id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id=$1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= GRACEFUL SHUTDOWN =============
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    await pool.end();
    console.log('✅ Database connections closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

// ============= START SERVER =============
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});