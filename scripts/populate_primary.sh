#!/usr/bin/env bash


#-rw-r--r-- 1 jdr400 jdr400  840 Oct 18 18:50 assays_2016-03--2016-09.js
#-rw-r--r-- 1 jdr400 jdr400 1.2K Oct 18 18:50 assays_2016-06-xx.js

source dev_envs.sh
node common/workflows/library/rnai/ahringer/primary/assays_2016-03--2016-09.js
node common/workflows/library/rnai/ahringer/primary/assays_2016-06-xx.js

