#!/usr/bin/python

import os
import sys
import time

if len(sys.argv) < 2:
	print 'input parameter for number of clients'
	sys.exit()

client_count = int(sys.argv[1])

for i in range(client_count):
	os.system('node tls_client exp2 &')
	time.sleep(0.5)
