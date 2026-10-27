import React, { useState } from 'react';
import { ContratConfig, SemaineType } from '../types';
import { SyntheseContrat } from '../utils/calculs';
import { JOURS_SEMAINE_COURTS } from '../data/baremes';
import {
  AlertTriangle,
  Plus,
  Trash2,
  User,
  Calendar,
  Euro,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Props {
  config: ContratConfig;
  onChange: (newConfig: ContratConfig) => void;
  synthese: SyntheseContrat;
}

export const ContratForm: React.FC<Props> = ({ config, onChange, synthese }) => {
  const [showIdentite, setShowIdentite] = useState(false);
  const conv = synthese.bareme.tauxConversionBrutNet;

  const updateField = <K extends keyof ContratConfig>(
    key: K,
    value: ContratConfig[K]
  ) => {
    onChange({ ...config, [key]: value });
  };

  const handleTauxNetChange = (netVal: number) => {
    const brut = conv > 0 ? Number((netVal / conv).toFixed(4)) : 0;
    updateField('tauxHoraireBrut', brut);
  };

  const updateSemaine = (idx: number, partial: Partial<SemaineType>) => {
    const next = config.semainesTypes.map((s, i) =>
      i === idx ? { ...s, ...partial } : s
    );
    updateField('semainesTypes', next);
  };

  const updateJourPlanning = (semIdx: number, jourIdx: number, heures: number) => {
    const sem = config.semainesTypes[semIdx];
    const nextHeures = [...sem.heuresParJour] as SemaineType['heuresParJour'];
    nextHeures[jourIdx] = Math.max(0, heures);
    updateSemaine(semIdx, { heuresParJour: nextHeures });
  };

  const addRythmeSemaine = () => {
    const inactiveIdx = config.semainesTypes.findIndex((s) => !s.active);
    if (inactiveIdx !== -1) {
      updateSemaine(inactiveIdx, {
        active: true,
        nbSemainesAn: 10,
        heuresParJour: [10, 10, 5, 10, 10, 0, 0],
      });
    }
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Alertes si besoin */}
      {synthese.alerteTauxMiniLegal && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-300 bg-red-50 p-3.5 text-xs text-red-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <strong>Taux horaire sous le minimum légal :</strong> minimum{' '}
            {(synthese.bareme.txHoraireBrutMini * conv).toFixed(2)} € net/h (
            {synthese.bareme.txHoraireBrutMini.toFixed(2)} € brut/h).
          </div>
        </div>
      )}

      {/* Carte Synthèse Mensualisation */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 p-4 text-white shadow-md">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-indigo-200">Mensualisation nette (hors IE/repas)</span>
          <span className="text-2xl font-extrabold text-emerald-300">
            {synthese.mensualisationNetteEstimee.toFixed(2)} € <span className="text-xs font-normal">/mois</span>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-center text-xs">
          <div>
            <span className="block text-[10px] text-indigo-200">Heures / mois</span>
            <strong>{synthese.heuresMensualiseesTotal.toFixed(1)} h</strong>
          </div>
          <div>
            <span className="block text-[10px] text-indigo-200">Jours / mois</span>
            <strong>{synthese.joursMensualisesArrondi} j</strong>
          </div>
          <div>
            <span className="block text-[10px] text-indigo-200">Moyenne / sem.</span>
            <strong>{synthese.heuresMoyenneParSemaine.toFixed(1)} h</strong>
          </div>
        </div>
      </div>

      {/* 1. Tarifs horaires & Indemnités */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="mb-3 flex items-center gap-2 text-slate-800">
          <Euro className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold">1. Tarifs & Indemnités</h3>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-indigo-50/70 p-3">
            <div>
              <label className="block text-[11px] font-bold text-indigo-950">
                Taux Horaire NET (€/h)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={Number((config.tauxHoraireBrut * conv).toFixed(2))}
                onChange={(e) => handleTauxNetChange(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-indigo-300 bg-white px-3 py-2 text-base font-extrabold text-indigo-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">
                Taux Horaire BRUT (€/h)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={Number(config.tauxHoraireBrut.toFixed(4))}
                onChange={(e) => updateField('tauxHoraireBrut', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-bold text-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">
                Entretien (€/h)
              </label>
              <input
                type="number"
                step="0.005"
                min={synthese.bareme.ieMinConvHeure}
                value={config.ieHoraireContractuelle}
                onChange={(e) =>
                  updateField('ieHoraireContractuelle', Number(e.target.value))
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600">
                IE min. / jour (€)
              </label>
              <input
                type="number"
                step="0.05"
                min={synthese.bareme.ieMinConvJour}
                value={config.ieJournaliereContractuelle}
                onChange={(e) =>
                  updateField('ieJournaliereContractuelle', Number(e.target.value))
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">
                Repas 1 ({config.repas1Label || 'Déjeuner'}) €
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={config.repas1Tarif}
                onChange={(e) => updateField('repas1Tarif', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600">
                Repas 2 ({config.repas2Label || 'Goûter'}) €
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={config.repas2Tarif}
                onChange={(e) => updateField('repas2Tarif', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600">
                Repas 3 ({config.repas3Label || 'Repas 3'}) €
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={config.repas3Tarif}
                onChange={(e) => updateField('repas3Tarif', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Type de contrat & Planning de la semaine */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="mb-3 flex items-center gap-2 text-slate-800">
          <Calendar className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold">2. Rythme d’accueil & Horaires</h3>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">
                Type de contrat
              </label>
              <select
                value={config.typeContrat}
                onChange={(e) => {
                  const newType = e.target.value as ContratConfig['typeContrat'];
                  const nextSem = [...config.semainesTypes];
                  if (newType === 'AC' && nextSem.filter((s) => s.active).length === 1) {
                    nextSem[0] = { ...nextSem[0], nbSemainesAn: 52 };
                  } else if (newType === 'AI' && nextSem[0].nbSemainesAn > 46) {
                    nextSem[0] = { ...nextSem[0], nbSemainesAn: 44 };
                  }
                  onChange({ ...config, typeContrat: newType, semainesTypes: nextSem });
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-900"
              >
                <option value="AC">Année Complète (52 semaines / an)</option>
                <option value="AI">Année Incomplète (46 semaines ou moins / an)</option>
                <option value="Reel">Contrat au Réel (occasionnel)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600">
                Région
              </label>
              <select
                value={config.region}
                onChange={(e) =>
                  updateField('region', e.target.value as ContratConfig['region'])
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-900"
              >
                <option value="Autres">France entière hors Alsace-Moselle</option>
                <option value="Alsace-Moselle">Alsace-Moselle</option>
              </select>
            </div>
          </div>

          {config.typeContrat !== 'Reel' && (
            <div className="space-y-3 pt-1">
              {config.semainesTypes.map((sem, sIdx) => {
                if (!sem.active) return null;
                const totalH = sem.heuresParJour.reduce((a, b) => a + b, 0);

                return (
                  <div
                    key={sem.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2.5">
                      <span className="text-xs font-bold text-slate-800">
                        Semaine {sem.id} ({totalH}h/sem)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">Semaines/an :</span>
                        <input
                          type="number"
                          min="1"
                          max="52"
                          value={sem.nbSemainesAn}
                          onChange={(e) =>
                            updateSemaine(sIdx, { nbSemainesAn: Number(e.target.value) })
                          }
                          className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center text-xs font-bold"
                        />
                        {sIdx > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              updateSemaine(sIdx, { active: false, nbSemainesAn: 0 })
                            }
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Grille d'heures Lun-Ven + Sam-Dim */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {JOURS_SEMAINE_COURTS.map((jourNom, jIdx) => (
                        <div key={jourNom} className="text-center">
                          <label className="block text-[10px] font-bold text-slate-500">
                            {jourNom}
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="24"
                            value={sem.heuresParJour[jIdx]}
                            onChange={(e) =>
                              updateJourPlanning(sIdx, jIdx, Number(e.target.value))
                            }
                            className={`mt-1 w-full rounded-lg border py-1.5 text-center text-xs font-bold ${
                              sem.heuresParJour[jIdx] > 0
                                ? 'border-indigo-300 bg-white text-indigo-900'
                                : 'border-slate-200 bg-slate-100 text-slate-400'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {config.semainesTypes.some((s) => !s.active) && (
                <button
                  type="button"
                  onClick={addRythmeSemaine}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600"
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter un 2e rythme de semaine (Semaine B...)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Accordéon : Coordonnées (Enfant, Employeur, Assistante Maternelle) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <button
          type="button"
          onClick={() => setShowIdentite(!showIdentite)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left"
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-600" />
            <div>
              <span className="block text-xs font-bold text-slate-800">
                3. Noms & Coordonnées (pour l’impression du bulletin)
              </span>
              <span className="text-[11px] text-slate-500">
                Enfant : {config.nomEnfant} • AM : {config.salariePrenom} {config.salarieNom}
              </span>
            </div>
          </div>
          {showIdentite ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {showIdentite && (
          <div className="space-y-4 border-t border-slate-100 bg-slate-50/50 p-4 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="font-semibold text-slate-600">Prénom de l’enfant</label>
                <input
                  type="text"
                  value={config.nomEnfant}
                  onChange={(e) => updateField('nomEnfant', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600">Tarif KM (€/km)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.tarifKm}
                  onChange={(e) => updateField('tarifKm', Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                <div className="font-bold text-slate-800">Employeur (Parent)</div>
                <input
                  type="text"
                  placeholder="Prénom"
                  value={config.employeurPrenom}
                  onChange={(e) => updateField('employeurPrenom', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5"
                />
                <input
                  type="text"
                  placeholder="Nom"
                  value={config.employeurNom}
                  onChange={(e) => updateField('employeurNom', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5"
                />
                <input
                  type="text"
                  placeholder="Adresse"
                  value={config.employeurAdresse}
                  onChange={(e) => updateField('employeurAdresse', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5"
                />
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                <div className="font-bold text-slate-800">Assistante Maternelle</div>
                <input
                  type="text"
                  placeholder="Prénom"
                  value={config.salariePrenom}
                  onChange={(e) => updateField('salariePrenom', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5"
                />
                <input
                  type="text"
                  placeholder="Nom"
                  value={config.salarieNom}
                  onChange={(e) => updateField('salarieNom', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5"
                />
                <input
                  type="text"
                  placeholder="Adresse"
                  value={config.salarieAdresse}
                  onChange={(e) => updateField('salarieAdresse', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
