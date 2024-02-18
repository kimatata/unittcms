const express = require('express');
const { Sequelize } = require('sequelize');
const app = express();

// enable frontend access
const cors = require("cors");
const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
};
app.use(cors(corsOptions));

// enable json middleware
app.use(express.json());

// init sequalize
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
});

// "/"
const indexRoute = require("./routes/index");
app.use("/", indexRoute);

// "/projects"
const projectsIndexRoute = require('./routes/projects/index')(sequelize);
const projectsNewRoute = require('./routes/projects/new')(sequelize);
const projectsEditRoute = require('./routes/projects/edit')(sequelize);
const projectsDeleteRoute = require('./routes/projects/delete')(sequelize);
app.use('/projects', projectsIndexRoute);
app.use('/projects', projectsNewRoute);
app.use('/projects', projectsEditRoute);
app.use('/projects', projectsDeleteRoute);

// "/folders"
const foldersIndexRoute = require('./routes/folders/index')(sequelize);
const foldersNewRoute = require('./routes/folders/new')(sequelize);
app.use('/folders', foldersIndexRoute);
app.use('/folders', foldersNewRoute);

// "/runs"
const runsIndexRoute = require('./routes/runs/index')(sequelize);
const runsNewRoute = require('./routes/runs/new')(sequelize);
app.use('/runs', runsIndexRoute);
app.use('/runs', runsNewRoute);

// "/cases"
const casesIndexRoute = require('./routes/cases/index')(sequelize);
const casesNewRoute = require('./routes/cases/new')(sequelize);
app.use('/cases', casesIndexRoute);
app.use('/cases', casesNewRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
