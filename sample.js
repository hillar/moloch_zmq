var INIFILE = './config.ini'; // <- put your moloch ini file location here

// load zmq conf from moloch ini file
var iniparser = require('iniparser');
var config = iniparser.parseSync(INIFILE);
var server_type = config.zmqPattern;
var TYPES = {'pub':'sub','push':'pull'}; // Only two 0MQ patterns are supported on the moment. Push/Pull and Pub/Sub.
var client_type = TYPES[server_type];
var servers = [];
for (var k in config) { // look in each section for zmqConfig
        if (config[k].zmqConfig) {
                var port = config[k].zmqConfig.split(':')[2]; //if in config is tcp://*:3240 we have now host ;(
                var host = k.split('-')[0]; // more than one capture on same host like hostname-cap1; hostname-cap2; etc.. 
                servers.push('tcp://'+host+':'+port);
        }
}
if (servers.length < 1) { // there was no sections, fallback to local host
        var os = require('os');
        var host = os.hostname();
        var port = config.zmqConfig.split(':')[2];
        servers.push('tcp://'+host+':'+port);
}
if (process.stdout.isTTY) {
    console.log('got from '+INIFILE)
    console.log('client type',client_type);
    console.log('servers:\n',servers);
}

// servers list prepared, go connect each
var zmq = require('zmq');
var sockets = [];
var counters = {};
for (var i = 0; i < servers.length; i++) {
    if (process.stdout.isTTY) console.log('creating socket for ',servers[i]);
    var sock = zmq.socket(client_type);
    var server = servers[i];
    sockets.push(sock);
    sockets[i].subscribe('http'); // <- TODO, move it to options 
    sockets[i].on('message', function(msg){
        var endpoint = this.getsockopt(zmq.ZMQ_LAST_ENDPOINT);
        if (!counters[endpoint]) {
            counters[endpoint] = {};
            counters[endpoint].count = 0;
            counters[endpoint].start = Date.now();
            if (process.stdout.isTTY) console.log('connected to ' + endpoint);

        }
        counters[endpoint].count ++;
        parseMsg( endpoint, msg.toString() );
    });
    sockets[i].connect(server);
}


function parseMsg(endpoint, str){
    /*
        put your parser here ...

        now just sending it to stdout tab separated
    */
    if (process.stdout.isTTY) return; // do not kill tty
    process.stdout.write(Date.now() +'\t'+ endpoint + '\t' + str + '\n');
}


if (process.stdout.isTTY) {
    // show stats every 10s 
    setInterval(function(){
        var now = Date.now();
        var total = 0;
        var first = Infinity;
        console.log('server, eps, total');
        for (var endpoint in counters){
            var count = counters[endpoint].count;
            var start = counters[endpoint].start;
            var rate = count / ((now-start)/1000)|0;
            total += count;
            first = Math.min(start,first);
            console.log(endpoint, rate, count);
        }
        console.log('TOTAL', total / ((now-first)/1000)|0, total);

    },10000);
} else {
    process.stdout.on('error', function() {process.exit()}); // dont send error on end of pipe
}

