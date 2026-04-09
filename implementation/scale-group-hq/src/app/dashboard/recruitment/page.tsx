export default function RecruitmentPage() {
  const stages = [
    {
      id: "SOURCING",
      label: "Sourcing",
      color: "border-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "SCREENING",
      label: "Screening",
      color: "border-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      id: "INTERVIEW",
      label: "Entretien",
      color: "border-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      id: "OFFER",
      label: "Offre",
      color: "border-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      id: "HIRED",
      label: "Embauche",
      color: "border-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      id: "REJECTED",
      label: "Rejete",
      color: "border-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Recrutement</h1>
          <p className="mt-1 text-corporate-400">
            Pipeline de recrutement et suivi des candidatures
          </p>
        </div>
        <button className="btn-primary">Ajouter un candidat</button>
      </div>

      {/* Pipeline Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stages.map((stage) => (
          <div key={stage.id} className={`card border-t-2 ${stage.color}`}>
            <div className="text-2xl font-bold text-white">--</div>
            <div className="mt-1 text-xs text-corporate-500">{stage.label}</div>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-corporate-100">
          Vue Kanban
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="min-w-[280px] flex-shrink-0 rounded-xl border border-navy-700 bg-navy-900/50"
            >
              {/* Column Header */}
              <div
                className={`flex items-center justify-between border-b border-navy-700 p-4 ${stage.bgColor}`}
              >
                <h3 className="text-sm font-semibold text-corporate-200">
                  {stage.label}
                </h3>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-700 text-xs font-medium text-corporate-400">
                  0
                </span>
              </div>

              {/* Column Body */}
              <div className="space-y-3 p-3">
                <div className="flex items-center justify-center rounded-lg border border-dashed border-navy-700 p-6 text-sm text-corporate-600">
                  Aucun candidat
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-corporate-100">
          Activite recente
        </h2>
        <div className="card">
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8 text-corporate-500">
              Aucune activite de recrutement a afficher.
              Ajoutez des candidats pour commencer le suivi.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
