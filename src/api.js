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
    'allowedIps',
    'scopeBase',
    'credentialsExpire',
    'credentials',
    'ip2name',
  ],
  errorCodes: {
    IPNotAllowed: 403,
  },
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
  title: 'Retreive a temporary taskcluster credential',
  description: 'Generate a set of temporary credentials',
  stability:  API.stability.experimental,
}, async function (req, res) {
  let ip = req.ip;
  debug(`${ip} is asking for credentials`);

  if (!isIpAllowed(ip, this.allowedIps)) {
    return res.reportError('IPNotAllowed', 'Remote IP not allowed', {});
  }

  let hostname;
  try {
    hostname = await this.ip2name(ip);
  } catch (err) {
    debug(`From ip2name: ${err}`);
    return res.reportError('IPNotAllowed', 'Remote IP not allowed', {});
  }
  debug(`${ip} translates to ${hostname}`);

  let labels = hostname.split('.');
  labels.reverse();
  let scopes = [this.scopeBase + labels.join('.')];
  let start = new Date();
  let tempCred = taskcluster.createTemporaryCredentials({
    //clientId: <authenticated dns name of machine?>
    clientId: hostname,
    start,
    expiry: taskcluster.fromNow(this.credentialsExpire, start),
    scopes: scopes,
    credentials: this.credentials,
  });
  debug(`${ip} receives credentials with scopes ${scopes}`);
  res.reply({credentials: tempCred});
});

module.exports = api;
