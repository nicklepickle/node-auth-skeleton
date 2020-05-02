const config = require("../config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  config.database.database,
  config.database.user,
  config.database.password, {
  host: config.database.host,
  dialect: config.database.engine,
  pool: config.database.pool
});

const Models = {};
Models.Sequelize = Sequelize;
Models.sequelize = sequelize;
Models.users = require("./user.js")(sequelize, Sequelize);
Models.sessions = require("./session.js")(sequelize, Sequelize);

// more models can go here




Models.sequelize.sync();
module.exports = Models;
