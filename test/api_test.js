suite('API', function() {
  var assert      = require('assert');
  var helper      = require('./helper');

  helper.setup();

  test("ping", async function() {
    await helper.startWebServer();
    await helper.hostSecrets.ping();
  });

  suite("credentials", function() {
    // NOTE: we don't attempt to fake `req.ip` (it's a read-only
    // attribute of the Express request), so these tests all modify
    // what ip2name and isIpAllowed return.
    test("where ip2names raises an error", async function() {
      helper.overwrites['ipAllowed'] = () => true;
      helper.overwrites['ip2name'] = async () => Promise.reject('nope');
      await helper.startWebServer();
      helper.assertRejects(async () =>
        await helper.hostSecrets.credentials(),
        /IPNotAllowed/
      );
    });

    test("where ip is not allowed", async function() {
      helper.overwrites['ipAllowed'] = () => false;
      helper.overwrites['ip2name'] = async () => 'a.domain.name';
      await helper.startWebServer();
      // assertRejects just does not work here
      try {
        await helper.hostSecrets.credentials();
        return Promise.reject('should fail but did not');
      } catch (err) {
      }
    });

    test("ip2names says it's OK", async function() {
      helper.overwrites['ipAllowed'] = () => true;
      helper.overwrites['ip2name'] = async () => 'a.domain.name';
      await helper.startWebServer();
      let res = await helper.hostSecrets.credentials();
      assert.equal(res.credentials.clientId, 'a.domain.name');
      let cert = JSON.parse(res.credentials.certificate);
      assert.equal(cert.scopes.length, 1);
      assert.equal(cert.scopes[0], 'assume:project:releng:host:name.domain.a');
    });
  });
});
