#!/bin/bash -e

NODE_VERSION=${NODE_VERSION:-6.9.5}
NODE_PLATFORM=${NODE_PLATFORM:-linux-x64}
NODE_DIRNAME="node-v${NODE_VERSION}-${NODE_PLATFORM}"
NODE_FILENAME="node-v${NODE_VERSION}-${NODE_PLATFORM}.tar.xz"
NODE_URL=https://nodejs.org/dist/v${NODE_VERSION}/${NODE_FILENAME}
STARTWD=$PWD

DIST_DIR=dist
NODEJS_DIR=nodejs

# only download the package if it doesn't exist locally
if [[ ! -f "$NODE_FILENAME" ]] ; then
  curl -LO $NODE_URL
fi

# clean up the dist directory
rm -rf $DIST_DIR
mkdir -p $DIST_DIR/$NODEJS_DIR

tar -f ${NODE_FILENAME} -C $DIST_DIR/$NODEJS_DIR -ax

# Copy the source and needed files into the package.  We copy specific files to
# make sure that we don't accidentally include files which shouldn't be
# included
cp -r schemas/ test/ src/ package.json config.yml $DIST_DIR

# We want to do the install using the copy we're managing ourself
export PATH="$PWD/${NODEJS_DIR}/${NODE_DIRNAME}/bin/:$PATH"
(cd $DIST_DIR && ./${NODEJS_DIR}/${NODE_DIRNAME}/bin/npm install .)

# We need to generate the start.sh script using a useful node binary path
sed -e "s,<<<NODE_BINARY>>>,./${NODEJS_DIR}/${NODE_DIRNAME}/bin/node," < start.sh.in > $DIST_DIR/start.sh
chmod +x $DIST_DIR/start.sh

# Give some information on the distribution that this was built against
git rev-parse HEAD > $DIST_DIR/gitinfo
git status >> $DIST_DIR/gitinfo
git diff >> $DIST_DIR/gitinfo

# Pack it up!
tar zcf host-secrets.tar.gz dist/

