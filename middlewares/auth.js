const jwt = require('jsonwebtoken')
const JWT_SECRET = "HelloThereImObiWan"

function authenticateToken(req, res, next) {
    const token = req.cookies.token
    if (!token) return res.sendStatus(401)

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

module.exports = { authenticateToken };