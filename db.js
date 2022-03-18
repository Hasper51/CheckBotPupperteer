const {Sequelize} = require('sequelize');

module.exports = new Sequelize(
    'telegambot',
    'root',
    'root',
    {
        host: '46.148.239.181',
        port: '6432',
        dialect: 'postgres'
    }
)
