var taskcluster = require('taskcluster-client');
var api         = require('../lib/api');
var load        = require('../lib/main');
var config      = require('typed-env-config');
var _           = require('lodash');

var cfg = config({profile: 'test'});

var helper = module.exports = {};

helper.overwrites = {};
helper.load = async (component, overwrite) => {
  if (overwrite) {
    helper.overwrites[component] = overwrite;
  }
  return await load(component, helper.overwrites);
}

var webServer = undefined;
helper.startWebServer = async () => {
  if (webServer) {
    await webServer.terminate();
  }
  webServer = await helper.load('server');

  // Create client for working with API
  helper.baseUrl = 'http://localhost:' + webServer.address().port + '/v1';
  var reference = api.reference({baseUrl: helper.baseUrl});
  helper.HostSecrets = taskcluster.createClient(reference);
  helper.hostSecrets = new helper.HostSecrets({
    // Ensure that we use global agent, to avoid problems with keepAlive
    // preventing tests from exiting
    agent:            require('http').globalAgent,
    baseUrl:          helper.baseUrl,
  });
};

// Call this in suites or tests that make API calls, hooks etc; it will set up
// what's required to respond to those calls.
helper.setup = function() {
  // Setup before each test
  setup(async () => {
    // clear the overwrites
    helper.overwrites = {profile: 'test', process: 'test-helper'};
  });

  // Cleanup after tests
  suiteTeardown(async () => {
    // Kill webServer
    if (webServer) {
      await webServer.terminate();
      webServer = undefined;
    }
  });
};

/**
 * Assert that an async function rejects with an error matching RegExp error
 */
helper.assertRejects = async (fn, error) => {
  try {
    await fn();
  } catch (err) {
    if (error.test(err)) {
      return;
    }
    throw err;
  }
  throw new Error("Did not reject");
};

