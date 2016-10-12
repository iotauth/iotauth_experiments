#!/bin/bash

FILE_NAME=$1
# Normal, rc, udp, rcUdp
PORT_TO_BROADCAST="udp.dstport == 8088"
PORT_TO_MQTT_BROKER="tcp.dstport == 1883"
PORT_FROM_MQTT_BROKER="tcp.srcport == 1883"
PORTS_TO_SERVER="tcp.dstport == 22100 || tcp.dstport == 22300 || udp.dstport == 22400 || udp.dstport == 22600"
PORTS_FROM_SERVER="tcp.srcport == 22100 || tcp.srcport == 22300 || udp.srcport == 22400 || udp.srcport == 22600"
PORTS_TO_AUTH1="tcp.dstport == 21900 || udp.dstport == 21902"
PORTS_FROM_AUTH1="tcp.srcport == 21900 || udp.srcport == 21902"
PORTS_TO_AUTH2="tcp.dstport == 22900 || udp.dstport == 22902"
PORTS_FROM_AUTH2="tcp.srcport == 22900 || udp.srcport == 22902"
echo FILE_NAME: "$FILE_NAME"
echo ==== Client statistics ====
echo sent packet count/length, received packet count/length
tshark -2 -nr "$FILE_NAME" -R "$PORTS_TO_SERVER || $PORTS_TO_AUTH1 || $PORT_TO_BROADCAST || $PORT_TO_MQTT_BROKER" -T fields -e frame.len | wc -l
tshark -2 -nr "$FILE_NAME" -R "$PORTS_TO_SERVER || $PORTS_TO_AUTH1 || $PORT_TO_BROADCAST || $PORT_TO_MQTT_BROKER" -T fields -e frame.len | awk '{sum+=$1}END{print sum}'
tshark -2 -nr "$FILE_NAME" -R "$PORTS_FROM_SERVER || $PORTS_FROM_AUTH1 || $PORT_FROM_MQTT_BROKER" -T fields -e frame.len | wc -l
tshark -2 -nr "$FILE_NAME" -R "$PORTS_FROM_SERVER || $PORTS_FROM_AUTH1 || $PORT_FROM_MQTT_BROKER" -T fields -e frame.len | awk '{sum+=$1}END{print sum}'
echo ==== Server statistics ====
echo sent packet count/length, received packet count/length
tshark -2 -nr "$FILE_NAME" -R "$PORTS_FROM_SERVER || $PORTS_TO_AUTH2" -T fields -e frame.len | wc -l
tshark -2 -nr "$FILE_NAME" -R "$PORTS_FROM_SERVER || $PORTS_TO_AUTH2" -T fields -e frame.len | awk '{sum+=$1}END{print sum}'
tshark -2 -nr "$FILE_NAME" -R "$PORTS_TO_SERVER || $PORTS_FROM_AUTH2" -T fields -e frame.len | wc -l
tshark -2 -nr "$FILE_NAME" -R "$PORTS_TO_SERVER || $PORTS_FROM_AUTH2" -T fields -e frame.len | awk '{sum+=$1}END{print sum}'
echo