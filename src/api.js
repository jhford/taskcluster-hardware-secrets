let API = require('taskcluster-lib-api');
let debug = require('debug')('hardware-secrets:api');
let assert = require('assert');
let _ = require('lodash');

let api = new API({
  title: 'Hardware Secrets',
  description: 'Write this, sucka!',
  schemaPrefix: 'http://schemas.taskcluster.net/hardware-secrets/v1/',
});

function isIpAllowed(ip, allowed) {
  return true;
}

// So for auth we should support the following schemes:
//  * tc-scopes: admin users and tasks
//  * tokens: we should have an entity which stores tokens and the names of secrets it can access
//  * ip:
//
//  Token based is low priority, but for IP I wonder if we could have scopes but deferAuth.  If we did that
//  we could have the check for auth be basically if (isIpAllowed(...) || req.satisfies({name})) { }.
//
//  I'm not sure if that's the cleanest API though
api.declare({
  method: 'get',
  route: '/secret/:name',
  name: 'getSecret',
  input: undefined, // For now
  output: undefined, // For now
  title: 'Reteive a hardware secret',
  description: 'White this, sucka!',
  stability:  API.stability.experimental,
}, async function (req, res) {
  let name = req.params.name;
  debug(`${req.ip} is asking for ${name}`);
  try {
    let secret = await this.Secret.load({name});
    debug('loaded secret');
    if (isIpAllowed(req.ip, secret.allowed)) {
      debug(`${req.ip} is receiving ${name}`);
      return res.json(secret.payload);
    } else {
      debug(`${req.ip} is not allowed to access ${name}`);
      res.status(403).json({
        error: 'ResourceUnavailable',
        msg: 'secret not available',
      });
    }
  } catch (err) {
    if (err.code === 'ResourceNotFound') {
      debug(`${req.ip} cannot be given ${name} because it does not exist`);
      res.status(403).json({
        error: 'ResourceUnavailable',
        msg: 'secret not available',
      });
    } else {
      throw err;
    }
  }

});

api.declare({
  method: 'put',
  route: '/secret/:name',
  name: 'createSecret',
  input: undefined, // For now
  output: undefined, // For now
  title: 'Create a hardware secret',
  description: 'White this, sucka!',
  stability:  API.stability.experimental,
  // FIXME: scopes: [['hardware-secrets:secret:<name>']],
}, async function(req, res) {
  let name = req.params.name;
  debug(`${req.ip} is creating ${name}`);
  try {
    let secret = await this.Secret.create(req.body);
    debug(`${req.ip} created ${name}`);
    res.json(secret.payload);
  } catch (err) {
    if (err.code !== 'EntityAlreadyExists') {
      throw err;
    }
    let extantSecret = await this.Secret.load({name});
    let match = ['name', 'payload', 'allowed'].every(key => {
      return _.isEqual(extantSecret[key], req.body[key]);
    });

    if (!match) {
      debug(`${req.ip} cannot create ${name} because non-identical version exists`);
      res.status(409).json({
        error: 'ResourceAlreadyExists',
        msg: 'Secret already exists with different definition',
      });
    } else {
      debug(`${req.ip} created ${name} but it was already there`);
      res.json(extantSecret.payload);
    }
  }
});

api.declare({
  method: 'delete',
  route: '/secret/:name',
  name: 'removeSecret',
  input: undefined, // For now
  output: undefined, // For now
  title: 'Delete a hardware secret',
  description: 'White this, sucka!',
  stability:  API.stability.experimental,
  // FIXME: scopes: [['hardware-secrets:secret:<name>']],
}, async function(req, res) {
  let name = req.params.name;
  debug(`${req.ip} is removing ${name}`);
  try {
    await this.Secret.remove({name}, true);
    debug(`${req.ip} removed ${name}`);
    res.status(204).end();
  } catch (err) {
    if (err.code === 'ResourceNotFound') {
      debug(`${req.ip} could not remove ${name} because it did not exist`);
      res.status(204).end();
    } else {
      throw err;
    }
  }
});

api.declare({
  method: 'post',
  route: '/secret/:name',
  name: 'updateSecret',
  input: undefined, // For now
  output: undefined, // For now
  title: 'Update a hardware secret',
  description: 'White this, sucka!',
  stability:  API.stability.experimental,
  // FIXME: scopes: [['hardware-secrets:secret:<name>']],
}, async function(req, res) {
  let name = req.params.name;
  let input = req.body;
  debug(`${req.ip} is updating ${name}`);
  let secret = await this.Secret.load({name});

  if (input.name !== name) {
    throw new Error('cannot rename secrets');
  }

  await secret.modify(extantSecret => {
    extantSecret.payload = input.payload;
    extantSecret.allowed = input.allowed;
  });
  
  return res.json(input.payload);
  
});

module.exports = api;
