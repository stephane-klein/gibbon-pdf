const createApp = require('./app');
const config = require('./config');

const app = createApp(
    config.get('port'),
    config.get('template_path'),
    config.get('static_path')
);

const server = app.listen(config.get('port'), () => {
    console.log(`Server listening on port: ${config.get('port')}`);
});

module.exports = server;
