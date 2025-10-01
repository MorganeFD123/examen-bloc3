const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('./../services/database')

const { authenticateToken } = require('../middlewares/auth')
const JWT_SECRET = "HelloThereImObiWan"

function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Accès interdit');
    }
    next();
}

router
.get('/',authenticateToken, isAdmin, (_, res) => {
    const sql = 'SELECT * FROM utilisateurs'
    db.query(sql, (err, results) => {
        if (err) throw err
        res.json(results)
    })
})

.post('/register', async (req, res) => {
    const { name, prenom, email, password, role } = req.body
    console.log(req.body)
    const hashedPassword = await bcrypt.hash(password, 10)
    const sql = 'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES (?, ?, ?, ?, ?)'
    db.query(sql, [name, prenom, email, hashedPassword, role || 'utilisateur'], (err, result) => {
        if (err) {
            console.error(err)
            res.status(500).send('Problème SQL')
        }
        else res.send('Utilisateur enregistré')
    })
})
.get('/pass/:pass', async (req, res)=> {
    //For Test Only
    const hashedPassword = await bcrypt.hash(req.params.pass, 10)
    res.send(hashedPassword)
})

.put('/:id', authenticateToken, (req, res) => {
    const { nom, prenom, email, role } = req.body
    const sql = 'UPDATE utilisateurs SET nom = ?, prenom = ?, email = ?, role = ? WHERE id = ?'
    db.query(sql, [nom, prenom, email, role, req.params.id], (err) => {
        if (err) throw err
        res.send('Utilisateur mis à jour')
    })
})

.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM utilisateurs WHERE email = ?'
    db.query(sql, [email], async (err, results) => {
        if (err) throw err
        if (results.length === 0) {
            return res.status(400).send('Utilisateur non trouvé')
        }
        const user = results[0]
        const isMatch = await bcrypt.compare(password, user.mot_de_passe)
        if (!isMatch) {
            return res.status(400).send('Mot de passe incorrect')
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '2h' })
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Utiliser 'true' si HTTPS
            sameSite: 'lax'
        })
        res.json({ token })
    })
})

.get('/:id', authenticateToken, (req, res) => {
    const sql = 'SELECT * FROM utilisateurs WHERE id = ?'
    db.query(sql, [req.params.id], (err, result) => {
        if (err) throw err
        res.json(result)
    })
})
.get('/user-role', authenticateToken, (req, res) => {
    res.json({ role: req.user.role });
})

module.exports = router