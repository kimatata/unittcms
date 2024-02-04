const express = require('express');
const { Sequelize } = require('sequelize');
const app = express();

// enable frontend access
const cors = require("cors");
const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
};
app.use(cors(corsOptions));

// enable json middleware
app.use(express.json());

// init sequalize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

// "/"
const indexRoute = require('./routes/index');
app.use('/', indexRoute);

// "/projects"
const projectsIndexRoute = require('./routes/projects/index')(sequelize);
const projectsNewRoute = require('./routes/projects/new')(sequelize);
app.use('/projects', projectsIndexRoute);
app.use('/projects', projectsNewRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
