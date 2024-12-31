require('dotenv').config();
const puppeteer = require('puppeteer');
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 4000;

// Raw body parser middleware
app.use(express.raw({
    type: '*/*',  // Accept all types, can be changed to 'text/plain' or 'application/json' based on the client
    limit: '50mb'
}));

// Middleware to handle the raw body
app.use((req, res, next) => {
    if (req.method === 'POST') {
        try {
            req.body = req.body.toString('utf8');
            console.log('Request Body:', req.body);  // Debug log to verify the received raw body
            req.body = req.body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        } catch (error) {
            console.error('Body parsing error:', error);
            return res.status(400).json({ error: 'Invalid body content' });
        }
    }
    next();
});

// POST /execute endpoint for executing JavaScript code
app.post("/execute", async (req, res) => {
    const jsCode = req.body;  // Raw body content
    console.log('Received JS Code:', jsCode); // Debug log to check if the body is being received correctly
    if (!jsCode) return res.status(400).json({ error: "No JavaScript code provided." });

    try {
        // Wrapping eval in a promise to handle async code
        const result = await new Promise((resolve, reject) => {
            try {
                const evaluated = eval(jsCode);  // Execute the code
                if (evaluated instanceof Promise) {
                    // If the result is a promise, wait for it to resolve
                    evaluated.then(resolve).catch(reject);
                } else {
                    resolve(evaluated);  // If not a promise, resolve immediately
                }
            } catch (error) {
                reject(error);
            }
        });

        res.json({ result, receivedCode: jsCode }); // Send the result back as response
    } catch (error) {
        console.error('Execution error:', error);
        res.status(500).json({ error: error.message, receivedCode: jsCode }); // Debug info
    }
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
