module.exports = {
  host: '192.168.1.83',
  port: '2048',
  worker: 'pi1',
  butttonPin: 'GPIO4',
  lightPin: 'GPIO7',

  machines: [
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
  ]
}