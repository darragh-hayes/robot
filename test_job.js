var mqtt = require('mqtt').connect('mqtt://localhost:2048');
var config = require('./config.js');

var cocktails = {
  bloody: {
    activations: [
      {time: 5000}, // milliseconds
      {time: 3000},
      {time: 6000}
    ]
  },
  spritz: {
    activations: [
      {time:4000},
      {time: 3000},
      {time: 4000}
    ]
  }
};

var defs = {
  cocktails: cocktails,
  workers: {
    bob: {
      cocktails: [{machine: 0, cocktail: 'bloody'}, {machine: 1, cocktail: 'spritz'}]
    },
    mark: {
      cocktails: [{machine: 0, cocktail: 'spritz'}, {machine: 1, cocktail: 'spritz'}]
    }
  }
};

var jobs = [{
        id: 0,
        name: 'Matteo',
        cocktail: 'bloody',
        pump: 0,
        activations: defs.cocktails.bloody.activations
  }];


mqtt.on('connect', function() {
  mqtt.subscribe(config.worker);
});

mqtt.on('message', function(topic, message) {
  console.log('received message', message.toString());

  message = JSON.parse(message.toString());
  if (message.status === 'button pressed') {
    mqtt.publish('pi1', JSON.stringify({status: 'new jobs', jobs: jobs}));
  }
});