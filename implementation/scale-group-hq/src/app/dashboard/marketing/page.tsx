export default function MarketingPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Marketing</h1>
          <p className="mt-1 text-corporate-400">
            Calendrier editorial et analytiques LinkedIn
          </p>
        </div>
        <button className="btn-primary">Nouveau contenu</button>
      </div>

      {/* LinkedIn Analytics */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-subtitle">Publications</div>
          <div className="mt-2 card-value">--</div>
          <div className="mt-1 text-xs text-corporate-500">Total publiees</div>
        </div>
        <div className="card">
          <div className="card-subtitle">Impressions</div>
          <div className="mt-2 card-value">--</div>
          <div className="mt-1 text-xs text-corporate-500">Vues totales</div>
        </div>
        <div className="card">
          <div className="card-subtitle">Engagement</div>
          <div className="mt-2 card-value">--</div>
          <div className="mt-1 text-xs text-corporate-500">
            Likes + commentaires + partages
          </div>
        </div>
        <div className="card">
          <div className="card-subtitle">Taux d&apos;engagement</div>
          <div className="mt-2 card-value">--%</div>
          <div className="mt-1 text-xs text-corporate-500">
            Engagement / impressions
          </div>
        </div>
      </div>

      {/* Content Calendar */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-corporate-100">
          Calendrier editorial
        </h2>
        <div className="card">
          {/* Status Tabs */}
          <div className="mb-6 flex gap-2">
            {[
              { label: "Tous", count: "--" },
              { label: "Brouillons", count: "--" },
              { label: "Planifies", count: "--" },
              { label: "Publies", count: "--" },
            ].map((tab, i) => (
              <button
                key={tab.label}
                className={`rounded-lg px-4 py-2 text-sm ${
                  i === 0
                    ? "bg-accent-600 text-white"
                    : "bg-navy-800 text-corporate-400 hover:text-corporate-200"
                }`}
              >
                {tab.label}{" "}
                <span className="ml-1 rounded-full bg-navy-700 px-2 py-0.5 text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Content Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Titre</th>
                  <th className="table-header">Plateforme</th>
                  <th className="table-header">Date planifiee</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header text-right">Impressions</th>
                  <th className="table-header text-right">Engagement</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-cell" colSpan={7}>
                    <div className="flex items-center justify-center py-8 text-corporate-500">
                      Aucun contenu dans le calendrier.
                      Cliquez sur &quot;Nouveau contenu&quot; pour commencer.
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Content Performance */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-corporate-100">
          Performance des publications
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="card">
            <h3 className="card-title mb-4">Top publications</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-center py-6 text-corporate-500">
                Pas encore de donnees de performance
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title mb-4">Meilleurs horaires</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-center py-6 text-corporate-500">
                Publiez du contenu pour voir les analytiques
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Post Creator */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-corporate-100">
          Creation rapide
        </h2>
        <div className="card">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-corporate-400">
                Titre
              </label>
              <input
                type="text"
                placeholder="Titre de la publication..."
                className="input"
                disabled
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-corporate-400">
                Contenu
              </label>
              <textarea
                placeholder="Redigez votre publication LinkedIn..."
                rows={4}
                className="input resize-none"
                disabled
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm text-corporate-400">
                  Plateforme
                </label>
                <select className="select" disabled>
                  <option>LinkedIn</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-corporate-400">
                  Date de publication
                </label>
                <input type="datetime-local" className="input" disabled />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" disabled>
                Sauvegarder brouillon
              </button>
              <button className="btn-primary" disabled>
                Planifier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
