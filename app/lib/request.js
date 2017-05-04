"use strict";

const http = require('http'),
  rsocks5 = require('rsocksv5'),
  url = require('url');

module.exports = {
  request: (options, postData) => {
    return new Promise((resolve, reject) => {
      const request = http.request(options, resource => {
        if (resource.statusCode < 200 || resource.statusCode >= 300) {
          return reject(new Error('invalidStatusCode=' + resource.statusCode));
        }

        let body = [];

        resource.on('data', chunk => {
          body.push(chunk);
        });

        resource.on('end', () => {
          resolve(Buffer.concat(body).toString());
        });
      });

      request.on('error', error => {
        reject(error);
      });

      if (postData) {
        request.write(postData);
      }

      request.end();
    });
  },
  makeProxyRequest: (type, request, response, proxyIp, proxyPort) => {
    console.log([
      'make proxy request',
      type
    ]);
    const ph = url.parse(request.url);
    let options = {};

    if (!/^bt[2-5]?\.(rutracker\.org|t-ru\.org|rutracker\.cc)$/.test(ph.hostname)) {
      options = {
        port: ph.port,
        hostname: ph.hostname,
        method: request.method,
        path: ph.path,
        headers: request.headers
      };
    } else if (type === 'socks') {
      request.headers.host = ph.host;

      options = {
        host: ph.host,
        port: ph.port,
        method: request.method,
        path: ph.path,
        headers: request.headers,
        agent: new rsocks5.HttpAgent({
          proxyHost: proxyIp,
          proxyPort: proxyPort,
          auths: [rsocks5.auth.None()],
          path: ph.path
        })
      };
    } else {
      options = {
        port: proxyPort,
        hostname: proxyIp,
        method: request.method,
        path: request.url,
        headers: request.headers
      };
    }

    return http.request(options, (proxyResponse) => {
      proxyResponse.pause();
      response.writeHeader(proxyResponse.statusCode, proxyResponse.headers);
      proxyResponse.pipe(response);
      proxyResponse.resume();
    });
  }
};
