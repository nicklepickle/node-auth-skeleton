const fs = require("fs");
const session = require('express-session');
const sessionStore = require('connect-pg-simple')(session);
const config = require('../config');
const createTableSql = config.approot + "/node_modules/connect-pg-simple/table.sql"
const tableExistsSql =
`SELECT table_name
  FROM information_schema.tables
  WHERE table_name = 'session'`;

module.exports = (sequelize, Sequelize) => {
  if (fs.existsSync(createTableSql)) {
    sequelize.query(tableExistsSql).then(function(results) {
      if (results[1].rowCount == 0) {
        fs.readFile(createTableSql, 'utf8', function read(err, data) {
          if (err) {
            console.log('Error reading ' + createTableSql + ': ' + err);
          }
          sequelize.query(data).then(function(ok) {
            console.log('session table created.')
          });
        });
      }
      else {
        console.log('Session table exists.');
      }
    });
  }
  else {
    console.log(createTableSql + ' does not exist. Install connect-pg-simple?');
  }

  return session({
    key: config.session.key,
    secret: config.session.secret,
    store: new sessionStore({conObject: config.database}),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: config.session.secure }
  });
}
