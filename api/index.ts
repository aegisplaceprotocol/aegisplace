import { createApp } from "../server/_core/app";

// Export the Express app as the default Vercel handler.
// Vercel calls app(req, res) for each incoming request.
export default createApp();
