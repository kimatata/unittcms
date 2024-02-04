const express = require('express');
const { Sequelize } = require('sequelize');
const app = express();

// init sequalize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

// "/"
const indexRoute = require('./routes/index');
app.use('/', indexRoute);

// "/projects"
const projectsRoute = require('./routes/projects')(sequelize);
app.use('/projects', projectsRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
