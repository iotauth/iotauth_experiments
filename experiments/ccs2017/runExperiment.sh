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
    -n|--num_auths)
      NUM_AUTHS_TO_KILL="$2"
      shift # past argument
      ;;
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
  echo "Usage: ./runExperiments.sh [options]"
  echo
  echo "Options:"
  echo "  -n,--num_auths <arg>    Number of Auths to kill. Should be [1-6]."
  echo "  -e,--exp_name <arg>     Experiment name - prefix for the result dir."
  echo "  -h,--help               Show this help."
  exit 1
fi

# Check cmd line argument sanity.
if [ -z "$NUM_AUTHS_TO_KILL" ]
then
  echo "Number of Auths to kill is NOT set. (Try ./runExperiments.sh --help)"
  echo "Exiting ..."
  exit 1
fi

if [[ ! $NUM_AUTHS_TO_KILL =~ ^[1-6]$ ]]
then
  echo "Number of Auths to kill should be integer [1-6]."
  echo "Exiting ..."
  exit 1
fi

if [ -z "$EXP_NAME" ]
then
  echo "Experiment's name is NOT set. (Try ./runExperiments.sh --help)"
  echo "Exiting ..."
  exit 1
fi

# Starting experiment round.

echo "##################################"
echo "## Starting An Experiment Round ##"
echo "##################################"
echo
echo "Experiment information:"
echo "Experiment name:$EXP_NAME, Auths to kill: $NUM_AUTHS_TO_KILL"
echo
# Start NS3 simulator.

cd $NS3
echo "Moved to NS3 directory: $NS3"
./waf --run tap-mixed-sst --command-template="%s $LXC/tapConfigs.txt" &
sleep 10s
# $! contains the process ID of the most recently executed background pipeline.
NS3_PID=`pgrep ns3`
echo "Started NS3 simulator. PID:$NS3_PID"
echo "Running ps command..."
ps

# Bring up Auths and Things.

cd $EXEC
echo "Moved to EXEC directory: $EXEC"
EXEC_START_TIMESTAMP=`timestamp`
echo "Starting start-exp.sh script..."
# -E option is important to pass the environment variables (e.g., $ENTITY) to sudo.
sudo -E ./start-exp.sh -n $NUM_AUTHS_TO_KILL

if [ $? -ne 0  ] ; then
  echo "[Error] start-exp.sh finished with problems! exiting..." ; exit 1
fi

echo "start-exp.sh script finished successfully"
cat <<EOM >execution.log
Experiment started at $EXEC_START_TIMESTAMP
Experiment ended at `timestamp`
EOM

# Copy results

echo "Returning back to CCS directory..."
cd $CCS

echo "Copying results to directory named $EXP_NAME""_""$NUM_AUTHS_TO_KILL"
./copyResults.sh -d "$EXP_NAME""_""$NUM_AUTHS_TO_KILL"

# Kill NS3 simulator process
echo "Killing NS3 simulator process..."
kill -9 $NS3_PID

echo "End of experiment round."



