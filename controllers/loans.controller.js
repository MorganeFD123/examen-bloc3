const db = require('../services/database.js');

const loanBook = (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    const { id_book, expected_return_date } = req.body;
    const id_user = req.user.id;

    if (!id_book || !expected_return_date) {
        return res.status(400).json({ message: "Veuillez fournir l'ID du livre et la date de retour." });
    }

    const loanDate = new Date();
    const returnDate = new Date(expected_return_date);

    if (isNaN(returnDate.getTime())) {
        return res.status(400).json({ message: "Date de retour invalide." });
    }

    if (returnDate <= loanDate) {
        return res.status(400).json({ message: "La date de retour doit être ultérieure à la date d'emprunt." });
    }

    const diffTime = Math.abs(returnDate - loanDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
        return res.status(400).json({ message: "La durée de l'emprunt ne peut pas dépasser 30 jours." });
    }

    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ message: "Erreur technique lors de la transaction.", error: err });
        }

        const checkBookQuery = "SELECT statut FROM livres WHERE id = ?";
        db.query(checkBookQuery, [id_book], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ message: "Erreur lors de la vérification du livre.", error: err });
                });
            }

            if (results.length === 0) {
                return db.rollback(() => {
                    res.status(404).json({ message: "Livre non trouvé." });
                });
            }

            if (results[0].statut === 'emprunté') {
                return db.rollback(() => {
                    res.status(400).json({ message: "Ce livre est déjà emprunté." });
                });
            }

            const insertLoanQuery = "INSERT INTO loans (id_user, id_book, date_loan, expected_return_date) VALUES (?, ?, ?, ?)";
            db.query(insertLoanQuery, [id_user, id_book, loanDate.toISOString().slice(0, 10), returnDate.toISOString().slice(0, 10)], (err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ message: "Erreur lors de la création de l'emprunt.", error: err });
                    });
                }

                const updateBookQuery = "UPDATE livres SET statut = 'emprunté' WHERE id = ?";
                db.query(updateBookQuery, [id_book], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ message: "Erreur lors de la mise à jour du statut du livre.", error: err });
                        });
                    }

                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ message: "Erreur lors de la finalisation de la transaction.", error: err });
                            });
                        }
                        res.status(201).json({ message: "Livre emprunté avec succès." });
                    });
                });
            });
        });
    });
};

const returnBook = (req, res) => {
    const { id_loan } = req.params;
    const returnDate = new Date();

    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ message: "Erreur technique lors de la transaction.", error: err });
        }

        const getLoanQuery = "SELECT id_book FROM loans WHERE id_loan = ? AND actual_return_date IS NULL";
        db.query(getLoanQuery, [id_loan], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ message: "Erreur lors de la recherche de l'emprunt.", error: err });
                });
            }

            if (results.length === 0) {
                return db.rollback(() => {
                    res.status(404).json({ message: "Aucun emprunt en cours trouvé pour cet ID." });
                });
            }

            const id_book = results[0].id_book;

            const updateLoanQuery = "UPDATE loans SET actual_return_date = ? WHERE id_loan = ?";
            db.query(updateLoanQuery, [returnDate.toISOString().slice(0, 10), id_loan], (err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ message: "Erreur lors de la mise à jour de l'emprunt.", error: err });
                    });
                }

                const updateBookQuery = "UPDATE livres SET statut = 'disponible' WHERE id = ?";
                db.query(updateBookQuery, [id_book], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ message: "Erreur lors de la mise à jour du statut du livre.", error: err });
                        });
                    }

                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ message: "Erreur lors de la finalisation de la transaction.", error: err });
                            });
                        }
                        res.status(200).json({ message: "Livre retourné avec succès." });
                    });
                });
            });
        });
    });
};

const getAllLoans = (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Utilisateur non authentifié." });
    }
    const id_user = req.user.id;

    const query = `
        SELECT 
            l.id_loan,
            l.date_loan,
            l.expected_return_date,
            l.actual_return_date,
            b.titre AS book_title,
            b.auteur AS book_author
        FROM loans l
        JOIN livres b ON l.id_book = b.id
        WHERE l.id_user = ?
        ORDER BY l.date_loan DESC
    `;

    db.query(query, [id_user], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Erreur lors de la récupération des emprunts.", error: err });
        }

        const today = new Date();
        const loans = results.map(loan => {
            const expectedReturn = new Date(loan.expected_return_date);
            if (!loan.actual_return_date && expectedReturn < today) {
                const diffTime = Math.abs(today - expectedReturn);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                loan.late_message = `Ce livre a ${diffDays} jours de retard.`;
            }
            return loan;
        });

        res.status(200).json(loans);
    });
};

module.exports = {
    loanBook,
    returnBook,
    getAllLoans
};