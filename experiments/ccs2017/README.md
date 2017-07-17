# Important directories and enviroment variables

**$CONF (iotauth_experiments/expConfigs)**

* This directory includes scripts for generating the *ns3Exp.graph*, *devList.txt*, and *commCosts.txt* files using *.input* file which describes Auths and thing, including a list of Auths, a list of things (clients & servers), assignemts (Auth - thing registration), trust relationships between Auths, communication costs, and migration plans.
  
**$IOT/examples (iotauth/examples)**

* This directory is for scripts to generate credentials, config files, and Auth databases using *.graph* file generated in $CONF.
  
**$LXC (iotauth_experiments/network_sim/linux_containers)**

* This directory includes scripts for generating other scripts to set up, start, stop, and teardown linux containers (LXC, para-virtualmachines). The generation script uses *devList.txt* and *commCosts.txt* files. See [LXC README.md](https://github.com/iotauth/iotauth_experiments/blob/master/network_sim/linux_containers/README.md) for more details.
  
**$NS3 (bake/source/ns-3.26)**

* A directory for running the ns-3 network simulator. The network model is under $TAP directory ($NS3/src/tap-bridge/examples). This simulation model connects linux containers (LXCs), therefore, the simulator must be running before we run LXCs.

**$EXEC (iotauth_experiments/network_sim/container_execution)**

* This directory is for actually executing linux containers (LXCs) for Auths, servers, and clinets. As a result of LXC execution, the execution logs are stored in subdirectories *auth_execution* for Auth logs, *server_execution* for server logs, and *client_execution* for client logs.

**$CCS (iotauth_experiments/experiments/ccs2017)**

* Current directory. This directory includes options for exepriments under $CCS/expOptions and contains scripts for copying logs and packet captures (pcap) to $CCS/results directory and scripts for analyzing the results, including availability and expected energy consumption.

**Environment variable details**

      export IOT=$DEV/iotauth

      export EXP=$DEV/iotauth_experiments
      export CONF=$EXP/expConfigs
      export CCS=$EXP/experiments/ccs2017

      export NS3=$DEV/bake/source/ns-3.26
      export TAP=$NS3/src/tap-bridge/examples

      export NETSIM=$DEV/iotauth_experiments/network_sim
      export LXC=$NETSIM/linux_containers
      export EXEC=$NETSIM/container_execution

# Experiment procedure

* Experiment graph generation (**ns3Exp.graph**)

  * This also generates **commCosts.txt** (communication costs between Auths and things) and **devList.txt** (a list of device information - name, address, type, position)
  
        cd $CONF
        node expGraphGenerator.js

* To generate Auths and entities using graph

      cd $IOT/examples
      ./cleanAll.sh
      ./generateAll.sh -g $CONF/ns3Exp.graph

* To set linux containers (LXCs). **generateAll.sh** will generate **tapConfigs.txt** that is used for ns3 simulation. The setup takes some time. See [LXC README.md](https://github.com/iotauth/iotauth_experiments/blob/master/network_sim/linux_containers/README.md) for more details. Do not forget to teardown LXCs with "./teardown-virtual-network.sh" before you create a new set of LXCs. (If not, it will cause problems because of the LXCs that are already there).

      cd $LXC
      ./cleanAll.sh
      ./generateAll.sh -d $CONF/devList.txt -c $CONF/commCosts.txt
      sudo ./setup-virtual-network.sh

* To see current linux containers,

      sudo lxc-ls

* To setup ns3 network simulation environment (build is optional)

  * To edit the simulator source code, see inside **src/tap-bridge/examples** and look into simulation files (e.g., **tap-matrix-sst.cc**, **tap-mixed-sst.cc**)
  
        cd $NS3
        ./waf build
        
        # To use matrix propagation loss for wifi connections
        ./waf --run tap-matrix-sst --command-template="%s $LXC/tapConfigs.txt"
        
        # To use positions in x,y,z coordinates for wifi connections
        ./waf --run tap-mixed-sst --command-template="%s $LXC/tapConfigs.txt"

* To run linux containers (LXCs) for experiments

  * Initializes Auths, servers, and clients
  * Emulates failure of an Auth
  * Change owners of created log files
      
        sudo chroot /
        cd $EXEC
        ./start-exp.sh
        
  * To stop the experiment while it is still in progress
        
        ./stop-all.sh
        
  * To clean created logs, etc.
        
        ./cleanAll.sh
        
* To analyze results
  
  * Copy results (logs and pcap files) to a directory that will be created under $CCS/results/YYMMDD-HHMMSS, (this also copies config files used for the experiments under $CCS/results/YYMMDD-HHMMSS/configs to use them in analysis such as the given communication costs, addresses of communication targets, and names devices and TAPs. **NOTE: Don't run this analysis as a super user (root)!!**
  
        exit
        cd $CCS
        ./copyResults.sh

  * Analyze results for the given directory (e.g., results/YYMMDD-HHMMSS). Creates a directory called under results/YYMMDD-HHMMSS/analysis for storing analysis results (currently availability.txt and packet.txt)
  
        ./analyzeResult.sh [RESULT_DIR]

# Further details of experiments

* Details for running experiments
        
  * To run Auths and servers background

        sudo chroot /
        cd $EXEC
        cd auth_execution
        ./cleanAll.sh
        ./start-auths.sh

        cd server_execution
        ./cleanAll.sh
        ./start-servers.sh

  * To run clients

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

  * To simulate failure of an Auth

        sudo lxc-stop -n auth1

