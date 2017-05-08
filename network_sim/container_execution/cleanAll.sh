#!/bin/bash

# Script for cleaning auth/server/client execution directories that contain logs
# Author: Hokeun Kim

cd auth_execution
./cleanAll.sh
cd ..

cd server_execution
./cleanAll.sh
cd ..

cd client_execution
./cleanAll.sh
cd ..
