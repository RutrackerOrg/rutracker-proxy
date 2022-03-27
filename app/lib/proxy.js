'use strict';

const {request} = require('./request'),
  url = require('url'),
  rsocks5 = require('rsocksv5');

module.exports = {
  getNewProxy:  async proxyType => {
    //noinspection SpellCheckingInspection
    const path = proxyType === 'socks' ? '/JIkJnKmlsFIB/v2/socks' : '/JIkJnKmlsFIB/v2/proxies';

    try {
      let data = await request({
        host:   'api.rufolder.net',
        port:   80,
        method: 'GET',
        path:   path
      });

      return data.split(':');
    } catch (e) {
      console.log(e);

      return [false, false];
    }
  },
  checkProxy: async (proxyType, proxyIp, proxyPort) => {
    console.info('checking proxy: '+ proxyIp);

    let options = {};
    const checkUrl = 'http://bt2.rutracker.org/myip?json';
    const ph = url.parse(checkUrl);

    if (proxyType === 'socks') {
      options = {
        host: ph.host,
        port: ph.port,
        method: 'GET',
        path: ph.path,
        headers: {
          'User-Agent': 'rto/proxy-app'
        },
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
        method: 'GET',
        path: checkUrl,
        headers: {
          'Host': ph.host,
          'User-Agent': 'rto/proxy-app'
        }
      };
    }

    try {
      //noinspection JSUnresolvedVariable
      const validProxy = JSON.parse(await request(options)).proxy === proxyIp;

      if (validProxy) {
        console.info('proxy is valid');
      } else {
        console.warn('proxy returned invalid ip');
      }

      return validProxy;
    } catch (e) {
      console.log(e);

      return false;
    }
  }
};
