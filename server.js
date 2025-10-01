const express = require('express')
const bodyParser = require('body-parser')
const booksrouter = require('./router/books')
const usersRouter = require('./router/users')
const loansRouter = require('./router/loans')
const cors = require('cors')
const path = require('path')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const db = require('./services/database')

const { authenticateToken } = require('./middlewares/auth')

const corsOptions = {
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
}

const router = express.Router()
router.use(bodyParser.json());
router.use(cors(corsOptions));
router.use(cookieParser());
router.use('/api/books', booksrouter);
router.use('/api/users', usersRouter);
router.use('/api/loans', loansRouter);

router.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Déconnexion réussie' });
});

router.get('/api/session', authenticateToken, (req, res) => {
    if (req?.user) {
        res.json({ user: req.user });
    } else {
        res.status(401).json({ message: 'Non authentifié' });
    }
});

router.get('/api/statistics', (req, res) => {
    const totalBooksQuery = 'SELECT COUNT(*) AS total_books FROM livres';
    const totalUsersQuery = 'SELECT COUNT(*) AS total_users FROM utilisateurs';

    db.query(totalBooksQuery, (err, booksResult) => {
        if (err) throw err;
        db.query(totalUsersQuery, (err, usersResult) => {
            if (err) throw err;
            res.json({
                total_books: booksResult[0].total_books,
                total_users: usersResult[0].total_users
            });
        });
    });
});

router.use('/', express.static(path.join(__dirname, "./webpub")))
router.use(express.static(path.join(__dirname, "./webpub")))
router.use('/*', (_, res) => {
    res.sendFile(
        path.join(__dirname, "./webpub/index.html")
    );
})
router.get("*", (_, res) => {
    res.sendFile(
        path.join(__dirname, "./webpub/index.html")
    );
});

module.exports = router;