#!/bin/bash

# Script for cleaning configurations and scripts
# Author: Hokeun Kim

rm *.conf
rm setup-virtual-network.sh
rm start-virtual-network.sh
rm stop-virtual-network.sh
rm teardown-virtual-network.sh
rm host-port-assignments.txt

rm ../container_execution/auth_execution/start-auths.sh
rm ../container_execution/auth_execution/stop-auths.sh
rm ../container_execution/server_execution/start-servers.sh
rm ../container_execution/server_execution/stop-servers.sh

