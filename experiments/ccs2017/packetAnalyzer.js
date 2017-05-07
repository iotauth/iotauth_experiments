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
const execSync = require('child_process').execSync;

var debugging = true;

function getTapName(devName) {
    return 'tap-' + devName;
}

// get files
if (process.argv.length <= 5) {
    console.error('[Pcap result directory], [graph file], [dev list file] and [comm costs file] must be provided!');
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
            var pcapInfo = {
                name: dev.name,
                tapName: getTapName(dev.name),
                addr: dev.addr,
                targetList: []
            };
        if (dev.type === 'server') {
            addrMap[dev.name] = dev.addr;
            serverMap[dev.name] = pcapInfo;
        }
        else if (dev.type === 'client') {
            addrMap[dev.name] = dev.addr;
            clientMap[dev.name] = pcapInfo;
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

var pcapInfoList = Object.values(clientMap).concat(Object.values(serverMap));
pcapInfoList = pcapInfoList.sort(function(a, b) {
  return a.name < b.name ? -1 : 1;
});

if (debugging) {
    // For debugging pcap entity-target addresses
    console.log('\nFor debugging pcap entity-target addresses: \n');
    console.log(util.inspect(pcapInfoList, {depth:3}));
}

// ip.src == 10.0.1.8
// arp.src.proto_ipv4 == 10.0.1.8

// ip.dst == 10.0.1.3
// arp.dst.proto_ipv4 == 10.0.1.3

// Example pcap info
//[ { name: 't1',
//    tapName: 'tap-t1',
//    addr: '10.0.1.5',
//    targetList: 
//     [ { name: 'auth1', addr: '10.0.1.1', cost: 1 },
//       { name: 'auth3', addr: '10.0.1.3', cost: 2.5 },
//       { name: 't2', addr: '10.0.1.8', cost: 1 },
//       { name: 't5', addr: '10.0.1.10', cost: 1 } ] },

function getPcapFilter(srcAddr, dstAddr) {
    var pcapFilter = '(ip.src == SRC_ADDR && ip.dst == DST_ADDR) || ' +
        '(arp.src.proto_ipv4 == SRC_ADDR && arp.dst.proto_ipv4 == DST_ADDR)';
    pcapFilter = pcapFilter.replace(new RegExp('SRC_ADDR', 'g'), srcAddr);
    pcapFilter = pcapFilter.replace(new RegExp('DST_ADDR', 'g'), dstAddr);
    return pcapFilter;
}

var pcapAnalysisList = [];
for (var i = 0; i < pcapInfoList.length; i++) {
    var pcapInfo = pcapInfoList[i];
    var pcapFileName = pcapDir + '/wifi-' + pcapInfo.tapName + '.pcap';
    var countCommandTemplate = 'tshark -2 -nr "' + pcapFileName + '" -R "PCAP_FILTER" -T fields -e frame.len | wc -l';
    var bytesCommandTemplate = 'tshark -2 -nr "' + pcapFileName + '" -R "PCAP_FILTER" -T fields -e frame.len | awk \'{sum+=$1}END{print sum}\'';
    var analysisTargetList = [];
    for (var j = 0; j < pcapInfo.targetList.length; j++) {
        var target = pcapInfo.targetList[j];
        var myAddr = pcapInfo.addr;
        var targetAddr = target.addr;
        var sentFilter = getPcapFilter(myAddr, targetAddr);
        var receivedFilter = getPcapFilter(targetAddr, myAddr);
        analysisTargetList.push({
            name: target.name,
            cost: target.cost,
            sentCoundCommand: countCommandTemplate.replace('PCAP_FILTER', sentFilter),
            sentBytesCommand: bytesCommandTemplate.replace('PCAP_FILTER', sentFilter),
            receivedCoundCommand: countCommandTemplate.replace('PCAP_FILTER', receivedFilter),
            receivedBytesCommand: bytesCommandTemplate.replace('PCAP_FILTER', receivedFilter)
        });
    }
    pcapAnalysisList.push({
        name: pcapInfo.name,
        targetList: analysisTargetList
    });
}

if (debugging) {
    // For debugging pcap commands
    console.log('\nFor debugging pcap commands: \n');
    console.log(util.inspect(pcapAnalysisList, {depth:3}));
}

function getTsharkResult(result) {
    result = result.toString().trim();
    if (result.length == 0) {
        return 0;
    }
    return parseInt(result);
}

var entityPcapResultList = [];

console.log('\nProcessing pcap results...\n');
for (var i = 0; i < pcapAnalysisList.length; i++) {
    var pcapAnalysis = pcapAnalysisList[i];
    var results = [];
    for (var j = 0; j < pcapAnalysis.targetList.length; j++) {
        var target = pcapAnalysis.targetList[j];
        console.log('EntityName: ' + pcapAnalysis.name + '\tTargetName: ' + target.name);
        var data = {
            sentCount: getTsharkResult(execSync(target.sentCoundCommand)),
            sentBytes: getTsharkResult(execSync(target.sentBytesCommand)),
            receivedCount: getTsharkResult(execSync(target.receivedCoundCommand)),
            receivedBytes: getTsharkResult(execSync(target.receivedBytesCommand))
        };
        results.push({
            targetName: target.name,
            cost: target.cost,
            data: data
        });
    }
    entityPcapResultList.push({
        entityName: pcapAnalysis.name,
        results: results
    });
}

if (debugging) {
    // For debugging pcap raw results
    console.log('\nFor debugging pcap raw results: \n');
    console.log(util.inspect(entityPcapResultList, {depth:4}));
}

function convertPcapResultToEnergy(data, cost) {
    // Energy per operation
    // Send packet: 454 μJ + 1.9 μJ × packet size (bytes)
    // Receive packet: 356 μJ + 0.5 μJ × packet size (bytes)
    var energyForSending = 454 * data.sentCount + 1.9 * data.sentBytes;
    var energyForReceiving = 356 * data.receivedCount + 0.5 * data.receivedBytes;
    return energyForSending * cost + energyForReceiving;
}

var entityEnergyResultList = [];
for (var i = 0; i < entityPcapResultList.length; i++) {
    var entityPcapResult = entityPcapResultList[i];
    var energyResults = [];
    var totalEnergy = 0;
    for (var j = 0; j < entityPcapResult.results.length; j++) {
        var pcapResult = entityPcapResult.results[j];
        var energyResult = convertPcapResultToEnergy(pcapResult.data, pcapResult.cost);
        energyResults.push({
            targetName: pcapResult.targetName,
            energy: energyResult
        });
        totalEnergy += energyResult;
    }
    entityEnergyResultList.push({
        entityName: entityPcapResult.entityName,
        totalEnergy: totalEnergy,
        results: energyResults
    });
}

console.log('\nDisplaying final results: \n');
console.log(util.inspect(entityEnergyResultList, {depth:3}));

var totalThingsEnergy = 0;
for (var i = 0; i < entityEnergyResultList.length; i++) {
    var entityEnergyResult = entityEnergyResultList[i];
    totalThingsEnergy += entityEnergyResult.totalEnergy;
}
console.log('\nTotal energy for all things: \n');
console.log(totalThingsEnergy / 1000 + ' mJ');





