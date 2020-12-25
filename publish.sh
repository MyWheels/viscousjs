#!/bin/bash

# Not sure why, but putting this directory
#  change in a package.json script just doesn't
#  seem to work well. So we'll just do it here

set -e

err() {
    echo "Error occurred:"
    awk 'NR>L-4 && NR<L+4 { printf "%-5d%3s%s\n",NR,(NR==L?">>>":""),$0 }' L=$1 $0
}
trap 'err $LINENO' ERR

rm -rf lib
yarn test
yarn build
cp -rf README.md lib
cat package.json | sed 's/lib\///g' > lib/package.json
cd lib
npm publish
