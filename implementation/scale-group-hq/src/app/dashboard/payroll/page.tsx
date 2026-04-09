export default function PayrollPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Paie</h1>
          <p className="mt-1 text-corporate-400">
            Bulletins de paie, DSN et simulation charges sociales
          </p>
        </div>
        <button className="btn-primary">Generer la paie du mois</button>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-subtitle">Brut total</div>
          <div className="mt-2 card-value">--</div>
          <div className="mt-1 text-xs text-corporate-500">Mois en cours</div>
        </div>
        <div className="card">
          <div className="card-subtitle">Net total</div>
          <div className="mt-2 card-value">--</div>
          <div className="mt-1 text-xs text-corporate-500">A verser</div>
        </div>
        <div className="card">
          <div className="card-subtitle">Charges patronales</div>
          <div className="mt-2 card-value text-yellow-400">--</div>
          <div className="mt-1 text-xs text-corporate-500">URSSAF + retraite</div>
        </div>
        <div className="card">
          <div className="card-subtitle">Cout total employeur</div>
          <div className="mt-2 card-value text-red-400">--</div>
          <div className="mt-1 text-xs text-corporate-500">Brut + charges patronales</div>
        </div>
      </div>

      {/* Payroll Runs History */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-corporate-100">
          Historique des paies
        </h2>
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Periode</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header text-right">Brut total</th>
                  <th className="table-header text-right">Net total</th>
                  <th className="table-header text-right">Charges totales</th>
                  <th className="table-header text-right">Bulletins</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-cell" colSpan={7}>
                    <div className="flex items-center justify-center py-8 text-corporate-500">
                      Aucune paie generee. Cliquez sur &quot;Generer la paie du mois&quot; pour commencer.
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Salary Simulator */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-corporate-100">
          Simulateur brut / net
        </h2>
        <div className="card">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm text-corporate-400">
                Salaire brut mensuel
              </label>
              <input
                type="number"
                placeholder="3500"
                className="input"
                disabled
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-corporate-400">
                Type de contrat
              </label>
              <select className="select" disabled>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="FREELANCE">Freelance</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="btn-primary w-full" disabled>
                Simuler
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-navy-800 p-4">
              <div className="text-xs text-corporate-500">Brut</div>
              <div className="mt-1 text-lg font-semibold text-white">--</div>
            </div>
            <div className="rounded-lg bg-navy-800 p-4">
              <div className="text-xs text-corporate-500">Charges salariales</div>
              <div className="mt-1 text-lg font-semibold text-yellow-400">--</div>
            </div>
            <div className="rounded-lg bg-navy-800 p-4">
              <div className="text-xs text-corporate-500">Net a payer</div>
              <div className="mt-1 text-lg font-semibold text-green-400">--</div>
            </div>
            <div className="rounded-lg bg-navy-800 p-4">
              <div className="text-xs text-corporate-500">Charges patronales</div>
              <div className="mt-1 text-lg font-semibold text-red-400">--</div>
            </div>
          </div>
        </div>
      </div>

      {/* DSN Status */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-corporate-100">
          Statut DSN
        </h2>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="badge-info">DSN mensuelle</div>
            <span className="text-sm text-corporate-300">
              La Declaration Sociale Nominative est generee automatiquement apres validation de la paie.
            </span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Periode</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Date envoi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-cell" colSpan={4}>
                    <div className="flex items-center justify-center py-4 text-corporate-500">
                      Aucune DSN a afficher
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
