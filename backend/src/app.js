const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const Koa = require('koa');
const koaStatic = require('koa-static');
const cors = require('@koa/cors');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const Sentry = require('@sentry/node');
const nunjucks = require('nunjucks');
const puppeteer = require('puppeteer');

const readFile = promisify(fs.readFile);

const config = require('./config');
const { overrideConsoleErrorToAddSentryCapture } = require('./utils');
const router = new Router();

if (config.get('sentryDSN')) {
    console.log('Sentry enabled');
    Sentry.init({
        dsn: config.get('sentryDSN'),
        release: config.get('sentryRelease'),
        attachStacktrace: true,
        normalizeDepth: 11,
        environment: config.get('sentryEnvironment')
    });

    overrideConsoleErrorToAddSentryCapture();
} 

router.get('/v1/', (ctx) => {
    ctx.body = {
        version: '0.1.0'
    };
});

router.get('/v1/templates/', (ctx) => {
    ctx.body = fs.readdirSync(config.get('template_path'));
});

router.get('/v1/templates/:name', (ctx) => {
    const schemaJsonPath = path.join(
        config.get('template_path'),
        ctx.params.name,
        'schema.json'
    );
    if (!fs.existsSync(schemaJsonPath)) {
        ctx.status = 404;
        ctx.body = `Template ${ctx.params.name} not exists`;
        return;
    }
    const jsonSchemaStr = fs.readFileSync(
        schemaJsonPath,
        {
            encoding: 'utf8'
        }
    );

    let jsonSchema;

    try {
        jsonSchema = JSON.parse(jsonSchemaStr);
    } catch (error) {
        Sentry.withScope((scope) => {
            scope.addEventProcessor(function (event) {
                return Sentry.Handlers.parseRequest(event, ctx.request);
            });
            console.error(error);
        });
        ctx.status = 500;
        ctx.body = error;
        return;
    }
    ctx.body = {
        json_schema: jsonSchema
    };
});

router.post('/v1/templates/:name/html', (ctx) => {
    const templatePath = path.join(
        config.get('template_path'),
        ctx.params.name,
        `${ctx.request.body.lang || ctx.request.query.lang || 'default'}.html`
    );
    if (!fs.existsSync(templatePath)) {
        ctx.status = 404;
        ctx.body = `Template ${ctx.params.name}/${ctx.request.body.lang || ctx.request.query.lang || 'default'}.html not exists`;
        return;
    }

    try {      
        ctx.body = nunjucks.renderString(
            fs.readFileSync(
                templatePath,
                {
                    encoding: 'utf8'
                }
            ),
            ctx.request.body
        );
    } catch (error) {
        Sentry.withScope((scope) => {
            scope.addEventProcessor(function (event) {
                return Sentry.Handlers.parseRequest(event, ctx.request);
            });
            console.error(error);
        });
    }
});

router.post('/v1/templates/:name/pdf', async (ctx) => {
    const puppeteerConfig = {
        args: ['--no-sandbox', '--disable-dev-shm-usage']
    };

    try {      
        const browser = await puppeteer.launch(puppeteerConfig);
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', interceptedRequest => {
            var data = {
                'method': 'POST',
                'postData': JSON.stringify(ctx.request.body),
                headers: { 'Content-Type': 'application/json' }
            };
            interceptedRequest.continue(data);
        });
        await page.goto(
            ctx.request.body.lang
                ? `http://127.0.0.1:${config.get('port')}/v1/templates/${ctx.params.name}/html?lang=${ctx.request.body.lang}`
                : `http://127.0.0.1:${config.get('port')}/v1/templates/${ctx.params.name}/html`
        );
        const buffer = await page.pdf({
            format: 'A4',
            printBackground: true
        });
        ctx.type = 'application/pdf';
        ctx.body = buffer;
        browser.close();
    } catch (error) {
        Sentry.withScope((scope) => {
            scope.addEventProcessor(function (event) {
                return Sentry.Handlers.parseRequest(event, ctx.request);
            });
            console.error(error);
        });
    }
});

const app = new Koa();
app.use(bodyParser());
app.use(cors());
app.use(router.routes());

module.exports = function createApp() {
    const app = new Koa();
    app.use(bodyParser());
    app.use(cors());
    app.use(router.routes());

    if (config.get('static_path')) {
        app.use(koaStatic(config.get('static_path')));
        app.use(async (ctx, next) => {
            ctx.type = 'html';
            ctx.body = await readFile(`${config.get('static_path')}/index.html`);
            await next();
        });
    }
    
    return app;
};
