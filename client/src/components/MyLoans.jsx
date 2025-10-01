import React, { useEffect, useState } from "react";
import axios from "axios";

const MyLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [returnStatus, setReturnStatus] = useState({});

  useEffect(() => {
    axios
      .get("/api/loans", { withCredentials: true })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setLoans(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            "Erreur lors de la récupération des emprunts."
        );
        setLoading(false);
      });
  }, []);

  const handleReturn = async (id_loan) => {
    setReturnStatus((prev) => ({ ...prev, [id_loan]: "Retour en cours..." }));
    try {
      const res = await axios.put(
        `/api/loans/${id_loan}/return`,
        {},
        { withCredentials: true }
      );
      if (res.status === 200) {
        setReturnStatus((prev) => ({
          ...prev,
          [id_loan]: "Livre retourné avec succès !",
        }));
        setLoans((loans) =>
          loans.map((loan) =>
            loan.id_loan === id_loan
              ? { ...loan, actual_return_date: new Date().toISOString().slice(0, 10) }
              : loan
          )
        );
      } else {
        setReturnStatus((prev) => ({
          ...prev,
          [id_loan]: res.data.message || "Erreur lors du retour.",
        }));
      }
    } catch (err) {
      setReturnStatus((prev) => ({ ...prev, [id_loan]: "Erreur réseau." }));
    }
  };

  if (loading) return <div className="myloans-loading">Chargement...</div>;
  if (error) return <div className="myloans-error">{error}</div>;

  return (
    <div className="myloans-container">
      <h2>Mes livres empruntés</h2>
      {(!loans || loans.length === 0) ? (
        <div className="myloans-empty">Aucun livre emprunté.</div>
      ) : (
        <ul className="myloans-list">
          {loans.map((loan) => (
            <li key={loan.id_loan} className="myloans-item">
              <div className="myloans-details">
                <strong>{loan.book_title}</strong> <br />
                <span>Auteur : {loan.book_author}</span> <br />
                <span>Date d'emprunt : {loan.date_loan}</span> <br />
                <span>Date retour prévue : {loan.expected_return_date}</span> <br />
                {loan.actual_return_date ? (
                  <span className="myloans-returned">
                    Retourné le : {loan.actual_return_date}
                  </span>
                ) : (
                  <>
                    <span className="myloans-not-returned">Non retourné</span>
                    <button
                      className="myloans-return-btn"
                      onClick={() => handleReturn(loan.id_loan)}
                      disabled={!!returnStatus[loan.id_loan]}
                    >
                      Retourner
                    </button>
                    {returnStatus[loan.id_loan] && (
                      <div className="myloans-status">
                        {returnStatus[loan.id_loan]}
                      </div>
                    )}
                  </>
                )}
                {loan.late_message && (
                  <span className="myloans-late">{loan.late_message}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyLoans;