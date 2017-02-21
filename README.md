Taskcluster Host Secrets
========================
This is a service which generates taskcluster credentials for machines based on
their IP address, after doing a forward and reverse DNS verification.  The service
will grant a set of temporary credential

## Example

```
$ curl localhost:8080/v1/credentials
{
  "credentials": {
    "clientId": "project/testing-host-secrets/host/localhost.localdomain",
    "accessToken": "<snip>",
    "certificate": "{\"version\":1,\"scopes\":[\"assume:project:testing-host-secrets:host:localdomain.localhost\"],\"start\":1486575908837,\"expiry\":1486575908837,\"seed\":\"<snip>\",\"signature\":\"<snip>\",\"issuer\":\"<snip>\"}"
  }
}
```

The credentials generated give a single scope.  This scope is the concatenation
of the `TASKCLUSTER_SCOPE_BASE` configuration value and the reversed domain
name.  The client id for the temporary credential is the concatenation of the
`TASKCLUSTER_CLIENT_ID_BASE` configuration value and the domain name.

For example, if `TASKCLUSTER_SCOPE_BASE` was set to `assume:project:test:host:`
and `TASKCLUSTER_CLIENT_ID_BASE` was set to `project/test/host/` then the scope
generated for a host with a hostname of `a.test.machine.com` would be
`assume:project:test:host:com.machine.test.a` and the client id would be
`project/test/host/com.machine.test.a`.

The role specified in these scopes (`project:testing-host-secrets:host:*`) can
be given other roles to expand on what they can do.  This includes storing secrets
using the taskcluster-secrets service.  This credential is used for bootstraping
and not for generating the final credential to be used by the service.

## Credentials
The taskcluster credentials that are to be used with this service must be
permanent credentials (temporary credentials cannot generate other temporary).
Those credentials must have the scope `$TASKCLUSTER_SCOPE_BASE*` (e.g.
`assume:project:testing-host-secrets:host:*`) or a subset of the valid
hostnames.

## Usage
Unlike other taskcluster services, this service is designed to be deployed in a
datacenter along side physical workers.  There are two ways to deploy the project:
using the standard `git clone <...> && cd <...> && npm install` flow or using a
tarball generated by the package.sh script.

### Standard Deployment
You can do a standard deployment of this service like many other node applications.
``` bash 
git clone <...>
cd taskcluster-host-secrets
npm install
export TASKCLUSTER_SCOPE_BASE="assume:project:testing-host-secrets:host:"
export TASKCLUSTER_CLIENT_ID_BASE="project/testing-host-secrets/host/"
export TASKCLUSTER_CREDENTIALS_EXPIRE="1 day"
export TASKCLUSTER_ALLOWED_IPS="0.0.0.0/0"
export TASKCLUSTER_CLIENT_ID=<snip>
export TASKCLUSTER_ACCESS_TOKEN=<snip>
export FORCE_SSL=true
export TRUST_PROXY=false
export PORT=8080
export NODE_ENV=production
export DEBUG="host-secrets:*"
node lib/main server
```

Unlike other taskcluster services which automatically publish api references
and schemas, this service is deployed to potentially many hosts and thus needs
a way to split deployment environments.  We're using `NODE_ENV` to control
things around how the environment should work with tools like Express, and
`DEPLOY_ENV` to pick which section of the `config.yml` or `user-config.yml`
file to use

### package.sh Based Deployment
This script generates a tarball meant to ease deployment on systems which do not
already have a node environment.  This tarball can be regenerated very easily.

```
./package.sh && echo done
```

Which will create a `dist.tar.gz` file.  This archive contains a full node environment
as well as a wrapper script.  To launch the server, you can do this:

```
tar xf host-secrets.tar.gz
cd dist
./start.sh
```

In addition to the standard environment variables, this wrapper script has the following command line options (overrides environment):

* `--scope-base`: equivalent to `TASKCLUSTER_SCOPE_BASE`
* `--client-id-base`: equivalent to `TASKCLUSTER_CLIENT_ID_BASE`
* `--expires`: equivalent to `TASKCLUSTER_CREDENTIALS_EXPIRE`
* `--allowed-ips`: equivalent to `TASKCLUSTER_ALLOWED_IPS`
* `--client-id`: equivalent to `TASKCLUSTER_CLIENT_ID`
* `--token`: equivalent to `TASKCLUSTER_ACCESS_TOKEN`
* `--port`: equivalent to `PORT`
* `--env`: equivalent to `NODE_ENV`
* `--force-ssl`: equivalent to `FORCE_SSL`
* `--trust-proxy`: equivalent to `TRUST_PROXY`
