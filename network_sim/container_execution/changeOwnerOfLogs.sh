#!/bin/bash

# Script for changing ownership of the logs from "root" to the original user.
# Author: Hokeun Kim

USER=`stat -c '%U' .`

chown $USER client_execution/t[0-9]*
chown $USER client_execution/t[0-9]*/nohup.out

chown $USER client_execution/c[0-9]*
chown $USER client_execution/c[0-9]*/nohup.out

chown $USER server_execution/t[0-9]*
chown $USER server_execution/t[0-9]*/nohup.out

chown $USER server_execution/s[0-9]*
chown $USER server_execution/s[0-9]*/nohup.out

chown $USER auth_execution/auth[0-9]*
chown $USER auth_execution/auth[0-9]*/nohup.out

