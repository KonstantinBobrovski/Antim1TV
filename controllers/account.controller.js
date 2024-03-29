const { sequelize, Users, Rights, Priorities, Videos, AllowedVideos } = require('../models/Models')

const { Op } = require('sequelize')
const Errors = require('../Errors/index.error');

const bcrypt = require('bcrypt');

const Actions = require('../models/enums/Actions.enum');
const tvService = require('../services/tv.service');

class AccountController {

    async GetMyAccountPage(req, res, next) {
        try {

            const myVideos = await Videos.findAll({ where: { SuggesterId: res.locals.user.id } })
            const myRights = res.locals.user.rights;
            const tvs = tvService.GetTvs();
            res.render('account/me', {
                title: "Мой аккаунт",
                active: { account: true },
                css: ['account.css'],
                js: ['account/account.js'],
                myVideos,
                myRights,
                tvs,
                myTvs: req.cookies.tvs,
                myPriority: res.locals.user.priority
            });

        } catch (error) {
            next(new Errors.InternalError('Неизвестна грешка', error))
        }
    }

    async Logout(req, res, next) {
        res.clearCookie('access', {
            secure: true,
            httpOnly: true,
            expires: new Date(Date.now() - 2),
        });
        res.redirect('/')
    }

    async GetAllowsPage(req, res, next) {
        try {
            let user = res.locals.user;

            if (user.rights.includes(Actions.AllowVideo)) {
                const tvs = tvService.GetTvs();

                const videosToAllow = await Videos.findAll({
                    where: { verified: null }
                });
                res.render('account/allow', {
                    title: "Одобри контент",
                    active: { account: true },
                    css: ['account.css'],
                    js: ['account/allow.js'],
                    videosToAllow,
                    tvs,
                });
            } else {
                next(new Errors.ForbiddenError())
            }
        } catch (error) {
            next(new Errors.InternalError('Неизвестна грешка', error))
        }
    }

    async GetUsersPage(req, res, next) {
        const me = res.locals.user;

        const myRights = me.rights;

        if (!(myRights.includes(Actions.ChangePriority) || myRights.includes(Actions.ChangeRight) || myRights.includes(Actions.BanUser))) {
            return next(new Errors.ForbiddenError('Нямате права да контролирате акаунтите'))
        }

        const defaultSearch = req.query['search-pattern']?.slice(1, -1)

        res.render('account/users', {
            title: "Потребители",
            active: { account: true },
            css: ['account.css'],
            js: ['account/users.js'],
            defaultSearch
        });


    }

    async GetByName(req, res, next) {
        const me = res.locals.user;

        const myRights = me.rights;

        if (!(myRights.includes(Actions.ChangePriority) || myRights.includes(Actions.ChangeRight) || myRights.includes(Actions.BanUser))) {
            return next(new Errors.ForbiddenError('Нямате права да контролирате акаунтите'))
        }
        if (!req.query.username) {
            return next(new Errors.BadRequestError())
        }

        const include = [{
            model: Priorities,
            as: 'Prioritiy',
            attributes: ['priority', 'GiverId', 'id'],
        }];


        if (myRights.includes(Actions.ChangeRight)) {
            include.push({
                model: Rights,
                as: 'Rights',
                attributes: ['actionCode', 'GiverId', 'id']

            })
        }

        const order = [[{ model: Priorities, as: 'Prioritiy' }, 'priority', 'ASC']]

        let users;

        try {
            if (/^id=/.test(req.query.username)) {
                const id = req.query.username.slice(3)

                if (!id || isNaN(id))
                    return next(new Errors.BadRequestError())

                users = await Users.findAll({
                    where: {
                        id: id
                    },
                    include,
                    order,
                    attributes: ['username', 'id']

                })
                if (users.length == 0)
                    return next(new Errors.NotFoundError('Този потребител не е намерен.Може би има по-висок от вас приоритет'))
            }
            else {
                users = await Users.findAll({
                    where: {
                        username: {
                            [Op.like]: req.query.username + '%'
                        }
                    },
                    order,
                    include,
                    attributes: ['username', 'id']

                })
            }


            res.json(users)
        } catch (error) {
            next(new Errors.InternalError('', error))
        }


    }


    /**
     * @param  {int} changeCount How should priority be changed
     */
    ChangePriority(changeCount) {
        return async function (req, res, next) {
            try {
                const me = res.locals.user;

                const myRights = me.rights;

                if (!myRights.includes(Actions.ChangePriority)) {
                    return next(new Errors.ForbiddenError('Нямате правo да променяте приоритет'))
                }


                if (!(req.body.id && !isNaN(req.body.id)))
                    return next(new Errors.BadRequestError());

                const priorityId = parseInt(req.body.id);
                const priority = await Priorities.findByPk(priorityId)

                if (!priority) {
                    return next(new Errors.NotFoundError('Няма приоритет с това id'))
                }
                if (priority.priority + changeCount <= 0) {
                    return next(new Errors.BadRequestError('Приоритет не може да е по-малък или равен от 0'))
                }
                if (priority.priority >= me.priority - 1) {
                    return next(new Errors.ForbiddenError('Нямате достатъчно приоритет за тази операция'))
                }
                if (priority.GiverId) {
                    const giver = await Priorities.findOne({
                        where: {
                            'ReceiverId': priority.GiverId
                        }
                    })
                    if (giver && giver.priority >= me.priority && giver.ReceiverId != me.id) {
                        return next(new Errors.ForbiddenError('Нямате достатъчно приоритет за тази операция'))
                    }
                }
                const t = await sequelize.transaction();
                Promise.all([priority.increment('priority', { by: changeCount, transaction: t }),
                Priorities.update({ GiverId: parseInt(me.id) }, {
                    where: {
                        id: priorityId
                    }, transaction: t
                })]).then(([incr, giv]) => {
                    t.commit()
                    res.json({ success: true, new_priority: incr.priority })
                }).catch(error => {
                    t.rollback();
                    return next(new Errors.InternalError('Неизвестна грешка', error))
                });
            } catch (error) {
                next(new Errors.InternalError('Неизвестна грешка', error))
            }

        }
    }

    async DeleteRight(req, res, next) {
        try {
            const me = res.locals.user;

            const myRights = me.rights;

            if (!myRights.includes(Actions.ChangeRight)) {
                return next(new Errors.ForbiddenError('Нямате правo да променяте права'))
            }

            const rightId = +req.body['right_id']
            const userId = +req.body['user_id']

            if (!(rightId && !isNaN(rightId)) && !(userId && !isNaN(userId)))
                return next(new Errors.BadRequestError());

            const receiver = await Users.findByPk(userId, {
                include: [{
                    model: Priorities,
                    as: 'Prioritiy',
                    attributes: ['priority', 'GiverId', 'id']
                }]
            });

            if (!receiver)
                return next(new Errors.NotFoundError('Нямате потребител с това право'))

            if (receiver.Prioritiy.priority >= me.priority)
                return next(new Errors.ForbiddenError('Нямате правo да променяте правата на този потребител'))

            const right = await Rights.findByPk(rightId, {
                include: [{
                    //giver of right
                    model: Users,
                    as: 'Giver',
                    attributes: ['id'],
                    include: [{
                        //priority of giver of right
                        model: Priorities,
                        as: 'Prioritiy',
                        attributes: ['priority', 'GiverId', 'id']
                    }]
                }]
            })

            if (right) {
                if (right.Giver.Prioritiy.priority >= me.priority && right.Giver.id !== me.id)
                    return next(new Errors.ForbiddenError('Нямате правo да триете това право.'))
                else {
                    await right.destroy();
                    res.json({ success: true })

                }
            }

        } catch (error) {
            return next(new Errors.InternalError('Грешка', error))
        }
    }

    async AddRight(req, res, next) {

        try {
            const me = res.locals.user;

            const myRights = me.rights;

            if (!myRights.includes(Actions.ChangeRight)) {
                return next(new Errors.ForbiddenError('Нямате правo да променяте права'))
            }

            const rightCode = req.body['right_code']
            const userId = +req.body['user_id']

            if (!(rightCode) && !(userId && !isNaN(userId)))
                return next(new Errors.BadRequestError());

            if (!myRights.includes(rightCode))
                return next(new Errors.ForbiddenError('За да даденете право на някого трябва да имате това право'));


            const receiver = await Users.findByPk(userId, {
                include: [{
                    model: Priorities,
                    as: 'Prioritiy',
                    attributes: ['priority', 'GiverId', 'id']
                }]
            });

            if (!receiver)
                return next(new Errors.NotFoundError('Нямате потребител с това право'))

            if (receiver.Prioritiy.priority >= me.priority)
                return next(new Errors.ForbiddenError('Нямате правo да променяте правата на този потребител'))

            const [right, created] = await Rights.findOrCreate({
                where: {
                    ReceiverId: userId,
                    actionCode: rightCode
                },
                defaults: {
                    GiverId: me.id
                }
            });

            if (!created)
                return next(new Errors.BadRequestError('Потребителя вече има това право'))


            res.json({
                success: true,
                result: {
                    user: { id: userId },
                    actionCode: rightCode,
                    id: right.id,
                    GiverId: me.id
                }
            })
        } catch (error) {
            return next(new Errors.InternalError('Грешка', error))
        }
    }

    async SetTvCookies(req, res, next) {

        const tvIds = [].concat(req.body.tvIds).filter(el => !isNaN(el)).map(el => parseInt(el));
        res.cookie('tvs', tvIds, {
            //10 years
            expires: new Date(Date.now() + 315569520000)
        })
        res.json({ success: true, tvIds })
    }

    async ChangePassword(req, res, next) {
        const me = res.locals.user;


        const newPassword = req.body['parolaBatiii']
        if (!newPassword)
            return next(new Errors.BadRequestError());

        try {
            let new_psw = await bcrypt.hash(newPassword, 10)
            await Users.update({ password: new_psw }, {
                where: {
                    id: me.id
                }
            });
            res.json({ success: true })
        } catch (error) {
            return next(new Errors.InternalError('', error))
        }

    }

    async DeleteAccount(req, res, next) {
        const deleteID = req.body['deleteID']

        const me = res.locals.user;
        try {
            if (deleteID == me.id) {
                await Users.destroy({
                    where: {
                        id: deleteID
                    }
                })
                return res.redirect(req.baseUrl + '/logout')

            } else {
                const myRights = me.rights;

                if (!myRights.includes(Actions.BanUser)) {
                    return next(new Errors.ForbiddenError('Нямате правo да триете потребители'))
                }

                const receiver = await Users.findByPk(deleteID, {
                    include: [{
                        model: Priorities,
                        as: 'Prioritiy',
                        attributes: ['priority', 'GiverId', 'id']
                    }]
                });

                if (!receiver)
                    return next(new Errors.NotFoundError('Нямате потребител с това право'))

                if (receiver.Prioritiy.priority >= me.priority)
                    return next(new Errors.ForbiddenError('Нямате правo да променяте правата на този потребител'))

                await Users.destroy({
                    where: {
                        id: deleteID
                    }
                })

                return res.json({ success: true })


            }
        } catch (error) {
            return next(new Errors.InternalError('', error))

        }


    }

}
module.exports = new AccountController()