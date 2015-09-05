var mqtt = require('mqtt').connect('mqtt://localhost:2048');

var cocktails = {
  bloody: {
    activations: [
      {time: 60000}, // milleseconds
      {time: 30000},
      {time: 60000}
    ]
  },
  spritz: {
    activations: [
      {time:4000}, // milleseconds
      {time: 3000},
      {time: 4000}
    ]
  }
}
var defs = {
  cocktails: cocktails,
  workers: {
    bob: {
      cocktails: ['bloody', 'spritz']
    },
    mark: {
      cocktails: ['spritz', 'spritz']
    }
  }
}

var jobs = [{
        id: 0,
        name: 'Matteo',
        cocktail: 'bloody',
        pump: 0,
        activations: defs.cocktails.bloody.activations
      }]


mqtt.on('connect', function() {
  mqtt.subscribe('pi1');
  //mqtt.publish('pi1', JSON.stringify({jobs: jobs}));
  //console.log('pushed messaged');
})

mqtt.on('message', function(topic, message) {
  console.log('received message', message.toString());

  message = JSON.parse(message.toString());
  if (message.status === 'button pressed') {
    mqtt.publish('pi1', JSON.stringify({status: 'new jobs', jobs: jobs}));
  }
})