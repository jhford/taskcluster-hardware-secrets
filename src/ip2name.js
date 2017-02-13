const dns = require('mz/dns');

/**
 * Get the hostname corresponding to the given IP.  This hostname
 * must be the only hostname to which that IP resolves in reverse DNS (via
 * PTR records), and the hostname must only resolve to the given IP.  The
 * hostname must not contain a wildcard character.  The IP must be an IPv4
 * address.
 */
module.exports = async ip => {
  // if ip is given in IPv4-translated format, strip the prefix.
  ip = ip.replace(/^::ffff:/, '');

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

  let forward = await dns.resolve4(hostname);
  if (forward.length > 1) {
    throw new Error(`Hostname for ${ip} maps back to several IPs`);
  } else if (forward.length === 0 || forward[0] !== ip) {
    throw new Error(`Hostname for ${ip} does not map back to ${ip}`);
  }

  return hostname;
};
