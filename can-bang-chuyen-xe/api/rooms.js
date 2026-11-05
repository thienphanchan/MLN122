import { createHostedServer } from '../server/hosted-server.js';

// Vercel runs the exported HTTP server, including its WebSocket upgrade handler.
// Never start a listener or fall back to a local room file in a Function.
const { server } = createHostedServer();
export default server;
