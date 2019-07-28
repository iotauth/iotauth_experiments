#!/bin/bash

# Script for copying experimental results to results directory
# Author: Hokeun Kim

# Parse command line arguments:
# -d for results directory name.
while [[ $# -gt 0 ]]
do
  key="$1"

  case $key in
    -d|--result_dir)
      RESULT_DIR="$2"
      shift # past argument
      ;;
    -h|--help)
      SHOW_HELP=true
      ;;
    *)
      # unknown option
      echo "Unknown option $key, exiting..."
      exit 1
      ;;
  esac
  shift # past argument or value
done

if [ "$SHOW_HELP" = true ] ; then
  echo "Usage: ./copyResults.sh [options]"
  echo
  echo "Options:"
  echo "  -d,--result_dir <arg>   Directory name for results."
  echo "  -h,--help               Show this help."
  exit 1
fi

if [ -z "$RESULT_DIR" ]
then
  echo "Result directory name is not set, using date time for directory name."
  DATE=`date +%y%m%d-%H%M%S`
  RESULT_DIR=results/$DATE
else
  RESULT_DIR=results/$RESULT_DIR
fi

mkdir $RESULT_DIR

# copy execution logs
cp -r $EXEC/*_execution $RESULT_DIR
cp $EXEC/execution.log $RESULT_DIR

# Currently copying captured packets (pcap) is disabled
# copy captured packets
# mkdir $RESULT_DIR/pcap
# cp $NS3/*.pcap $RESULT_DIR/pcap

# copy current configurations used for experiments
mkdir $RESULT_DIR/configs
cp $CONF/cory5th.graph $CONF/devList.txt $CONF/commCosts.txt expOptions/expEntity.option $RESULT_DIR/configs

echo "Results have been copied to $RESULT_DIR."


