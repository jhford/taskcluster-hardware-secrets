let Entity = require('azure-entities');
let debug = require('debug')('hardware-secrets:data');
let assert = require('assert');
let Promise = require('promise');
let _ = require('lodash');

/** Entity for tracking tasks and associated state */
let Secret = Entity.configure({
  version: 1,
  partitionKey: Entity.keys.StringKey('name'),
  rowKey: Entity.keys.ConstantKey('hardwareSecret'),
  properties: {
    // A name for the secret
    name: Entity.types.String,
    // Payload of the secret
    payload: Entity.types.JSON,
    // Information what's allowed and what isn't
    allowed: Entity.types.JSON,
  },
});

module.exports = {Secret};
