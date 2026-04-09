export default function FinancePage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Finance</h1>
        <p className="mt-1 text-corporate-400">
          Tresorerie, P&L et transactions du groupe
        </p>
      </div>

      {/* Treasury Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-corporate-100">
          Tresorerie consolidee
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="card">
            <div className="card-subtitle">Total consolide</div>
            <div className="mt-2 card-value text-green-400">--</div>
            <div className="mt-1 text-xs text-corporate-500">
              Derniere synchronisation: --
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-900/50 text-xs font-bold text-purple-400">
                Q
              </div>
              <div className="card-subtitle">Qonto</div>
            </div>
            <div className="mt-2 card-value">--</div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-900/50 text-xs font-bold text-blue-400">
                R
              </div>
              <div className="card-subtitle">Revolut</div>
            </div>
            <div className="mt-2 card-value">--</div>
          </div>
        </div>
      </div>

      {/* P&L Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-corporate-100">
          Compte de resultat par filiale
        </h2>
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Filiale</th>
                  <th className="table-header text-right">Chiffre d&apos;affaires</th>
                  <th className="table-header text-right">Charges</th>
                  <th className="table-header text-right">Resultat</th>
                  <th className="table-header text-right">Marge %</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-cell" colSpan={5}>
                    <div className="flex items-center justify-center py-8 text-corporate-500">
                      Les donnees s&apos;afficheront une fois la base de donnees connectee
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cash Flow Forecast */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-corporate-100">
          Prevision de tresorerie (6 mois)
        </h2>
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Mois</th>
                  <th className="table-header text-right">Entrees</th>
                  <th className="table-header text-right">Sorties</th>
                  <th className="table-header text-right">Flux net</th>
                  <th className="table-header text-right">Solde cumule</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-cell" colSpan={5}>
                    <div className="flex items-center justify-center py-8 text-corporate-500">
                      Projection automatique basee sur l&apos;historique des transactions
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-corporate-100">
          Dernieres transactions
        </h2>
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Description</th>
                  <th className="table-header">Contrepartie</th>
                  <th className="table-header">Categorie</th>
                  <th className="table-header text-right">Montant</th>
                  <th className="table-header">Banque</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-cell" colSpan={6}>
                    <div className="flex items-center justify-center py-8 text-corporate-500">
                      Aucune transaction a afficher
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
