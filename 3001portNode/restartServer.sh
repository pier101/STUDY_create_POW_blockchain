#!/bin/bash
kill -9 `ps -ef | grep node | grep httpServer.js | awk '{print $2}'`
node httpServer.js &

# vi restartServer.sh