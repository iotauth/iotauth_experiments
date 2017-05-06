# To collect

# For sent packets

ip.src == 10.0.1.8


# For received packets

ip.dst == 10.0.1.8

ip.dst == 10.0.1.8 && ip.src

# For analyzing packets captured

node packetAnalyzer.js [DIRECTORY] [GRAPH] [DEV_LIST] [COMM_COST]

node packetAnalyzer.js $NS3 $CONF/ns3Exp.graph $CONF/devList.txt $CONF/commCosts.txt


