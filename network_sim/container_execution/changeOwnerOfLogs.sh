#!/bin/bash

# Script for changing ownership of the logs from "root" to the original user.
# Author: Hokeun Kim

USER=`stat -c '%U' .`

chown $USER client_execution/t*
chown $USER client_execution/t*/nohup.out

chown $USER server_execution/t*
chown $USER server_execution/t*/nohup.out

chown $USER auth_execution/auth*
chown $USER auth_execution/auth*/nohup.out

