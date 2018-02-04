#!/usr/bin/env bash

## This is a scratch file for creating a new library
# common/models/library/rnai
# └── Ahringer
#     ├── defs
#     │   ├── Rnai-Librarystock.js
#     │   ├── Rnai-Librarystock.json
#     │   ├── Rnai-RnaiLibrary.js
#     │   └── Rnai-RnaiLibrary.json
#     ├── extract
#     │   ├── primary
#     │   │   └── Rnai-Librarystock.js
#     │   ├── Rnai-Librarystock.js
#     │   └── secondary
#     │       └── Rnai-Librarystock.js
#     ├── helpers.js
#     └── load
#         └── Rnai-Librarystock.js


### WIP Create a new library

LIBRARY='fda'
TYPE='chemical'
LIBRARYMODEL='Chemical-FDALibrary'


## Workflows

mkdir -p common/workflows/library/$TYPE/$LIBRARY/secondary/data
mkdir -p common/workflows/library/$TYPE/$LIBRARY/primary/data


## Models
mkdir -p common/models/library/$TYPE/$LIBRARY/defs
mkdir -p common/models/library/$TYPE/$LIBRARY/extract/primary
mkdir -p common/models/library/$TYPE/$LIBRARY/extract/secondary
mkdir -p common/models/library/$TYPE/$LIBRARY/load/secondary
mkdir -p common/models/library/$TYPE/$LIBRARY/load/primary
mkdir -p common/models/library/$TYPE/$LIBRARY/helpers/

touch common/models/library/$TYPE/$LIBRARY/defs/$LIBRARYMODEL.js
touch common/models/library/$TYPE/$LIBRARY/extract/primary/$LIBRARYMODEL.js
touch common/models/library/$TYPE/$LIBRARY/extract/secondary/$LIBRARYMODEL.js
touch common/models/library/$TYPE/$LIBRARY/load/secondary/$LIBRARYMODEL.js
touch common/models/library/$TYPE/$LIBRARY/load/primary/$LIBRARYMODEL.js
touch common/models/library/$TYPE/$LIBRARY/helpers/$LIBRARYMODEL.js
