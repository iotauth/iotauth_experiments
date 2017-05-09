#!/bin/bash

# Script for copying experimental results to results directory
# Author: Hokeun Kim

DATE=`date +%y%m%d-%H%M%S`

RESULT_DIR=results/$DATE

mkdir $RESULT_DIR
mkdir $RESULT_DIR/pcap

cp -r $EXEC/*_execution $RESULT_DIR
cp $NS3/*.pcap $RESULT_DIR/pcap




