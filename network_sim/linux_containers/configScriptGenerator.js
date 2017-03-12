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

function generateLxcConfigs(devList) {
    var templateStr = fs.readFileSync('templates/lxc.conf.template', 'utf-8');
    for (var i = 0; i < devList.length; i++) {
        var dev = devList[i];
        var devName = dev.name;
        var lxcConfStr = templateStr.replace(new RegExp('BRIDGE_NAME', 'g'), getBridgeName(devName));
        lxcConfStr = lxcConfStr.replace(new RegExp('CONTAINER_NAME', 'g'), getContainerName(devName));
        lxcConfStr = lxcConfStr.replace(new RegExp('DEV_ADDR', 'g'), dev.addr);
        fs.writeFileSync(getLxcConfFileName(devName), lxcConfStr, 'utf-8');
    }
}

function generateSetupScript(devList) {
    // script file names
    var setupScriptFileName = 'setup-virtual-network.sh';
    var startScriptFileName = 'start-virtual-network.sh';
    var stopScriptFileName = 'stop-virtual-network.sh';
    var teardownScriptFileName = 'teardown-virtual-network.sh';
    
    // for setup script
    var addBridgeCommands = '';
    var createTapCommands = '';
    var setTapPersistentCommands = '';
    var addBridgeToTapCommands = '';
    var createContainerCommands = '';
    
    // for start script
    var startContainerCommands = '';
    
    // for stop script
    var stopContainerCommands = '';
    
    // for teardown script
    var destroyContainerCommands = '';
    var bridgeDownCommands = '';
    var removeBridgeFromTapCommands = '';
    var deleteBridgeCommands = '';
    var tapDownCommands = '';
    var setTapNonPersistentCommands = '';
    
        
    for (var i = 0; i < devList.length; i++) {
        var devName = devList[i].name;
        var containerName = devName;
        var bridgeName = getBridgeName(devName);
        var tapName = getTapName(devName);
        // for setup script
        addBridgeCommands += 'brctl addbr ' + bridgeName + '\n';
        createTapCommands += 'tunctl -t ' + tapName + '\n';
        setTapPersistentCommands += 'ifconfig ' + tapName + ' 0.0.0.0 promisc up\n';
        addBridgeToTapCommands += 'brctl addif ' + bridgeName + ' ' + tapName + '\nifconfig ' + bridgeName + ' up\n';
        createContainerCommands += 'lxc-create -n ' + containerName + ' -f ' + getLxcConfFileName(devName) + ' -t download -- -d ubuntu -r xenial -a amd64\n';
        
        // for start script
        startContainerCommands += 'lxc-start -n ' + containerName + ' -d\n';
        
        // for stop script
        stopContainerCommands += 'lxc-stop -n ' + containerName + '\n';
        
        // for teardown script
        destroyContainerCommands += 'lxc-destroy -n ' + containerName + '\n';
        bridgeDownCommands += 'ifconfig ' + bridgeName + ' down\n';
        removeBridgeFromTapCommands += 'brctl delif ' + bridgeName + ' ' + tapName + '\n';
        deleteBridgeCommands += 'brctl delbr ' + bridgeName + '\n';
        tapDownCommands += 'ifconfig ' + tapName + ' down\n';
        setTapNonPersistentCommands += 'tunctl -d ' + tapName + '\n';
    }
    
    // generating setup script
    var setupScript = fs.readFileSync('templates/' + setupScriptFileName + '.template', 'utf-8');
    setupScript = setupScript.replace('ADD_BRIDGE_COMMANDS', addBridgeCommands);
    setupScript = setupScript.replace('CREATE_TAP_COMMANDS', createTapCommands);
    setupScript = setupScript.replace('ADD_BRIDGE_TO_TAP_COMMANDS', addBridgeToTapCommands);
    setupScript = setupScript.replace('SET_TAP_PERSISTENT_COMMANDS', setTapPersistentCommands);
    setupScript = setupScript.replace('CREATE_CONTAINER_COMMANDS', createContainerCommands);
    fs.writeFileSync(setupScriptFileName, setupScript, 'utf-8');
    
    // generating start script
    var startScript = fs.readFileSync('templates/' + startScriptFileName + '.template', 'utf-8');
    startScript = startScript.replace('START_CONTAINER_COMMANDS', startContainerCommands);
    fs.writeFileSync(startScriptFileName, startScript, 'utf-8');
    
    // generating stop script
    var stopScript = fs.readFileSync('templates/' + stopScriptFileName + '.template', 'utf-8');
    stopScript = stopScript.replace('STOP_CONTAINER_COMMANDS', stopContainerCommands);
    fs.writeFileSync(stopScriptFileName, stopScript, 'utf-8');
    
    // generating teardown script
    var teardownScript = fs.readFileSync('templates/' + teardownScriptFileName + '.template', 'utf-8');
    teardownScript = teardownScript.replace('DESTROY_CONTAINER_COMMANDS', destroyContainerCommands);
    teardownScript = teardownScript.replace('BRIDGE_DOWN_COMMANDS', bridgeDownCommands);
    teardownScript = teardownScript.replace('REMOVE_BRIDGE_FROM_TAP_COMMANDS', removeBridgeFromTapCommands);
    teardownScript = teardownScript.replace('DELETE_BRIDGE_COMMANDS', deleteBridgeCommands);
    teardownScript = teardownScript.replace('TAP_DOWN_COMMANDS', tapDownCommands);
    teardownScript = teardownScript.replace('SET_TAP_NONPERSISTENT_COMMANDS', setTapNonPersistentCommands);
    fs.writeFileSync(teardownScriptFileName, teardownScript, 'utf-8');
}

var devList = [
    {name: 'auth101', addr: '10.0.0.1'},
    {name: 'auth102', addr: '10.0.0.2'},
    {name: 'net1.client', addr: '10.0.0.3'},
    {name: 'net2.server', addr: '10.0.0.4'}
];

generateLxcConfigs(devList);
generateSetupScript(devList);

