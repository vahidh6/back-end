const app = require('../src/app');
const connectDB = require('../src/config/database');

module.exports = async (req, res) => {
  if (!global.dbConnected) {
    try {
      await connectDB();  // اتصال MongoDB فقط یک بار
      global.dbConnected = true;
    } catch (err) {
      return res.status(500).json({
        error: 'خطا در اتصال به دیتابیس',
        details: err.message
      });
    }
  }

  return app(req, res);
};
