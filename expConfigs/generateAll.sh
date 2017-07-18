#!/bin/bash

# Script for generating .graph file to be used for generation of Auths and entities
# Author: Hokeun Kim

# followings are default parameters
# files for input and output of the node script
INPUT_FILE="ns3Exp.input"
OUTPUT_GRAPH_FILE="ns3Exp.graph"
GENERATE_FOR_NS3=true

# parsing command line arguments
# -n for number of nets, -d for DB protection method and -a for host port assignment
while [[ $# -gt 0 ]]
do
	key="$1"

	case $key in
		-i|--in)
			INPUT_FILE="$2"
			shift # past argument
		;;
		-o|--out)
			OUTPUT_GRAPH_FILE="$2"
			shift # past argument
		;;
		-n|--ns3)
			GENERATE_FOR_NS3=true
		;;
		-l|--local)
			GENERATE_FOR_NS3=false
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
	echo "  -i,--in <arg>              Path for input file for generating graph."
	echo "  -o,--out <arg>             Output file name/path for generated graph."
	echo "  -n,--ns3 <arg>             Generate graph for ns3 simulation. (Default)"
	echo "  -l,--local <arg>           Generate graph for running locally."
	echo "  -h,--help                  Show this help."
	exit 1
fi

if [ "$GENERATE_FOR_NS3" = true ] ; then
    NS3_OPTION="-n"
fi

node expGraphGenerator.js $INPUT_FILE $OUTPUT_GRAPH_FILE $NS3_OPTION

