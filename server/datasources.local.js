module.exports = {
  "db": {
    "name": "db",
    "connector": "memory"
  },
  "arrayscanDS": {
      "connector": "mssql",
      "host": process.env.HCS_HOST,
      "port": 1433,
      "database": process.env.HCS_DB,
      "username": process.env.HCS_USER,
      "password": process.env.HCS_PASS
  },
  "chemgenDS": {
      "connector": "mysql",
      "host": process.env.CHEMGEN_HOST,
      "database": process.env.CHEMGEN_DB,
      "username": process.env.CHEMGEN_USER,
      "password": process.env.CHEMGEN_PASS
  },
  "wordpressDS": {
      "connector": "mysql",
      "host": process.env.WORDPRESS_HOST,
      "database": process.env.WORDPRESS_DB,
      "username": process.env.WORDPRESS_USER,
      "password": process.env.WORDPRESS_PASS
  }
};
