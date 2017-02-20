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

  let subnets = [];

  for (let subnet of allowedSubnets) {
    subnets.push(ipaddr.parseCIDR(subnet));
  }

  return function(ip) {
    // Parse the IP into an IP object
    ip = ipaddr.parse(ip);

    // Go through the subnets and see if we can match any.  A match means the
    // ip is in the subnet
    for (let subnet of subnets) {
      if (ip.match(subnet)) {
        return true;
      }
    }

    // If we didn't find our IP in an allowed subnet, we need to return false
    return false;
  };
};
