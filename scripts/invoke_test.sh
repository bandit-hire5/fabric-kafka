#!/bin/bash

ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
CHANNEL_NAME="mychannel"

parsePeerConnectionParameters() {
	# check for uneven number of peer and org parameters
	if [ $(( $# % 2 )) -ne 0 ]; then
        	exit 1
	fi

	PEER_CONN_PARMS=""
	PEERS=""
	while [ "$#" -gt 0 ]; do
		PEER="peer$1.org$2"
		PEERS="$PEERS $PEER"
		PEER_CONN_PARMS="$PEER_CONN_PARMS --peerAddresses $PEER.example.com:7051"
		if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "true" ]; then
        		TLSINFO=$(eval echo "--tlsRootCertFiles \$PEER$1_ORG$2_CA")
        		PEER_CONN_PARMS="$PEER_CONN_PARMS $TLSINFO"
        	fi
		# shift by two to get the next pair of peer/org parameters
        	shift; shift
	done
	# remove leading space for output
	PEERS="$(echo -e "$PEERS" | sed -e 's/^[[:space:]]*//')"

	echo peer chaincode invoke -o orderer.example.com:7050  --tls --cafile $ORDERER_CA -C $CHANNEL_NAME -n mycc $PEER_CONN_PARMS -c '{"Args":["invoke","a","b","10"]}'
}

parsePeerConnectionParameters