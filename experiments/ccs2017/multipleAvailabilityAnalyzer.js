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

var debugMode = false;

// Function definitions
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

function getResponseListFromClientExecLogDir(clientExecLogDir) {
    var responseList = [];
    var lastResponseList = [];
    var elementList = fs.readdirSync(clientExecLogDir);
    for (var i = 0; i < elementList.length; i++) {
        var element = elementList[i];
        var fullPath = path.join(clientExecLogDir, element);
        var stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            var logString = fs.readFileSync(fullPath + '/nohup.out', 'utf-8');
            var response = extractLastAvailability(element, logString);
            extractAvailability(element, logString, responseList);
            lastResponseList.push(response);
        }
    }

    // sort by timestamp
    responseList.sort(function(a,b) { return a.timeStamp - b.timeStamp; });
    return responseList;
}


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
    if (debugMode) {
        console.log(perWindowAvailability);
    }
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

// Compute availability ratio based on maximum expected response.
function getAvailabilityOverMaxExpectedResponse(logDir) {
    var clientExecLogDir = path.join(logDir, 'client_execution');
    var responseList = getResponseListFromClientExecLogDir(clientExecLogDir);
    var firstStartTime = responseList[0].timeStamp;
    var timeWindow = 60 * 1000;   // 1 minute

    var originalSubResponseLists = getSubResponseLists(firstStartTime, timeWindow, responseList);
    var subResponseLists = extractLastResponsesFromEachSubList(originalSubResponseLists);
    var perWindowAvailability = getPerWindowAvailability(subResponseLists);

    var maxExpected = getMaxExpected(perWindowAvailability);
    var availabilityRatioValues = [];
    for (var i = 0; i < perWindowAvailability.length; i++) {
        var perWindow = perWindowAvailability[i];
        availabilityRatioValues.push(perWindow.actual / maxExpected);
    }
    return availabilityRatioValues;
}

// String comparison functions for sorting
function normalStringOrder(x, y) {
    return x == y ? 0 : (x < y ? -1 : 1);
}

function suffixOrderFirst(x, y) {
    var xUnderscoreIndex = x.lastIndexOf('_');
    var yUnderscoreIndex = y.lastIndexOf('_');
    if (xUnderscoreIndex < 0 || yUnderscoreIndex < 0) {
        return normalStringOrder(x, y);
    }
    var xSuffix = x.substring(xUnderscoreIndex + 1);
    var ySuffix = y.substring(yUnderscoreIndex + 1);
    if (xSuffix == ySuffix) {
        return normalStringOrder(x, y);
    }
    return normalStringOrder(xSuffix, ySuffix);
}

function customExpOrder(x, y) {
    var xUnderscoreIndex = x.lastIndexOf('_');
    var yUnderscoreIndex = y.lastIndexOf('_');
    if (xUnderscoreIndex < 0 || yUnderscoreIndex < 0) {
        return normalStringOrder(x, y);
    }
    var xSuffix = x.substring(xUnderscoreIndex + 1);
    var ySuffix = y.substring(yUnderscoreIndex + 1);
    if (xSuffix == ySuffix) {
        var xPrefix = x.substring(0, xUnderscoreIndex);
        var yPrefix = y.substring(0, yUnderscoreIndex);
        if (xPrefix == 'ILP_mt_ac') {
            return -1;
        } else if (yPrefix == 'ILP_mt_ac') {
            return 1;
        }
        return normalStringOrder(x, y);
    }
    return normalStringOrder(xSuffix, ySuffix);
}

// Beginning of main program.

var program = require('commander');
program
  .version('0.1.0')
  .option('-a, --average', 'Output average ')
  .option('-n, --order-by-number', 'Order by the number suffix of directories - the number of Auths killed')
  .option('-c, --custom-order', 'Order by the number suffix of directories and the custom experiment order - advanced first')
  .option('-t, --trim', 'Trim results')
  .parse(process.argv);

// get dir path with log directories
var numRequiredArgs = 1;
if (program.args.length < (2 + numRequiredArgs)) {
    console.error('[exec log dir] must be provided!');
    process.exit(1);
}

var orderBySuffixNumber = false;
if (program.orderByNumber != null) {
    orderBySuffixNumber = true;
}

var orderByCustomOrder = false;
if (program.customOrder != null) {
    orderByCustomOrder = true;
}

var outputAverage = false;
if (program.average != null) {
    outputAverage = true;
}

var trimResults = false;
if (program.trim != null) {
    trimResults = true;
}

// Map from exp name to availability ratio values.
var availabilityMap = {};
var expNames = [];
var maxAvailabilityListSize = 0;
// 'program.args' is the args not parsed by the program. 
for (var i = 0; i < program.args.length; i++) {
    var execLogDir = program.args[i];
    var expName = path.basename(execLogDir);
    expNames.push(expName);
    availabilityMap[expName] = getAvailabilityOverMaxExpectedResponse(execLogDir);
    if (availabilityMap[expName].length > maxAvailabilityListSize) {
        maxAvailabilityListSize = availabilityMap[expName].length;
    }
}

if (orderByCustomOrder) {
    expNames.sort(customExpOrder);
}
else if (orderBySuffixNumber) {
    expNames.sort(suffixOrderFirst);
}
else {
    expNames.sort(normalStringOrder);
}

var firstLine = 'Minute\t'
for (var j = 0; j < expNames.length; j++) {
    var expName = expNames[j];
    firstLine += expName + '\t';
}
console.log(firstLine);
var precision = 3;
var availabilitySums = Array(expNames.length).fill(0.0);
var availabilitySumStartMinute = 6;
var availabilitySumEndMinute = 20;
for (var i = 0; i < maxAvailabilityListSize; i++) {
    var minute = i - 1;
    var line = minute + '\t';
    if (trimResults) {
        if (minute < 1 || minute > 20) {
            continue;
        }
    }
    for (var j = 0; j < expNames.length; j++) {
        var expName = expNames[j];
        var availabilityValues = availabilityMap[expName];
        var availabilityValue = 'N/A';
        if (i < availabilityValues.length) {
            availabilityValue = availabilityValues[i].toFixed(precision);
        }
        line += availabilityValue + '\t';
        // Sum availability values
        if (minute >= availabilitySumStartMinute && minute <= availabilitySumEndMinute) {
            availabilitySums[j] += availabilityValues[i];
        }
    }
    console.log(line);
}

if (outputAverage) {
    console.log();
    console.log('Availability sum - for minutes [' + availabilitySumStartMinute + ',' + availabilitySumEndMinute + ']');
    var averageFirstLine = '\t';
    var averageValueLine = 'Average\t';
    var numAverageValues = availabilitySumEndMinute - availabilitySumStartMinute + 1;
    for (var i = 0; i < expNames.length; i++) {
        averageFirstLine += expNames[i] + '\t';
        averageValueLine += (availabilitySums[i] / numAverageValues).toFixed(precision) + '\t';
    }
    console.log(averageFirstLine + '\n' + averageValueLine);
}

/*
for (var i = 0; i < availabilityRatioValues.length; i++) {
    console.log(availabilityRatioValues[i].toFixed(precision));
}
*/

//console.log(availabilityMap);

// console.log(availabilityRatioValues);

/*
if (outputFile != null) {
    console.log('Also writing the result to output file: ' + outputFile);
    
	  fs.writeFileSync(outputFile, 
		    //JSON2.stringify(subResponseLists, null, '\t'),
		    JSON2.stringify(availabilityRatioValues, null, '\t'),
		    'utf8'
	  );
}
*/



