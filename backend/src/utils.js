const Sentry = require('@sentry/node');

global.oldConsoleError = console.error;
const overrideConsoleErrorToAddSentryCapture = () => {
    if (!('console' in global)) {
        return;
    }
    if (!('error' in global.console)) {
        return;
    }

    console.error = (...args) => {
        Sentry.withScope((scope) => {
            scope.setLevel('error');
            scope.addEventProcessor((event) => {
                event.logger = 'console';
                return event;
            });
            scope.setContext('console arguments', {
                arguments: args
            });

            if (args[0] instanceof Error) {
                Sentry.captureException(args[0]);
            } else {
                Sentry.captureMessage(args[0]);
            }
        });
        global.oldConsoleError(...args);
    };
};

module.exports = {
    overrideConsoleErrorToAddSentryCapture
};