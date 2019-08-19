#!/bin/bash

# Script for analyzing multiple results in the multiple result directories.
# Author: Hokeun Kim

if [ $# -eq 0 ]; then
    echo "No arguments provided. Directory for results should be specified."
    exit 1
fi

# Concatenate result directories.
RESULT_DIRS=""
for i in $*; do
    RESULT_DIRS=$RESULT_DIRS$i" "
done

# analyze availability results
node multipleAvailabilityAnalyzer.js -c -a -t $RESULT_DIRS
