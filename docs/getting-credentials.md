---
title: Getting Credentials
---

To get a set of Taskcluster credentials for the current host, a client need
only make a GET request to the `/v1/credentials` path.  For example, if the host
is available at `https://host-credentials.mydomain.net`, 

```
$ curl https://host-credentials.mydomain.net/v1/credentials
{
  "credentials": {
    "clientId": "project/testing-host-secrets/host/localhost.localdomain",
    "accessToken": "<snip>",
    "certificate": "{\"version\":1,\"scopes\":[\"assume:project:testing-host-secrets:host:localdomain.localhost\"],\"start\":1486575908837,\"expiry\":1486575908837,\"seed\":\"<snip>\",\"signature\":\"<snip>\",\"issuer\":\"<snip>\"}"
  }
}
```

No parameters or credentials are required.

## Client Security

Note that any code running on the client can make this request. If code runs on
the host which cannot be trusted with the resulting credentials (for example,
executing a Taskcluster task), take steps to ensure that the untrusted code
cannot access the service.
