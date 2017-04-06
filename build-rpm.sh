#!/bin/bash
set -ex
#
# Prepare to and actually build a taskcluster-host-secrets RPM.
# This assumes a clean ~/rpm
rpmdev-setuptree > /dev/null

VERSION=$(python -c "import json ; print(json.load(open('package.json'))['version'])")
TOPDIR=$(realpath rpmbuild)
rm -rf $TOPDIR
mkdir -p $TOPDIR/{RPMS,SRPMS,SOURCES,BUILD,SPECS}

sed -e "s/__VERSION__/$VERSION/" < host-secrets.spec.in > host-secrets.spec
tar -zc -f $TOPDIR/SOURCES/taskcluster-host-secrets.tar.gz $(git ls-files)
spectool -C $TOPDIR/SOURCES -g host-secrets.spec
rpmbuild --define "version $VERSION" --define "_topdir $TOPDIR" -bs host-secrets.spec
rm -rf results/
mkdir results/
#for env in epel-6-x86_64 ; do
for env in fedora-25-x86_64 ; do
  rm -rf results/$env
  mkdir results/$env
  mock --define "version $VERSION" -r $env $TOPDIR/SRPMS/taskcluster-host-secrets*.src.rpm --resultdir results/$env
done
