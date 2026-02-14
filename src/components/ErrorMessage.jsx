export default function ErrorMessage({ message }) {
  return (
    <div style={{
      maxWidth: 1100, margin: "20px auto", padding: "16px 24px",
      background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#dc2626", marginBottom: 4 }}>
        Impossible de charger les donn&eacute;es
      </div>
      <div style={{ fontSize: 11, color: "#78716c" }}>
        {message || "V\u00E9rifiez votre connexion et rechargez la page."}
      </div>
    </div>
  );
}
