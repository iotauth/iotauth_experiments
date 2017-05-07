# To collect

# For sent packets

ip.src == 10.0.1.8


# For received packets

ip.dst == 10.0.1.8

ip.dst == 10.0.1.8 && ip.src

(ip.src == 10.0.1.10  && ip.dst == 10.0.1.3) || (arp.src.proto_ipv4 == 10.0.1.10 && arp.dst.proto_ipv4 == 10.0.1.3)
# For analyzing packets captured

node packetAnalyzer.js [RESULT_DIRECTORY] [GRAPH] [DEV_LIST] [COMM_COST]

node packetAnalyzer.js $NS3 $CONF/ns3Exp.graph $CONF/devList.txt $CONF/commCosts.txt


