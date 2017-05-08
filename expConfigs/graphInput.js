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
 * Input for graph generation
 * @author Hokeun Kim
 */

"use strict";

var fs = require('fs');
module.exports = function(inputFileName) {
	var module = {};

	// commCostList
	module.commCostList = [];
	module.echoServerList = [];
	module.autoClientList = [];

	// helper function to construct commcost list
	function addCommCost(e1, e2, cost) {
		if ((typeof e1) == 'number') {
			e1 = 'auth' + e1;
		}
		module.commCostList.push({
			name1: e1,
			name2: e2,
			cost: cost
		});
	}

	function addMigrationPlan(thingName, backupToAuthID) {
		for (var i = 0; i < module.echoServerList.length; i++) {
			var echoServer = module.echoServerList[i];
			if (echoServer.name == thingName) {
				echoServer.backupTo = backupToAuthID;
				return;
			}
		}
		for (var i = 0; i < module.autoClientList.length; i++) {
			var autoClient = module.autoClientList[i];
			if (autoClient.name == thingName) {
				autoClient.backupTo = backupToAuthID;
				return;
			}
		}
	}
	var input = fs.readFileSync(inputFileName) + '';
	// below here as inputs
	eval(input);
	return module;
};
