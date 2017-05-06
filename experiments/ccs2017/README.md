# Enviroment variables
export IOT=$DEV/iotauth

export EXP=$DEV/iotauth_experiments
export CONF=$EXP/expConfigs
export CCS=$EXP/experiments/ccs2017

export NS3=$DEV/bake/source/ns-3.26
export TAP=$NS3/src/tap-bridge/examples

export NETSIM=$DEV/iotauth_experiments/network_sim
export LXC=$NETSIM/linux_containers
export EXEC=$NETSIM/container_execution

# Experiment graph generation (ns3Exp.graph)
# This also generates commCosts.txt (communication costs between Auths and things)
# and devList.txt (a list of device information - name, address, type, position)
cd $CONF
node expGraphGenerator.js

# To generate Auths and entities using graph
cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g $CONF/ns3Exp.graph

# To set linux containers (setup takes some time...)
cd $LXC
./cleanAll.sh
./generateAll.sh -d $CONF/devList.txt -c $CONF/commCosts.txt
sudo ./setup-virtual-network.sh

# To see current linux containers,
sudo lxc-ls

# To setup ns3 network simulation environment (build is optional)
cd $NS3
./waf build
./waf --run tap-matrix-sst --command-template="%s $LXC/tapConfigs.txt"
# NOT used anymore: ./waf --run tap-mixed-sst --command-template="%s $LXC/tapConfigs.txt"

# To run Auths and servers background
sudo chroot /
cd $EXEC
cd auth_execution
./cleanAll.sh
./start-auths.sh

cd server_execution
./cleanAll.sh
./start-servers.sh

# To run clients
sudo chroot /
lxc-start -n t2
lxc-attach -n t2
cd $ENTITY
node autoClient.js configs/Clients/t2.config 

lxc-start -n t4
lxc-attach -n t4
cd $ENTITY
node autoClient.js configs/Clients/t4.config 

lxc-start -n t5
lxc-attach -n t5
cd $ENTITY
node autoClient.js configs/Clients/t5.config 

lxc-start -n t6
lxc-attach -n t6
cd $ENTITY
node autoClient.js configs/Clients/t6.config 

lxc-start -n t8
lxc-attach -n t8
cd $ENTITY
node autoClient.js configs/Clients/t8.config 

# To simulate failure of an Auth
sudo lxc-stop -n auth1

