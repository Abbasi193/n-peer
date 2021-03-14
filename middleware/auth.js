const jwt = require('jsonwebtoken');
const JWT_SECRET = 'b2637fe72f618333ce1c0326b09c526e37c785be585695f5617a2e95ac96cf8f8a4d39749b257d3bf1c52e356e8b0486c5f3d60fc3aaab0cb573fe9d0787f6b1';
const REFRESH_TOKEN_SECRET= '5f9cbd39357edfac53c261128598613a6db41df2fdaf5e6bc1b89d2870f3caa4dd0776bcabc6e0c311fba9fa1995be4ec212d44c2f9533a016a91608567a927c';
const auth = (req,res,next) => {
    
    var token = req.headers.cookie;
    if(token)
        token = token.split('=')[1]
    if(!token){ return res.redirect('/login');/*res.status(401).json({msg:'Authorization denied'});*/}
        
    try {
        const decode = jwt.verify(token,JWT_SECRET);
        req.user = decode;
        next();
    } catch(e) {
        res.redirect('/login')
        //res.status(400).json({ msg: 'Token is not valid' });
    }
}

module.exports = auth;