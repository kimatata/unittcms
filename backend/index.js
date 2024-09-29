const express = require('express');
const RateLimit = require('express-rate-limit');
const path = require('path');
const { Sequelize } = require('sequelize');
const app = express();

// enable frontend access
const cors = require('cors');
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:8000';
const corsOptions = {
  origin: frontendOrigin,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};
app.use(cors(corsOptions));

// enable json middleware
app.use(express.json());

// enable rate limiter
const limiter = RateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 1000, // 1000 requests per hour
  message: 'Too many requests from this IP, please try again after an hour',
});
app.use(limiter);

// Specify the directory to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// init sequalize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database/database.sqlite',
  logging: false,
});

// "/"
const indexRoute = require('./routes/index');
app.use('/', indexRoute);

// "users"
const usersIndexRoute = require('./routes/users/index')(sequelize);
const usersFindRoute = require('./routes/users/find')(sequelize);
const usersSearchRoute = require('./routes/users/search')(sequelize);
const signUpRoute = require('./routes/users/signup')(sequelize);
const signInRoute = require('./routes/users/signin')(sequelize);
app.use('/users', usersIndexRoute);
app.use('/users', usersFindRoute);
app.use('/users', usersSearchRoute);
app.use('/users', signUpRoute);
app.use('/users', signInRoute);
// ESM import
(async () => {
  const updateRoute = await import('./routes/users/update.mjs');
  app.use('/users', updateRoute.default(sequelize));
})();

// "/projects"
const projectsIndexRoute = require('./routes/projects/index')(sequelize);
const projectsShowRoute = require('./routes/projects/show')(sequelize);
const projectsNewRoute = require('./routes/projects/new')(sequelize);
const projectsEditRoute = require('./routes/projects/edit')(sequelize);
const projectsDeleteRoute = require('./routes/projects/delete')(sequelize);
app.use('/projects', projectsIndexRoute);
app.use('/projects', projectsShowRoute);
app.use('/projects', projectsNewRoute);
app.use('/projects', projectsEditRoute);
app.use('/projects', projectsDeleteRoute);

// "/folders"
const foldersIndexRoute = require('./routes/folders/index')(sequelize);
const foldersNewRoute = require('./routes/folders/new')(sequelize);
const foldersEditRoute = require('./routes/folders/edit')(sequelize);
const foldersDeleteRoute = require('./routes/folders/delete')(sequelize);
app.use('/folders', foldersIndexRoute);
app.use('/folders', foldersNewRoute);
app.use('/folders', foldersEditRoute);
app.use('/folders', foldersDeleteRoute);

// "/cases"
const casesIndexRoute = require('./routes/cases/index')(sequelize);
const casesIndexByProjectIdRoute = require('./routes/cases/indexByProjectId')(sequelize);
const casesShowRoute = require('./routes/cases/show')(sequelize);
const casesNewRoute = require('./routes/cases/new')(sequelize);
const casesEditRoute = require('./routes/cases/edit')(sequelize);
const casesDeleteRoute = require('./routes/cases/delete')(sequelize);
app.use('/cases', casesIndexRoute);
app.use('/cases', casesIndexByProjectIdRoute);
app.use('/cases', casesShowRoute);
app.use('/cases', casesNewRoute);
app.use('/cases', casesEditRoute);
app.use('/cases', casesDeleteRoute);

// "/steps"
const stepsEditRoute = require('./routes/steps/edit')(sequelize);
app.use('/steps', stepsEditRoute);

// "/attachments"
const attachmentsNewRoute = require('./routes/attachments/new')(sequelize);
const attachmentsDeleteRoute = require('./routes/attachments/delete')(sequelize);
const attachmentsDownloadRoute = require('./routes/attachments/download')(sequelize);
app.use('/attachments', attachmentsNewRoute);
app.use('/attachments', attachmentsDeleteRoute);
app.use('/attachments', attachmentsDownloadRoute);

// "/runs"
const runsIndexRoute = require('./routes/runs/index')(sequelize);
const runsShowRoute = require('./routes/runs/show')(sequelize);
const runsNewRoute = require('./routes/runs/new')(sequelize);
const runsEditRoute = require('./routes/runs/edit')(sequelize);
const runDeleteRoute = require('./routes/runs/delete')(sequelize);
app.use('/runs', runsIndexRoute);
app.use('/runs', runsShowRoute);
app.use('/runs', runsNewRoute);
app.use('/runs', runsEditRoute);
app.use('/runs', runDeleteRoute);

// "/runcases"
const runCaseIndexRoute = require('./routes/runcases/index')(sequelize);
const runCaseEditRoute = require('./routes/runcases/edit')(sequelize);
app.use('/runcases', runCaseIndexRoute);
app.use('/runcases', runCaseEditRoute);

// "/members"
const membersIndexRoute = require('./routes/members/index')(sequelize);
const membersNewRoute = require('./routes/members/new')(sequelize);
const membersEditRoute = require('./routes/members/edit')(sequelize);
const membersDeleteRoute = require('./routes/members/delete')(sequelize);
const membersCheckRoute = require('./routes/members/check')(sequelize);
app.use('/members', membersIndexRoute);
app.use('/members', membersNewRoute);
app.use('/members', membersEditRoute);
app.use('/members', membersDeleteRoute);
app.use('/members', membersCheckRoute);

// "/home"
const homeIndexRoute = require('./routes/home/index')(sequelize);
app.use('/home', homeIndexRoute);

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
  console.log(`Access from the frontend origin: ${frontendOrigin} is valid.`);
  if (!process.env.SECRET_KEY) {
    console.log(
      "[Warning]: Default key is used for token generation. Please set the environment variable 'SECRET_KEY'`."
    );
  }
});
