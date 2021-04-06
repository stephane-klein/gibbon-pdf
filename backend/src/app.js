const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const Koa = require('koa');
const koaStatic = require('koa-static');
const cors = require('@koa/cors');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const nunjucks = require('nunjucks');
const puppeteer = require('puppeteer');

const readFile = promisify(fs.readFile);
const router = new Router();

router.get('/v1/', (ctx) => {
    ctx.body = {
        version: '0.1.0'
    };
});

router.get('/v1/templates/', (ctx) => {
    ctx.body = fs.readdirSync(ctx.templatePath);
});

router.get('/v1/templates/:name', (ctx) => {
    const schemaJsonPath = path.join(
        ctx.templatePath,
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
    } catch (e) {
        ctx.status = 500;
        ctx.body = e;
        return;
    }
    ctx.body = {
        json_schema: jsonSchema
    };
});

router.post('/v1/templates/:name/html', (ctx) => {
    const templatePath = path.join(
        ctx.templatePath,
        ctx.params.name,
        'default.html'
    );
    if (!fs.existsSync(templatePath)) {
        ctx.status = 404;
        ctx.body = `Template ${ctx.params.name}/default.html not exists`;
        return;
    }
    ctx.body = nunjucks.renderString(
        fs.readFileSync(
            templatePath,
            {
                encoding: 'utf8'
            }
        ),
        ctx.request.body
    );
});


router.post('/v1/templates/:name/pdf', async (ctx) => {
    const puppeteerConfig = {
        args: ['--disable-dev-shm-usage']
    };

    if (ctx.chromiumPath) {
        puppeteerConfig.executablePath = ctx.chromiumPath;
    }

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
    await page.goto(`http://${ctx.request.header.host}/v1/templates/${ctx.params.name}/html`);
    const buffer = await page.pdf({ format: 'A4' });
    ctx.type = 'application/pdf';
    ctx.body = buffer;
    browser.close();
});

const app = new Koa();
app.use(bodyParser());
app.use(cors());
app.use(router.routes());

module.exports = function createApp(port, templatePath, staticPath, chromiumPath) {
    const app = new Koa();
    app.context.port = port;
    app.context.templatePath = templatePath;
    app.context.chromiumPath = chromiumPath;
    app.use(bodyParser());
    app.use(cors());
    app.use(router.routes());

    if (staticPath) {
        app.use(koaStatic(staticPath));
        app.use(async (ctx, next) => {
            ctx.type = 'html';
            ctx.body = await readFile(`${staticPath}/index.html`);
            await next();
        });
    }
    
    return app;
};
