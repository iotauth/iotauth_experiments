#!/bin/bash

# Script for running experiments with multiple configurations - from generating Auths/Servers/Clients.
# Author: Hokeun Kim

echo 'order2 - None'

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_disabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e order2/None -m 6 -o 501,403,504,401,503,402

echo 'order2 - Naive'

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e order2/Naive -m 6 -o 501,403,504,401,503,402

echo 'order2 - ILP'

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/order2/cory45_ILP.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e order2/ILP -m 6 -o 501,403,504,401,503,402

echo 'order2 - ILP_mt_ac'

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/order2/cory45_ILP_mt_ac.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e order2/ILP_mt_ac -m 6 -o 501,403,504,401,503,402




