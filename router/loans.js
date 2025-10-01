const express = require('express');
const router = express.Router();
const loansController = require('../controllers/loans.controller.js');
const { authenticateToken } = require('../middleware/auth');

// Emprunter un livre
router.post('/', authenticateToken, loansController.loanBook);

// Retourner un livre
router.post('/:id_loan/return', authenticateToken, loansController.returnBook);

// Récupérer tous les emprunts d'un utilisateur
router.get('/', authenticateToken, loansController.getAllLoans);

module.exports = router;