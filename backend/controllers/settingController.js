const Setting = require('../models/Setting');

exports.getSettings = async (req, res) => {
  try {
    const setting = await Setting.findOne();
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const [updated] = await Setting.update(req.body, { where: {} });
    const setting = await Setting.findOne();
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};