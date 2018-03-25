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

function extractLastAvailability(entityName, logString) {
    var logLines = logString.split('\n');
    for (var i = logLines.length - 1; i >= 0; i--) {
        var logLine = logLines[i];
        if (logLine.startsWith('Resp-actual/expected/ratio/ts:')) {
            var tokens = logLine.split(' ');
            var actualResponses = parseInt(tokens[tokens.length -4]);
            var expectedResponses = parseInt(tokens[tokens.length -3]);
            var timeStamp = parseInt(tokens[tokens.length - 1]);
            return {
                name: entityName,
                actual: actualResponses,
                expected: expectedResponses,
                ratio: actualResponses/expectedResponses,
                timeStamp: timeStamp
            };
        }
    }
}

function extractAvailability(entityName, logString, responseList) {
    var logLines = logString.split('\n');
    for (var i = 0; i < logLines.length; i++) {
        var logLine = logLines[i];
        if (logLine.startsWith('Resp-actual/expected/ratio/ts:')) {
            var tokens = logLine.split(' ');
            var actualResponses = parseInt(tokens[tokens.length -4]);
            var expectedResponses = parseInt(tokens[tokens.length -3]);
            var timeStamp = parseInt(tokens[tokens.length - 1]);
            var response = {
                name: entityName,
                actual: actualResponses,
                expected: expectedResponses,
                ratio: actualResponses/expectedResponses,
                timeStamp: timeStamp
            };
            responseList.push(response);
        }
    }
}

var responseList = [];
var lastResponseList = [];
var elementList = fs.readdirSync(execLogDir);
for (var i = 0; i < elementList.length; i++) {
    var element = elementList[i];
    var fullPath = path.join(execLogDir, element);
    var stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
        var logString = fs.readFileSync(fullPath + '/nohup.out', 'utf-8');
        var response = extractLastAvailability(element, logString);
        extractAvailability(element, logString, responseList);
        lastResponseList.push(response);
    }
}

//console.log(lastResponseList);

// sort by timestamp
responseList.sort(function(a,b) { return a.timeStamp - b.timeStamp; });
console.log(responseList);


function getSubResponseLists(firstStartTime, timeWindow, responseList) {
    var subResponseLists = [];
    
    var currentSubList = [];
    // inclusive startTime and endTime
    var startTime = firstStartTime;
    var endTime = startTime + timeWindow - 1;    
    for (var i = 0; i < responseList.length; i++) {
        var response = responseList[i];
        if (response.timeStamp > endTime) {
            // proceed to next window
            startTime = endTime + 1;
            endTime = startTime + timeWindow - 1;
            subResponseLists.push(currentSubList);
            currentSubList = [];
        }
        currentSubList.push(response);
    }
    // add subList for the last window
    subResponseLists.push(currentSubList);
    return subResponseLists;
}

function extractLastResponsesFromEachSubList(oldSubResponseLists) {
    var newSubResponseLists = [];

    for (var i = 0; i < oldSubResponseLists.length; i++) {
        var oldSubResponseList = oldSubResponseLists[i];
        var map = {};
        for (var j = oldSubResponseList.length - 1; j >= 0; j--) {
            var oldSubResponse = oldSubResponseList[j];
            if (map[oldSubResponse.name] == null) {
                map[oldSubResponse.name] = oldSubResponse;
            }
        }
        newSubResponseLists.push(map);
    }
    return newSubResponseLists;
}

function getPerWindowAvailability(subResponseLists) {
    var prevMap = {};
    var perWindowAvailability = [];
    for (var i = 0; i < subResponseLists.length; i++) {
        var subResponseList = subResponseLists[i];
        var windowExpected = 0;
        var windowActual = 0;
        var numResponseToPrevWindow = 0;
        for (var attribute in subResponseList) {
            var response = subResponseList[attribute];
            var expected = response.expected;
            var actual = response.actual;
            var prevResponse = prevMap[response.name];
            if (prevResponse != null) {
                expected -= prevResponse.expected;
                actual -= prevResponse.actual;
            }
            if (actual > expected) {
                var diff = actual - expected;
                numResponseToPrevWindow += diff;
            }
            windowExpected += expected;
            windowActual += actual;
            prevMap[response.name] = response;
        }
      
        perWindowAvailability.push({
            actual: windowActual,
            expected: windowExpected,
            respToPrev: numResponseToPrevWindow,
        });
    }

    console.log(perWindowAvailability);
    // push back responses to previous windows
    var respToPrev = 0;
    for (var i = perWindowAvailability.length - 1; i >= 0; i--) {
        var perWindow = perWindowAvailability[i];
        if (respToPrev > 0) {
            perWindow.actual += respToPrev;
            respToPrev = 0;
        }
        var diff = perWindow.actual - perWindow.expected;
        if (diff > 0) {
            respToPrev += diff;
            perWindow.actual -= diff;
        }
        respToPrev += perWindow.respToPrev;
        delete perWindow.respToPrev;
        perWindow.ratio = perWindow.actual / perWindow.expected;
        perWindowAvailability[i] = perWindow;
    }

    return perWindowAvailability;
}

function getMaxExpected(perWindowAvailability) {
    var maxExpected = 0;
    for (var i = 0; i < perWindowAvailability.length; i++) {
        var perWindow = perWindowAvailability[i];
        if (perWindow.expected > maxExpected) {
            maxExpected = perWindow.expected;
        }
    }
    return maxExpected;
}

var firstStartTime = responseList[0].timeStamp;
var timeWindow = 60 * 1000;   // 1 minute

var originalSubResponseLists = getSubResponseLists(firstStartTime, timeWindow, responseList);
var subResponseLists = extractLastResponsesFromEachSubList(originalSubResponseLists);
var perWindowAvailability = getPerWindowAvailability(subResponseLists);

console.log(perWindowAvailability);

for (var i = 0; i < perWindowAvailability.length; i++) {
    var perWindow = perWindowAvailability[i];
    console.log(perWindow.ratio);
}

console.log('Printing availability ratio based on maximum expected response');

var maxExpected = getMaxExpected(perWindowAvailability);
for (var i = 0; i < perWindowAvailability.length; i++) {
    var perWindow = perWindowAvailability[i];
    console.log(perWindow.actual / maxExpected);
}

if (outputFile != null) {
    console.log('Also writing the result to output file: ' + outputFile);
    
	  fs.writeFileSync(outputFile, 
		    //JSON2.stringify(subResponseLists, null, '\t'),
		    JSON2.stringify(originalSubResponseLists, null, '\t'),
		    'utf8'
	  );
}
// readlines reverse order
//startsWith('Responses-actual/expected/ratio:')


