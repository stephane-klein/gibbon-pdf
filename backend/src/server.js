const createApp = require('./app');

const PORT = process.env.PORT || 5000;

const app = createApp(
    PORT,
    process.env.TEMPLATES_PATH || '../pdf-templates/',
    process.env.STATIC_PATH || undefined,
);

const server = app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});

module.exports = server;
