module.exports = {
  database: {
    host: "localhost",
    user: "<database user>",
    password: "<database password>",
    database: "<database name>",
    engine: "postgres"
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  session: {
    key: "session.id",
    secret: "<session salt>",
    secure: false  // should always be true in a production environment
  },
  password: {
    saltrounds: 10, // bcrypt cost factor
    maxattempts: 10, // number of failed attempts before lock or 0 for off
    minlength: 6, // length requirement
    complexity: 1 // 0 for none or 1-3 for increasing complexity
  },
  approot: __dirname
};
