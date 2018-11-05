var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');
var fs = require('fs');

//
var fabric_client = new Fabric_Client();

// setup the fabric network
var channel = fabric_client.newChannel('mychannel');
let data = fs.readFileSync(path.join(__dirname, '../crypto-config/peerOrganizations/org1.example.com/msp/tlscacerts/tlsca.org1.example.com-cert.pem'));
let peer = fabric_client.newPeer(
    'grpcs://localhost:7051',
    {
        pem: Buffer.from(data).toString(),
        'ssl-target-name-override': 'peer0.org1.example.com'
    }
);
channel.addPeer(peer);

var member_user = null;
var store_path = path.join(__dirname, 'hfc-key-store');
console.log('Store path:'+store_path);
var tx_id = null;

Fabric_Client.newDefaultKeyValueStore({ path: store_path
}).then((state_store) => {
    // assign the store to the fabric client
    fabric_client.setStateStore(state_store);
    var crypto_suite = Fabric_Client.newCryptoSuite();
    // use the same location for the state store (where the users' certificate are kept)
    // and the crypto store (where the users' keys are kept)
    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
    crypto_suite.setCryptoKeyStore(crypto_store);
    fabric_client.setCryptoSuite(crypto_suite);

    // get the enrolled user from persistence, this user will sign all requests
    return fabric_client.getUserContext('user1', true);
}).then((user_from_store) => {
    if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Successfully loaded user1 from persistence');
        member_user = user_from_store;
    } else {
        throw new Error('Failed to get user1.... run registerUser.js');
    }

    let event_hubs = channel.getChannelEventHubsForOrg();
    console.log(event_hubs.length);

    event_hubs.forEach((eh) => {
        let instantiateEventPromise = new Promise((resolve, reject) => {
            console.log('instantiateEventPromise - setting up event');

            let regid1 = null;

            let event_timeout = setTimeout(() => {
                let message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
                console.log(message);
                eh.disconnect();
            }, 600000);

            eh.registerBlockEvent((block) => {
                console.log(block);

                /*if (block_num){
                    clearTimeout(event_timeout);
                    eh.unregisterChaincodeEvent(regid1);

                    console.log('Successfully received the chaincode event on block number '+ block_num);

                    resolve('RECEIVED');
                } else {
                    console.log('Successfully got chaincode event ... just not the one we are looking for on block number '+ block_num);
                }*/
            }, (error)=> {
                clearTimeout(event_timeout);
                console.log('Failed to receive the chaincode event ::'+error);
                reject(error);
            });

            /*regid1 = eh.registerChaincodeEvent('mycc', 'invoke', (event, block_num, tx, status) => {
                console.log('Successfully got a chaincode event with transid:'+tx + ' with status:'+status);

                let event_payload = event.payload;
                console.log(event, block_num, tx, status);
                //console.log('Successfully got a chaincode event with payload:'+ event_payload.toString('utf8'));

                /!*if (block_num){
                    clearTimeout(event_timeout);
                    eh.unregisterChaincodeEvent(regid1);

                    console.log('Successfully received the chaincode event on block number '+ block_num);

                    resolve('RECEIVED');
                } else {
                    console.log('Successfully got chaincode event ... just not the one we are looking for on block number '+ block_num);
                }*!/
            }, (error)=> {
                clearTimeout(event_timeout);
                console.log('Failed to receive the chaincode event ::'+error);
                reject(error);
            });*/

            eh.connect();
        });

        instantiateEventPromise
            .then((result) => {
                console.log('GOOD! ', result);
            })
            .catch((err) => {
                console.log('BAD! ', err);
            });
    });
}).catch((err) => {
    console.error('CATCH! ' + err);
});
