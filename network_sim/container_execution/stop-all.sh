#!/bin/bash

# Script for stopping auth/servers/clients
# Author: Hokeun Kim

if [ "$EUID" -ne 0 ]
  then echo "Please run as root. Exiting..."
  exit
fi

echo "Stopping clients..."
cd client_execution
./stop-clients.sh
cd ..

echo "Stopping servers..."
cd server_execution
./stop-servers.sh
cd ..

echo "Stoping Auths..."
cd auth_execution
./stop-auths.sh
cd ..

