var config = require('./config.js');
var Raspi = require('raspi-io');
var five = require('johnny-five');
var parallel = require('fastparallel')();
var raspi = new Raspi();
var board = new five.Board({ io: raspi });
var worker = config.worker;
var mqtt, button, light;
var ready = true;
var machines = config.machines;

board.on('ready', function () {

  initMachines();
  button = five.Button(config.buttonPin);
  light = five.Led(config.lightPin);
  light.blink();
  mqtt = require('mqtt').connect('mqtt://'+config.host+':'+config.port);
  mqtt.subscribe(worker);
  ping();

  mqtt.on('message', function(topic, message) {
    console.log(message.toString());
    message = JSON.parse(message.toString());

    if (message.status === 'ping') { ping(); }
    else if (message.jobs) { handleJobs(message); }
    else if (message.status === 'stop now') { stop(); }
  });

  button.on('down', function () {
    console.log('button pressed');
    if (ready) {
      mqtt.publish(worker, JSON.stringify({worker: worker, status: 'button pressed'}));
    }
  });

  this.repl.inject({
    machines: machines,
    kill: kill
  });
});

function initMachines() {
  machines.forEach(function(machine) {
    machine.pins = machine.ports.reduce(function (acc, port) {
      var pin = new five.Pin(port)
      acc[port] = pin
      return acc
    }, {});

    machine.kill = function () {
      var machine = this;
      this.ports.forEach(function (port) {
        var pin = machine.pins[port];
        pin.high();
        pin.low();
      })
    }
  
    machine.start = function () {
      var machine = this;
      this.ports.forEach(function (port) {
        var pin = machine.pins[port]
        pin.high();
      })
    }

    machine.runJob = function(job, cb) {
      var machine = this;
      this.ready = false;
      console.log('running job on machine', machine.id)
      mqtt.publish(worker, JSON.stringify({status: 'running job on machine ' + machine.id}));
      
      var portNum = 0;

      parallel(null,

        function(port, finished) {
          var pin = machine.pins[port];
          pin.high();

          setTimeout(function() {
            pin.low();
            finished();
          }, job.activations[portNum].time);

          portNum++;
        },
        machine.ports,
        function done() {
          //send glen a message saying drink tasty
          job.finished = true;
          mqtt.publish(worker, JSON.stringify({status: 'job complete', job: job}))
          cb();
        }
      );
    }
  });
}

function kill() {
  machines.forEach(function(m) {
    console.log('killed machines');
    m.kill();
    ready = true;
    light.blink();
    ping();
  });
}

function handleJobs(message) {
  console.log('received jobs' + JSON.stringify(message.jobs, null, 2));
  if (ready) {
    ready = false;
    light.stop().on();
    parallel(null, function(job, cb) {
      machines[job.pump].runJob(job, cb);
    },
    message.jobs, 
    function done() {
      light.blink();
      ready = true;
      console.log('Finished Jobs');
      ping();
    })
  }
}

function ping() {
  mqtt.publish('connections', JSON.stringify({worker: worker, status: 'worker here', ready: ready}));
}
