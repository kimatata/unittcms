import server from './server.js';
import { PORT } from './config/config.js';

server.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
