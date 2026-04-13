#!/bin/bash

BASEDIR=$(dirname "$0")

pnpm install --ignore-workspace

rm -fr $BASEDIR/src/pages
mkdir $BASEDIR/src/pages

cp $BASEDIR/src/Main.tsx $BASEDIR/src/pages/Main.tsx
rm -f $BASEDIR/exportCache.json

pnpm lint:cache
rm -fr $BASEDIR/src/pages




