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
      await helper.load('ip2name', async ip => {
        throw new Error("no way!");
      });
      await helper.startWebServer();
      helper.assertRejects(async () => 
        await helper.hostSecrets.credentials(),
        /IPNotAllowed/);
    });

    test("ip2names says it's OK", async function() {
      await helper.load('ip2name', async ip => "a.domain.name");
      await helper.startWebServer();
      let res = await helper.hostSecrets.credentials();
      assert.equal(res.credentials.clientId, 'a.domain.name');
      let cert = JSON.parse(res.credentials.certificate);
      assert.equal(cert.scopes.length, 1);
      assert.equal(cert.scopes[0], 'assume:project:releng:host:name.domain.a');
    });
  });
});
