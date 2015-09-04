var Raspi = require('raspi-io');
var five = require('johnny-five');
var parallel = require('fastparallel')();
var raspi = new Raspi();
var board = new five.Board({ io: raspi });
var worker = 'pi1';
var mqtt;

var ready = true;

var machines = [
  {
    id: 1,
    ports: ['GPIO24', 'GPIO9', 'GPIO18'],
    pins: {}
  },
  {
    id: 2,
    ports : ['GPIO22', 'GPIO23', 'GPIO27'],
    pins: {}
  }
];

board.on('ready', function () {

  mqtt = require('mqtt').connect('mqtt://192.168.1.83:2048');
  initMachines();
  mqtt.subscribe('pi1');

  var button = new five.Button('GPIO4');
  var light = new five.Led('GPIO7');

  light.pulse();

  button.on('down', function () {
    console.log('DOWN!');
    if (ready) {
        console.log('machines ready to take jobs');
        mqtt.publish(worker, JSON.stringify({worker: worker, status: 'ready'}));
    } else {
      console.log('not taking jobs');
    }
  })

  this.repl.inject({
    machines: machines,
    button: button
  });



  mqtt.publish(worker, JSON.stringify({worker: worker, status: 'ready'}));

  mqtt.on('message', function(topic, message) {
    console.log(message.toString());
    message = JSON.parse(message.toString());
    if (message.jobs) {
      console.log('received jobs' + JSON.stringify(message.jobs, null, 2));
      //if both machines are ready to accept jobs
      if (ready) {
        ready = false;
        light.on();
        parallel(null, function(job, cb) {
          machines[job.pump].runJob(job, cb);
        },
        message.jobs, 
        function done() {
          light.blink();
          ready = true;
          console.log('Finished Jobs');
          setTimeout(function() {
            light.stop();
          }, 10000);
        })
      }
    }
  });
})

function initMachines() {
  machines.forEach(function(machine) {
    machine.pins = machine.ports.reduce(function (acc, port) {
      var pin = new five.Pin(port)
      acc[port] = pin
      return acc
    }, {})

    machine.reset = function () {
      var machine = this;
      this.ports.forEach(function (port) {
        var pin = machine.pins[port];
        pin.low()
      })
    }
  
    machine.start = function () {
      var machine = this;
      this.ports.forEach(function (port) {
        var pin = machine.pins[port]
        pin.high()
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
          }, job.activations[portNum]);

          portNum++;
        },
        machine.ports,
        function done() {
          //send glen a message saying drink tasty
          cb();
        }
      );
    }
  });
}