# Server-Client experiments manual 

* To filter packets captured by WireShark

	For resource-constrained Client

		// sent packet (to server) or (to auth)
		(tcp.dstport == 22100) || (tcp.dstport == 21900)
		// received packet (from server) or (from auth)
		(tcp.srcport == 22100) || (tcp.srcport == 21900)

	For resource-constrained Server

		// sent packet (to client) or (to auth)
		(tcp.srcport == 22100) || (tcp.dstport == 22900)
		// received packet (from client) or (from auth)
		(tcp.dstport == 22100) || (tcp.srcport == 22900)
		
* For each experiment do the following to copy logs into result directories

		mv *.txt ../../../../iotauth_experiments/experiments/iotdi2017/results/server-client/TCP/one/

## For SSL/TLS experiments

* To run experiments

	Set up tls_client and tls_server in separate terminals

		node tls_client.js 2> 16_client.txt
		node tls_server.js 2> 16_server.txt

	Run packet capture

		tshark -i lo0 -w 16.pcap

	Run experiments for 16 servers

		tls_client> exp1 16

## For Proposed approach experiments

* General instructions

	Use two Auths

		Client with Auth101, Server with Auth102

* updated distribution key

		node client.js configs/net1/client.config 2> 16_client.txt
		node server.js configs/net2/server.config 2> 16_server.txt
		tshark -i lo0 -w 16.pcap

	* one cached key

			client> exp1 16 [22400 for UDP]

	* unlimited cached keys

			Auth1> reset sk
			client> skReq 16
			server> skReq 16
			client> exp1 16 [22400 for UDP]

* permanent distribution key (use entities with prefix "rc": resource-constrained)

		node client.js configs/net1/rcClient.config 2> 16_client.txt
		node server.js configs/net2/rcServer.config 2> 16_server.txt
		tshark -i lo0 -w 16.pcap

	* one cached key

			client> exp1 16 22300 [22600 for RC-UDP]

	* unlimited cached keys

			Auth1> reset sk
			client> skReq 16
			server> skReq 16
			client> exp1 16 22300 [22600 for RC-UDP]

* UDP default with updated distribution key (use entities with prefix "udp")

		node client.js configs/net1/udpClient.config 2> 16_client.txt
		node server.js configs/net2/udpServer.config 2> 16_server.txt
		tshark -i lo0 -w 16.pcap
		

* UDP permanent distribution key (use entities with prefix "rcUdp")

		node client.js configs/net1/rcUdpClient.config 2> 16_client.txt
		node server.js configs/net2/rcUdpServer.config 2> 16_server.txt
		tshark -i lo0 -w 16.pcap


# Publish-Subscribe experiment manual

## For SSL/TLS experiments

	node tls_server.js 2> 16_setup.txt
	tshark -i lo0 -w 16_setup.pcap
	./repeat_tls_client.py 16

	CTRL+C
	tshark -i lo0 -w 16_publish.pcap
	tls_server> sendFile

Later, open 16_setup.txt and cut second part and save it as 16_publish.txt

## For Proposed approach experiments

* Individual (Based on proposed approach, shared key only)

	* Updated distribution key
	
			node server.js configs/net2/server.config 2> 16_setup.txt
			tshark -i lo0 -w 16_setup.pcap
			server> skReqPub 1
			./repeat_client.py 16 keyId 22100

			CTRL+C
			tshark -i lo0 -w 16_publish.pcap
			server> sendFile

		Later, open 16_setup.txt and cut second part and save it as 16_publish.txt

	* Permanent distribution key

			node server.js configs/net2/rcServer.config 2> 16_setup.txt
			tshark -i lo0 -w 16_setup.pcap
			server> skReqPub 1
			./repeat_client.py 16 keyId 22300

			CTRL+C
			tshark -i lo0 -w 16_publish.pcap
			server> sendFile
			
	Make sure you check packets for **server**, because in this case **server is a publisher**!

* MessageBroker (MQTT)

	* Updated distribution key
	
			node client.js configs/net1/client.config 2> 16_setup.txt
			tshark -i lo0 -w 16_setup.pcap
			client> skReqPub 1
			client> mqtt

			CTRL+C
			tshark -i lo0 -w 16_publish.pcap
			client> spubFile

		* NO NEED to run server (subscriber) for experiments, but to check if the server really receives the messages (sanity check), run the server registered with Auth101 using following commands

				node server.js configs/net1/server.config
				server> skReqSub
				server> mqtt

	* Permanent distribution key
	
			node client.js configs/net1/rcClient.config 2> 16_setup.txt
			tshark -i lo0 -w 16_setup.pcap
			client> skReqPub 1
			client> mqtt

* Broadcast (UDP)

	* Updated distribution key

			node client.js configs/net1/udpClient.config 2> 16_setup.txt
			tshark -i lo0 -w 16_setup.pcap
			client> skReqPub 1
			client> initBc

			CTRL+C
			tshark -i lo0 -w 16_publish.pcap
			client> spubFile

		* NO NEED to run server (receiver) for experiments, but to check if the server really receives the messages (sanity check), run the server registered with Auth101 using following commands
		
				node server configs/net1/udpServer.config
				server> skReqSub
				server> bcSub

	* Permanent distribution key

			node client.js configs/net1/rcUdpClient.config 2> 16_setup.txt
			tshark -i lo0 -w 16_setup.pcap
			client> skReqPub 1
			client> initBc
