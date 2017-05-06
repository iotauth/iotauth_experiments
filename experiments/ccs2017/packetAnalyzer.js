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
 * Analyzer of pcap files
 * @author Hokeun Kim
 */

"use strict";

var fs = require('fs');
var util = require('util');

function getTapName(devName) {
    return 'tap-' + devName;
}

// get files
if (process.argv.length <= 5) {
    console.error('[Pcap directory], [graph file], [dev list file] and [comm costs file] must be provided!');
    process.exit(1);
}
var pcapDir = process.argv[2];
var graphFile = process.argv[3];
var devListFile = process.argv[4];
var commCostsFile = process.argv[5];
var graph = JSON.parse(fs.readFileSync(graphFile));
var devList = JSON.parse(fs.readFileSync(devListFile));
var commCosts = JSON.parse(fs.readFileSync(commCostsFile));
var assignments = graph.assignments;

function getCommCost(name1, name2) {
    for (var i = 0; i < commCosts.length; i++) {
        var commCost = commCosts[i];
        if (commCost.name1 === name1 && commCost.name2 === name2) {
            return commCost.cost;
        }
        else if (commCost.name1 === name2 && commCost.name2 === name1) {
            return commCost.cost;
        }
    }
    throw "no comm cost available for " + name1 + " and " + name2;
}

var entityList = graph.entityList;

var addrMap = {};
var clientMap = {};
var serverMap = {};

for (var i = 0; i < devList.length; i++) {
    var dev = devList[i];
    if (dev.type === 'auth') {
        addrMap[dev.name] = dev.wifi;
    }
    else {
        if (dev.type === 'server') {
            addrMap[dev.name] = dev.addr;
            serverMap[dev.name] = {name: dev.name, tapName: getTapName(dev.name), targetList: []};
        }
        else if (dev.type === 'client') {
            addrMap[dev.name] = dev.addr;
            clientMap[dev.name] = {name: dev.name, tapName: getTapName(dev.name), targetList: []};
        }
    }
}

//console.log(clientMap);
//console.log(serverMap);

for (var i = 0; i < entityList.length; i++) {
    var entity = entityList[i];
    // current auth as a target
    var currentAuth = 'auth' + assignments[entity.name];
    var authTarget = {
        name: currentAuth,
        addr: addrMap[currentAuth],
        cost: getCommCost(currentAuth, entity.name)
    };
    // migration auth as a target
    var migrationAuthTarget = null;
    if (entity.backupToAuthId >= 0) {
        var migrationAuth = 'auth' + entity.backupToAuthId;
        migrationAuthTarget = {
            name: migrationAuth,
            addr: addrMap[migrationAuth],
            cost: getCommCost(migrationAuth, entity.name)
        };
    }
    // this is a server
    if (entity.port != null) {
        //console.log(entity.name);
        serverMap[entity.name].targetList.push(authTarget);
        if (migrationAuthTarget !== null) {
            serverMap[entity.name].targetList.push(migrationAuthTarget);
        }
    }
    // this is a client
    else {
        clientMap[entity.name].targetList.push(authTarget);
        if (migrationAuthTarget !== null) {
            clientMap[entity.name].targetList.push(migrationAuthTarget);
        }
        // servers as targets
        for (var j = 0; j < entity.targetServerInfoList.length; j++) {
            var targetServerInfo = entity.targetServerInfoList[j];
            var commCost = getCommCost(entity.name, targetServerInfo.name);
            var serverTarget = {
                name: targetServerInfo.name,
                addr: targetServerInfo.host,
                cost: commCost
            };
            clientMap[entity.name].targetList.push(serverTarget);
            var clientTarget = {
                name: entity.name,
                addr: addrMap[entity.name],
                cost: commCost
            };
            serverMap[targetServerInfo.name].targetList.push(clientTarget);
        }
    }
}

//console.log(util.inspect(clientMap, {depth:3}));
//console.log(util.inspect(serverMap, {depth:3}));

var pcapList = Object.values(clientMap).concat(Object.values(serverMap));
pcapList = pcapList.sort(function(a, b) {
  return a.name < b.name ? -1 : 1;
});
console.log(util.inspect(pcapList, {depth:3}));



