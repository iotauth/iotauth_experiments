#!/bin/bash

FILE_NAME=$1
# Normal, rc, udp, rcUdp
PORTS_TO_SERVER="tcp.dstport == 22100 || tcp.dstport == 22300 || tcp.dstport == 22400 || tcp.dstport == 22600"
PORTS_FROM_SERVER="tcp.srcport == 22100 || tcp.srcport == 22300 || tcp.srcport == 22400 || tcp.srcport == 22600"
echo FILE_NAME: "$FILE_NAME"
echo ==== Client statistics ====
echo sent packet count/length, received packet count/length
tshark -2 -nr "$FILE_NAME" -R "$PORTS_TO_SERVER || tcp.dstport == 21900" -T fields -e frame.len | wc -l
tshark -2 -nr "$FILE_NAME" -R "$PORTS_TO_SERVER || tcp.dstport == 21900" -T fields -e frame.len | awk '{sum+=$1}END{print sum}'
tshark -2 -nr "$FILE_NAME" -R "$PORTS_FROM_SERVER || tcp.srcport == 22300 || tcp.srcport == 21900" -T fields -e frame.len | wc -l
tshark -2 -nr "$FILE_NAME" -R "$PORTS_FROM_SERVER || tcp.srcport == 22300 || tcp.srcport == 21900" -T fields -e frame.len | awk '{sum+=$1}END{print sum}'
echo ==== Server statistics ====
echo sent packet count/length, received packet count/length
tshark -2 -nr "$FILE_NAME" -R "$PORTS_FROM_SERVER || tcp.srcport == 22300 || tcp.dstport == 22900" -T fields -e frame.len | wc -l
tshark -2 -nr "$FILE_NAME" -R "$PORTS_FROM_SERVER || tcp.srcport == 22300 || tcp.dstport == 22900" -T fields -e frame.len | awk '{sum+=$1}END{print sum}'
tshark -2 -nr "$FILE_NAME" -R "$PORTS_TO_SERVER || tcp.srcport == 22900" -T fields -e frame.len | wc -l
tshark -2 -nr "$FILE_NAME" -R "$PORTS_TO_SERVER || tcp.srcport == 22900" -T fields -e frame.len | awk '{sum+=$1}END{print sum}'
echo