#!/bin/bash

# Script for generating configurations and other scripts
# Author: Hokeun Kim

# followings are default parameters
# file for host and port assignment of Auth and entities
DEV_LIST_FILE="devList.txt"
COMM_COSTS_FILE=""

# parsing command line arguments
# -n for number of nets, -d for DB protection method and -a for host port assignment
while [[ $# -gt 0 ]]
do
	key="$1"

	case $key in
		-d|--devlist)
			DEV_LIST_FILE="$2"
			shift # past argument
		;;
		-c|--commcosts)
			COMM_COSTS_FILE="$2"
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
	echo "Usage: ./generateAll.sh [options]"
	echo
	echo "Options:"
	echo "  -d,--devlist <arg>              Path for device list file."
	echo "  -c,--commcosts <arg>            Path for communication costs file."
	echo "  -h,--help                       Show this help."
	exit 1
fi

echo "Config script generation options:"
echo DEV_LIST_FILE = $DEV_LIST_FILE
echo COMM_COSTS_FILE = $COMM_COSTS_FILE

node configScriptGenerator.js $DEV_LIST_FILE $COMM_COSTS_FILE
if [ $? -ne 0  ] ; then
	echo "[Error] Script finished with problems! exiting..." ; exit 1
fi

# scripts for containers
chmod +x setup-virtual-network.sh
chmod +x start-virtual-network.sh
chmod +x stop-virtual-network.sh
chmod +x teardown-virtual-network.sh
# scripts for Auths
chmod +x ../container_execution/auth_execution/start-auths.sh
chmod +x ../container_execution/auth_execution/stop-auths.sh
# scripts for servers
chmod +x ../container_execution/server_execution/start-servers.sh
chmod +x ../container_execution/server_execution/stop-servers.sh

