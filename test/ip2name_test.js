const mocha = require('mocha');
const assert = require('assert');
const ip2name = require('../lib/ip2name');
const dns = require('mz/dns');
const helper = require('./helper');

suite("ip2name", function() {

  suite("with real DNS:", function() {
    // these depend on actual DNS, so if they break it may be due to changes
    // by whoever owns these IPs, rather than a code issue.
    test("8.8.8.8 (IPv4)", async function() {
      let name = await ip2name('8.8.8.8');
      assert.equal(name, 'google-public-dns-a.google.com');
    });

    test("2001:4860:4860::64 (IPv6)", async function() {
      let name = await ip2name('2001:4860:4860::64');
      assert.equal(name, 'google-public-dns64-a.google.com');
    });

    test("verizon FiOS", async function() {
      let name = await ip2name('108.4.148.72');
      assert.equal(name, 'pool-108-4-148-72.albyny.fios.verizon.net');
    });
  });

  suite("with faked DNS:", function() {
    let old = {};
    let forward;
    let reverse;

    suiteSetup(function() {
      old.resolve4 = dns.resolve4;
      old.reverse = dns.reverse;

      dns.resolve4 = async (hostname) => { return forward[hostname] || []; }
      dns.reverse = async (ip) => { return reverse[ip] || []; }
    });

    suiteTeardown(function() {
      dns.resolve4 = old.resolve4;
      dns.reverse = old.reverse;
    });

    setup(function() {
      forward = {};
      reverse = {};
    });

    test("success", async function() {
      reverse['1.1.1.1'] = ['a.domain.name'];
      forward['a.domain.name'] = ['1.1.1.1'];
      assert.equal(await ip2name('1.1.1.1'), 'a.domain.name');
    });

    test("too many hostnames for IP", async function() {
      reverse['1.1.1.1'] = ['a.domain.name', 'b.domain.name'];
      await helper.assertRejects(async () => {
        await ip2name('1.1.1.1');
      }, /Several hostnames found for 1.1.1.1/);
    });

    test("no hostname for IP", async function() {
      reverse['1.1.1.1'] = [];
      await helper.assertRejects(async () => {
        await ip2name('1.1.1.1');
      }, /No hostnames found for 1.1.1.1/);
    });

    test("too many IPs for hostname", async function() {
      reverse['1.1.1.1'] = ['a.domain.name'];
      forward['a.domain.name'] = ['1.1.1.1', '2.2.2.2'];
      await helper.assertRejects(async () => {
        await ip2name('1.1.1.1');
      }, /Hostname for 1.1.1.1 maps back to several IPs/);
    });

    test("no IPs for hostname", async function() {
      reverse['1.1.1.1'] = ['a.domain.name'];
      forward['a.domain.name'] = [];
      await helper.assertRejects(async () => {
        await ip2name('1.1.1.1');
      }, /Hostname for 1.1.1.1 does not map back to 1.1.1.1/);
    });

    test("hostname contains '*'", async function() {
      reverse['1.1.1.1'] = ['*.domain.name'];
      forward['*.domain.name'] = ['1.1.1.1'];
      await helper.assertRejects(async () => {
        await ip2name('1.1.1.1');
      }, /Hostname for 1.1.1.1 is invalid/);
    });
  });
});
