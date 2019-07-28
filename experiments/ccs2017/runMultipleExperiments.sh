#!/bin/bash

# Script for running one round of experiment - start ns3, start Auth/thing execution, copying results.
# Author: Hokeun Kim

# Define a timestamp function
# Usage: echo message `timestamp`
timestamp() {
    echo $(($(date +%s%N)/1000000))
}

# Parse command line arguments:
# -n for number of auths to kill
# -e for experiment name
while [[ $# -gt 0 ]]
do
  key="$1"

  case $key in
    -e|--exp_name)
      EXP_NAME="$2"
      shift # past argument
      ;;
    -h|--help)
      SHOW_HELP=true
      ;;
    *)
      # unknown option
      ;;
  esac
  shift # past argument or value
done

if [ "$SHOW_HELP" = true ] ; then
  echo "Usage: ./runMultipleExperiments.sh [options]"
  echo
  echo "Options:"
  echo "  -e,--exp_name <arg>     Experiment name - prefix for the result dir."
  echo "  -h,--help               Show this help."
  exit 1
fi

# Check cmd line argument sanity.

if [ -z "$EXP_NAME" ]
then
  echo "Experiment's name is NOT set. (Try ./runMultipleExperiments.sh --help)"
  echo "Exiting ..."
  exit 1
fi

# Starting experiments.

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "!! Starting Multiple Experiments !!"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo
echo "Experiment name:$EXP_NAME"
echo

MAX_AUTHS_TO_KILL=6

for ((i = 1; i <= $MAX_AUTHS_TO_KILL; i++))
do
  NUM_AUTHS_TO_KILL=$i
  echo "----------------------------------------------------------------------"
  echo "-- Command:   ./runExperiment.sh -e $EXP_NAME -n $NUM_AUTHS_TO_KILL"
  echo "-- Timestamp: `timestamp`"
  echo "----------------------------------------------------------------------"
  ./runExperiment.sh -e $EXP_NAME -n $NUM_AUTHS_TO_KILL
done

