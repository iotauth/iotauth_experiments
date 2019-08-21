#!/bin/bash

# Script for running experiments with multiple configurations - from generating Auths/Servers/Clients.
# Author: Hokeun Kim


#TRUST_ID="trust1"
#AUTH_TRUSTS="501-502,501-504,502-503,502-504,401-402,401-403,401-502,401-504,402-503,403-501"

#TRUST_ID="trust2"
#AUTH_TRUSTS="501-502,503-504,502-503,502-504,401-402,401-403,401-502,401-504,402-501,403-503"

TRUST_ID="trust3"
AUTH_TRUSTS="501-502,501-504,502-503,502-504,403-402,401-403,401-502,401-501,402-502,503-504"

mkdir -p floorPlans/cory45/$TRUST_ID
mkdir -p $CONF/$TRUST_ID
# For None and Naive
node floorPlanToInput.js -i floorPlans/cory45/cory45.txt -a floorPlans/cory45/cory45Assignments.json -c floorPlans/cory45/cory45AuthCapacity.json -o floorPlans/cory45/$TRUST_ID/cory45 -b 6 -l -t $AUTH_TRUSTS
cd $CONF
./generateAll.sh -i $CCS/floorPlans/cory45/$TRUST_ID/cory45.input -o $CONF/$TRUST_ID/cory45.graph
cd $CCS
# For Less_Naive
node floorPlanToInput.js -i floorPlans/cory45/cory45.txt -a floorPlans/cory45/cory45Assignments.json -c floorPlans/cory45/cory45AuthCapacity.json -o floorPlans/cory45/$TRUST_ID/cory45_less_naive -b 6 -l -t $AUTH_TRUSTS -n
cd $CONF
./generateAll.sh -i $CCS/floorPlans/cory45/$TRUST_ID/cory45_less_naive.input -o $CONF/$TRUST_ID/cory45_less_naive.graph
cd $CCS
# For ILP and ILP_mt_ac
NUM_ORDERS=6 # order1 - order2
for ((i = 1; i <= $NUM_ORDERS; i++))
do
  mkdir -p $CONF/$TRUST_ID/order$i
  node $CONF/integrateMigrationPlan.js -g $CONF/$TRUST_ID/cory45.graph -m $IOT/auth/migration-solver/results/$TRUST_ID/order$i/cory45_plan_ILP.json -o $CONF/$TRUST_ID/order$i/cory45_ILP.graph
  node $CONF/integrateMigrationPlan.js -g $CONF/$TRUST_ID/cory45.graph -m $IOT/auth/migration-solver/results/$TRUST_ID/order$i/cory45_plan_ILP_mt_ac.json -o $CONF/$TRUST_ID/order$i/cory45_ILP_mt_ac.graph
done

ORDER_ID="order1"
AUTH_KILL_ORDER="504,402,501,403,503,401"

### Template for None, Naive, Less_Naive, ILP, ILP_mt_ac experiments ###
echo $ORDER_ID
echo $AUTH_KILL_ORDER

echo $ORDER_ID - None

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_disabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/None -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Less_Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45_less_naive.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/Less_Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/$ORDER_ID/cory45_ILP.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/ILP -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP_mt_ac

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/$ORDER_ID/cory45_ILP_mt_ac.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/ILP_mt_ac -m 6 -o $AUTH_KILL_ORDER
########################################################################

ORDER_ID="order3"
AUTH_KILL_ORDER="503,504,402,403,401,501"

### Template for None, Naive, Less_Naive, ILP, ILP_mt_ac experiments ###
echo $ORDER_ID
echo $AUTH_KILL_ORDER

echo $ORDER_ID - None

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_disabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/None -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Less_Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45_less_naive.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/Less_Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/$ORDER_ID/cory45_ILP.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/ILP -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP_mt_ac

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/$ORDER_ID/cory45_ILP_mt_ac.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/ILP_mt_ac -m 6 -o $AUTH_KILL_ORDER
########################################################################

ORDER_ID="order5"
AUTH_KILL_ORDER="504,501,503,401,402,403"

### Template for None, Naive, Less_Naive, ILP, ILP_mt_ac experiments ###
echo $ORDER_ID
echo $AUTH_KILL_ORDER

echo $ORDER_ID - None

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_disabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/None -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Less_Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45_less_naive.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/Less_Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/$ORDER_ID/cory45_ILP.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/ILP -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP_mt_ac

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/$ORDER_ID/cory45_ILP_mt_ac.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/ILP_mt_ac -m 6 -o $AUTH_KILL_ORDER
########################################################################

ORDER_ID="order6"
AUTH_KILL_ORDER="401,504,402,403,501,503"

### Template for None, Naive, Less_Naive, ILP, ILP_mt_ac experiments ###
echo $ORDER_ID
echo $AUTH_KILL_ORDER

echo $ORDER_ID - None

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_disabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/None -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Less_Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45_less_naive.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/Less_Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/$ORDER_ID/cory45_ILP.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/ILP -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP_mt_ac

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/$ORDER_ID/cory45_ILP_mt_ac.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/ILP_mt_ac -m 6 -o $AUTH_KILL_ORDER
########################################################################

ORDER_ID="order2"
AUTH_KILL_ORDER="501,403,504,401,503,402"

### Template for None, Naive, Less_Naive, ILP, ILP_mt_ac experiments ###
echo $ORDER_ID
echo $AUTH_KILL_ORDER

echo $ORDER_ID - None

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_disabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/None -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Less_Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45_less_naive.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/Less_Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/$ORDER_ID/cory45_ILP.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/ILP -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP_mt_ac

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/$ORDER_ID/cory45_ILP_mt_ac.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/ILP_mt_ac -m 6 -o $AUTH_KILL_ORDER
########################################################################

ORDER_ID="order4"
AUTH_KILL_ORDER="402,503,504,401,501,403"

### Template for None, Naive, Less_Naive, ILP, ILP_mt_ac experiments ###
echo $ORDER_ID
echo $AUTH_KILL_ORDER

echo $ORDER_ID - None

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_disabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/None -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - Less_Naive

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/cory45_less_naive.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/Less_Naive -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/$ORDER_ID/cory45_ILP.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/ILP -m 6 -o $AUTH_KILL_ORDER

echo $ORDER_ID - ILP_mt_ac

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/$TRUST_ID/$ORDER_ID/cory45_ILP_mt_ac.graph -p asdf
cd $CCS
cp $CCS/expOptions/expEntity_migration_enabled.option $CCS/expOptions/expEntity.option
./runMultipleExperiments.sh -e $TRUST_ID/$ORDER_ID/ILP_mt_ac -m 6 -o $AUTH_KILL_ORDER
########################################################################

