import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-4xl text-center">
        <h1 className="mb-2 text-5xl font-bold text-white">
          Scale Group HQ
        </h1>
        <p className="mb-8 text-xl text-corporate-300">
          Plateforme de pilotage du groupe Scale — Finance, RH, Marketing
        </p>

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="card text-center">
            <div className="card-title mb-2">Filiales</div>
            <div className="card-value">3</div>
            <div className="card-subtitle">Entites actives</div>
          </div>

          <div className="card text-center">
            <div className="card-title mb-2">Tresorerie</div>
            <div className="card-value text-green-400">--</div>
            <div className="card-subtitle">Consolidee multi-banques</div>
          </div>

          <div className="card text-center">
            <div className="card-title mb-2">Effectifs</div>
            <div className="card-value">--</div>
            <div className="card-subtitle">Collaborateurs groupe</div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-corporate-100">
            P&L par filiale
          </h2>
          <div className="overflow-hidden rounded-xl border border-navy-700">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Filiale</th>
                  <th className="table-header text-right">CA mensuel</th>
                  <th className="table-header text-right">Charges</th>
                  <th className="table-header text-right">Marge</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-cell" colSpan={4}>
                    <span className="text-corporate-400">
                      Connectez la base de donnees pour voir les donnees en temps reel
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-corporate-100">
            Prochaine paie
          </h2>
          <div className="card">
            <p className="text-corporate-300">
              Le prochain bulletin de paie sera genere automatiquement en fin de mois.
              Acces complet via le tableau de bord.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-base"
        >
          Acceder au tableau de bord
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>
    </main>
  );
}
