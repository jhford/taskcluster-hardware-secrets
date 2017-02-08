let API = require('taskcluster-lib-api');
let debug = require('debug')('host-secrets:api');
let assert = require('assert');
let _ = require('lodash');
let taskcluster = require('taskcluster-client');
let dns = require('mz/dns');

let api = new API({
  title: 'Hardware Secrets',
  description: 'Write this, sucka!',
  schemaPrefix: 'http://schemas.taskcluster.net/host-secrets/v1/',
});

function isIpAllowed(ip, allowedIps) {
  return true;
}

api.declare({
  method: 'get',
  route: '/credentials',
  name: 'credentials',
  input: undefined, // For now
  output: undefined, // For now
  title: 'Reteive a host secret',
  description: 'Generate a set of temporary credentials',
  stability:  API.stability.experimental,
}, async function (req, res) {
  let ip = req.ip;
  debug(`${ip} is asking for credentials`);
  let dnsNames = await dns.reverse(ip);
  console.dir(dnsNames);
  if (isIpAllowed(ip, this.allowedIps)) {
    let start = new Date();
    let scopes = dnsNames.filter(name => {
      // Because wildcards could be used to escalate scopes, we're going to ignore dns names which contain
      // that character
      return name.indexOf('*') === -1;
    }).map(name => {
      let chunks = name.split('.');
      chunks.reverse();
      return this.scopeBase + chunks.join('.');
    });
    let tempCred = taskcluster.createTemporaryCredentials({
      //clientId: <authenticated dns name of machine?>
      clientId: dnsNames[0],
      start: start,
      expiry: taskcluster.fromNow(this.credentialsExpire, start),
      scopes: scopes,
      credentials: this.credentials,
    });
    debug(`${ip} receives credentials`);
    res.reply({credentials: tempCred});
  } else {
    debug(`${ip} is forbidden`);
    res.status(403).reply({
      message: 'Forbidden',
      code: 'Forbidden',
    });
  }
});

module.exports = api;
