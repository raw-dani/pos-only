const express = require('express');
const router = express.Router();
const seedData = require('../utils/seeder');

router.post('/', async (req, res) => {
  try {
    await seedData();
    res.json({ message: 'Data seeded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;