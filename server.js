require('dotenv').config();
const app = require('./app');
const { initDatabase } = require('./db/init');

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize application', error);
    process.exit(1);
  }
}

startServer();
