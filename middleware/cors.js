const cors = require('cors');

function applyCors(app) {
  app.use(cors());
}

module.exports = applyCors;
