#!/bin/bash

# Script for analyzing multiple results in the multiple result directories.
# Author: Hokeun Kim

if [ $# -eq 0 ]; then
    echo "No arguments provided. Directory for results should be specified."
    exit 1
fi

# Concatenate all args including result directories.
NODE_ARGS=""
for i in $*; do
    NODE_ARGS=$NODE_ARGS$i" "
done

# analyze availability results
node multipleAvailabilityAnalyzer.js $NODE_ARGS
