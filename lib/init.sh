#!/bin/bash

# Script for initializing node.js source code for experiments
# Author: Hokeun Kim

NODE_JS_NAME="node-v7.6.0"

if [ -d $NODE_JS_NAME ]; then
	echo $NODE_JS_NAME "already exists"
	exit 1
fi

wget "https://nodejs.org/dist/v7.6.0/"$NODE_JS_NAME".tar.gz"
tar -xvzf $NODE_JS_NAME".tar.gz"
rm "$NODE_JS_NAME.tar.gz"

#./modifyConfig.sh $NODE_JS_NAME
