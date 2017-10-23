#!/usr/bin/env bash

echo '##########'
echo '## ICBM ##'
echo '##########'
echo '--- NOTE ---'
echo '* Change server url at Client/src/entry.ts:104'
echo '------------'

cd Client
npm install
node_modules/.bin/webpack ../server/client.js
cd ../server
npm install
node server.js
