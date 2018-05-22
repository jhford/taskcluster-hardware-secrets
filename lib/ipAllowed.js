const ipaddr = require('ipaddr.js');
const assert = require('assert');

/**
 * Return a closure which will check if a given IP is allowed.  The list of
 * subnets in CIDR format.  If any of the given subnets contains the IP address
 * requested to be checked, the function will return `true` otherwise it will
 * return `false`
 */
module.exports = function(allowedSubnets) {
  assert(allowedSubnets, 'Must provide allowed subnets in CIDR format');
  assert(Array.isArray(allowedSubnets), 'Allowed subnets must be a list');

  let subnetsV4 = [];
  let subnetsV6 = [];

  for (let subnet of allowedSubnets) {
    let parsed = ipaddr.parseCIDR(subnet);
    // Let's be sure that this value is a 2-tuple of an object and a mask
    // length.  Probably overkill
    assert(typeof parsed[0] === 'object');
    assert(typeof parsed[1] === 'number');
    assert(parsed.length === 2);
    if (parsed[0].kind() === 'ipv4') {
      subnetsV4.push(parsed);
    } else if (parsed[0].kind() === 'ipv6') {
      subnetsV6.push(parsed);
    } else {
      assert(false, 'CIDR Specifies unknown address type');
    }
  }

  return function(ip) {
    // Parse the IP into an IP object
    ip = ipaddr.parse(ip);

    // We want to match IPv4 addresses to allowed IPv4 subnets and IPv6 to
    // allowed IPv6 subnets
    if (ip.kind() === 'ipv4') {
      for (let subnet of subnetsV4) {
        if (ip.match(subnet)) {
          return true;
        }
      }
    } else if (ip.kind() === 'ipv6') {
      for (let subnet of subnetsV6) {
        if (ip.match(subnet)) {
          return true;
        }
      }
    } else {
      throw new Error('Ip address is unexpected format: ' + ip.kind());
    }

    // If we didn't find our IP in an allowed subnet, we need to return false
    return false;
  };
};
