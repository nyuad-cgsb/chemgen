#!/usr/bin/env bash

export NODE_ENV='stage'

## Ports
export SERVER_PORT=3000
export CLIENT_PORT=9000
export CLIENT_TEST=9001

## Chemgen MYSQL Datasource
export CHEMGEN_HOST="onyx.abudhabi.nyu.edu"
export CHEMGEN_DB='chemgen_stage'
export CHEMGEN_USER='chemgen'
export CHEMGEN_PASS='chemGen123'

## HCS SQL Server (mssql) Datasource
export HCS_HOST="10.230.9.202"
export HCS_DB='store'
export HCS_USER='mysqluser'
export HCS_PASS='password'

#Wordpress database
export WORDPRESS_HOST="onyx.abudhabi.nyu.edu"
export WORDPRESS_USER="chemgen_wp_stage"
export WORDPRESS_PASS="Password123"
export WORDPRESS_DB="chemgen_wp_stage"
export wpUrl="http://onyx.abudhabi.nyu.edu/chemgen_stage"
