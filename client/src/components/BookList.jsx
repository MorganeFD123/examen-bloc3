import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './../styles/booklist.css'

const BookList = () => {
    const navigate = useNavigate()
    const [books, setBooks] = useState([])
    const [userRole, setUserRole] = useState('')
    const [loanStatus, setLoanStatus] = useState({})
    const base = import.meta.env.VITE_BASE_URL || '/'

    useEffect(() => {
        fetch(base+'api/books', {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => setBooks(data))
            .catch(error => console.error('Erreur:', error))
        fetch(base+'api/session', {
            credentials: 'include'
        })
            .then(response => {
                if(response.status === 200) return response.json()
                else throw new Error("Account not found")
            })
            .then(data => setUserRole(data.user.role || 'Guest'))
            .catch(error => setUserRole('Guest'))
    }, [])

    const handleAddBook = () => {
        navigate('/add_book')
    }

    const handleHome = () => {
        navigate('/')
    }

    const handleLoan = async (bookId) => {
        const expectedReturnDate = prompt("Entrez la date de retour prévue (YYYY-MM-DD, max 30 jours) :")
        if (!expectedReturnDate) return

        setLoanStatus(prev => ({ ...prev, [bookId]: "En cours..." }))
        try {
            const res = await fetch(base + 'api/loans', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id_book: bookId, expected_return_date: expectedReturnDate })
            })
            const data = await res.json()
            if (res.status === 201) {
                setLoanStatus(prev => ({ ...prev, [bookId]: "Emprunté avec succès !" }))
                setBooks(books => books.map(b => b.id === bookId ? { ...b, statut: 'emprunté' } : b))
            } else {
                setLoanStatus(prev => ({ ...prev, [bookId]: data.message || "Erreur lors de l'emprunt." }))
            }
        } catch (err) {
            setLoanStatus(prev => ({ ...prev, [bookId]: "Erreur réseau." }))
        }
    }

    return (
        <div className="container">
            <h2>Liste des Livres - Librairie XYZ</h2>
            {books.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Titre</th>
                            <th>Auteur</th>
                            <th>Date de publication</th>
                            <th>Statut</th>
                            <th>Détails</th>
                            <th>Emprunter</th>
                        </tr>
                    </thead>
                    <tbody>
                        {books.map(book => (
                            <tr key={book.id}>
                                <td><img className="book-image" src={book.photo_url} alt={book.titre} /></td>
                                <td>{book.titre}</td>
                                <td>{book.auteur}</td>
                                <td>{book.date_publication}</td>
                                <td>{book.statut}</td>
                                <td><a href={`${base}book/${book.id}`}>Voir les détails</a></td>
                                <td>
                                    {book.statut === 'disponible' && userRole !== 'Guest' ? (
                                        <>
                                            <button onClick={() => handleLoan(book.id)}>Emprunter</button>
                                            {loanStatus[book.id] && <div className="loan-status">{loanStatus[book.id]}</div>}
                                        </>
                                    ) : (
                                        <span style={{color: 'gray'}}>Indisponible</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>Erreur lors de la récupération des livres.</p>
            )}
            {userRole === 'admin' && (
                <button onClick={handleAddBook}>Ajouter un livre</button>
            )}
            <button onClick={handleHome}>Retour à l'accueil</button>
        </div>
    );
};

export default BookList