let API = require('taskcluster-lib-api');
let debug = require('debug')('host-secrets:api');
let assert = require('assert');
let _ = require('lodash');
let taskcluster = require('taskcluster-client');
let ip2name = require('./ip2name');

let api = new API({
  title: 'Host Secrets',
  description: 'Get Taskcluster credentials based on IP address',
  schemaPrefix: 'http://schemas.taskcluster.net/host-secrets/v1/',
  context: [
    'scopeBase',
    'credentialsExpire',
    'credentials',
    'ip2name',
    'ipAllowed',
  ],
  errorCodes: {
    IPNotAllowed: 403,
  },
});

api.declare({
  method: 'get',
  route: '/credentials',
  name: 'credentials',
  input: undefined, // For now
  output: undefined, // For now
  title: 'Retreive a temporary taskcluster credential',
  description: 'Generate a set of temporary credentials',
  stability:  API.stability.experimental,
}, async function (req, res) {
  let ip = req.ip;
  debug(`${ip} is asking for credentials`);

  if (!this.ipAllowed(ip)) {
    debug(`${ip} is disallowed by IP`);
    return res.reportError('IPNotAllowed', 'Remote IP not allowed', {});
  }
  debug(`${ip} is allowed by IP`);

  let hostname;
  try {
    hostname = await this.ip2name(ip);
  } catch (err) {
    debug(`From ip2name: ${err}`);
    debug(`${ip} is disallowed by DNS`);
    return res.reportError('IPNotAllowed', 'Remote IP not allowed', {});
  }
  debug(`${ip} translates to ${hostname}`);

  let labels = hostname.split('.');
  labels.reverse();
  let scopes = [this.scopeBase + labels.join('.')];
  let start = new Date();
  let tempCred = taskcluster.createTemporaryCredentials({
    clientId: hostname,
    start,
    expiry: taskcluster.fromNow(this.credentialsExpire, start),
    scopes: scopes,
    credentials: this.credentials,
  });
  debug(`${ip} (${hostname}) receives credentials with scopes ${scopes}`);
  res.reply({credentials: tempCred});
});

module.exports = api;
