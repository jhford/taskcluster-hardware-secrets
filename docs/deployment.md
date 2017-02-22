---
title: Deploying the Service
---

## Configuration

Select a clientId prefix.  In most cases this should be the clientId of the
service itself with a trailing slash, for example,
`project/testing-host-secrets/`.

Select a role prefix, too. The service will append the reversed domain name to
this prefix. For example, a prefix of
`assume:project:testing-host-secrets:host:` will result in host credentials
with roles like `assume:project:testing-host-secrets:host:com.machine.test.a`.

The service's client should have the following roles:

 * `auth:create-client:project/testing-host-secrets/*` (to allow creation of temporary credentials)
 * `assume:project:testing-host-secrets:host:*` (to allow issuance of host roles)

Along with any other scopes required such as, statsum and sentry.

## Service Security

The service should be on a network that is protected from external access.

Ideally, it should be configured in such a way that it gets direct connections
from clients. If this is not possible, set it up in a place where no adversary
can forge request headers such as `X-Remote-Ip`.

The service should be connected to a trusted DNS resolver, ideally one that is
authoritative for the networks configured as allowed IPs. Spoofed DNS could
result in the issuance of credentials to the wrong hosts.
