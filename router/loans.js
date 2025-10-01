const express = require('express');
const router = express.Router();
const loansController = require('../controllers/loans.controller.js');
const { authenticateToken } = require('../middlewares/auth');

router.post('/', authenticateToken, loansController.loanBook);
router.post('/:id_loan/return', authenticateToken, loansController.returnBook);
router.get('/', authenticateToken, loansController.getAllLoans);

module.exports = router;