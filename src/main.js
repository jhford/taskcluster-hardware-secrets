let _ = require('lodash');
let _Secret = require('./data').Secret;

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
      project: 'hardware-secrets',
      credentials: cfg.taskcluster.credentials,
      mock: profile !== 'production',
      process,
    }),
  },

  validator: {
    requires: ['cfg'],
    setup: async ({cfg}) => {
      return await validator({
        prefix: 'hardware-secrets/v1/',
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

  Secret: {
    requires: ['cfg'],
    setup: async ({cfg}) => {
      let Secret = _Secret.setup({
        account: cfg.azure.account,
        table: cfg.azure.secretsTableName,
        credentials: cfg.taskcluster.credentials,
      });
      return Secret;
    },
  },

  api: {
    requires: ['cfg', 'validator', 'monitor', 'Secret'],
    setup: async ({cfg, validator, monitor, Secret}) => {
      let router = await api.setup({
        context: {
          Secret: Secret,
        },
        validator: validator,
        authBaseUrl: cfg.taskcluster.authBaseUrl,
        publish: cfg.app.publishMetaData,
        baseUrl: cfg.server.publicUrl + '/v1',
        referencePrefix: 'hardware-secrets/v1/api.json',
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
