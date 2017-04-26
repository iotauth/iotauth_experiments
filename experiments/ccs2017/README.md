# To generate Auths and entities using graph
cd $IOT/examples
./cleanAll.sh
./generateAll.sh -g expConfigs/ns3Exp.graph

# To set linux containers (setup takes some time...)
cd $LXC
./cleanAll.sh
./generateAll.sh -d $IOT/examples/expConfigs/devList.txt
sudo ./setup-virtual-network.sh

# To setup ns3 network simulation environment (build is optional)
cd $NS3
./waf build
./waf --run tap-mixed-sst --command-template="%s $LXC/tapConfigs.txt"

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

lxc-start -n t4
lxc-attach -n t4

lxc-start -n t5
lxc-attach -n t5
