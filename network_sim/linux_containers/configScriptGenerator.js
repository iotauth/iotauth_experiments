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
    return devName;
}

function addNetworkConfig(networkConfigs, bridgeName, addr) {
    networkConfigs += 'lxc.network.type = veth\n';
    networkConfigs += 'lxc.network.link = ' + bridgeName + '\n';
    networkConfigs += 'lxc.network.ipv4 = ' + addr + '/24\n';
    networkConfigs += 'lxc.network.flags = up\n';
    return networkConfigs;
}

function generateLxcConfigs(devList) {
    var templateStr = fs.readFileSync('templates/lxc.conf.template', 'utf-8');
    for (var i = 0; i < devList.length; i++) {
        var dev = devList[i];
        var devName = dev.name;
        var bridgeName = getBridgeName(devName);
        var lxcConfStr = templateStr.replace(new RegExp('BRIDGE_NAME', 'g'), bridgeName);
        lxcConfStr = lxcConfStr.replace(new RegExp('CONTAINER_NAME', 'g'), getContainerName(devName));
        
        var networkConfigs = '';
        networkConfigs = addNetworkConfig(networkConfigs, bridgeName, dev.addr);
        if (dev.wifi) {
            networkConfigs += '\n';
            networkConfigs = addNetworkConfig(networkConfigs, bridgeName + 'wifi', dev.wifi);
        }

        lxcConfStr = lxcConfStr.replace('NET_CONF', networkConfigs);
        fs.writeFileSync(getLxcConfFileName(devName), lxcConfStr, 'utf-8');
    }
}

function addTapBridgeCommands(commands, bridgeName, tapName) {
    // for setup script
    commands.addBridge += 'brctl addbr ' + bridgeName + '\n';
    commands.createTap += 'tunctl -t ' + tapName + '\n';
    commands.setTapPersistent += 'ifconfig ' + tapName + ' 0.0.0.0 promisc up\n';
    commands.addBridgeToTap += 'brctl addif ' + bridgeName + ' ' + tapName + '\nifconfig ' + bridgeName + ' up\n';
    // for teardown script
    commands.bridgeDown += 'ifconfig ' + bridgeName + ' down\n';
    commands.removeBridgeFromTap += 'brctl delif ' + bridgeName + ' ' + tapName + '\n';
    commands.deleteBridge += 'brctl delbr ' + bridgeName + '\n';
    commands.tapDown += 'ifconfig ' + tapName + ' down\n';
    commands.setTapNonPersistent += 'tunctl -d ' + tapName + '\n';
    return commands;
}

function addContainerCommands(commands, containerName, lxcConfFileName) {
    // for setup script
    commands.createContainer += 'lxc-create -n ' + containerName + ' -f ' + lxcConfFileName + ' -t download -- -d ubuntu -r xenial -a amd64\n';
    // for start script
    commands.startContainer += 'lxc-start -n ' + containerName + ' -d\n';
    // for stop script
    commands.stopContainer += 'lxc-stop -n ' + containerName + '\n';
    // for teardown script
    commands.destroyContainer += 'lxc-destroy -n ' + containerName + '\n';
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
        var lxcConfFileName = getLxcConfFileName(devName);
        commands = addTapBridgeCommands(commands, bridgeName, tapName);
        if (dev.wifi) {
            commands = addTapBridgeCommands(commands, bridgeName + 'wifi', tapName + 'wifi');
        }
        commands = addContainerCommands(commands, containerName, lxcConfFileName);
    }
    
    // generating setup script
    var setupScript = fs.readFileSync('templates/' + setupScriptFileName + '.template', 'utf-8');
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
        if (devName.startsWith('auth')) {
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

var devList = [
    {name: 'auth101', addr: '10.0.0.1', wifi: '10.0.1.1'},
    {name: 'auth102', addr: '10.0.0.2', wifi: '10.0.1.2'},
    {name: 'net1.client', addr: '10.0.1.3'},
    {name: 'net2.server', addr: '10.0.1.4'}
];

generateLxcConfigs(devList);
generateSetupScript(devList);
generateAddressMapping(devList);

