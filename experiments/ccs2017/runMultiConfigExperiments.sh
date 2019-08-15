#!/bin/bash

# Script for running experiments with multiple configurations - from generating Auths/Servers/Clients.
# Author: Hokeun Kim

ORDER_ID="order1"
AUTH_KILL_ORDER="504,402,501,403,503,401"

### Template for None, Naive, ILP, ILP_mt_ac experiments ###
echo $ORDER_ID
echo $AUTH_KILL_ORDER

echo $ORDER_ID - None

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_disabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/None -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$ORDER_ID/cory45_ILP.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/ILP -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP_mt_ac

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$ORDER_ID/cory45_ILP_mt_ac.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/ILP_mt_ac -m 6 -o $AUTH_KILL_ORDER
############################################################

ORDER_ID="order2"
AUTH_KILL_ORDER="501,403,504,401,503,402"

### Template for None, Naive, ILP, ILP_mt_ac experiments ###
echo $ORDER_ID
echo $AUTH_KILL_ORDER

echo $ORDER_ID - None

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_disabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/None -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$ORDER_ID/cory45_ILP.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/ILP -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP_mt_ac

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$ORDER_ID/cory45_ILP_mt_ac.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/ILP_mt_ac -m 6 -o $AUTH_KILL_ORDER
############################################################

ORDER_ID="order3"
AUTH_KILL_ORDER="503,504,402,403,401,501"

### Template for None, Naive, ILP, ILP_mt_ac experiments ###
echo $ORDER_ID
echo $AUTH_KILL_ORDER

echo $ORDER_ID - None

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_disabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/None -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$ORDER_ID/cory45_ILP.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/ILP -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP_mt_ac

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$ORDER_ID/cory45_ILP_mt_ac.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/ILP_mt_ac -m 6 -o $AUTH_KILL_ORDER
############################################################

ORDER_ID="order4"
AUTH_KILL_ORDER="402,503,504,401,501,403"

### Template for None, Naive, ILP, ILP_mt_ac experiments ###
echo $ORDER_ID
echo $AUTH_KILL_ORDER

echo $ORDER_ID - None

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_disabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/None -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$ORDER_ID/cory45_ILP.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/ILP -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP_mt_ac

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$ORDER_ID/cory45_ILP_mt_ac.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/ILP_mt_ac -m 6 -o $AUTH_KILL_ORDER
############################################################

ORDER_ID="order5"
AUTH_KILL_ORDER="504,501,503,401,402,403"

### Template for None, Naive, ILP, ILP_mt_ac experiments ###
echo $ORDER_ID
echo $AUTH_KILL_ORDER

echo $ORDER_ID - None

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_disabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/None -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$ORDER_ID/cory45_ILP.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/ILP -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP_mt_ac

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$ORDER_ID/cory45_ILP_mt_ac.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/ILP_mt_ac -m 6 -o $AUTH_KILL_ORDER
############################################################

ORDER_ID="order6"
AUTH_KILL_ORDER="401,504,402,403,501,503"

### Template for None, Naive, ILP, ILP_mt_ac experiments ###
echo $ORDER_ID
echo $AUTH_KILL_ORDER

echo $ORDER_ID - None

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_disabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/None -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$ORDER_ID/cory45_ILP.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/ILP -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP_mt_ac

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$ORDER_ID/cory45_ILP_mt_ac.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $ORDER_ID/ILP_mt_ac -m 6 -o $AUTH_KILL_ORDER
############################################################

