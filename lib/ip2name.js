const dns = require('mz/dns');
const ipaddr = require('ipaddr.js');

/**
 * Get the hostname corresponding to the given IP.  This hostname
 * must be the only hostname to which that IP resolves in reverse DNS (via
 * PTR records), and the hostname must only resolve to the given IP.  The
 * hostname must not contain a wildcard character.  The IP must be an IPv4
 * address.
 */
module.exports = async ip => {
  let ipA = ipaddr.parse(ip);

  let resolve;

  switch(ipA.kind()) {
    case 'ipv4':
      resolve = dns.resolve4;
      break;
    case 'ipv6':
      resolve = dns.resolve6;
      break;
    default:
      throw new Error('Unrecognized IP format');
  }

  let hostnames = await dns.reverse(ip);
  if (hostnames.length > 1) {
    throw new Error(`Several hostnames found for ${ip}`);
  } else if (hostnames.length === 0) {
    throw new Error(`No hostnames found for ${ip}`);
  }

  let hostname = hostnames[0];
  if (!/^[a-zA-Z0-9-.]*$/.test(hostname)) {
    throw new Error(`Hostname for ${ip} is invalid`);
  }

  let forward = await resolve(hostname);
  if (forward.length > 1) {
    throw new Error(`Hostname for ${ip} maps back to several IPs`);
  } else if (forward.length === 0 || forward[0] !== ip) {
    throw new Error(`Hostname for ${ip} does not map back to ${ip}`);
  }

  return hostname;
};
