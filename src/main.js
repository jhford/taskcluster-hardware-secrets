let _ = require('lodash');

let loader = require('taskcluster-lib-loader');
let config = require('typed-env-config');
let validator = require('taskcluster-lib-validate');
let monitor = require('taskcluster-lib-monitor');
let api = require('./api'); 
let App = require('taskcluster-lib-app');

let load = loader({
  cfg: {
    requires: ['profile'],
    setup: ({profile}) => config({profile}),
  },

  monitor: {
    requires: ['process', 'profile', 'cfg'],
    setup: ({process, profile, cfg}) => monitor({
      project: 'host-secrets',
      credentials: cfg.taskcluster.credentials,
      mock: profile !== 'production',
      process,
    }),
  },

  validator: {
    requires: ['cfg'],
    setup: async ({cfg}) => {
      return await validator({
        prefix: 'host-secrets/v1/',
        aws: cfg.aws,
      });
    },
  },

  server: {
    requires: ['cfg', 'api'],
    setup: ({cfg, api}) => {
      let app = App(cfg.server);
      app.use('/v1', api);
      return app.createServer();
    },
  },

  api: {
    requires: ['cfg', 'validator', 'monitor'],
    setup: async ({cfg, validator, monitor}) => {
      let allowedIps = cfg.taskcluster.allowedIps;
      if (allowedIps.includes(',')) {
          allowedIps = allowedIps.split(',').map(x => x.trim());
      }
      let router = await api.setup({
        context: {
          credentials: cfg.taskcluster.credentials,
          scopeBase: cfg.taskcluster.scopeBase,
          credentialsExpire: cfg.taskcluster.credentialsExpire,
          allowed: allowedIps,
        },
        validator: validator,
        authBaseUrl: cfg.taskcluster.authBaseUrl,
        publish: cfg.app.publishMetaData,
        baseUrl: cfg.server.publicUrl + '/v1',
        referencePrefix: 'host-secrets/v1/api.json',
        monitor: monitor.prefix('api'),
      });

      return router;
    },
  },
}, ['profile', 'process']);

if (!module.parent) {
  require('source-map-support').install();
  load(process.argv[2], {
    process: process.argv[2],
    profile: process.env.NODE_ENV,
  }).catch(err => {
    console.log(err.stack);
    process.exit(1);
  });
}

// Export load for tests
module.exports = load;
