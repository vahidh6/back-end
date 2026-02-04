const app = require('../src/app');
const connectDB = require('../src/config/database');

module.exports = async (req, res) => {
  // اتصال به دیتابیس فقط یک بار
  if (!global.dbConnected) {
    try {
      await connectDB();
      global.dbConnected = true;
    } catch (err) {
      return res.status(500).json({ error: 'خطا در اتصال به دیتابیس', details: err.message });
    }
  }

  // اجرای Express app
  return app(req, res);
};
