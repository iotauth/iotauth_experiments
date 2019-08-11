#!/bin/bash

# Script for running experiments with multiple configurations - from generating Auths/Servers/Clients.
# Author: Hokeun Kim

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45.graph -p asdf
cd $CCS
./runMultipleExperiments.sh -e order2/Naive -m 6 -o 501,403,504,401,503,402

echo 'Next config'

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45_ILP.graph -p asdf
cd $CCS
./runMultipleExperiments.sh -e order2/ILP -m 6 -o 501,403,504,401,503,402

echo 'Next config'

cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/cory45_ILP_mt_ac.graph -p asdf
cd $CCS

./runMultipleExperiments.sh -e order2/ILP_mt_ac -m 6 -o 501,403,504,401,503,402




