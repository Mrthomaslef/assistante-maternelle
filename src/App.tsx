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
  PlusCircle,
  Trash2,
} from 'lucide-react';

const STORAGE_KEY = 'assmat_calculateur_state_v1';

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
      heuresParJour: [9, 9, 9, 9, 9, 0, 0], // 45h sur 5 jours
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
  tauxHoraireBrut: 5.7604, // ~4.50 € net/h
  ieHoraireContractuelle: 0.435,
  ieJournaliereContractuelle: 3.92,
  repas1Label: 'Déjeuner',
  repas1Tarif: 3.5,
  repas2Label: 'Goûter',
  repas2Tarif: 1.5,
  repas3Label: 'Dîner / Matin',
  repas3Tarif: 0,
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

type ActiveTab = 'contrat' | 'presence' | 'bulletin' | 'recap';

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
      // ignore storage quota errors
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
    a.download = `assistante-maternelle-${config.nomEnfant || 'contrat'}.json`;
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header principal */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Baby className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                Calculateur Assistante Maternelle
              </h1>
              <p className="text-xs text-slate-500">
                Contrat, Feuille de présence, Bulletin de salaire & Pajemploi (Barème 11/07/2026)
              </p>
            </div>
          </div>

          {/* Sélecteur de mois & outils */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1">
              <select
                value={currentFeuille.id}
                onChange={(e) => setSelectedFeuilleId(e.target.value)}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:outline-hidden"
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
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                title="Ajouter un nouveau mois"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Mois
              </button>

              {feuilles.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeleteCurrentMonth}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title="Supprimer ce mois"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setNoticeOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <BookOpen className="h-3.5 w-3.5" /> Notice officielle
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              title="Sauvegarder mes données (JSON)"
            >
              <Download className="h-3.5 w-3.5" />
            </button>

            <label
              className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              title="Importer une sauvegarde (JSON)"
            >
              <Upload className="h-3.5 w-3.5" />
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Barre d'ajout de mois rapide */}
        {showAddMonth && (
          <div className="border-t border-indigo-100 bg-indigo-50/80 px-4 py-2.5">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-3 text-xs">
              <span className="font-semibold text-indigo-950">
                Créer la feuille d’un nouveau mois :
              </span>
              <select
                value={newMonthMois}
                onChange={(e) => setNewMonthMois(Number(e.target.value))}
                className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 font-medium"
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
                className="w-20 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 font-medium"
              />
              <button
                type="button"
                onClick={handleAddMonth}
                className="rounded-lg bg-indigo-600 px-3 py-1 font-semibold text-white hover:bg-indigo-700"
              >
                Créer et ouvrir
              </button>
              <button
                type="button"
                onClick={() => setShowAddMonth(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Navigation par onglets */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav className="-mb-px flex space-x-2 overflow-x-auto">
            {[
              {
                id: 'contrat' as ActiveTab,
                label: '1. Contrat & Mensualisation',
                icon: CalendarDays,
              },
              {
                id: 'presence' as ActiveTab,
                label: `2. Feuille de Présence (${MOIS_NOMS[currentFeuille.mois - 1]})`,
                icon: FileSpreadsheet,
              },
              {
                id: 'bulletin' as ActiveTab,
                label: `3. Bulletin & Pajemploi (${resultatMensuel.netAPayer.toFixed(2)} €)`,
                icon: Receipt,
              },
              {
                id: 'recap' as ActiveTab,
                label: `4. Récapitulatif, Régul AI & Impôts (${feuilles.length} mois)`,
                icon: BarChart3,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition-colors sm:text-sm ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
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

      {/* Contenu principal */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === 'contrat' && (
          <ContratForm
            config={config}
            onChange={setConfig}
            synthese={syntheseContrat}
          />
        )}

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

      {/* Modal Notice officielle */}
      <NoticeModal open={noticeOpen} onClose={() => setNoticeOpen(false)} />
    </div>
  );
}
