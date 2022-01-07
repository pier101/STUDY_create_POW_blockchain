#!/bin/bash
kill -9 `ps -ef | grep node | grep r_main.js | awk '{print $2}'`

# vi restartServer.sh