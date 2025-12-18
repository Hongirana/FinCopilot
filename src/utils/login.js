require('dotenv').config();
const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


exports.loginForm = async ( req, res )=>{
    try{
        console.log("Inside Login Form");
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'email and password required to Login' });
        const userData = await prisma.user.findUnique({where: {email}});
        if(!userData){
            return res.status(404).json({error : 'User does not exist'});
        }
        const comparePassword = await bcrypt.compare(password , userData.password);
        
        if(!comparePassword){
            return res.status(401).json({error : 'Invalid Credentials'});
        }
        const payload = {
            email : userData.email,
            id : userData.id,
            name : userData.name
        }
        const jwtToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1hr'})
        return res.status(200).json({title: 'login' , message : 'Login Successful' , token : jwtToken });
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }   
}