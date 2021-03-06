#!/usr/bin/env bash

export NODE_ENV='test'

## Ports
export SERVER_PORT=3000
export CLIENT_PORT=9000
export CLIENT_TEST=9001

export wpUrl="http://onyx.abudhabi.nyu.edu/wordpress"

PROJECTDIR=/home/jillian/Dropbox/projects/NY/chemgen/chemgen-loopback-new
RSYNC="rsync -avz  -e 'ssh -p 4410' --exclude=node_modules $PROJECTDIR jdr400@onyx.abudhabi.nyu.edu:/home/jdr400/projects/chemgen/" 

echo $RSYNC

inotify-hookable \
    --watch-directories '.' \
    --watch-directories server \
    --watch-directories common \
    --watch-directories test \
    --on-modify-command "${RSYNC}; mocha --recursive "

    #--on-modify-command "mocha --recursive --reporter nyan"
    #--on-modify-command "${RSYNC}; mocha --recursive --reporter nyan"
    #--on-modify-command "mocha --reporter spec --recursive --inspect-brk"
