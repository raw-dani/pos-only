const Product = require('../models/Product');

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{ model: require('../models/Category'), as: 'category' }]
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    console.log('DEBUG PRODUCTS - Create product request');
    console.log('DEBUG PRODUCTS - User:', req.user);
    console.log('DEBUG PRODUCTS - Body:', req.body);

    const product = await Product.create(req.body);
    console.log('DEBUG PRODUCTS - Product created:', product);
    res.status(201).json(product);
  } catch (error) {
    console.error('DEBUG PRODUCTS - Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Product.update(req.body, { where: { id } });
    if (updated) {
      const product = await Product.findByPk(id, {
        include: [{ model: require('../models/Category'), as: 'category' }]
      });
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.destroy({ where: { id } });
    if (deleted) {
      res.json({ message: 'Product deleted' });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};