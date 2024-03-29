const express = require('express');
require('dotenv').config();
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser')
const cors = require('cors')
const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS
const nocache = require("nocache");

const { Sync, sequelize } = require('./models/sequlize')

const rolesService = require('./services/roles.service');

StartApp();

async function StartApp() {

    await Sync()

    if (process.env.NODE_ENV == 'dev') {
        await DevFill();
        console.log('Filling db ready')
    }


    const app = express();


    app.engine('.hbs', exphbs({
        extname: '.hbs',
        helpers: require('./views/helpers/helpers'),
        runtimeOptions: {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true

        },
    }));
    app.set('view engine', '.hbs');

    app.use(express.static('public'));

    app.use(nocache());
    app.use(cookieParser())
    app.use(cors())

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json())

    app.use(redirectToHTTPS([/localhost:(\d{4})/], [], 308));

    app.use(require('./routes/main.router'));

    const server = app.listen(process.env.PORT, () => {
        console.log(`I WORK. Example app listening at http://localhost:${process.env.PORT}`)
    });

    const io = require('socket.io')(server);

    io.on('connection', require('./controllers/Socket.controller').SocketHandling);


}

//Inits db for dev purposes
async function DevFill() {

    try {
        console.log('Filling db')
        //password is password =)
        let admin = await sequelize.models.user.create({ username: "admin", password: '$2a$10$VPL4JZHtdjpYIW81H4j/u.oFq3GOqxI0jVjvqB0pNeVujWzhI2sGa', email: 'admin@gmail.com' })
        await rolesService.SetGodRole(admin)

        //password is Notpassword
        let notAdmin = await sequelize.models.user.create({ username: "notAdmin", password: '$2a$10$$2a$10$glMOBcHyAFVxW2RYx2hiU.oGAh8.QhobQIKCB9hmd53DbtcEHBIZC/u.oFq3GOqxI0jVjvqB0pNeVujWzhI2sGa', email: 'notadmin@gmail.com' })
        await rolesService.SetNewbieRole(notAdmin)

        await sequelize.models.tv.bulkCreate([{ name: 'Главен' },
        { name: '4 етаж' }])

    } catch (error) {
        console.log(error);
    }






}