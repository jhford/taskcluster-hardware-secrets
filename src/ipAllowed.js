const ip = require('ip');
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
    subnets.push(ip.cidrSubnet(subnet));
  }
  return function(ip) {
    // if ip is given in IPv4-translated format, strip the prefix.
    ip = ip.replace(/^::ffff:/, '');

    // Check each subnet allowed to see if this IP is allowed
    for (let subnet of subnets) {
      if (subnet.contains(ip)) {
        return true;
      }
    }

    // If we didn't find our IP in an allowed subnet, we need to return false
    return false;
  };
};
