const express = require("express");
const path = require('path');
const { Sequelize } = require("sequelize");
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

// Specify the directory to serve static files
app.use(express.static(path.join(__dirname, "public")));

// init sequalize
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
});

// "/"
const indexRoute = require("./routes/index");
app.use("/", indexRoute);

// "/projects"
const projectsIndexRoute = require("./routes/projects/index")(sequelize);
const projectsShowRoute = require("./routes/projects/show")(sequelize);
const projectsNewRoute = require("./routes/projects/new")(sequelize);
const projectsEditRoute = require("./routes/projects/edit")(sequelize);
const projectsDeleteRoute = require("./routes/projects/delete")(sequelize);
app.use("/projects", projectsIndexRoute);
app.use("/projects", projectsShowRoute);
app.use("/projects", projectsNewRoute);
app.use("/projects", projectsEditRoute);
app.use("/projects", projectsDeleteRoute);

// "/folders"
const foldersIndexRoute = require("./routes/folders/index")(sequelize);
const foldersNewRoute = require("./routes/folders/new")(sequelize);
const foldersEditRoute = require("./routes/folders/edit")(sequelize);
const foldersDeleteRoute = require("./routes/folders/delete")(sequelize);
app.use("/folders", foldersIndexRoute);
app.use("/folders", foldersNewRoute);
app.use("/folders", foldersEditRoute);
app.use("/folders", foldersDeleteRoute);

// "/cases"
const casesIndexRoute = require("./routes/cases/index")(sequelize);
const casesShowRoute = require("./routes/cases/show")(sequelize);
const casesNewRoute = require("./routes/cases/new")(sequelize);
const casesEditRoute = require("./routes/cases/edit")(sequelize);
const casesDeleteRoute = require("./routes/cases/delete")(sequelize);
const casesBulkDeleteRoute = require("./routes/cases/bulkDelete")(sequelize);
app.use("/cases", casesIndexRoute);
app.use("/cases", casesShowRoute);
app.use("/cases", casesNewRoute);
app.use("/cases", casesEditRoute);
app.use("/cases", casesDeleteRoute);
app.use("/cases", casesBulkDeleteRoute);

// "/steps"
const stepsNewRoute = require("./routes/steps/new")(sequelize);
const stepsDeleteRoute = require("./routes/steps/delete")(sequelize);
app.use("/steps", stepsNewRoute);
app.use("/steps", stepsDeleteRoute);

// "/attachments"
const attachmentsNewRoute = require("./routes/attachments/new")(sequelize);
const attachmentsDeleteRoute = require("./routes/attachments/delete")(sequelize);
const attachmentsDownloadRoute = require("./routes/attachments/download")(sequelize);
app.use("/attachments", attachmentsNewRoute);
app.use("/attachments", attachmentsDeleteRoute);
app.use("/attachments", attachmentsDownloadRoute);

// "/runs"
const runsIndexRoute = require("./routes/runs/index")(sequelize);
const runsShowRoute = require("./routes/runs/show")(sequelize);
const runsNewRoute = require("./routes/runs/new")(sequelize);
const runsEditRoute = require("./routes/runs/edit")(sequelize);
const runDeleteRoute = require("./routes/runs/delete")(sequelize);
app.use("/runs", runsIndexRoute);
app.use("/runs", runsShowRoute);
app.use("/runs", runsNewRoute);
app.use("/runs", runsEditRoute);
app.use("/runs", runDeleteRoute);

// "/runcases"
const runCaseIndexRoute = require("./routes/runcases/index")(sequelize);
const runCaseNewRoute = require("./routes/runcases/new")(sequelize);
const runCaseEditRoute = require("./routes/runcases/edit")(sequelize);
const runCaseBuldNewRoute = require("./routes/runcases/bulkNew")(sequelize);
const runCaseDeleteRoute = require("./routes/runcases/delete")(sequelize);
const runCaseBulkDeleteRoute = require("./routes/runcases/bulkDelete")(sequelize);
app.use("/runcases", runCaseIndexRoute);
app.use("/runcases", runCaseNewRoute);
app.use("/runcases", runCaseEditRoute);
app.use("/runcases", runCaseBuldNewRoute);
app.use("/runcases", runCaseDeleteRoute);
app.use("/runcases", runCaseBulkDeleteRoute);

// "/home"
const homeIndexRoute = require("./routes/home/index")(sequelize);
app.use("/home", homeIndexRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
