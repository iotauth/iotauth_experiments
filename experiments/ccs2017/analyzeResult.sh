#!/bin/bash

# Script for analyzing experimental results in the result directory
# Author: Hokeun Kim

if [ $# -eq 0 ]; then
    echo "No arguments provided. Directory for results should be specified."
    exit 1
fi

RESULT_DIR=$1

echo "RESULT_DIR=$RESULT_DIR"

RESULT_CONF=$RESULT_DIR/configs
ANALYSIS_DIR=$RESULT_DIR/analysis

mkdir -p $ANALYSIS_DIR

# analyze pcap results (currently disabled)
# node packetAnalyzer.js $RESULT_DIR/pcap $RESULT_CONF/cory5th.graph $RESULT_CONF/devList.txt $RESULT_CONF/commCosts.txt $ANALYSIS_DIR/packet.txt

# analyze availability results
node availabilityAnalyzer.js $RESULT_DIR/client_execution $ANALYSIS_DIR/availability.txt


