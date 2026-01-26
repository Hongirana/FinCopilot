
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = {
  user: {
    async create({ args, query }) {
      
      if (args.data.password) {
        const hashedPassword = await bcrypt.hash(args.data.password, saltRounds);
        args.data.password = hashedPassword;
      }
      
      return query(args);
    }
    
    // Add update operation if needed
    // async update({ args, query }) {
    //   args.data.updatedAt = new Date();
    //   return query(args);
    // }
  }
};
