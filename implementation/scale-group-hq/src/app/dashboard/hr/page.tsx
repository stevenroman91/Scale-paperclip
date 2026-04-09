export default function HRPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Ressources Humaines</h1>
        <p className="mt-1 text-corporate-400">
          Effectifs, turnover et analytiques RH du groupe
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-subtitle">Effectif total</div>
          <div className="mt-2 card-value">--</div>
          <div className="mt-1 text-xs text-corporate-500">Collaborateurs actifs</div>
        </div>

        <div className="card">
          <div className="card-subtitle">Taux de turnover</div>
          <div className="mt-2 card-value">--</div>
          <div className="mt-1 text-xs text-corporate-500">Annuel glissant</div>
        </div>

        <div className="card">
          <div className="card-subtitle">Cout moyen / embauche</div>
          <div className="mt-2 card-value">--</div>
          <div className="mt-1 text-xs text-corporate-500">Estimation 15% salaire annuel</div>
        </div>

        <div className="card">
          <div className="card-subtitle">Delai moyen embauche</div>
          <div className="mt-2 card-value">-- j</div>
          <div className="mt-1 text-xs text-corporate-500">Sourcing a signature</div>
        </div>
      </div>

      {/* Headcount by Subsidiary */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-corporate-100">
          Effectifs par filiale
        </h2>
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Filiale</th>
                  <th className="table-header text-right">CDI</th>
                  <th className="table-header text-right">CDD</th>
                  <th className="table-header text-right">Freelance</th>
                  <th className="table-header text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-cell" colSpan={5}>
                    <div className="flex items-center justify-center py-8 text-corporate-500">
                      Donnees disponibles apres connexion a la base
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-corporate-100">
          Repartition par departement
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {["Tech", "Produit", "Commercial", "Marketing", "Finance", "RH"].map(
            (dept) => (
              <div key={dept} className="card text-center">
                <div className="text-2xl font-bold text-white">--</div>
                <div className="mt-1 text-xs text-corporate-500">{dept}</div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Turnover Analysis */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-corporate-100">
          Analyse du turnover
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="card">
            <div className="card-subtitle">Departs</div>
            <div className="mt-2 card-value text-red-400">--</div>
            <div className="mt-1 text-xs text-corporate-500">Depuis le 1er janvier</div>
          </div>
          <div className="card">
            <div className="card-subtitle">Embauches</div>
            <div className="mt-2 card-value text-green-400">--</div>
            <div className="mt-1 text-xs text-corporate-500">Depuis le 1er janvier</div>
          </div>
          <div className="card">
            <div className="card-subtitle">Solde net</div>
            <div className="mt-2 card-value">--</div>
            <div className="mt-1 text-xs text-corporate-500">Variation effectif</div>
          </div>
        </div>
      </div>

      {/* Recruitment Funnel Summary */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-corporate-100">
          Entonnoir de recrutement
        </h2>
        <div className="card">
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Sourcing", color: "bg-blue-900/50 text-blue-400" },
              { label: "Screening", color: "bg-indigo-900/50 text-indigo-400" },
              { label: "Entretien", color: "bg-purple-900/50 text-purple-400" },
              { label: "Offre", color: "bg-yellow-900/50 text-yellow-400" },
              { label: "Embauche", color: "bg-green-900/50 text-green-400" },
              { label: "Rejete", color: "bg-red-900/50 text-red-400" },
            ].map((stage) => (
              <div
                key={stage.label}
                className={`flex items-center gap-2 rounded-lg px-4 py-3 ${stage.color}`}
              >
                <span className="text-2xl font-bold">--</span>
                <span className="text-sm">{stage.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
