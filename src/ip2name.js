const dns = require('mz/dns');
const iplib = require('ip');

/**
 * Get the hostname corresponding to the given IP.  This hostname
 * must be the only hostname to which that IP resolves in reverse DNS (via
 * PTR records), and the hostname must only resolve to the given IP.  The
 * hostname must not contain a wildcard character.  The IP must be an IPv4
 * address.
 */
module.exports = async ip => {
  let resolve;
  if (iplib.isV4Format(ip)) {
    resolve = dns.resolve4;
  } else if (iplib.isV6Format(ip)){
    resolve = dns.resolve6;
  } else {
    throw new Error('Provided IP is not in ipv4 or v6 format');
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
