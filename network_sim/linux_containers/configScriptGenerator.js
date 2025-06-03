/*
 * Copyright (c) 2016, Regents of the University of California
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * IOTAUTH_COPYRIGHT_VERSION_1
 */

/**
 * Generator for linux container (lxc) configurations and scripts.
 * @author Hokeun Kim
 */


"use strict";

var fs = require('fs');

function getLxcConfFileName(devName) {
    return 'lxc-' + devName + '.conf';
}

function getBridgeName(devName) {
    return 'br-' + devName;
}

function getTapName(devName) {
    return 'tap-' + devName;
}

function getContainerName(devName) {
    // net1.client -> net1_client
    return devName.replace('.', '_');
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function addNetworkConfig(networkConfigs, bridgeName, addr, index) {
    networkConfigs += `lxc.net.${index}.type = veth\n`;
    networkConfigs += `lxc.net.${index}.link = ${bridgeName}\n`;
    networkConfigs += `lxc.net.${index}.ipv4.address = ${addr}/24\n`;
    networkConfigs += `lxc.net.${index}.flags = up\n`;
    return networkConfigs;
}

function generateLxcConfigs(devList) {
    var templateStr = fs.readFileSync('templates/lxc.conf.template', 'utf-8');
    var currentWorkingDir = process.cwd(); // Get the current working directory

    for (var i = 0; i < devList.length; i++) {
        var dev = devList[i];
        var devName = dev.name;
        var bridgeName = getBridgeName(devName);

        // Replace placeholders in the template
        var lxcConfStr = templateStr.replace(new RegExp('BRIDGE_NAME', 'g'), bridgeName);
        lxcConfStr = lxcConfStr.replace(new RegExp('CONTAINER_NAME', 'g'), getContainerName(devName));
        lxcConfStr = lxcConfStr.replace(new RegExp('PWD', 'g'), currentWorkingDir); // Replace PWD with the current working directory

        var networkConfigs = '';
        networkConfigs = addNetworkConfig(networkConfigs, bridgeName, dev.addr, 0);
        if (dev.wifi) {
            networkConfigs += '\n';
            networkConfigs = addNetworkConfig(networkConfigs, bridgeName + 'wifi', dev.wifi, 1);
        }

        lxcConfStr = lxcConfStr.replace('NET_CONF', networkConfigs);
        fs.writeFileSync(getLxcConfFileName(devName), lxcConfStr, 'utf-8');
    }
}

function addTapBridgeCommands(commands, bridgeName, tapName) {
    // for setup script
    commands.addBridge += 'brctl addbr ' + bridgeName + '\n';
    commands.createTap += 'tunctl -t ' + tapName + '\n';
    commands.setTapPersistent += 'ip link set ' + tapName + ' up\nip link set ' + tapName + ' promisc on\n';
    commands.addBridgeToTap += 'brctl addif ' + bridgeName + ' ' + tapName + '\nip link set ' + bridgeName + ' up\n';
    // for teardown script
    commands.bridgeDown += 'ip link set ' + bridgeName + ' down\n';
    commands.removeBridgeFromTap += 'brctl delif ' + bridgeName + ' ' + tapName + '\n';
    commands.deleteBridge += 'brctl delbr ' + bridgeName + '\n';
    commands.tapDown += 'ip link set ' + tapName + ' down\n';
    commands.setTapNonPersistent += 'tunctl -d ' + tapName + '\n';
    return commands;
}

function addContainerCommands(commands, containerName, lxcConfFileName) {
    // for setup script
    commands.createContainer += 'lxc-create -n ' + containerName + ' -f ' + lxcConfFileName + ' -t download -- -d ubuntu -r jammy -a amd64\n';
    // for start script
    commands.startContainer += 'lxc-start -n ' + containerName + ' -d\n';
    // for stop script
    commands.stopContainer += 'lxc-stop -n ' + containerName + '\n';
    // for teardown script
    commands.destroyContainer += 'lxc-destroy -n ' + containerName + '\n';
    return commands;
}

function addCleanupCommands(commands, bridgeName, tapName) {
    // Cleanup commands for setup script
    commands.cleanup += `if ip link show ${bridgeName} > /dev/null 2>&1; then ip link set ${bridgeName} down; brctl delbr ${bridgeName}; fi\n`;
    commands.cleanup += `if ip link show ${tapName} > /dev/null 2>&1; then ip link delete ${tapName}; fi\n`;
    return commands;
}

function generateSetupScript(devList) {
    // script file names
    var setupScriptFileName = 'setup-virtual-network.sh';
    var startScriptFileName = 'start-virtual-network.sh';
    var stopScriptFileName = 'stop-virtual-network.sh';
    var teardownScriptFileName = 'teardown-virtual-network.sh';
    
    var commands = {
        // for setup script
        cleanup: '',
        addBridge: '',
        createTap: '',
        setTapPersistent: '',
        addBridgeToTap: '',
        createContainer: '',
        
        // for start script
        startContainer: '',
        
        // for stop script
        stopContainer: '',
        
        // for teardown script
        destroyContainer: '',
        bridgeDown: '',
        removeBridgeFromTap: '',
        deleteBridge: '',
        tapDown: '',
        setTapNonPersistent: ''
    };
    
    for (var i = 0; i < devList.length; i++) {
        var dev = devList[i];
        var devName = dev.name;
        var containerName = getContainerName(devName);
        var bridgeName = getBridgeName(devName);
        var tapName = getTapName(devName);
        commands = addCleanupCommands(commands, bridgeName, tapName);
        commands = addTapBridgeCommands(commands, bridgeName, tapName);
        if (dev.wifi) {
            commands = addCleanupCommands(commands, bridgeName + 'wifi', tapName + 'wifi');
            commands = addTapBridgeCommands(commands, bridgeName + 'wifi', tapName + 'wifi');
        }
        commands = addContainerCommands(commands, containerName, getLxcConfFileName(devName));
    }
    
    // generating setup script
    var setupScript = fs.readFileSync('templates/' + setupScriptFileName + '.template', 'utf-8');
    setupScript = setupScript.replace('CLEANUP_COMMANDS', commands.cleanup);
    setupScript = setupScript.replace('ADD_BRIDGE_COMMANDS', commands.addBridge);
    setupScript = setupScript.replace('CREATE_TAP_COMMANDS', commands.createTap);
    setupScript = setupScript.replace('ADD_BRIDGE_TO_TAP_COMMANDS', commands.addBridgeToTap);
    setupScript = setupScript.replace('SET_TAP_PERSISTENT_COMMANDS', commands.setTapPersistent);
    setupScript = setupScript.replace('CREATE_CONTAINER_COMMANDS', commands.createContainer);
    fs.writeFileSync(setupScriptFileName, setupScript, 'utf-8');
    
    // generating start script
    var startScript = fs.readFileSync('templates/' + startScriptFileName + '.template', 'utf-8');
    startScript = startScript.replace('START_CONTAINER_COMMANDS', commands.startContainer);
    fs.writeFileSync(startScriptFileName, startScript, 'utf-8');
    
    // generating stop script
    var stopScript = fs.readFileSync('templates/' + stopScriptFileName + '.template', 'utf-8');
    stopScript = stopScript.replace('STOP_CONTAINER_COMMANDS', commands.stopContainer);
    fs.writeFileSync(stopScriptFileName, stopScript, 'utf-8');
    
    // generating teardown script
    var teardownScript = fs.readFileSync('templates/' + teardownScriptFileName + '.template', 'utf-8');
    teardownScript = teardownScript.replace('DESTROY_CONTAINER_COMMANDS', commands.destroyContainer);
    teardownScript = teardownScript.replace('BRIDGE_DOWN_COMMANDS', commands.bridgeDown);
    teardownScript = teardownScript.replace('REMOVE_BRIDGE_FROM_TAP_COMMANDS', commands.removeBridgeFromTap);
    teardownScript = teardownScript.replace('DELETE_BRIDGE_COMMANDS', commands.deleteBridge);
    teardownScript = teardownScript.replace('TAP_DOWN_COMMANDS', commands.tapDown);
    teardownScript = teardownScript.replace('SET_TAP_NONPERSISTENT_COMMANDS', commands.setTapNonPersistent);
    fs.writeFileSync(teardownScriptFileName, teardownScript, 'utf-8');
}
// container name, [ {dev name, addr}, {dev name, addr} ]
function generateAddressMapping(devList) {
    var assignmentString = '';
    for (var i = 0; i < devList.length; i++) {
        var dev = devList[i];
        var devName = dev.name;
        if (devName.toLowerCase().startsWith('auth')) {
            devName = devName.replace('auth', 'Auth');
        }
        assignmentString += devName + '\t' + dev.addr;
        if (dev.wifi) {
            assignmentString += '\t' + dev.wifi;
        }
        assignmentString += '\n';
    }
    var outputFileName = 'host-port-assignments.txt';
    var outputFileString = fs.readFileSync('templates/' + outputFileName + '.template', 'utf-8');
    outputFileString = outputFileString.replace('HOST_PORT_ASSIGNMENTS', assignmentString);
    fs.writeFileSync(outputFileName, outputFileString, 'utf-8');
}

function generateStartStopScripts(devList) {
    var startAuthCommands = '';
    var stopAuthCommands = '';
    
    var startServerCommands = '';
    var stopServerCommands = '';
    
    var startClientCommands = '';
    var stopClientCommands = '';
    
    for (var i = 0; i < devList.length; i++) {
        var dev = devList[i];
        var devName = dev.name;
        var containerName = getContainerName(devName);
        var dirName = devName;
        
        if (dev.type == 'auth') {
            // for start commands
            startAuthCommands += '\nmkdir -p ' + dirName + '\n';
            startAuthCommands += 'cd ' + dirName + '\n'
            startAuthCommands += 'lxc-start -n ' + containerName + '\n';
            // printf "y\\nasdf\\n" |
            startAuthCommands += 'nohup lxc-attach -n ' + containerName + ' -- java -jar $AUTH/target/auth-server-jar-with-dependencies.jar -p $AUTH/../properties/example' + capitalizeFirstLetter(devName) + '.properties -b $AUTH/ -s asdf &\n';
            startAuthCommands += 'cd ..\n';
            // for stop commands
            stopAuthCommands += '\nlxc-stop -n ' + containerName + '\n';
        }
        
        else if (dev.type == 'server') {
            // for start commands
            startServerCommands += '\nmkdir -p ' + dirName + '\n';
            startServerCommands += 'cd ' + dirName + '\n'
            startServerCommands += 'lxc-start -n ' + containerName + '\n';
            startServerCommands += 'nohup lxc-attach -n ' + containerName + ' -- node $ENTITY/echoServer.js $ENTITY/configs/Servers/' + devName + '.config $ENTITY $CCS/expOptions/expEntity.option &\n';
            startServerCommands += 'cd ..\n';
            // for stop commands
            stopServerCommands += '\nlxc-stop -n ' + containerName + '\n';
        }
        
        else if (dev.type == 'client') {
            // for start commands
            startClientCommands += '\nmkdir -p ' + dirName + '\n';
            startClientCommands += 'cd ' + dirName + '\n'
            startClientCommands += 'lxc-start -n ' + containerName + '\n';
            startClientCommands += 'nohup lxc-attach -n ' + containerName + ' -- node $ENTITY/autoClient.js $ENTITY/configs/Clients/' + devName + '.config $ENTITY $CCS/expOptions/expEntity.option &\n';
            startClientCommands += 'cd ..\n';
            startClientCommands += 'sleep $WAIT_TIME_BETWEEN_CLIENTS\n';   // intentional delay
            // for stop commands
            stopClientCommands += '\nlxc-stop -n ' + containerName + '\n';
        }
    }
    
    // write to Auth script files
    var startAuthScriptFileName = 'start-auths.sh';
    var stopAuthScriptFileName = 'stop-auths.sh';
    var startAuthScriptString = fs.readFileSync('templates/' + startAuthScriptFileName + '.template', 'utf-8').replace('START_AUTH_COMMANDS', startAuthCommands);
    var stopAuthScriptString = fs.readFileSync('templates/' + stopAuthScriptFileName + '.template', 'utf-8').replace('STOP_AUTH_COMMANDS', stopAuthCommands);
    var authTargetDirectory = '../container_execution/auth_execution/';
    fs.writeFileSync(authTargetDirectory + startAuthScriptFileName, startAuthScriptString, 'utf-8');
    fs.writeFileSync(authTargetDirectory + stopAuthScriptFileName, stopAuthScriptString, 'utf-8');
    
    // write to server script files
    var startServerScriptFileName = 'start-servers.sh';
    var stopServerScriptFileName = 'stop-servers.sh';
    var startServerScriptString = fs.readFileSync('templates/' + startServerScriptFileName + '.template', 'utf-8').replace('START_SERVER_COMMANDS', startServerCommands);
    var stopServerScriptString = fs.readFileSync('templates/' + stopServerScriptFileName + '.template', 'utf-8').replace('STOP_SERVER_COMMANDS', stopServerCommands);
    var serverTargetDirectory = '../container_execution/server_execution/';
    fs.writeFileSync(serverTargetDirectory + startServerScriptFileName, startServerScriptString, 'utf-8');
    fs.writeFileSync(serverTargetDirectory + stopServerScriptFileName, stopServerScriptString, 'utf-8');
    
    // write to client script files
    var startClientScriptFileName = 'start-clients.sh';
    var stopClientScriptFileName = 'stop-clients.sh';
    var startClientScriptString = fs.readFileSync('templates/' + startClientScriptFileName + '.template', 'utf-8').replace('START_CLIENT_COMMANDS', startClientCommands);
    var stopClientScriptString = fs.readFileSync('templates/' + stopClientScriptFileName + '.template', 'utf-8').replace('STOP_CLIENT_COMMANDS', stopClientCommands);
    var clientTargetDirectory = '../container_execution/client_execution/';
    fs.writeFileSync(clientTargetDirectory + startClientScriptFileName, startClientScriptString, 'utf-8');
    fs.writeFileSync(clientTargetDirectory + stopClientScriptFileName, stopClientScriptString, 'utf-8');
}


function getTapIndex(tapList, devName) {
    for (var i = 0; i < tapList.length; i++) {
        if (tapList[i].devName == devName) {
            return i;
        }
    }
}

function generateTapConfigs(devList, commCosts) {
    var wiredTapList = [];
    var wifiTapList = [];
    var wifiPositionList = [];
    
    for (var i = 0; i < devList.length; i++) {
        var dev = devList[i];
        var devName = dev.name;
        var tapName = getTapName(dev.name);
        var position = dev.position;
        if (dev.type == 'auth') {
            wiredTapList.push({tapName: tapName, devName: devName});
            tapName = tapName + 'wifi';
        }
        wifiTapList.push({tapName: tapName, devName: devName});
        wifiPositionList.push(position.x + ' ' + position.y + ' ' + position.z);
    }
    
    var tapConfigString = 'WiredTaps\n';
    for (var i = 0; i < wiredTapList.length; i++) {
        tapConfigString += wiredTapList[i].tapName + '\n';
    }
    tapConfigString += '\n';
    tapConfigString += 'WifiTaps\n';
    for (var i = 0; i < wifiTapList.length; i++) {
        tapConfigString += wifiTapList[i].tapName + '\n';
    }
    tapConfigString += '\n';
    tapConfigString += 'WifiPositions\n';
    for (var i = 0; i < wifiPositionList.length; i++) {
        tapConfigString += wifiPositionList[i] + '\n';
    }
    
    tapConfigString += '\n';
    tapConfigString += 'CommCosts\n';
    if (commCosts) {
        for (var i = 0; i < commCosts.length; i++) {
            var commCost = commCosts[i];
            var index1 = getTapIndex(wifiTapList, commCost.name1);
            var index2 = getTapIndex(wifiTapList, commCost.name2);
            tapConfigString += index1 + ' ' + index2 + ' ' + commCost.cost + '\n';
        }
        tapConfigString += '\n';
    }
    
    var outputFileName = 'tapConfigs.txt';
    fs.writeFileSync(outputFileName, tapConfigString, 'utf-8');
}

// get devList file
if (process.argv.length <= 2) {
    console.error('Device list file must be provided!');
    process.exit(1);
}
var devListFile = process.argv[2];
var devList = JSON.parse(fs.readFileSync(devListFile));

generateLxcConfigs(devList);
generateSetupScript(devList);
//generateAddressMapping(devList);
generateStartStopScripts(devList);

var commCosts = null;
// get commCosts
if (process.argv.length > 3) {
    console.log('commCosts are given!');
    var commCostsFile = process.argv[3];
    commCosts = JSON.parse(fs.readFileSync(commCostsFile));
}
generateTapConfigs(devList, commCosts);




