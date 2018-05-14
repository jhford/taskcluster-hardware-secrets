Taskcluster Host Secrets
========================

This is a service which generates taskcluster credentials for machines based on
their IP address, after doing a forward and reverse DNS verification.  The
service will grant a set of temporary credentials with a role based on the DNS
hostname.

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

## Credentials

The taskcluster credentials that are to be used with this service must be
permanent credentials (temporary credentials cannot generate other temporary).
Those credentials must have the scope `$TASKCLUSTER_SCOPE_BASE*` (e.g.
`assume:project:testing-host-secrets:host:*`) or a subset of the valid
hostnames.

### Deployment to Heroku-like services

For hosting services which provide an interface similar to Heroku, this snippet
should provide you with the details you need to integrate into it.

``` bash 
git clone <...>
cd taskcluster-host-secrets
yarn install
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

## Packaging

To make deployment in non-heroku environments, we have provided the ability to
build RPM packages easily.  This requires the Fedora Project's `mock` command.
It's easiest to use a recent version of Fedora to do the building, but any
version of Fedora or Enterprise Linux containing the Fedora 25 mock
configuration will work

Note that the package is built for the Fedora 25 environment even for
deployment to all environments.  This is done because the build process
requires a recent version of GCC to build node modules correctly, which is not
provided in Enterprise Linux 6.  The Node.js binaries included are a verbatim
copy of those provided by the Node.js project themselves.

The service can either be started with the `start.sh` script which has the
following command line options and environment variables:

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

The RPM packaging of this project includes an init.d script.  This is done
because the current deployment environment (EL 6) does not have systemd.  The
configuration file for this init.d script is `/etc/host-secrets.conf` and the
init script is `/etc/init.d/host-secrets`

The package can be built by running:

```
./build-rpm.sh
```

The output of the build process will be located in the `results/` subdirectory
of the repository clone, in another subdirectory (e.g.
`results/fedora-25-x86_64`) for the mock environment.  The output will be a
non-architecture specific source RPM, an architecture specific binary RPM as
well as a couple of log files of the build process.

The resulting RPM will include an architecture appropriate version of the
Node.js environment required to run the service as well as the service itself.

This process reqiures a modern Fedora system, and cannot run in Docker.

```
sudo dnf install git /usr/bin/rpmdev-setuptree mock dnf-utils
sudo usermod -a -G mock $USER
git clone https://github.com/taskcluster/taskcluster-host-secrets
cd taskcluster-host-secrets
./build-rpm.sh
```
