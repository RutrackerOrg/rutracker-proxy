const {getNewProxy, checkProxy} = require('./lib/proxy');
const {makeProxyRequest} = require('./lib/request');
const logger = require('./lib/logger');
const http = require('http');
const commandLineArgs = require('command-line-args');

const obtainConfig = () => {
  const optionDefinitions = [
    {name: 'ip', type: String, defaultOption: '0.0.0.0'},
    {name: 'port', alias: 't', type: Number, defaultOption: 8080},
    {name: 'type', type: String, defaultOption: 'socks'}
  ];
  return commandLineArgs(optionDefinitions)
};

const obtainProxy = async (type) => {
  const proxy = await getNewProxy(type);
  const [proxyIp, proxyPort] = proxy;
  await checkProxy(type, proxyIp, proxyPort);
  return {proxyIp, proxyPort}
};

const main = async () => {
  const {ip, port, type} = obtainConfig();
  const {proxyIp, proxyPort} = await obtainProxy(type);

  http.createServer().listen(port, ip).on('request', (req, res) => {
    req.pause();

    const proxyRequest = makeProxyRequest(type, req, res, proxyIp, proxyPort);
    //noinspection JSUnresolvedFunction
    proxyRequest.on('error', e => {
      logger.error(e);
      res.writeHead(400, {"Content-Type": "text/plain"});
      res.write(e.toString());
      res.end();
    });

    req.pipe(proxyRequest);
    req.resume();
  });
  console.log(`Listening on ${ip}:${port} (proxy type: ${type})`);
};

Promise.resolve(0).then(main);
