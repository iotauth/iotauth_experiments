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
 * Server entity using SSL/TLS.
 * @author Hokeun Kim
 */

"use strict";

var tls = require('tls');
var fs = require('fs');
var common = require('./tls_common');

var options = {
    key: fs.readFileSync('credentials/ServerKey.pem'),
    cert: fs.readFileSync('credentials/ServerCert.pem'),

    // This is necessary only if using the client certificate authentication.
    requestCert: true,

    // This is necessary only if the client uses the self-signed certificate.
    ca: [ fs.readFileSync('credentials/CACert.pem') ]
};
var sockets = [];
var server = tls.createServer(options, function(socket) {
    console.log('server connected',
        socket.authorized ? 'authorized' : 'unauthorized');
    if (!socket.authorized) {
        console.log('Connection not authorized: ' + socket.authroizationError)
    }
    sockets.push(socket);
    //socket.write("welcome!\n");
    socket.setEncoding('utf8');
    socket.on('data', function(data) {
        console.log('received: ' + data);
    });
    socket.on('end', function() {
        console.log('client disconnected');
    });
    //socket.pipe(socket);
});

function commandInterpreter() {
    console.log('TLS_Server prompt>');
    var chunk = process.stdin.read();
    if (chunk != null) {
        var input = chunk.toString().trim();
        var idx = input.indexOf(' ');
        var command;
        var message = undefined;

        if (idx < 0) {
            command = input;
        }
        else {
            command = input.slice(0, idx);
            message = input.slice(idx + 1);
        }

        if (command == 'send') {
            console.log('send command');
            if (message == undefined) {
                console.log('no message!');
                return;
            }
            for (var i = 0; i < sockets.length; i++) {
                sockets[i].write(message);
            }
        }
        else if (command == 'sendFile') {
            console.log('sendFile command');
            console.error('============ sendFile command ===========');
            var fileData = fs.readFileSync('../data_examples/data.bin');
            console.log('file data length: ' + fileData.length);
            for (var i = 0; i < sockets.length; i++) {
                sockets[i].write(fileData);
            }
        }
        else {
            console.log('unrecognized command: ' + command);
        }
    }
};

var SERVER_PORT = common.SERVER_PORT;
if (process.argv.length > 2) {
    SERVER_PORT = parseInt(process.argv[2]);
}

server.listen(SERVER_PORT, function() {
    console.log('server bound on port ' + SERVER_PORT);
});

process.stdin.on('readable', commandInterpreter);