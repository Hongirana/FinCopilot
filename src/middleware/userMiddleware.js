// middlewares/user.js
const bcrypt = require('bcrypt');
const saltRounds = 10;
module.exports = async (params, next) => {
    if (params.model === 'User') {
        if (params.action === 'create') {
            const data = params.args.data;
            console.log('Creating user:', data.email);
            // Hash password, set defaults, etc.
            //Hash password example
            if (data.password) {

                const hashedPassword = await bcrypt.hash(data.password, saltRounds);
                data.password = hashedPassword;
            }
            params.args.data = data;
        }

        // if (params.action === 'update') {
        //     console.log('Updating user:', params.args.where);
        //     params.args.data.updatedAt = new Date();
        // }
    }
    return next(params);
};
