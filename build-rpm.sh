#!/bin/bash
set -ex
#
# Prepare to and actually build a taskcluster-host-secrets RPM.
# This assumes a clean ~/rpm
rpmdev-setuptree > /dev/null

TOPDIR=$(realpath rpmbuild)
rm -rf $TOPDIR
mkdir -p $TOPDIR/{RPMS,SRPMS,SOURCES,BUILD,SPECS}

tar -zc -f $TOPDIR/SOURCES/taskcluster-host-secrets.tar.gz $(git ls-files)
spectool -C $TOPDIR/SOURCES -g host-secrets.spec
rpmbuild --define "_topdir $TOPDIR" -bs host-secrets.spec
#for env in epel-6-x86_64 ; do
for env in fedora-25-x86_64 ; do
  mock -r $env $TOPDIR/SRPMS/taskcluster-host-secrets*.src.rpm
done
