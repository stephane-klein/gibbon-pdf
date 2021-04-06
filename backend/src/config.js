const Convict = require('convict');

const config = Convict({
    port: {
        doc: 'Backend listen http port',
        format: Number,
        default: 5000,
        env: 'PORT'
    },
    template_path: {
        doc: 'Path to pdf templates',
        format: String,
        default: '../pdf-templates/',
        env: 'TEMPLATES_PATH'
    },
    static_path: {
        doc: 'Path to static html to expose to http, on production, it is path to gibbon-pdf frontend dist files',
        format: String,
        default: undefined,
        env: 'STATIC_PATH'
    }
});

config.validate({ allowed: 'strict' });

module.exports = config;