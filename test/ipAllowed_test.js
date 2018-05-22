const mocha = require('mocha');
const assert = require('assert');
const ipAllowed = require('../lib/ipAllowed');
const helper = require('./helper');

suite('ipAllowed', function() {
  test('allowed by subnet IPv4', function() {
    let allowed = ipAllowed(['1.0.0.0/32']);
    assert(allowed('1.0.0.0'));
  });

  test('disallowed by subnet IPv4', function() {
    let allowed = ipAllowed(['1.0.0.0/32']);
    assert(!allowed('1.0.0.1'));
  });
  
  test('allowed by subnet IPv6', function() {
    let allowed = ipAllowed(['2001:0:0:0:0:ffff:100:0/128']);
    assert(allowed('2001:0:0:0:0:ffff:100:0'));
  });

  test('disallowed by subnet IPv6', function() {
    let allowed = ipAllowed(['2001:0:0:0:0:ffff:100:0/128']);
    assert(!allowed('2001:0:0:0:0:ffff:100:1'));
  });

  test('only validate ipv6 addresses in ipv6 subnets', function() {
    let allowed = ipAllowed(['2001:0:0:0:0:ffff:100:0/128']);
    assert(!allowed('1.0.0.1'));
  });

  test('only validate ipv4 addresses in ipv4 subnets', function() {
    let allowed = ipAllowed(['1.0.0.1/32']);
    assert(!allowed('2001:0:0:0:0:ffff:100:1'));
  });

  test('ipv4 and v6 both validate when subnets of both types are provided', function() {
    let allowed = ipAllowed([
      '0.0.0.0/0',
      '::/0',
    ]);
    assert(allowed('1.0.0.0'));
    assert(allowed('::45:1'));
  });

  test('allowed from multiple subnets', function() {
    let allowed = ipAllowed([
      '1.0.0.0/32',
      '2.0.0.0/32',
      '3.0.0.0/32',
    ]);
    assert(allowed('2.0.0.0'));
  });

  test('disallowed from multiple subnets', function() {
    let allowed = ipAllowed([
      '1.0.0.0/32',
      '2.0.0.0/32',
      '3.0.0.0/32',
    ]);
    assert(!allowed('2.0.0.1'));
  });
});
