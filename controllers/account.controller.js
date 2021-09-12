const { sequelize, Users, Rights, Priorities, Videos, AllowedVideos } = require('../models/Models')
const Actions = require('../models/Actions.enum');
class AccountController {

    async GetMyAccountPage(req, res, next) {
        try {
            let user = res.locals.user;

            let myVideos = await Videos.findAll({ where: { SuggesterId: res.locals.user.id } })

            res.render('account/me', {
                title: "Мой аккаунт",
                active: { account: true },
                css: ['account.css'],
                js: ['account.js'],
                myVideos
            });

        } catch (error) {
            next(error)
        }
    }

    async GetAllowsPage(req, res, next) {
        try {
            let user = res.locals.user;
            if (user.rights.includes(Actions.AllowVideo)) {
                let videosToAllow = await Videos.findAll({ where: { verified: null } });
                res.render('account/allow', {
                    title: "Одобри контент",
                    active: { account: true },
                    css: ['account.css'],
                    js: ['account.js'],
                    videosToAllow
                });
            }else{
                req.redirect('/403')
            }
        } catch (error) {
            next(error)
        }
    }

    async GetUsersPage(req,res,next){
        
    }

}
module.exports = new AccountController()