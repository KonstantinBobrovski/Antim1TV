const StandartError = require('./Standart.error');

class UnauthorizedError extends StandartError {
    constructor(errors) {
        if (arguments.length)
            super(401, errors)
        else
            super(401, 'Моля влезте в профила си')
    }
}

module.exports=UnauthorizedError