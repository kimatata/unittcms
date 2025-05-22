const server = require('./server');

const PORT = process.env.PORT || 8001;

server.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
