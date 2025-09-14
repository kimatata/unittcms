import path from 'path';
import express from 'express';
import cors from 'cors';
import RateLimit from 'express-rate-limit';
import { Sequelize } from 'sequelize';
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const app = express();

// enable frontend access
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
const databasePath = path.resolve(__dirname, 'database/database.sqlite');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databasePath,
  logging: false,
});

// "/"
import indexRoute from './routes/index.js';
app.use('/', indexRoute.default(sequelize));

// "/health"
import healthIndexRoute from './routes/health/index.js';
app.use('/health', healthIndexRoute.default(sequelize));

// "users"
import usersIndexRoute from './routes/users/index.js';
import usersFindRoute from './routes/users/find.js';
import usersSearchRoute from './routes/users/search.js';
import usersUpdateRoute from './routes/users/update.js';
import signUpRoute from './routes/users/signup.js';
import signInRoute from './routes/users/signin.js';
app.use('/users', usersIndexRoute.default(sequelize));
app.use('/users', usersFindRoute.default(sequelize));
app.use('/users', usersSearchRoute.default(sequelize));
app.use('/users', usersUpdateRoute.default(sequelize));
app.use('/users', signUpRoute.default(sequelize));
app.use('/users', signInRoute.default(sequelize));

// "/projects"
import projectsIndexRoute from './routes/projects/index.js';
import projectsShowRoute from './routes/projects/show.js';
import projectsNewRoute from './routes/projects/new.js';
import projectsEditRoute from './routes/projects/edit.js';
import projectsDeleteRoute from './routes/projects/delete.js';
app.use('/projects', projectsIndexRoute.default(sequelize));
app.use('/projects', projectsShowRoute.default(sequelize));
app.use('/projects', projectsNewRoute.default(sequelize));
app.use('/projects', projectsEditRoute.default(sequelize));
app.use('/projects', projectsDeleteRoute.default(sequelize));

// "/folders"
import foldersIndexRoute from './routes/folders/index.js';
import foldersNewRoute from './routes/folders/new.js';
import foldersEditRoute from './routes/folders/edit.js';
import foldersDeleteRoute from './routes/folders/delete.js';
app.use('/folders', foldersIndexRoute.default(sequelize));
app.use('/folders', foldersNewRoute.default(sequelize));
app.use('/folders', foldersEditRoute.default(sequelize));
app.use('/folders', foldersDeleteRoute.default(sequelize));

// "/cases"
import casesDownloadRoute from './routes/cases/download.js';
import casesIndexRoute from './routes/cases/index.js';
import casesIndexByProjectIdRoute from './routes/cases/indexByProjectId.js';
import casesShowRoute from './routes/cases/show.js';
import casesNewRoute from './routes/cases/new.js';
import casesEditRoute from './routes/cases/edit.js';
import casesDeleteRoute from './routes/cases/delete.js';
app.use('/cases', casesDownloadRoute.default(sequelize));
app.use('/cases', casesIndexRoute.default(sequelize));
app.use('/cases', casesIndexByProjectIdRoute);
app.use('/cases', casesShowRoute.default(sequelize));
app.use('/cases', casesNewRoute.default(sequelize));
app.use('/cases', casesEditRoute.default(sequelize));
app.use('/cases', casesDeleteRoute.default(sequelize));

// "/steps"
import stepsEditRoute from './routes/steps/edit.js';
app.use('/steps', stepsEditRoute.default(sequelize));

// "/attachments"
import attachmentsNewRoute from './routes/attachments/new.js';
import attachmentsDeleteRoute from './routes/attachments/delete.js';
import attachmentsDownloadRoute from './routes/attachments/download.js';
app.use('/attachments', attachmentsNewRoute.default(sequelize));
app.use('/attachments', attachmentsDeleteRoute.default(sequelize));
app.use('/attachments', attachmentsDownloadRoute.default(sequelize));

// "/runs"
import runsDownloadRoute from './routes/runs/download.js';
import runsIndexRoute from './routes/runs/index.js';
import runsShowRoute from './routes/runs/show.js';
import runsNewRoute from './routes/runs/new.js';
import runsEditRoute from './routes/runs/edit.js';
import runDeleteRoute from './routes/runs/delete.js';

app.use('/runs', runsDownloadRoute.default(sequelize));
app.use('/runs', runsIndexRoute.default(sequelize));
app.use('/runs', runsShowRoute.default(sequelize));
app.use('/runs', runsNewRoute.default(sequelize));
app.use('/runs', runsEditRoute.default(sequelize));
app.use('/runs', runDeleteRoute.default(sequelize));

// "/runcases"
import runCaseIndexRoute from './routes/runcases/index.js';
import runCaseEditRoute from './routes/runcases/edit.js';
app.use('/runcases', runCaseIndexRoute.default(sequelize));
app.use('/runcases', runCaseEditRoute.default(sequelize));

// "/members"
import membersIndexRoute from './routes/members/index.js';
import membersNewRoute from './routes/members/new.js';
import membersEditRoute from './routes/members/edit.js';
import membersDeleteRoute from './routes/members/delete.js';
import membersCheckRoute from './routes/members/check.js';
app.use('/members', membersIndexRoute.default(sequelize));
app.use('/members', membersNewRoute.default(sequelize));
app.use('/members', membersEditRoute.default(sequelize));
app.use('/members', membersDeleteRoute.default(sequelize));
app.use('/members', membersCheckRoute.default(sequelize));

// "/home"
import homeIndexRoute from './routes/home/index.js';
app.use('/home', homeIndexRoute.default(sequelize));

if (!process.env.SECRET_KEY) {
  console.log(
    "[Warning]: Default key is used for token generation. Please set the environment variable 'SECRET_KEY'`."
  );
}

// Export the app instead of starting the server
export default app;
