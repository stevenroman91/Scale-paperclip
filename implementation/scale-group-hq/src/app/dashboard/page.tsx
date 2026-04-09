import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Tableau de bord</h1>
        <p className="mt-1 text-corporate-400">
          Vue consolidee du groupe Scale
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-subtitle">Tresorerie consolidee</div>
          <div className="mt-2 card-value text-green-400">--</div>
          <div className="mt-1 stat-change-positive">Multi-banques Qonto + Revolut</div>
        </div>

        <div className="card">
          <div className="card-subtitle">Marge nette mensuelle</div>
          <div className="mt-2 card-value">--</div>
          <div className="mt-1 card-subtitle">Toutes filiales confondues</div>
        </div>

        <div className="card">
          <div className="card-subtitle">Effectifs groupe</div>
          <div className="mt-2 card-value">--</div>
          <div className="mt-1 card-subtitle">CDI + CDD + Freelances</div>
        </div>

        <div className="card">
          <div className="card-subtitle">Masse salariale</div>
          <div className="mt-2 card-value">--</div>
          <div className="mt-1 card-subtitle">Cout total employeur</div>
        </div>
      </div>

      {/* P&L by subsidiary */}
      <div className="mb-8">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">P&L par filiale</h2>
            <Link href="/dashboard/finance" className="btn-secondary text-xs">
              Voir le detail
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Filiale</th>
                  <th className="table-header text-right">CA mensuel</th>
                  <th className="table-header text-right">Charges</th>
                  <th className="table-header text-right">Marge</th>
                  <th className="table-header text-right">Taux</th>
                  <th className="table-header text-right">Effectif</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-cell" colSpan={6}>
                    <div className="flex items-center justify-center py-8 text-corporate-500">
                      Connectez la base de donnees pour afficher les donnees
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Treasury Overview */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Tresorerie</h2>
            <Link href="/dashboard/finance" className="btn-secondary text-xs">
              Detail
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-navy-800 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-900/50 text-sm font-bold text-purple-400">
                  Q
                </div>
                <div>
                  <p className="text-sm font-medium text-corporate-200">Qonto</p>
                  <p className="text-xs text-corporate-500">Compte principal</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-white">--</span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-navy-800 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900/50 text-sm font-bold text-blue-400">
                  R
                </div>
                <div>
                  <p className="text-sm font-medium text-corporate-200">Revolut</p>
                  <p className="text-xs text-corporate-500">Compte operations</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-white">--</span>
            </div>
          </div>
        </div>

        {/* Next Payroll */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Prochaine paie</h2>
            <Link href="/dashboard/payroll" className="btn-secondary text-xs">
              Gerer
            </Link>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg bg-navy-800 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-corporate-400">Statut</span>
                <span className="badge-warning">A generer</span>
              </div>
            </div>
            <div className="rounded-lg bg-navy-800 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-corporate-400">Brut total estime</span>
                <span className="text-lg font-semibold text-white">--</span>
              </div>
            </div>
            <div className="rounded-lg bg-navy-800 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-corporate-400">Net total estime</span>
                <span className="text-lg font-semibold text-white">--</span>
              </div>
            </div>
            <div className="rounded-lg bg-navy-800 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-corporate-400">Charges patronales</span>
                <span className="text-lg font-semibold text-white">--</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recruitment + Marketing row */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recruitment Pipeline Summary */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Pipeline recrutement</h2>
            <Link href="/dashboard/recruitment" className="btn-secondary text-xs">
              Voir
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["Sourcing", "Entretien", "Offre"].map((stage) => (
              <div key={stage} className="rounded-lg bg-navy-800 p-3 text-center">
                <div className="text-2xl font-bold text-white">--</div>
                <div className="text-xs text-corporate-500">{stage}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Calendar Summary */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Calendrier editorial</h2>
            <Link href="/dashboard/marketing" className="btn-secondary text-xs">
              Voir
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["Brouillons", "Planifies", "Publies"].map((status) => (
              <div key={status} className="rounded-lg bg-navy-800 p-3 text-center">
                <div className="text-2xl font-bold text-white">--</div>
                <div className="text-xs text-corporate-500">{status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
