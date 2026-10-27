import React, { useState, useEffect, useMemo } from 'react';
import { ContratConfig, FeuilleMensuelle } from './types';
import {
  calculerResultatMensuel,
  calculerSyntheseContrat,
  genererJoursMois,
} from './utils/calculs';
import { MOIS_NOMS } from './data/baremes';
import { ContratForm } from './components/ContratForm';
import { FeuillePresence } from './components/FeuillePresence';
import { BulletinSalaire } from './components/BulletinSalaire';
import { RecapAnnuel } from './components/RecapAnnuel';
import { NoticeModal } from './components/NoticeModal';
import {
  Baby,
  CalendarDays,
  FileSpreadsheet,
  Receipt,
  BarChart3,
  BookOpen,
  Download,
  Upload,
  Plus,
  Trash2,
} from 'lucide-react';

const STORAGE_KEY = 'assmat_calculateur_state_v3';

const DEFAULT_CONTRAT: ContratConfig = {
  nomEnfant: 'Léo',
  dateDebutContrat: '2026-09-01',
  region: 'Autres',
  typeContrat: 'AC',
  employeurNom: 'Dupont',
  employeurPrenom: 'Thomas',
  employeurAdresse: '12 rue des Lilas, 75000 Paris',
  employeurNumPajemploi: '',
  salarieNom: 'Martin',
  salariePrenom: 'Sophie',
  salarieAdresse: '8 avenue Victor Hugo, 75000 Paris',
  salarieNumSS: '',
  majorationHSMensualisee: false,
  tauxMajorationHS: 0.1,
  tauxMajorationHC: 0,
  semainesTypes: [
    {
      id: 'A',
      label: 'Semaine A',
      active: true,
      nbSemainesAn: 52,
      heuresParJour: [10, 10, 5, 10, 10, 0, 0],
    },
    {
      id: 'B',
      label: 'Semaine B',
      active: false,
      nbSemainesAn: 0,
      heuresParJour: [0, 0, 0, 0, 0, 0, 0],
    },
    {
      id: 'C',
      label: 'Semaine C',
      active: false,
      nbSemainesAn: 0,
      heuresParJour: [0, 0, 0, 0, 0, 0, 0],
    },
    {
      id: 'D',
      label: 'Semaine D',
      active: false,
      nbSemainesAn: 0,
      heuresParJour: [0, 0, 0, 0, 0, 0, 0],
    },
    {
      id: 'E',
      label: 'Semaine E',
      active: false,
      nbSemainesAn: 0,
      heuresParJour: [0, 0, 0, 0, 0, 0, 0],
    },
    {
      id: 'F',
      label: 'Semaine F',
      active: false,
      nbSemainesAn: 0,
      heuresParJour: [0, 0, 0, 0, 0, 0, 0],
    },
  ],
  tauxHoraireBrut: 5.7604,
  ieHoraireContractuelle: 0.435,
  ieJournaliereContractuelle: 2.65,
  repas1Label: 'Déjeuner',
  repas1Tarif: 3.5,
  repas2Label: 'Goûter',
  repas2Tarif: 1.5,
  repas3Label: 'Repas 3',
  repas3Tarif: 1.5,
  repasFournisParentsValeurJour: 0,
  tarifKm: 0.55,
  tauxImpositionPAS: 0,
  modeReglement: 'Virement / Pajemploi+',
};

function createFeuilleMois(
  annee: number,
  mois: number,
  config: ContratConfig
): FeuilleMensuelle {
  const id = `${annee}-${String(mois).padStart(2, '0')}`;
  return {
    id,
    annee,
    mois,
    label: `${annee}_${MOIS_NOMS[mois - 1]}`,
    jours: genererJoursMois(annee, mois, config),
    variables: {
      heuresMaj1erMai: 0,
      tauxMajJF: 0.1,
      heuresMajJF: 0,
      cpVersementBrut: 0,
      nbJoursCPDeclares: 0,
      regularisationNormaleBrut: 0,
      regularisationMajorationBrut: 0,
      inclurePrimePrecarite: false,
      soldeCPFinContratBrut: 0,
      indemniteRupture: 0,
      cmgTouche: 0,
      commentaireBulletin: '',
      dateEdition: new Date().toISOString().slice(0, 10),
    },
  };
}

type ActiveTab = 'presence' | 'bulletin' | 'contrat' | 'recap';

export default function App() {
  const [config, setConfig] = useState<ContratConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.config) return parsed.config;
      }
    } catch {
      // ignore
    }
    return DEFAULT_CONTRAT;
  });

  const [feuilles, setFeuilles] = useState<FeuilleMensuelle[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.feuilles) && parsed.feuilles.length > 0) {
          return parsed.feuilles;
        }
      }
    } catch {
      // ignore
    }
    return [createFeuilleMois(2026, 10, DEFAULT_CONTRAT)];
  });

  const [selectedFeuilleId, setSelectedFeuilleId] = useState<string>(() => {
    return feuilles[0]?.id || '2026-10';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('presence');
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [newMonthAnnee, setNewMonthAnnee] = useState(2026);
  const [newMonthMois, setNewMonthMois] = useState(11);
  const [showAddMonth, setShowAddMonth] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ config, feuilles }));
    } catch {
      // ignore
    }
  }, [config, feuilles]);

  const currentFeuille = useMemo(() => {
    return (
      feuilles.find((f) => f.id === selectedFeuilleId) ||
      feuilles[0] ||
      createFeuilleMois(2026, 10, config)
    );
  }, [feuilles, selectedFeuilleId, config]);

  const syntheseContrat = useMemo(() => {
    return calculerSyntheseContrat(
      config,
      currentFeuille.annee,
      currentFeuille.mois
    );
  }, [config, currentFeuille.annee, currentFeuille.mois]);

  const resultatMensuel = useMemo(() => {
    return calculerResultatMensuel(config, currentFeuille);
  }, [config, currentFeuille]);

  const handleUpdateCurrentFeuille = (updated: FeuilleMensuelle) => {
    setFeuilles((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f))
    );
  };

  const handleAddMonth = () => {
    const id = `${newMonthAnnee}-${String(newMonthMois).padStart(2, '0')}`;
    const existing = feuilles.find((f) => f.id === id);
    if (existing) {
      setSelectedFeuilleId(existing.id);
      setShowAddMonth(false);
      return;
    }
    const nouvelle = createFeuilleMois(newMonthAnnee, newMonthMois, config);
    setFeuilles((prev) => [...prev, nouvelle]);
    setSelectedFeuilleId(nouvelle.id);
    setShowAddMonth(false);
  };

  const handleDeleteCurrentMonth = () => {
    if (feuilles.length <= 1) return;
    if (!window.confirm('Supprimer ce mois ?')) return;
    const remaining = feuilles.filter((f) => f.id !== currentFeuille.id);
    setFeuilles(remaining);
    setSelectedFeuilleId(remaining[remaining.length - 1].id);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify({ config, feuilles }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assmat-${config.nomEnfant || 'contrat'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result));
        if (parsed.config && Array.isArray(parsed.feuilles)) {
          setConfig(parsed.config);
          setFeuilles(parsed.feuilles);
          if (parsed.feuilles[0]?.id) {
            setSelectedFeuilleId(parsed.feuilles[0].id);
          }
        }
      } catch {
        alert('Fichier JSON invalide.');
      }
    };
    reader.readAsText(file);
  };

  const TABS = [
    { id: 'presence' as ActiveTab, label: 'Présence', icon: FileSpreadsheet },
    { id: 'bulletin' as ActiveTab, label: 'Paie & Pajemploi', icon: Receipt },
    { id: 'contrat' as ActiveTab, label: 'Contrat', icon: CalendarDays },
    { id: 'recap' as ActiveTab, label: 'Bilan', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Barre supérieure compacte et épurée */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3.5 py-2.5">
          {/* Logo & Nom */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Baby className="h-5 w-5" />
            </div>
            <span className="text-sm font-extrabold tracking-tight text-slate-900">
              AssMat
            </span>
          </div>

          {/* Sélecteur de mois central */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
            <select
              value={currentFeuille.id}
              onChange={(e) => setSelectedFeuilleId(e.target.value)}
              className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs focus:outline-hidden"
            >
              {[...feuilles]
                .sort((a, b) =>
                  a.annee !== b.annee ? b.annee - a.annee : b.mois - a.mois
                )
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {MOIS_NOMS[f.mois - 1]} {f.annee}
                  </option>
                ))}
            </select>

            <button
              type="button"
              onClick={() => setShowAddMonth(!showAddMonth)}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white"
              title="Nouveau mois"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>

            {feuilles.length > 1 && (
              <button
                type="button"
                onClick={handleDeleteCurrentMonth}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:text-red-600"
                title="Supprimer ce mois"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Boutons Aide & Sauvegarde */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setNoticeOpen(true)}
              className="rounded-xl bg-indigo-50 p-2 text-indigo-600"
              title="Notice officielle"
            >
              <BookOpen className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              title="Exporter mes données"
            >
              <Download className="h-4 w-4" />
            </button>
            <label
              className="cursor-pointer rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              title="Importer des données"
            >
              <Upload className="h-4 w-4" />
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Création d'un nouveau mois */}
        {showAddMonth && (
          <div className="border-t border-indigo-100 bg-indigo-50 px-4 py-2.5">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-indigo-950">Nouveau mois :</span>
              <div className="flex items-center gap-2">
                <select
                  value={newMonthMois}
                  onChange={(e) => setNewMonthMois(Number(e.target.value))}
                  className="rounded-lg border border-indigo-200 bg-white px-2 py-1 font-medium"
                >
                  {MOIS_NOMS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={newMonthAnnee}
                  onChange={(e) => setNewMonthAnnee(Number(e.target.value))}
                  className="w-16 rounded-lg border border-indigo-200 bg-white px-2 py-1 font-medium"
                />
                <button
                  type="button"
                  onClick={handleAddMonth}
                  className="rounded-lg bg-indigo-600 px-3 py-1 font-bold text-white"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onglets sur grand écran uniquement */}
        <div className="mx-auto hidden max-w-3xl px-4 sm:block">
          <nav className="-mb-px flex space-x-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-bold transition ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Contenu centré au format mobile/tablette confortable (max-w-3xl) */}
      <main className="mx-auto max-w-3xl px-3.5 py-4">
        {activeTab === 'presence' && (
          <FeuillePresence
            config={config}
            feuille={currentFeuille}
            resultat={resultatMensuel}
            onChangeFeuille={handleUpdateCurrentFeuille}
          />
        )}

        {activeTab === 'bulletin' && (
          <BulletinSalaire
            config={config}
            feuille={currentFeuille}
            resultat={resultatMensuel}
            onChangeFeuille={handleUpdateCurrentFeuille}
          />
        )}

        {activeTab === 'contrat' && (
          <ContratForm
            config={config}
            onChange={setConfig}
            synthese={syntheseContrat}
          />
        )}

        {activeTab === 'recap' && (
          <RecapAnnuel
            config={config}
            feuilles={feuilles}
            onSelectFeuille={(id) => {
              setSelectedFeuilleId(id);
              setActiveTab('bulletin');
            }}
          />
        )}
      </main>

      {/* Barre de navigation fixe en bas de l'écran sur téléphone */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 pb-safe backdrop-blur-xs sm:hidden print:hidden">
        <div className="grid grid-cols-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-2.5 text-[11px] font-bold transition ${
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className="mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Notice officielle */}
      <NoticeModal open={noticeOpen} onClose={() => setNoticeOpen(false)} />
    </div>
  );
}
