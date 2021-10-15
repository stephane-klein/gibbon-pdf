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
    },
    sentryDSN: {
        doc: 'Sentry DSN URL',
        format: String,
        default: '',
        env: 'SENTRY_DSN'
    },
    sentryEnvironment: {
        doc: 'Sentry environment name',
        format: String,
        default: 'unknown',
        env: 'SENTRY_ENVIRONMENT'
    },
    sentryRelease: {
        doc: 'Sentry release',
        format: String,
        default: '',
        env: 'SENTRY_RELEASE'
    }
});

config.validate({ allowed: 'strict' });

module.exports = config;