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
 * Convert a floor plan into an input for graph generator
 * @author Hokeun Kim
 */
"use strict";

var fs = require('fs');

var floorPlanFile = 'floorPlans/cory5th.txt';
var outputFile = 'floorPlans/cory5th.input';

var floorPlanString = fs.readFileSync(floorPlanFile, 'utf-8');
var floorPlanLines = floorPlanString.split('\n');

var auths = [];
var clients = [];
var servers = [];

for (var i = 0; i < floorPlanLines.length; i++) {
	var line = floorPlanLines[i].trim();
	var tokens = line.split(/[ \t]+/);
    if (tokens.length < 4) {
    	continue;
    }
    var position = {x: parseFloat(tokens[1]), y: parseFloat(tokens[2]), z: parseFloat(tokens[3])};
    var name = tokens[0];

    if (name.startsWith('c')) {
    	clients.push({name: name, position: position});
    }
    else if (name.startsWith('s')) {
    	servers.push({name: name, position: position});
    }
    else {
    	auths.push({id: parseInt(name), position: position});
    }
}

Array.prototype.sortOn = function(key){
    this.sort(function(a, b){
        if(a[key] < b[key]){
            return -1;
        }else if(a[key] > b[key]){
            return 1;
        }
        return 0;
    });
}

clients.sortOn('name');
servers.sortOn('name');
auths.sortOn('id');

console.log('Total ' +  clients.length + ' clients');
console.log(clients);
console.log('Total ' +  servers.length + ' servers');
console.log(servers);
console.log('Total ' +  auths.length + ' auths');
console.log(auths);

// authList
var authList = [];
for (var i = 0; i < auths.length; i++) {
    authList.push({id: auths[i].id});
}

console.log(JSON.stringify(authList,null,'\t'));

// authTrusts
var authTrusts = [];
for (var i = 0; i < auths.length; i++) {
    for (var j = i + 1; j < auths.length; j++) {
        authTrusts.push({id1: auths[i].id, id2: auths[j].id});
    }
}

console.log(JSON.stringify(authTrusts,null,'\t'));

function computeDistance(pos1, pos2) {
    var squared = (pos1.x-pos2.x)*(pos1.x-pos2.x)
        + (pos1.y-pos2.y)*(pos1.y-pos2.y)
        + (pos1.z-pos2.z)*(pos1.z-pos2.z);
    return Math.sqrt(squared);
}
var assignments ={};

function populateAssignments(entityList, authList) {
    for (var i = 0; i < entityList.length; i++) {
        var entity = entityList[i];
        var authId = -1;
        var minDist = 1000000;
        for (var j = 0; j < authList.length; j++) {
            var auth = authList[j];
            var curDist = computeDistance(entity.position, auth.position);
            if (curDist < minDist) {
                minDist = curDist;
                authId = auth.id;
            }
        }
        assignments[entity.name] = authId;
    }
}
populateAssignments(clients, auths);
populateAssignments(servers, auths);

console.log(JSON.stringify(assignments,null,'\t'));

var echoServerList = [];
for (var i = 0; i < servers.length; i++) {
    echoServerList.push({name: servers[i].name});
}

var autoClientList = [];
for (var i = 0; i < clients.length; i++) {
    var client = clients[i];
    var target = "";
    var minDist = 1000000;
    for (var j = 0; j < servers.length; j++) {
        var server = servers[j];
        var curDist = computeDistance(client.position, server.position);
        if (curDist < minDist) {
            minDist = curDist;
            target = server.name;
        }
    }
    autoClientList.push({name: client.name, target: target});
}
var positions = {};
function populatePositions(entityList) {
    for (var i = 0; i < entityList.length; i++) {
        var entity = entityList[i];
        if (entity.id != null) {
            positions[entity.id] = entity.position;
        }
        else {
            positions[entity.name] = entity.position;
        }
    }
}
populatePositions(auths);
populatePositions(clients);
populatePositions(servers);

console.log(JSON.stringify(positions,null,'\t'));

function populateBackupTos(entityList, authList) {
    for (var i = 0; i < entityList.length; i++) {
        var entity = entityList[i];
        var authId = -1;
        var minDist = 1000000;
        for (var j = 0; j < authList.length; j++) {
            var auth = authList[j];
            if (assignments[entity.name] == auth.id) {
                continue;
            }
            var curDist = computeDistance(positions[entity.name], auth.position);
            if (curDist < minDist) {
                minDist = curDist;
                authId = auth.id;
            }
        }
        entityList[i].backupTo = authId;
    }
}

populateBackupTos(autoClientList, auths);
populateBackupTos(echoServerList, auths);

console.log(JSON.stringify(autoClientList,null,'\t'));
console.log(JSON.stringify(echoServerList,null,'\t'));
