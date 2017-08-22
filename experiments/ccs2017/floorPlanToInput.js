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

// authList
function getAuthList(auths) {
    var authList = [];
    for (var i = 0; i < auths.length; i++) {
        authList.push({id: auths[i].id});
    }
    return authList;
}

// authTrusts
function getAuthTrusts(auths) {
    var authTrusts = [];
    for (var i = 0; i < auths.length; i++) {
        for (var j = i + 1; j < auths.length; j++) {
            authTrusts.push({id1: auths[i].id, id2: auths[j].id});
        }
    }
    return authTrusts;
}

function computeDistance(pos1, pos2) {
    var squared = (pos1.x-pos2.x)*(pos1.x-pos2.x)
        + (pos1.y-pos2.y)*(pos1.y-pos2.y)
        + (pos1.z-pos2.z)*(pos1.z-pos2.z);
    return Math.sqrt(squared);
}

function populateAssignments(assignments, entityList, auths, predefinedAssignments) {
    for (var i = 0; i < entityList.length; i++) {
        var entity = entityList[i];
        if (predefinedAssignments != null && predefinedAssignments[entity.name] != null) {
            assignments[entity.name] = predefinedAssignments[entity.name];
            continue;
        }
        var authId = -1;
        var minDist = 1000000;
        for (var j = 0; j < auths.length; j++) {
            var auth = auths[j];
            var curDist = computeDistance(entity.position, auth.position);
            if (curDist < minDist) {
                minDist = curDist;
                authId = auth.id;
            }
        }
        assignments[entity.name] = authId;
    }
}

function getAssignments(auths, clients, servers, predefinedAssignments) {
    var assignments ={};
    populateAssignments(assignments, clients, auths, predefinedAssignments);
    populateAssignments(assignments, servers, auths, predefinedAssignments);
    return assignments;
}

function getEchoServerList(servers) {
    var echoServerList = [];
    for (var i = 0; i < servers.length; i++) {
        echoServerList.push({name: servers[i].name});
    }
    return echoServerList;
}

function getAutoClientList(clients, servers) {
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
    return autoClientList;
}

function populatePositions(positions, entityList) {
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

function getPositions(auths, clients, servers) {
    var positions = {};
    populatePositions(positions, auths);
    populatePositions(positions, clients);
    populatePositions(positions, servers);
    return positions;
}

function populateBackupTos(entityList, auths, maxNumBackupToAuths) {
    for (var i = 0; i < entityList.length; i++) {
        var entity = entityList[i];
        //var authId = -1;
        //var minDist = 1000000;
        var authDists = [];
        for (var j = 0; j < auths.length; j++) {
            var auth = auths[j];
            if (assignments[entity.name] == auth.id) {
                continue;
            }
            var curDist = computeDistance(positions[entity.name], auth.position);
            authDists.push({id: auth.id, dist: curDist});
            //if (curDist < minDist) {
            //    minDist = curDist;
            //    authId = auth.id;
            //}
        }
        authDists.sortOn('dist');
        var backupTo = [];
        for (var j = 0; j < authDists.length && j < maxNumBackupToAuths; j++) {
            backupTo.push(authDists[j].id);
        }
        //backupTo.push(authId);
        entityList[i].backupTo = backupTo;
    }
}
/*
    entities = {
        auths:   list of {id, position: {x,y,z} },
        clients: list of {name, position: {x,y,z} },
        servers: list of {name, position: {x,y,z} }
    }
*/
function getCommCosts(auths, clients, servers) {
    var entities = auths.concat(clients, servers);
    var commCosts = '';

    for (var i = 0; i < entities.length; i++) {
        var e1 = entities[i];
        var name1 = e1.name == null ? e1.id : '\'' + e1.name + '\'';
        var extraTap1 = e1.name == null ? '\t' : '';
        var position1 = e1.position;
        for (var j = i + 1; j < entities.length; j++) {
            var e2 = entities[j];
            var name2 = e2.name == null ? e2.id : '\'' + e2.name + '\'';
            var extraTap2 = e2.name == null ? '\t' : '';
            var position2 = e2.position;

            var dist = computeDistance(position1, position2);
            var costStr = 'addCommCost(' + name1 + ',\t' + extraTap1 + name2 + ',\t' + extraTap2 + dist+')';
            commCosts += (costStr + '\n');
        }
    }
    return commCosts;
}

/*
    takes a floor plan file and returns sorted entities like this:

    entities = {
        auths:   list of {id, position: {x,y,z} },
        clients: list of {name, position: {x,y,z} },
        servers: list of {name, position: {x,y,z} }
    }
*/
function extractEntitiesFromFloorPlan(floorPlanFile) {
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

    clients.sortOn('name');
    servers.sortOn('name');
    auths.sortOn('id');

    return {
        auths: auths,
        clients: clients,
        servers: servers
    };
}
// take a look at iotauth/examples/configs/defaultGraphGenerator.js

var program = require('commander');
program
  .version('0.1.0')
  .option('-i, --in [value]', 'Input floor plan file')
  .option('-a, --assignments [value]', 'File for predefined assignments between Auths and entities')
  .option('-t, --auth-trusts [value]', 'File for predefined trusts between Auths')
  .option('-o, --out [value]', 'Output \'.input\' file (used as an input file for graph generator')
  .option('-b, --backup-auths <n>', 'Maximum number of Auths that entities can backup to', parseInt)
  .parse(process.argv);

var floorPlanFile = 'floorPlans/cory5th.txt';
var predefinedAssignmentsFile = null;
var predefinedAuthTrustsFile = null;
var outputFile = 'floorPlans/cory5th.input';
var maxNumBackupToAuths = 2;

if (program.in != null) {
    floorPlanFile = program.in;
}
if (program.assignments != null) {
    predefinedAssignmentsFile = program.assignments;
}
if (program.authTrusts != null) {
    predefinedAuthTrustsFile = program.authTrusts;
}
if (program.out != null) {
    outputFile = program.out;
}
if (program.backupAuths != null) {
    maxNumBackupToAuths = program.backupAuths;
}

console.log('Floor file name: ' + floorPlanFile);
console.log('Predefined assignments file name: ' + predefinedAssignmentsFile);
console.log('Predefined Auth trusts file name: ' + predefinedAuthTrustsFile);
console.log('Output file (.input) name: ' + outputFile);
console.log('Maximum number of Auths that entities can backup to: ' + maxNumBackupToAuths);


var entities = extractEntitiesFromFloorPlan(floorPlanFile);
// maximum number of Auths that an entity can backup to

var predefinedAssignments = null;
if (predefinedAssignmentsFile != null) {
    var file = require('./' + predefinedAssignmentsFile);
    predefinedAssignments = file.assignments;
}
var predefinedAuthTrusts = null;
if (predefinedAuthTrustsFile != null) {
    var file = require('./' + predefinedAuthTrustsFile);
    predefinedAuthTrusts = file.authTrusts;
}

var authList = getAuthList(entities.auths);
var authTrusts = predefinedAuthTrusts == null ? getAuthTrusts(entities.auths): predefinedAuthTrusts;
var assignments = getAssignments(entities.auths, entities.clients, entities.servers, predefinedAssignments);
var echoServerList = getEchoServerList(entities.servers);
var autoClientList = getAutoClientList(entities.clients, entities.servers);
var positions = getPositions(entities.auths, entities.clients, entities.servers);
populateBackupTos(autoClientList, entities.auths, maxNumBackupToAuths);
populateBackupTos(echoServerList, entities.auths, maxNumBackupToAuths);
//var commCosts = getCommCosts(entities.auths, entities.clients, entities.servers);
/*
console.log(JSON.stringify(authList,null,'\t'));
console.log(JSON.stringify(authTrusts,null,'\t'));
console.log(JSON.stringify(assignments,null,'\t'));
console.log(JSON.stringify(echoServerList,null,'\t'));
console.log(JSON.stringify(autoClientList,null,'\t'));
console.log(JSON.stringify(positions,null,'\t'));
*/
var outputString = '';
outputString += 'module.authList = ' + JSON.stringify(authList,null,'\t') + ';\n\n';
outputString += 'module.authTrusts = ' + JSON.stringify(authTrusts,null,'\t') + ';\n\n';
outputString += 'module.assignments = ' + JSON.stringify(assignments,null,'\t') + ';\n\n';
outputString += 'module.echoServerList = ' + JSON.stringify(echoServerList,null,'\t') + ';\n\n';
outputString += 'module.autoClientList = ' + JSON.stringify(autoClientList,null,'\t') + ';\n\n';
outputString += 'module.positions = ' + JSON.stringify(positions,null,'\t') + ';\n\n';
//utputString += commCosts;

fs.writeFileSync(outputFile, outputString, 'utf8');
