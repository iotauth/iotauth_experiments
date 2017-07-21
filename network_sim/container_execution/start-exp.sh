#!/bin/bash

# Script for running experiments
# Author: Hokeun Kim

if [ "$EUID" -ne 0 ]
  then echo "Please run as root. Exiting ..."
  exit
fi

NS3_PROC_ID=`ps -aux | grep "tap-mixed-sst" | grep -v "grep" | awk '{print $2}'`

if [[ $NS3_PROC_ID != *[!\ ]* ]]; then
  echo "NS3 is not running! Please run NS3 first. Exiting ..."
  exit
fi

WAIT_TIME_FOR_AUTH_INIT=10s
TIME_BEFOR_FAIL=120s
TIME_AFTER_FAIL=120s
AUTH_TO_KILL=auth1
CURRENT_DIR=`pwd`
WAIT_TIME_BETWEEN_CLIENTS=1.5s #0.43s

echo "WAIT_TIME_FOR_AUTH_INIT=$WAIT_TIME_FOR_AUTH_INIT"
echo "TIME_BEFOR_FAIL=$TIME_BEFOR_FAIL"
echo "TIME_AFTER_FAIL=$TIME_AFTER_FAIL"
echo "AUTH_TO_KILL=$AUTH_TO_KILL"
echo "CURRENT_DIR=$CURRENT_DIR"
echo "WAIT_TIME_BETWEEN_CLIENTS=$WAIT_TIME_BETWEEN_CLIENTS"

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

echo "Now running experiemtns for $TIME_BEFOR_FAIL before failure ..."

sleep $TIME_BEFOR_FAIL

echo "Killing $AUTH_TO_KILL"
lxc-stop -n $AUTH_TO_KILL

echo "Now running experiemtns for $TIME_AFTER_FAIL after failure ..."

sleep $TIME_AFTER_FAIL

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



