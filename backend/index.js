const express = require('express');
const app = express();

// "/"
const indexRoute = require('./routes/index');
app.use('/', indexRoute);

// "/projects"
const projectsRoute = require('./routes/projects');
app.use('/projects', projectsRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
