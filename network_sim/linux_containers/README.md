# Overview
---
This directory includes scripts to generate LXC (linux container) configuration files and other scripts for controlling LXC for SST network experiments with ns-3 network simulator.

# Manual for Experiments
---
Follow the steps below to generate, setup and start linux containers (LXC), and run Auths and entities inside the LXC.

Steps to generate and run linux containers

1. ./generateAll.sh
- this will generate lxc (linux container) configuration files and scripts to setup, start, stop, and tear down containers.

2. sudo ./setup-virtual-network.sh
- Setup and create linux containers and tap bridges.
- Should run this as a superuser (sudo).

3. sudo ./start-virtual-network.sh
- Start linux containers
    * Alternatively, inside network_sim/container_execution/auth_execution:
    run sudo ./start-auths.sh to start all Auth containers and run Auths inside it as a background programs
    * To see execution status of each Auth, inside network_sim/container_execution/auth_execution:
        sudo cat auth101/nohup.out
    *Alternatively, inside network_sim/container_execution/auth_execution:
    run sudo ./stop-auths.sh to stop all Auth containers


4. sudo ./stop-virtual-network.sh
- Stop linux containers

5. sudo ./teardown-virtual-network.sh
- Tear down and remove linux containers and bridges.

6. ./cleanAll.sh
- delete all configuration files and other scripts.
