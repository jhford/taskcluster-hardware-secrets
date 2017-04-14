let _ = require('lodash');

let loader = require('taskcluster-lib-loader');
let config = require('typed-env-config');
let validator = require('taskcluster-lib-validate');
let monitor = require('taskcluster-lib-monitor');
let api = require('./api'); 
let App = require('taskcluster-lib-app');
let ip2name = require('./ip2name');
let ipAllowed = require('./ipAllowed');
let docs = require('taskcluster-lib-docs');

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
        publish: false,
      });
    },
  },

  docs: {
    requires: ['cfg'],
    setup: ({cfg, validator, reference}) => docs.documenter({
      credentials: cfg.taskcluster.credentials,
      tier: 'integrations',
    }),
  },

  server: {
    requires: ['cfg', 'api', 'docs'],
    setup: ({cfg, api}) => {
      let app = App(cfg.server);
      app.use('/v1', api);
      return app.createServer();
    },
  },

  ip2name: {
    requires: [],
    setup: () => ip2name,
  },

  ipAllowed: {
    requires: ['cfg'],
    setup: ({cfg}) => ipAllowed(cfg.taskcluster.allowedIps),
  },

  api: {
    requires: ['cfg', 'validator', 'monitor', 'ip2name', 'ipAllowed'],
    setup: async ({cfg, validator, monitor, ip2name, ipAllowed}) => {
      let router = await api.setup({
        context: {
          credentials: cfg.taskcluster.credentials,
          scopeBase: cfg.taskcluster.scopeBase,
          clientIdBase: cfg.taskcluster.clientIdBase,
          credentialsExpire: cfg.taskcluster.credentialsExpire,
          ipAllowed,
          ip2name,
        },
        validator: validator,
        authBaseUrl: cfg.taskcluster.authBaseUrl,
        publish: false,
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
    profile: process.env.DEPLOY_ENV || 'default',
  }).catch(err => {
    console.log(err.stack);
    process.exit(1);
  });
}

// Export load for tests
module.exports = load;
