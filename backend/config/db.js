const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "prac_3",
  password: "templario2233",
  port: 5432,
});

module.exports = pool;
