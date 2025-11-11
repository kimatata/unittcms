import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import RateLimit from 'express-rate-limit';
import { Sequelize } from 'sequelize';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
app.use('/', indexRoute());

// "/health"
import healthIndexRoute from './routes/health/index.js';
app.use('/health', healthIndexRoute());

// "users"
import usersIndexRoute from './routes/users/index.js';
import usersFindRoute from './routes/users/find.js';
import usersSearchRoute from './routes/users/search.js';
import usersUpdateUsernameRoute from './routes/users/updateUsername.js';
import usersUpdatePasswordRoute from './routes/users/updatePassword.js';
import usersUpdateAvatarRoute from './routes/users/updateAvatar.js';
import usersUpdateRoleRoute from './routes/users/updateRole.js';
import signUpRoute from './routes/users/signup.js';
import signInRoute from './routes/users/signin.js';
app.use('/users', usersIndexRoute(sequelize));
app.use('/users', usersFindRoute(sequelize));
app.use('/users', usersSearchRoute(sequelize));
app.use('/users', usersUpdateUsernameRoute(sequelize));
app.use('/users', usersUpdatePasswordRoute(sequelize));
app.use('/users', usersUpdateAvatarRoute(sequelize));
app.use('/users', usersUpdateRoleRoute(sequelize));
app.use('/users', signUpRoute(sequelize));
app.use('/users', signInRoute(sequelize));

// "/projects"
import projectsIndexRoute from './routes/projects/index.js';
import projectsShowRoute from './routes/projects/show.js';
import projectsNewRoute from './routes/projects/new.js';
import projectsEditRoute from './routes/projects/edit.js';
import projectsDeleteRoute from './routes/projects/delete.js';
app.use('/projects', projectsIndexRoute(sequelize));
app.use('/projects', projectsShowRoute(sequelize));
app.use('/projects', projectsNewRoute(sequelize));
app.use('/projects', projectsEditRoute(sequelize));
app.use('/projects', projectsDeleteRoute(sequelize));

// "/folders"
import foldersIndexRoute from './routes/folders/index.js';
import foldersNewRoute from './routes/folders/new.js';
import foldersEditRoute from './routes/folders/edit.js';
import foldersDeleteRoute from './routes/folders/delete.js';
import foldersCloneRoute from './routes/folders/clone.js';
app.use('/folders', foldersIndexRoute(sequelize));
app.use('/folders', foldersNewRoute(sequelize));
app.use('/folders', foldersEditRoute(sequelize));
app.use('/folders', foldersDeleteRoute(sequelize));
app.use('/folders', foldersCloneRoute(sequelize));

// "/cases"
import casesDownloadRoute from './routes/cases/download.js';
import casesMoveRoute from './routes/cases/move.js';
import casesIndexRoute from './routes/cases/index.js';
import casesIndexByProjectIdRoute from './routes/cases/indexByProjectId.js';
import casesShowRoute from './routes/cases/show.js';
import casesNewRoute from './routes/cases/new.js';
import casesEditRoute from './routes/cases/edit.js';
import casesDeleteRoute from './routes/cases/delete.js';
import casesCloneRoute from './routes/cases/clone.js';
import casesImportRoute from './routes/cases/import.js';
app.use('/cases', casesDownloadRoute(sequelize));
app.use('/cases', casesMoveRoute(sequelize));
app.use('/cases', casesIndexRoute(sequelize));
app.use('/cases', casesIndexByProjectIdRoute(sequelize));
app.use('/cases', casesShowRoute(sequelize));
app.use('/cases', casesNewRoute(sequelize));
app.use('/cases', casesEditRoute(sequelize));
app.use('/cases', casesDeleteRoute(sequelize));
app.use('/cases', casesCloneRoute(sequelize));
app.use('/cases', casesImportRoute(sequelize));

// "/steps"
import stepsEditRoute from './routes/steps/edit.js';
app.use('/steps', stepsEditRoute(sequelize));

// "/attachments"
import attachmentsNewRoute from './routes/attachments/new.js';
import attachmentsDeleteRoute from './routes/attachments/delete.js';
import attachmentsDownloadRoute from './routes/attachments/download.js';
app.use('/attachments', attachmentsNewRoute(sequelize));
app.use('/attachments', attachmentsDeleteRoute(sequelize));
app.use('/attachments', attachmentsDownloadRoute(sequelize));

// "/runs"
import runsDownloadRoute from './routes/runs/download.js';
import runsIndexRoute from './routes/runs/index.js';
import runsShowRoute from './routes/runs/show.js';
import runsNewRoute from './routes/runs/new.js';
import runsEditRoute from './routes/runs/edit.js';
import runDeleteRoute from './routes/runs/delete.js';

app.use('/runs', runsDownloadRoute(sequelize));
app.use('/runs', runsIndexRoute(sequelize));
app.use('/runs', runsShowRoute(sequelize));
app.use('/runs', runsNewRoute(sequelize));
app.use('/runs', runsEditRoute(sequelize));
app.use('/runs', runDeleteRoute(sequelize));

// "/runcases"
import runCaseIndexRoute from './routes/runcases/index.js';
import runCaseEditRoute from './routes/runcases/edit.js';
app.use('/runcases', runCaseIndexRoute(sequelize));
app.use('/runcases', runCaseEditRoute(sequelize));

// "/members"
import membersIndexRoute from './routes/members/index.js';
import membersNewRoute from './routes/members/new.js';
import membersEditRoute from './routes/members/edit.js';
import membersDeleteRoute from './routes/members/delete.js';
import membersCheckRoute from './routes/members/check.js';
app.use('/members', membersIndexRoute(sequelize));
app.use('/members', membersNewRoute(sequelize));
app.use('/members', membersEditRoute(sequelize));
app.use('/members', membersDeleteRoute(sequelize));
app.use('/members', membersCheckRoute(sequelize));

// "/tags"
import tagsNewRoute from './routes/tags/new.js';
import tagsIndexRoute from './routes/tags/index.js';
import tagsEditRoute from './routes/tags/edit.js';
import tagsDeleteRoute from './routes/tags/delete.js';
import tagsShowRoute from './routes/tags/show.js';
app.use('/tags', tagsNewRoute(sequelize));
app.use('/tags', tagsIndexRoute(sequelize));
app.use('/tags', tagsShowRoute(sequelize));
app.use('/tags', tagsDeleteRoute(sequelize));
app.use('/tags', tagsEditRoute(sequelize));

// "/casetags"
import caseTagsEditRoute from './routes/casetags/edit.js';
app.use('/casetags', caseTagsEditRoute(sequelize));

// "/home"
import homeIndexRoute from './routes/home/index.js';
app.use('/home', homeIndexRoute(sequelize));

if (!process.env.SECRET_KEY) {
  console.log(
    "[Warning]: Default key is used for token generation. Please set the environment variable 'SECRET_KEY'`."
  );
}

// Export the app instead of starting the server
export default app;
