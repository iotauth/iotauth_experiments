#!/bin/bash

# Core script for running experiments
# Author: Hokeun Kim

# Define a timestamp function
# Usage: echo message `timestamp`
timestamp() {
    echo $(($(date +%s%N)/1000000))
}

# Parse command line arguments:
# -n for number of auths to kill
while [[ $# -gt 0 ]]
do
  key="$1"

  case $key in
    -n|--num_auths)
      NUM_AUTHS_TO_KILL="$2"
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
  echo "Usage: ./start-exp.sh [options]"
  echo
  echo "Options:"
  echo "  -n,--num_auths <arg>    Number of Auths to kill. Should be [1-6]."
  echo "  -h,--help               Show this help."
  exit 1
fi

# Check cmd line argument sanity.
if [ -z "$NUM_AUTHS_TO_KILL" ]
then
  echo "Number of Auths to kill is NOT set. (Try ./start-exp.sh --help)"
  echo "Exiting ..."
  exit 1
fi

if [[ ! $NUM_AUTHS_TO_KILL =~ ^[1-6]$ ]]
then
  echo "Number of Auths to kill should be integer [1-6]."
  echo "Exiting ..."
  exit 1
fi

# Check if the user is root.
if [ "$EUID" -ne 0 ]
    then echo "Please run as root. Exiting ..."
    exit 1
fi

NS3_PROC_ID=`ps -aux | grep "tap-mixed-sst" | grep -v "grep" | awk '{print $2}'`

if [[ $NS3_PROC_ID != *[!\ ]* ]]; then
    echo "NS3 is not running! Please run NS3 first. Exiting ..."
    exit 1
fi

WAIT_TIME_FOR_AUTH_INIT=60s
TIME_BEFOR_FAIL=300s
TIME_AFTER_FAIL=1200s
# NUM_AUTHS_TO_KILL=3     # Up to 3
AUTHS_TO_KILL=(auth504 auth402 auth501 auth403 auth503 auth401)
# AUTHS_TO_KILL=(auth1 auth3 auth4 auth2)
CURRENT_DIR=`pwd`
WAIT_TIME_BETWEEN_CLIENTS=3s #0.43s

echo "WAIT_TIME_FOR_AUTH_INIT=$WAIT_TIME_FOR_AUTH_INIT"
echo "TIME_BEFOR_FAIL=$TIME_BEFOR_FAIL"
echo "TIME_AFTER_FAIL=$TIME_AFTER_FAIL"
echo "NUM_AUTHS_TO_KILL=$NUM_AUTHS_TO_KILL"
printf "AUTHS_TO_KILL="
for ((i=0; i< $NUM_AUTHS_TO_KILL; i++)) {
    printf "${AUTHS_TO_KILL[i]} "
}
printf "\n"
echo "CURRENT_DIR=$CURRENT_DIR"
echo "WAIT_TIME_BETWEEN_CLIENTS=$WAIT_TIME_BETWEEN_CLIENTS"

echo "Cleaning outcomes from previous experiments ..."
./cleanAll.sh

echo "Starting Auths ..."
cd auth_execution
./start-auths.sh
cd ..

echo "Starting servers ..."
cd server_execution
./start-servers.sh
cd ..

echo "Waiting for Auths to initialize for $WAIT_TIME_FOR_AUTH_INIT ..."
sleep $WAIT_TIME_FOR_AUTH_INIT

echo "Starting clients ..."
cd client_execution
./start-clients.sh $WAIT_TIME_BETWEEN_CLIENTS
cd ..

echo "Now running experiemtns for $TIME_BEFOR_FAIL before failure ... from time: `timestamp`"

sleep $TIME_BEFOR_FAIL

for ((i=0; i< $NUM_AUTHS_TO_KILL; i++)) {
    echo "Killing ${AUTHS_TO_KILL[i]} at time: `timestamp`"
    lxc-stop -n ${AUTHS_TO_KILL[i]}
}

echo "Now running experiemtns for $TIME_AFTER_FAIL after failure ... from time: `timestamp`"

sleep $TIME_AFTER_FAIL

echo "Stopping simulation at time: `timestamp`"
echo "Stopping clients ..."
cd client_execution
./stop-clients.sh
cd ..

echo "Stopping servers ..."
cd server_execution
./stop-servers.sh
cd ..

echo "Stoping Auths ..."
cd auth_execution
./stop-auths.sh
cd ..

echo "Changing ownership of execution logs ..."
./changeOwnerOfLogs.sh



