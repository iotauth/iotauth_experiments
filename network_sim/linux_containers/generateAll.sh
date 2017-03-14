#!/bin/bash

# Script for generating configurations and other scripts
# Author: Hokeun Kim

node configScriptGenerator.js
# scripts for containers
chmod +x setup-virtual-network.sh
chmod +x start-virtual-network.sh
chmod +x stop-virtual-network.sh
chmod +x teardown-virtual-network.sh
# scripts for Auths
chmod +x ../container_execution/auth_execution/start-auths.sh
chmod +x ../container_execution/auth_execution/stop-auths.sh
# configuration for generating Auths and entities
cp host-port-assignments.txt $IOT/examples/configs
