#!/bin/bash

# Script for copying experimental results to results directory
# Author: Hokeun Kim

DATE=`date +%y%m%d-%H%M%S`

RESULT_DIR=results/$DATE

mkdir $RESULT_DIR

# copy execution logs
cp -r $EXEC/*_execution $RESULT_DIR
cp $EXEC/execution.log $RESULT_DIR

# copy captured packets
mkdir $RESULT_DIR/pcap
cp $NS3/*.pcap $RESULT_DIR/pcap

# copy current configurations used for experiments
mkdir $RESULT_DIR/configs
cp $CONF/cory5th.graph $CONF/devList.txt $CONF/commCosts.txt expOptions/expEntity.option $RESULT_DIR/configs


