# Important directories and enviroment variables

**$REPO_ROOT**

* This directory contains all 

**$CONF (iotauth_experiments/expConfigs)**

* This directory includes scripts for generating the *ns3Exp.graph*, *devList.txt*, and *commCosts.txt* files using *.input* file which describes Auths and thing, including a list of Auths, a list of things (clients & servers), assignemts (Auth - thing registration), trust relationships between Auths, communication costs, and migration plans.
  
**$IOT/examples (iotauth/examples)**

* This directory is for scripts to generate credentials, config files, and Auth databases using *.graph* file generated in $CONF.

**$ENTITY ($IOT/entity/node/example_entities)**

* This directory includes example entities and their scripts used in experiments. They are launched in LXC containers during experiments using the $EXEC scripts.
  
**$LXC (iotauth_experiments/network_sim/linux_containers)**

* This directory includes scripts for generating other scripts to set up, start, stop, and teardown linux containers (LXC, para-virtualmachines). The generation script uses *devList.txt* and *commCosts.txt* files. See [LXC README.md](https://github.com/iotauth/iotauth_experiments/blob/master/network_sim/linux_containers/README.md) for more details.
  
**$NS3 (bake/source/ns-3.26)**

* A directory for running the ns-3 network simulator. The network model is under *$TAP* directory (*$NS3/src/tap-bridge/examples*). This simulation model connects linux containers (LXCs), therefore, the simulator must be running before we run LXCs.

**$TAP ($NS3/src/tap-bridge/examples)**

* This directory includes SST simulation models using tap bridges. Currently used simulation models are *tap-matrix-sst.cc* and *tap-mixed-sst.cc*. Other files include *comm-cost.h* for CommCost class and *tap-csma-sst.cc* which was used for experimenting wired connections for Auths.

**$EXEC (iotauth_experiments/network_sim/container_execution)**

* This directory is for actually executing linux containers (LXCs) for Auths, servers, and clinets. As a result of LXC execution, the execution logs are stored in subdirectories *auth_execution* for Auth logs, *server_execution* for server logs, and *client_execution* for client logs.

**$CCS (iotauth_experiments/experiments/ccs2017)**

* Current directory. This directory includes options for exepriments under $CCS/expOptions and contains scripts for copying logs and packet captures (pcap) to $CCS/results directory and scripts for analyzing the results, including availability and expected energy consumption.

**$MOUNT_DIR**

* This directory indeicate 

**Environment variable details**

      export REPO_ROOT=/home/user
      
      export IOT=$REPO_ROOT/iotauth
      export ENTITY=$IOT/entity/node/example_entities

      export EXP=$REPO_ROOT/iotauth_experiments
      export CONF=$EXP/expConfigs
      export CCS=$EXP/experiments/ccs2017

      export NS3=$REPO_ROOT/bake/source/ns-3.26
      export TAP=$NS3/src/tap-bridge/examples

      export NETSIM=$REPO_ROOT/iotauth_experiments/network_sim
      export LXC=$NETSIM/linux_containers
      export EXEC=$NETSIM/container_execution
      export MOUNT_DIR=$REPO_ROOT

# Experiment flow

* Overall flow of experiments (from graph generation to result analysis)

![Image of experiment flow](figures/exp_flow.png?raw=true "Title")
[Download PDF version of image](https://github.com/iotauth/iotauth_experiments/raw/master/experiments/ccs2017/figures/exp_flow.pdf)

# Experiment procedure

* Generating an input for graph (**ns3Exp.input** as default, can be changed, others are **$CCS/floorPlans/cory5th.input**)

  * This takes coordinates for entities (**$CCS/floorPlans/cory5th.txt**), predefined Auth-entity assignments (**$CCS/floorPlans/cory5thAssignments.json**), predefined Auth trusts (**$CCS/floorPlans/cory5thAuthTrusts.json**), and predefined Auth capacity (**$CCS/floorPlans/cory5thAuthCapacity.json**).

        cd $CCS
        # Install required packages
        ./initConfigs.sh 
        # for help
        node floorPlanToInput.js --help
        # for generating floor plan with predefined assignments and Auth trusts
        node floorPlanToInput.js -a floorPlans/cory5thAssignments.json -t floorPlans/cory5thAuthTrusts.json -c floorPlans/cory5thAuthCapacity.json -o floorPlans/cory5th -b 3

* Experiment graph generation (**ns3Exp.graph** as default, can be changed)

  * This also generates **commCosts.txt** (communication costs between Auths and things) and **devList.txt** (a list of device information - name, address, type, position)
  * Internally uses *expGraphGenerator.js* and *graphInput.js*
  
        cd $CONF
        # Install required packages
        ./initConfigs.sh 
        # for help
        ./generateAll.sh --help
        # default local
        ./generateAll.sh 
        # With a given floor plan
        ./generateAll.sh -i $CCS/floorPlans/cory5th.input -o cory5th.graph

* To generate Auths and entities using graph

      cd $IOT/examples
      ./cleanAll.sh
      ./generateAll.sh -g $CONF/ns3Exp.graph

* To set linux containers (LXCs). **generateAll.sh** will generate **tapConfigs.txt** that is used for ns3 simulation. The setup takes some time. See [LXC README.md](https://github.com/iotauth/iotauth_experiments/blob/master/network_sim/linux_containers/README.md) for more details. Do not forget to teardown LXCs with "./teardown-virtual-network.sh" before you create a new set of LXCs. (If not, it will cause problems because of the LXCs that are already there).

      cd $LXC
      # Clean up existing LXCs
      sudo ./teardown-virtual-network.sh
      ./cleanAll.sh

      # Generate default configuration
      ./generateAll.sh -d $CONF/devList.txt
      # Generate configuration including communication cost relationships
      ./generateAll.sh -d $CONF/devList.txt -c $CONF/commCosts.txt

      # Set up LXCs
      sudo ./setup-virtual-network.sh

* To see current linux containers,

      sudo lxc-ls

* To setup ns3 network simulation environment (build is optional)

  * **IMPORTANT**: Before the first build of ns3, configure it to include examples and tests, enable sudo, and optimize the build. Examples include modules for simulation, **tap-matrix-sst** and **tap-mixed-sst**.

        ./waf configure --build-profile=optimized --enable-examples --enable-tests --enable-sudo

  * To edit the simulator source code, see inside **$TAP** (**$NS3/src/tap-bridge/examples**) and look into simulation files (e.g., **tap-matrix-sst.cc**, **tap-mixed-sst.cc**)
  
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


# Experiment procedure for extended experiments for Cory 3rd, 4th and 5th floors (Cory345)

* Generating an input for graph (**ns3Exp.input** as default, can be changed, others are **$CCS/floorPlans/cory345.input**)

  * This takes coordinates for entities (**$CCS/floorPlans/cory345.txt**), predefined Auth-entity assignments (**$CCS/floorPlans/cory345Assignments.json**), predefined Auth trusts (**$CCS/floorPlans/cory345AuthTrusts.json**), predefined Auth capacity (**$CCS/floorPlans/cory345AuthCapacity.json**).
  
        cd $CCS
        # for help
        node floorPlanToInput.js --help
        # for generating floor plan with predefined assignments and Auth trusts
        node floorPlanToInput.js -i floorPlans/cory345/cory345.txt -a floorPlans/cory345/cory345Assignments.json -t floorPlans/cory345/cory345AuthTrusts.json -c floorPlans/cory345/cory345AuthCapacity.json -o floorPlans/cory345/cory345 -b 9 -l

* To generate graph file and devList.txt, commCost.txt

      cd $CONF
      ./generateAll.sh -i $CCS/floorPlans/cory345/cory345.input -o cory345.graph

* To generate example Auths and servers and clients

      cd $IOT/examples
      ./cleanAll.sh
      ./generateAll.sh -g $CONF/cory345.graph

* The rest is the same for the smaller-scale experiments


# Experiment procedure for extended experiments for Cory 4th and 5th floors (Cory45)

* Generating an input for graph

  * This takes entity coordinates, Auth-entity assignments, Auth trusts, and Auth capacity for Cory 4th and 5th floors.

        node floorPlanToInput.js -i floorPlans/cory45/cory45.txt -a floorPlans/cory45/cory45Assignments.json -t floorPlans/cory45/cory45AuthTrusts.json -c floorPlans/cory45/cory45AuthCapacity.json -o floorPlans/cory45/cory45 -b 6 -l
  
* To generate graph file and devList.txt, commCost.txt

      cd $CONF
      ./generateAll.sh -i $CCS/floorPlans/cory45/cory45.input -o cory45.graph

* To integrate migration plans into graph file

      cd $CONF

      node integrateMigrationPlan.js -g cory45.graph -m $IOT/auth/migration-solver/results/cory45_plan_ILP.json -o cory45_ILP.graph

      node integrateMigrationPlan.js -g cory45.graph -m $IOT/auth/migration-solver/results/cory45_plan_ILP_mt.json -o cory45_ILP_mt.graph

      node integrateMigrationPlan.js -g cory45.graph -m $IOT/auth/migration-solver/results/cory45_plan_ILP_ac.json -o cory45_ILP_ac.graph

      node integrateMigrationPlan.js -g cory45.graph -m $IOT/auth/migration-solver/results/cory45_plan_ILP_mt_ac.json -o cory45_ILP_mt_ac.graph

* To generate example Auths and servers and clients

      cd $IOT/examples
      ./cleanAll.sh
      ./generateAll.sh -g $CONF/cory45.graph      
        
* To analyze multiple results (example commands)

      cd $CCS
      ./analyzeMultipleResults.sh -t -c -a -w 6 -n results_for_acm_tiot/trust1/order3/*
      ./analyzeMultipleResults.sh -t -c -a -w 6 results_for_acm_tiot/trust1/order6/*
      
* The rest is the same for the smaller-scale experiments
