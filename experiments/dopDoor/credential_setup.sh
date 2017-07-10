#!/bin/bash

scp hokeun@swarmnuc2008.eecs.berkeley.edu:~/Development/iotauth/entity/auth_certs/Auth101EntityCert.pem $IOT/entity/auth_certs/Auth101EntityCert.pem
scp hokeun@swarmnuc2008.eecs.berkeley.edu:~/Development/iotauth/entity/credentials/keys/net1/Net1.ClientKey.pem $IOT/entity/credentials/keys/net1/Net1.ClientKey.pem
scp hokeun@swarmnuc2008.eecs.berkeley.edu:~/Development/iotauth/entity/credentials/keys/net1/Net1.ServerKey.pem $IOT/entity/credentials/keys/net1/Net1.ServerKey.pem
scp $IOT/entity/credentials/certs/net1/Net1.ClientCert.pem hokeun@swarmnuc2008.eecs.berkeley.edu:~/Development/iotauth/entity/credentials/certs/net1/Net1.ClientCert.pem
scp $IOT/entity/credentials/certs/net1/Net1.ServerCert.pem hokeun@swarmnuc2008.eecs.berkeley.edu:~/Development/iotauth/entity/credentials/certs/net1/Net1.ServerCert.pem

