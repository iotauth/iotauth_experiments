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
 * Generator for experimental Auth entity graph
 * @author Hokeun Kim
 */

"use strict";

var fs = require('fs');
var JSON2 = require('JSON2');

// options
// uniquePorts: to distinguish Auths, server entities using different port numbers
// uniqueHosts: to distinguish Auths, server entities using different network addresses
var isNS3 = true;

var uniquePorts = isNS3 ? false : true;
var uniqueHosts = isNS3 ? true : false;

// getting input file using require
var graphInput = require('./graphInput.js')('ns3Exp.input');

// inputs
var authList = graphInput.authList;
var authTrusts = graphInput.authTrusts;
var assignments = graphInput.assignments;
var echoServerList = graphInput.echoServerList;
var autoClientList = graphInput.autoClientList;
var commCostList = graphInput.commCostList;
var positions = graphInput.positions == null ? {} : graphInput.positions;

// to be populated
var entityList = [];
var serverHostPortMap = {};
var devList =[];

var wiredSubnetBase = '10.0.0.';
var wiredAddress = 1;

var wifiSubnetBase = '10.0.1.';
var wifiAddress = 1;

function populateAuthList() {
	var currentPort = 21100;
	for (var i = 0; i < authList.length; i++) {
		var auth = authList[i];
		authList[i] = {
			id: auth.id,
			entityHost: uniqueHosts ? wifiSubnetBase + wifiAddress : 'localhost',
			authHost: uniqueHosts ? wiredSubnetBase + wiredAddress : 'localhost',
			tcpPort: currentPort,
			udpPort: currentPort + 2,
			authPort: currentPort + 1,
			dbProtectionMethod: 1
		}
		if (uniquePorts) {
			currentPort += 100;
		}
		if (uniqueHosts) {
			var dev = {
				name: 'auth' + authList[i].id,
				addr: authList[i].authHost,
				wifi: authList[i].entityHost,
				type: 'auth'
			};
			if (positions[authList[i].id] != null) {
				dev.position = positions[authList[i].id];
			}
			devList.push(dev);
			wiredAddress++;
			wifiAddress++;
		}
	}
}
function populateEchoServers() {
	var currentPort = 22100;
	for (var i = 0; i < echoServerList.length; i++) {
		var echoServer = echoServerList[i];
		var entity = {
			group: 'Servers',
			name: echoServer.name,
			host: uniqueHosts ? wifiSubnetBase + wifiAddress : 'localhost',
			port: currentPort,
			distProtocol: "TCP",
			usePermanentDistKey: false,
			distKeyValidityPeriod: "1*hour",
			maxSessionKeysPerRequest: 1,
			netName: 'Servers',
			credentialPrefix: echoServer.name + '.Server',
			backupToAuthId: echoServer.backupTo == null ? -1 : echoServer.backupTo
		}
		serverHostPortMap[entity.name] = {host: entity.host, port: entity.port};
		entityList.push(entity);
		if (uniquePorts) {
			currentPort++;
		}
		if (uniqueHosts) {
			var dev = {name: entity.name, addr: entity.host, type: 'server'};
			if (positions[entity.name] != null) {
				dev.position = positions[entity.name];
			}
			devList.push(dev);
			wifiAddress++;
		}
	}
}

function populateAutoClients() {
	for (var i = 0; i < autoClientList.length; i++) {
		var autoClient = autoClientList[i];
		var entity = {
			group: 'Clients',
			name: autoClient.name,
			distProtocol: 'TCP',
			usePermanentDistKey: false,
			distKeyValidityPeriod: '1*hour',
			maxSessionKeysPerRequest: 5,
			netName: 'Clients',
			credentialPrefix: autoClient.name + '.Client',
			backupToAuthId: autoClient.backupTo == null ? -1 : autoClient.backupTo
		}
		var targetServerInfoList = [];
		if (autoClient.target != null) {
			var target = serverHostPortMap[autoClient.target];
			targetServerInfoList.push({
				name: autoClient.target,
				host: target.host,
				port: target.port
			})
		}
		if (targetServerInfoList.length > 0) {
			entity.targetServerInfoList = targetServerInfoList;
		}
		entityList.push(entity);
		if (uniqueHosts) {
			var dev = {name: entity.name, addr: wifiSubnetBase + wifiAddress, type: 'client'};
			if (positions[entity.name] != null) {
				dev.position = positions[entity.name];
			}
			devList.push(dev);
			wifiAddress++;
		}
	}
}

// populate elements
populateAuthList();
populateEchoServers();
populateAutoClients();

var graph = {
	authList: authList,
	authTrusts: authTrusts,
	assignments: assignments,
	entityList: entityList
}

// write to file
var expGraphFile = 'exp.graph';
if (isNS3) {
	expGraphFile = 'ns3Exp.graph';
}
fs.writeFileSync(expGraphFile, 
	JSON2.stringify(graph, null, '\t'),
	'utf8'
);
if (devList.length > 0) {
	fs.writeFileSync('devList.txt', 
		JSON2.stringify(devList, null, '\t'),
		'utf8'
	);
}
if (commCostList.length > 0) {
	fs.writeFileSync('commCosts.txt', 
		JSON2.stringify(commCostList, null, '\t'),
		'utf8'
	);
}


