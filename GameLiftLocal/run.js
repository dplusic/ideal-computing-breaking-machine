const { spawn } = require('child_process');
const http = require('http');
const httpProxy = require('http-proxy');

const SERVER_PORT = 10100;
const GAMELIFTLOCAL_PORT = 10101;

const gameLiftLocal = spawn('java', ['-jar', `${__dirname}/AWSGameLiftLocal/GameLiftLocal.jar`, '-p', GAMELIFTLOCAL_PORT]);
gameLiftLocal.stdout.pipe(process.stdout);
gameLiftLocal.stderr.pipe(process.stdin);
gameLiftLocal.on('close', (code) => {
    console.log(`gameLiftLocal process exited with code ${code}`);
});

const proxy = httpProxy.createProxyServer({});
http.createServer((req, res) => {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.end();
        return;
    }

    proxy.web(req, res, { target: `http://localhost:${GAMELIFTLOCAL_PORT}` });

}).listen(SERVER_PORT);
