// Simple Node.js / Express server for FoodShare
// We use this to serve our static PWA files locally and on Vercel

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve all static assets from the public folder with correct MIME types
// so css, js, and json files parse properly in the browser
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        }
    }
}));

// Fallback all other routes back to index.html so our client-side SPA routing handles it
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start listening when running directly with node server.js
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Export app instance so Vercel can run it as a serverless function
module.exports = app;

