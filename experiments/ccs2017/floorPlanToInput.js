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

// Parse Auth Trusts string into Json.
// Should be in a format like this:
// 501-502,501-504,502-503,502-504,401-402,401-403,401-502,401-504,402-503,403-501
function parseAuthTrustsString(atStr) {
    // atStr: Auth Trust in string, atJson: Auth Trust in Json.
    var atJson = [];
    var atArray = atStr.split(',');
    for (var i = 0; i < atArray.length; i++) {
        var authTrust = atArray[i];
        var auths = authTrust.split('-');
        var authId1 = auths[0];
        var authId2 = auths[1];
        atJson.push({id1: Number(authId1), id2: Number(authId2)});
    }
    return atJson;
}

// Get fully connected authTrusts
function getFullyConnectedAuthTrusts(auths) {
    var authTrusts = [];
    for (var i = 0; i < auths.length; i++) {
        for (var j = i + 1; j < auths.length; j++) {
            authTrusts.push({id1: auths[i].id, id2: auths[j].id});
        }
    }
    return authTrusts;
}

function getAuthToTrustedAuthsMap(authTrusts) {
    var authToTrustedAuthsMap = {};
    for (var i = 0; i < authTrusts.length; i++) {
        var id1 = authTrusts[i].id1;
        var id2 = authTrusts[i].id2;
        if (authToTrustedAuthsMap[id1] == null) {
            authToTrustedAuthsMap[id1] = new Set();
        }
        if (authToTrustedAuthsMap[id2] == null) {
            authToTrustedAuthsMap[id2] = new Set();
        }
        authToTrustedAuthsMap[id1].add(id2);
        authToTrustedAuthsMap[id2].add(id1);
    }
    return authToTrustedAuthsMap;
}

// authCapacity
function getDefaultAuthCapacity(auths) {
    var authCapacity = {};
    for (var i = 0; i < auths.length; i++) {
        authCapacity[i.toString()] = 500;
    }
    return authCapacity;
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

// Sort by distance from Auths.
function populateBackupTos(entityList, auths, maxNumBackupToAuths, loopToOriginAuth, authToTrustedAuthsMap, lessNaive) {
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
            // If lessNaive is true, skip Auths that are not trusted by the original Auth.
            if (lessNaive && !authToTrustedAuthsMap[assignments[entity.name]].has(auth.id)) {
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
        if (loopToOriginAuth) {
            backupTo.push(assignments[entity.name]);
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

const { Command } = require('commander');
const program = new Command();
program
  .version('0.1.0')
  .option('-i, --in [value]', 'Input floor plan file')
  .option('-a, --assignments [value]', 'File for predefined assignments between Auths and entities')
  .option('-t, --auth-trusts [value]', 'File or string for predefined trusts between Auths')
  .option('-c, --auth-capacity [value]', 'File for predefined capacity of Auths')
  .option('-o, --out [value]', 'Output \'.input\' (for graph generator), \'.json\' (for migration solver)')
  .option('-b, --backup-auths <n>', 'Maximum number of Auths that entities can backup to', parseInt)
  .option('-l, --loop-to-origin-auth', 'Loop to original Auth by adding the original Auth at the end of the backup list')
  .option('-n, --less-naive', 'Make default back up plan less naive by considering trust between original Auth and backup-to Auths')
  .parse(process.argv);

var floorPlanFile = 'floorPlans/cory5th.txt';
var predefinedAssignmentsFile = null;
var predefinedAuthTrustsFileOrString = null;
var predefinedAuthCapacityFile = null;
var graphGeneratorInputFile = 'floorPlans/cory5th.input';
var migrationSolverInputFile = 'floorPlans/cory5th.json';
var maxNumBackupToAuths = 2;
var loopToOriginAuth = false;
var lessNaive = false;

const options = program.opts();
if (options.in != null) {
    floorPlanFile = options.in;
}
if (options.assignments != null) {
    predefinedAssignmentsFile = options.assignments;
}
if (options.authTrusts != null) {
    predefinedAuthTrustsFileOrString = options.authTrusts;
}
if (options.authCapacity != null) {
    predefinedAuthCapacityFile = options.authCapacity;
}
if (options.out != null) {
    graphGeneratorInputFile = options.out + '.input';
    migrationSolverInputFile = options.out + '.json';
}
if (options.backupAuths != null) {
    maxNumBackupToAuths = options.backupAuths;
}
if (options.loopToOriginAuth != null) {
    loopToOriginAuth = true;
}
if (options.lessNaive != null) {
    lessNaive = true;
}

console.log('Floor file name: ' + floorPlanFile);
console.log('Predefined assignments file name: ' + predefinedAssignmentsFile);
console.log('Predefined Auth trusts file name or string value: ' + predefinedAuthTrustsFileOrString);
console.log('Predefined Auth capacity file name: ' + predefinedAuthCapacityFile);
console.log('Output graph generator input file (.input) name: ' + graphGeneratorInputFile);
console.log('Output migration solver input file (.json) name: ' + migrationSolverInputFile);
console.log('Maximum number of Auths that entities can backup to: ' + maxNumBackupToAuths);
console.log('Loop to original Auth by adding the original Auth at the end of the backup list: ' + loopToOriginAuth);
console.log('Make default back up plan less naive by considering Auth trusts: ' + lessNaive);


var entities = extractEntitiesFromFloorPlan(floorPlanFile);
// maximum number of Auths that an entity can backup to

var predefinedAssignments = null;
if (predefinedAssignmentsFile != null) {
    var file = require('./' + predefinedAssignmentsFile);
    predefinedAssignments = file.assignments;
}
var predefinedAuthTrusts = null;
if (predefinedAuthTrustsFileOrString != null) {
    var authTrustFormat = '([0-9]|,|-)+';
    // If the given predefined Auth trusts are in the string format
    if (predefinedAuthTrustsFileOrString.match(authTrustFormat)[0].length == predefinedAuthTrustsFileOrString.length) {
        console.log('Predefined Auth trusts are given in a correct string format.');
        predefinedAuthTrusts = parseAuthTrustsString(predefinedAuthTrustsFileOrString);
    }
    // Otherwise, it's a file name
    else {
        console.log('Predefined Auth trusts are given in a file format.');
        var file = require('./' + predefinedAuthTrustsFileOrString);
        predefinedAuthTrusts = file.authTrusts;
    }
}
var predefinedAuthCapacity = null;
if (predefinedAuthCapacityFile != null) {
    var file = require('./' + predefinedAuthCapacityFile);
    predefinedAuthCapacity = file.authCapacity;
}

var authList = getAuthList(entities.auths);
var assignments = getAssignments(entities.auths, entities.clients, entities.servers, predefinedAssignments);
var authTrusts = predefinedAuthTrusts == null ? getFullyConnectedAuthTrusts(entities.auths): predefinedAuthTrusts;
var authCapacity = predefinedAuthCapacity == null ? getDefaultAuthCapacity(entities.auths): predefinedAuthCapacity;
var echoServerList = getEchoServerList(entities.servers);
var autoClientList = getAutoClientList(entities.clients, entities.servers);
var positions = getPositions(entities.auths, entities.clients, entities.servers);
var authToTrustedAuthsMap = getAuthToTrustedAuthsMap(authTrusts);
populateBackupTos(autoClientList, entities.auths, maxNumBackupToAuths, loopToOriginAuth, authToTrustedAuthsMap, lessNaive);
populateBackupTos(echoServerList, entities.auths, maxNumBackupToAuths, loopToOriginAuth, authToTrustedAuthsMap, lessNaive);

var graphGeneratorInputString = '';
graphGeneratorInputString += 'module.authList = ' + JSON.stringify(authList,null,'\t') + ';\n\n';
graphGeneratorInputString += 'module.authTrusts = ' + JSON.stringify(authTrusts,null,'\t') + ';\n\n';
graphGeneratorInputString += 'module.authCapacity = ' + JSON.stringify(authCapacity,null,'\t') + ';\n\n';
graphGeneratorInputString += 'module.assignments = ' + JSON.stringify(assignments,null,'\t') + ';\n\n';
graphGeneratorInputString += 'module.echoServerList = ' + JSON.stringify(echoServerList,null,'\t') + ';\n\n';
graphGeneratorInputString += 'module.autoClientList = ' + JSON.stringify(autoClientList,null,'\t') + ';\n\n';
graphGeneratorInputString += 'module.positions = ' + JSON.stringify(positions,null,'\t') + ';\n\n';
//utputString += commCosts;
fs.writeFileSync(graphGeneratorInputFile, graphGeneratorInputString, 'utf8');

var migrationSolverInputJson = {};
migrationSolverInputJson['authList'] = authList;
migrationSolverInputJson['autoClientList'] = autoClientList;
migrationSolverInputJson['assignments'] = assignments;
migrationSolverInputJson['authTrusts'] = authTrusts;
migrationSolverInputJson['authCapacity'] = authCapacity;

fs.writeFileSync(migrationSolverInputFile, JSON.stringify(migrationSolverInputJson,null,'\t'), 'utf8');

