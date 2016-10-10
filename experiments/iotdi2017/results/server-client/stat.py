#!/usr/bin/python

import os
import sys

def print_crypto_stat(file_path):
    with open(file_path) as f:
        lines = f.readlines()
    rsa_enc = 0
    rsa_dec = 0
    aes_bytes = 0
    sha_bytes = 0
    for line in reversed(lines):
        if rsa_enc > 0 and rsa_dec > 0 and aes_bytes > 0 and sha_bytes > 0:
            break
        if rsa_enc == 0 and 'RSA_encrypt(public/private):' in line:
        	rsa_enc = int(line.rsplit()[-1])
        if rsa_dec == 0 and 'RSA_decrypt(public/private):' in line:
        	rsa_dec = int(line.rsplit()[-1])
        if aes_bytes == 0 and ('IOT| EVP_Cipher: AES-128-CBC' in line or 'IOT| M_do_cipher: AES-128-CBC' in line):
        	aes_bytes = int(line.rsplit()[-1])
        if sha_bytes == 0 and 'final256: Total Digested:' in line:
        	sha_bytes = int(line.rsplit()[-1])
    print 'rsa_enc/rsa_dec/aes_bytes/sha_bytes'
    print rsa_enc
    print rsa_dec
    print aes_bytes
    print sha_bytes
    print ''

def recursive_dir_walk(root):
    for dir_name, dir_names, file_names in os.walk(root):
	    for file_name in file_names:
	    	file_path = os.path.join(dir_name, file_name)
	        print(file_path)
	        if file_path.endswith('.pcap'):
	        	os.system('./pcap_stat.sh ' + file_path)
	        elif file_path.endswith('.txt'):
	        	print_crypto_stat(file_path)

recursive_dir_walk('.')