Steps to generate and run linux containers

1. ./generateAll.sh

this will generate lxc (linux container) configuration files and scripts to setup, start, stop, and tear down containers.

2. sudo ./setup-virtual-network.sh

Setup and create linux containers and tap bridges.
Should run this as a superuser (sudo).

3. sudo ./start-virtual-network.sh

Start linux containers

3-1. Alternatively, inside network_sim/container_execution/auth_execution:
    run sudo ./start-auths.sh to start all Auth containers and run Auths inside it as a background programs

3-2. To see execution status of each Auth, inside network_sim/container_execution/auth_execution:
    sudo cat auth101/nohup.out

3-3. Alternatively, inside network_sim/container_execution/auth_execution:
    run sudo ./stop-auths.sh to stop all Auth containers


5. sudo ./stop-virtual-network.sh

Stop linux containers

6. sudo ./teardown-virtual-network.sh

Tear down and remove linux containers and bridges.
