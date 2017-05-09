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
var path = require('path');
var util = require('util');
var JSON2 = require('JSON2');

// get dir path with log directories
var numRequiredArgs = 1;
if (process.argv.length < (2 + numRequiredArgs)) {
    console.error('[exec log dir] must be provided!');
    process.exit(1);
}

var outputFile = null;
if (process.argv.length > (2 + numRequiredArgs) ) {
    outputFile = process.argv[2 + numRequiredArgs];
    console.log('Output file is given: ' + outputFile);
}

var execLogDir = process.argv[2];

function extractAvailability(entityName, logString) {
    var logLines = logString.split('\n');
    for (var i = logLines.length - 1; i >= 0; i--) {
        var logLine = logLines[i];
        if (logLine.startsWith('Responses-actual/expected/ratio:')) {
            var tokens = logLine.split(' ');
            var actualResponses = parseInt(tokens[tokens.length -3]);
            var expectedResponses = parseInt(tokens[tokens.length -2]);
            return {
                name: entityName,
                actual: actualResponses,
                expected: expectedResponses,
                ratio: actualResponses/expectedResponses
            };
        }
    }
}

var responseList = [];
var elementList = fs.readdirSync(execLogDir);
for (var i = 0; i < elementList.length; i++) {
    var element = elementList[i];
    var fullPath = path.join(execLogDir, element);
    var stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
        var response = extractAvailability(element, fs.readFileSync(fullPath + '/nohup.out', 'utf-8'));
        responseList.push(response);
    }
}

console.log(responseList);
        
if (outputFile != null) {
    console.log('Also writing the result to output file: ' + outputFile);
    
	fs.writeFileSync(outputFile, 
		JSON2.stringify(responseList, null, '\t'),
		'utf8'
	);
}
// readlines reverse order
//startsWith('Responses-actual/expected/ratio:')


