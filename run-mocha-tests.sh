#!/usr/bin/env bash

export NODE_ENV='TEST'

## Ports
export SERVER_PORT=3000
export CLIENT_PORT=9000
export CLIENT_TEST=9001

export wpUrl="http://onyx.abudhabi.nyu.edu/wordpress"

cd /home/jillian/Dropbox/projects/NY/chemgen/chemgen-loopback-new

inotify-hookable \
    --watch-directories '.' \
    --watch-directories server \
    --watch-directories common \
    --watch-directories test \
    --on-modify-command "mocha --recursive --reporter nyan"

