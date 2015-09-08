#Robot

*A script that controls pumps for a cocktail making robot*

---

##Terminology
* Robot - One complete unit powered by a raspberry pi. A robot is made up of two machines, a button and a light.
* Machine - A set of three pumps. Three drinks can be mixed together to make a cocktail.
* Job - Instructions to make a drink. A recipe is a list of pump activation times measured in milliseconds.
* Cocktail - [Mmmm...](https://upload.wikimedia.org/wikipedia/commons/5/51/Cocktails_mit_Schirmchen.jpg)

##Description
The `robot.js` script runs on a raspberry pi using [Johnny-Five](https://www.npmjs.com/package/johnny-five) and communicates with a [cocktail-control](https://www.github.com/mcollina/cocktail-control) server using [MQTT.js](https://www.github.com/MQTTJS/MQTT.js). 

When the button is pressed, the robot notifies the control server that it is ready to receive jobs.

`test_job.js` is a script that can be used to send test jobs to the robot without needing to start the entire control server.

## Repos
* [cocktail-control](https://www.github.com/mcollina/cocktail-control) - The control server.
* [workaholic-ui](https://www.github.com/thekemkid/workaholic-ui) - A web interface for ordering drinks.

## Branches
* relay - One of the robots was built using relays instead of transistors so we needed to change some code.
* reversed-light - We mistakenly soldered some of the led circuitry on a robot in reverse i.e. [on = off && off = on](https://i.imgur.com/TSFjFee.jpg).

## Special Thanks
* [Matteo Collina](https://www.github.com/mcollina) for his work on the cocktail-control.
* [Glen Keane](https://www.github.com/thekemkid) for creating the workaholic UI.
* [Marco Piraccini](https://www.github.com/marcopiraccini) for lending us his electronics genius.
* [Julian Cheal](https://www.github.com/juliancheal) for coming up with the original idea, building a relay based robot, and contributing to the code.
