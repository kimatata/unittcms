import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import RateLimit from 'express-rate-limit';
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

// init database (Postgres or SQLite via DATABASE_URL)
import { initDb } from './db/index.js';
import { createRepositories } from './repositories/index.js';

const rawDb = await initDb();
const db = { ...rawDb, repos: createRepositories(rawDb) };

// "/"
import indexRoute from './routes/index.js';
app.use('/', indexRoute(db));

// "/health"
import healthIndexRoute from './routes/health/index.js';
app.use('/health', healthIndexRoute(db));

// "users"
import usersIndexRoute from './routes/users/index.js';
import usersFindRoute from './routes/users/find.js';
import usersSearchRoute from './routes/users/search.js';
import usersUpdateUsernameRoute from './routes/users/updateUsername.js';
import usersUpdatePasswordRoute from './routes/users/updatePassword.js';
import usersAdminResetPasswordRoute from './routes/users/adminResetPassword.js';
import usersUpdateLocaleRoute from './routes/users/updateLocale.js';
import usersUpdateAvatarRoute from './routes/users/updateAvatar.js';
import usersUpdateRoleRoute from './routes/users/updateRole.js';
import signUpRoute from './routes/users/signup.js';
import signInRoute from './routes/users/signin.js';
app.use('/users', usersIndexRoute(db));
app.use('/users', usersFindRoute(db));
app.use('/users', usersSearchRoute(db));
app.use('/users', usersUpdateUsernameRoute(db));
app.use('/users', usersUpdatePasswordRoute(db));
app.use('/users', usersAdminResetPasswordRoute(db));
app.use('/users', usersUpdateLocaleRoute(db));
app.use('/users', usersUpdateAvatarRoute(db));
app.use('/users', usersUpdateRoleRoute(db));
app.use('/users', signUpRoute(db));
app.use('/users', signInRoute(db));

// "/projects"
import projectsIndexRoute from './routes/projects/index.js';
import projectsShowRoute from './routes/projects/show.js';
import projectsNewRoute from './routes/projects/new.js';
import projectsEditRoute from './routes/projects/edit.js';
import projectsDeleteRoute from './routes/projects/delete.js';
app.use('/projects', projectsIndexRoute(db));
app.use('/projects', projectsShowRoute(db));
app.use('/projects', projectsNewRoute(db));
app.use('/projects', projectsEditRoute(db));
app.use('/projects', projectsDeleteRoute(db));

// "/folders"
import foldersIndexRoute from './routes/folders/index.js';
import foldersNewRoute from './routes/folders/new.js';
import foldersEditRoute from './routes/folders/edit.js';
import foldersDeleteRoute from './routes/folders/delete.js';
import foldersCloneRoute from './routes/folders/clone.js';
app.use('/folders', foldersIndexRoute(db));
app.use('/folders', foldersNewRoute(db));
app.use('/folders', foldersEditRoute(db));
app.use('/folders', foldersDeleteRoute(db));
app.use('/folders', foldersCloneRoute(db));

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
app.use('/cases', casesDownloadRoute(db));
app.use('/cases', casesMoveRoute(db));
app.use('/cases', casesIndexRoute(db));
app.use('/cases', casesIndexByProjectIdRoute(db));
app.use('/cases', casesShowRoute(db));
app.use('/cases', casesNewRoute(db));
app.use('/cases', casesEditRoute(db));
app.use('/cases', casesDeleteRoute(db));
app.use('/cases', casesCloneRoute(db));
app.use('/cases', casesImportRoute(db));

// "/steps"
import stepsEditRoute from './routes/steps/edit.js';
app.use('/steps', stepsEditRoute(db));

// "/attachments"
import attachmentsNewRoute from './routes/attachments/new.js';
import attachmentsDeleteRoute from './routes/attachments/delete.js';
import attachmentsDownloadRoute from './routes/attachments/download.js';
app.use('/attachments', attachmentsNewRoute(db));
app.use('/attachments', attachmentsDeleteRoute(db));
app.use('/attachments', attachmentsDownloadRoute(db));

// "/runs"
import runsDownloadRoute from './routes/runs/download.js';
import runsIndexRoute from './routes/runs/index.js';
import runsShowRoute from './routes/runs/show.js';
import runsNewRoute from './routes/runs/new.js';
import runsEditRoute from './routes/runs/edit.js';
import runDeleteRoute from './routes/runs/delete.js';

app.use('/runs', runsDownloadRoute(db));
app.use('/runs', runsIndexRoute(db));
app.use('/runs', runsShowRoute(db));
app.use('/runs', runsNewRoute(db));
app.use('/runs', runsEditRoute(db));
app.use('/runs', runDeleteRoute(db));

// "/runcases"
import runCaseIndexRoute from './routes/runcases/index.js';
import runCaseEditRoute from './routes/runcases/edit.js';
app.use('/runcases', runCaseIndexRoute(db));
app.use('/runcases', runCaseEditRoute(db));

// "/members"
import membersIndexRoute from './routes/members/index.js';
import membersNewRoute from './routes/members/new.js';
import membersEditRoute from './routes/members/edit.js';
import membersDeleteRoute from './routes/members/delete.js';
import membersCheckRoute from './routes/members/check.js';
app.use('/members', membersIndexRoute(db));
app.use('/members', membersNewRoute(db));
app.use('/members', membersEditRoute(db));
app.use('/members', membersDeleteRoute(db));
app.use('/members', membersCheckRoute(db));

// "/tags"
import tagsNewRoute from './routes/tags/new.js';
import tagsIndexRoute from './routes/tags/index.js';
import tagsEditRoute from './routes/tags/edit.js';
import tagsDeleteRoute from './routes/tags/delete.js';
import tagsShowRoute from './routes/tags/show.js';
app.use('/tags', tagsNewRoute(db));
app.use('/tags', tagsIndexRoute(db));
app.use('/tags', tagsShowRoute(db));
app.use('/tags', tagsDeleteRoute(db));
app.use('/tags', tagsEditRoute(db));

// "/casetags"
import caseTagsEditRoute from './routes/casetags/edit.js';
app.use('/casetags', caseTagsEditRoute(db));

// "/comments"
import commentsIndexRoute from './routes/comments/index.js';
import commentsNewRoute from './routes/comments/new.js';
import commentsEditRoute from './routes/comments/edit.js';
import commentsDeleteRoute from './routes/comments/delete.js';
app.use('/comments', commentsIndexRoute(db));
app.use('/comments', commentsNewRoute(db));
app.use('/comments', commentsEditRoute(db));
app.use('/comments', commentsDeleteRoute(db));

// "/home"
import homeIndexRoute from './routes/home/index.js';
app.use('/home', homeIndexRoute(db));

// "/automation-configs"
import automationConfigsShowRoute from './routes/automationConfigs/show.js';
import automationConfigsNewRoute from './routes/automationConfigs/new.js';
import automationConfigsEditRoute from './routes/automationConfigs/edit.js';
import automationConfigsGenerateRoute from './routes/automationConfigs/generate.js';
import automationConfigsSyncStatusRoute from './routes/automationConfigs/syncStatus.js';
import automationConfigsTriggerRoute from './routes/automationConfigs/trigger.js';
import automationConfigsRunStatusRoute from './routes/automationConfigs/runStatus.js';
import automationConfigsRepairRoute from './routes/automationConfigs/repair.js';
import automationConfigsRunErrorsRoute from './routes/automationConfigs/runErrors.js';
import automationConfigsFixErrorRoute from './routes/automationConfigs/fixError.js';
import automationConfigsDeleteRepoRoute from './routes/automationConfigs/deleteRepo.js';
import automationConfigsImplementedCasesRoute from './routes/automationConfigs/implementedCases.js';
app.use('/automation-configs', automationConfigsShowRoute(db));
app.use('/automation-configs', automationConfigsNewRoute(db));
app.use('/automation-configs', automationConfigsEditRoute(db));
app.use('/automation-configs', automationConfigsGenerateRoute(db));
app.use('/automation-configs', automationConfigsSyncStatusRoute(db));
app.use('/automation-configs', automationConfigsTriggerRoute(db));
app.use('/automation-configs', automationConfigsRunStatusRoute(db));
app.use('/automation-configs', automationConfigsRepairRoute(db));
app.use('/automation-configs', automationConfigsRunErrorsRoute(db));
app.use('/automation-configs', automationConfigsFixErrorRoute(db));
app.use('/automation-configs', automationConfigsDeleteRepoRoute(db));
app.use('/automation-configs', automationConfigsImplementedCasesRoute(db));

// "/integration-configs"
import integrationConfigsShowRoute from './routes/integrationConfigs/show.js';
import integrationConfigsUpsertRoute from './routes/integrationConfigs/upsert.js';
import integrationConfigsDestroyRoute from './routes/integrationConfigs/destroy.js';
app.use('/integration-configs', integrationConfigsShowRoute(db));
app.use('/integration-configs', integrationConfigsUpsertRoute(db));
app.use('/integration-configs', integrationConfigsDestroyRoute(db));

if (!process.env.SECRET_KEY) {
  console.log(
    "[Warning]: Default key is used for token generation. Please set the environment variable 'SECRET_KEY'`."
  );
}

// Export the app instead of starting the server
export default app;
