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
  reset();
  mqtt = require('mqtt').connect('mqtt://'+config.host+':'+config.port);
  mqtt.subscribe(worker);
  ping();

  mqtt.on('message', function(topic, message) {
    console.log(message.toString());
    message = JSON.parse(message.toString());

    if (message.status === 'ping') { ping(); }
    else if (message.jobs) { handleJobs(message); }
    else if (message.status === 'stop now') { reset(); }
  });

  button.on('down', function () {
    console.log('button pressed');
    if (ready) {
      mqtt.publish(worker, JSON.stringify({worker: worker, status: 'button pressed'}));
    }
  });

  this.repl.inject({
    machines: machines,
    reset: reset,
    start: start
  });
});

function initMachines() {
  machines.forEach(function(machine) {
    machine.pins = machine.ports.reduce(function (acc, port) {
      var pin = new five.Relay({
                        type: "NC",
                        pin: port
                    });
      acc[port] = pin
      return acc
    }, {});

    machine.reset = function () {
      var machine = this;
      this.ports.forEach(function (port) {
        var pin = machine.pins[port];
        pin.on();
        pin.off();
      })
    }

    machine.start = function () {
      var machine = this;
      this.ports.forEach(function (port) {
        var pin = machine.pins[port]
        pin.on();
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
          pin.on();

          setTimeout(function() {
            pin.off();
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

function reset() {
  machines.forEach(function(m) {
    m.reset();
  });
  ready = true;
  light.blink();
  if (mqtt) {
    ping();
  }
}

function start() {
  machines.forEach(function(m) {
    m.start();
  });
  ready = false;
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

var signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];

signals.forEach(function(s) {
  process.on(s, function() {
    reset();
    light.stop().off();
  });
});
