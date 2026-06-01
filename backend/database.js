const { Pool } = require('pg');

// PostgreSQL connection - Gamit ang Railway environment variables
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'postgres.railway.internal',
  database: process.env.PGDATABASE || 'railway',
  password: process.env.PGPASSWORD || 'tmOYjAxXPyaOBMUceRCRsEZWsxhrqVOJ',
  port: process.env.PGPORT || 5432,
});

// Create tables function
const initDB = async () => {
  try {
    // Create items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pack_size INTEGER NOT NULL,
        type TEXT NOT NULL,
        cost_pack DECIMAL(10,2) NOT NULL,
        cost_base DECIMAL(10,2) NOT NULL,
        sell_pack DECIMAL(10,2) NOT NULL,
        sell_base DECIMAL(10,2) NOT NULL,
        reorder_level INTEGER DEFAULT 0
      )
    `);

    // Create movements table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movements (
        id SERIAL PRIMARY KEY,
        datetime TEXT NOT NULL,
        type TEXT NOT NULL,
        item_id TEXT NOT NULL,
        item_name TEXT NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit TEXT NOT NULL,
        base_delta INTEGER NOT NULL,
        note TEXT,
        sell_price DECIMAL(10,2),
        total_sales DECIMAL(10,2)
      )
    `);

    // Create expenses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        note TEXT
      )
    `);

    // Check if items table is empty
    const result = await pool.query('SELECT COUNT(*) FROM items');
    if (parseInt(result.rows[0].count) === 0) {
      // Insert sample packaging items
      await pool.query(`
        INSERT INTO items (id, name, pack_size, type, cost_pack, cost_base, sell_pack, sell_base, reorder_level) VALUES
        ('ITM-00001', 'Corrugated Box (10x10x10)', 50, 'Both', 2500, 50, 3500, 70, 100),
        ('ITM-00002', 'Plastic Packaging Roll', 100, 'Both', 800, 8, 1200, 12, 50),
        ('ITM-00003', 'Stretch Film (500m)', 1, 'Both', 450, 450, 650, 650, 20),
        ('ITM-00004', 'Packaging Tape (48mm)', 24, 'Both', 600, 25, 900, 37.50, 30),
        ('ITM-00005', 'Bubble Wrap Roll', 10, 'Both', 1200, 120, 1800, 180, 25),
        ('ITM-00006', 'Polybag (10x15")', 100, 'Both', 500, 5, 800, 8, 200),
        ('ITM-00007', 'Carton Sealer', 1, 'Both', 3500, 3500, 5000, 5000, 5),
        ('ITM-00008', 'Label Sticker Roll', 500, 'Both', 750, 1.50, 1000, 2, 100)
      `);
      console.log('✓ Sample items inserted');
    }

    console.log('✓ Database tables ready');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
};

initDB();

module.exports = pool;