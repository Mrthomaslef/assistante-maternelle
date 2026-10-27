import React from 'react';
import { ContratConfig, SemaineType } from '../types';
import { SyntheseContrat } from '../utils/calculs';
import { JOURS_SEMAINE_COURTS } from '../data/baremes';
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  User,
  Baby,
  Calendar,
  Euro,
  Utensils,
  Car,
  Info,
} from 'lucide-react';

interface Props {
  config: ContratConfig;
  onChange: (newConfig: ContratConfig) => void;
  synthese: SyntheseContrat;
}

export const ContratForm: React.FC<Props> = ({ config, onChange, synthese }) => {
  const conv = synthese.bareme.tauxConversionBrutNet;

  const updateField = <K extends keyof ContratConfig>(key: K, value: ContratConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const handleTauxNetChange = (netVal: number) => {
    const brut = conv > 0 ? Number((netVal / conv).toFixed(4)) : 0;
    updateField('tauxHoraireBrut', brut);
  };

  const updateSemaine = (idx: number, partial: Partial<SemaineType>) => {
    const next = config.semainesTypes.map((s, i) => (i === idx ? { ...s, ...partial } : s));
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
        heuresParJour: [8, 8, 8, 8, 8, 0, 0],
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertes réglementaires */}
      {(synthese.alerteTauxMiniLegal || synthese.alertePlafondCAFContrat) && (
        <div className="space-y-2">
          {synthese.alerteTauxMiniLegal && (
            <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="text-sm">
                <p className="font-semibold">
                  Attention : Taux horaire brut inférieur au minimum légal !
                </p>
                <p>
                  Le taux horaire brut saisi ({config.tauxHoraireBrut.toFixed(2)} €) est inférieur
                  au minimum conventionnel/légal en vigueur ({synthese.bareme.txHoraireBrutMini.toFixed(2)} € brut/h, soit{' '}
                  {(synthese.bareme.txHoraireBrutMini * conv).toFixed(2)} € net/h).
                </p>
              </div>
            </div>
          )}
          {synthese.alertePlafondCAFContrat && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-sm">
                <p className="font-semibold">
                  Attention : Dépassement ou risque de dépassement du plafond CAF (CMG)
                </p>
                <p>
                  Le tarif horaire ou journalier approche ou dépasse le plafond de référence CAF (
                  {synthese.bareme.plafondCAF} €). Vérifiez votre éligibilité au Complément de Libre Choix du Mode de Garde.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bandeau Synthèse de la Mensualisation */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-700/60 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-medium text-indigo-100">
              <CheckCircle2 className="h-3.5 w-3.5" /> Barème officiel 11/07/2026 ({config.region})
            </span>
            <h2 className="mt-2 text-xl font-bold">Synthèse de la Mensualisation du Contrat</h2>
          </div>
          <div className="text-right">
            <div className="text-xs text-indigo-200">Mensualisation Nette estimée (hors IE/IR)</div>
            <div className="text-3xl font-extrabold tracking-tight text-emerald-300">
              {synthese.mensualisationNetteEstimee.toFixed(2)} € <span className="text-sm font-normal text-indigo-200">/ mois</span>
            </div>
            <div className="text-xs text-indigo-200">
              Soit {synthese.mensualisationBruteTotale.toFixed(2)} € brut / mois
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-xs">
            <div className="text-xs text-indigo-200">Semaines / an</div>
            <div className="mt-1 text-lg font-bold">
              {config.typeContrat === 'Reel' ? 'Au réel' : `${synthese.nbSemainesTotalAn} sem.`}
            </div>
            <div className="text-xs text-indigo-300">
              {config.typeContrat === 'AC'
                ? 'Année complète (52 sem)'
                : config.typeContrat === 'AI'
                ? 'Année incomplète (≤46 sem)'
                : 'Contrat au réel'}
            </div>
          </div>

          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-xs">
            <div className="text-xs text-indigo-200">Heures mensualisées</div>
            <div className="mt-1 text-lg font-bold">
              {synthese.heuresMensualiseesTotal.toFixed(2)} h / mois
            </div>
            <div className="text-xs text-indigo-300">
              Moy. {synthese.heuresMoyenneParSemaine.toFixed(2)} h / semaine
            </div>
          </div>

          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-xs">
            <div className="text-xs text-indigo-200">Jours mensualisés</div>
            <div className="mt-1 text-lg font-bold">
              {synthese.joursMensualisesExact.toFixed(2)} j / mois
            </div>
            <div className="text-xs text-indigo-300">
              Déclaré Pajemploi : {synthese.joursMensualisesArrondi} j
            </div>
          </div>

          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-xs">
            <div className="text-xs text-indigo-200">Taux horaire Net / Brut</div>
            <div className="mt-1 text-lg font-bold">
              {synthese.tauxHoraireNet.toFixed(2)} € net
            </div>
            <div className="text-xs text-indigo-300">
              {synthese.tauxHoraireBrut.toFixed(4)} € brut (conv. {(conv * 100).toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Section 1 : Type de contrat & Région */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center gap-2 text-slate-800">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold">1. Paramètres généraux du Contrat</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Type d’accueil (Nouvelle terminologie CCN)
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
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden"
              >
                <option value="AC">
                  Accueil 52 semaines / 12 mois (Anciennement Année Complète - AC)
                </option>
                <option value="AI">
                  Accueil 46 semaines ou moins / 12 mois (Anciennement Année Incomplète - AI)
                </option>
                <option value="Reel">Contrat au Réel (Accueil occasionnel)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Région (Cotisations)
                </label>
                <select
                  value={config.region}
                  onChange={(e) =>
                    updateField('region', e.target.value as ContratConfig['region'])
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden"
                >
                  <option value="Autres">Autres régions (Taux conv. 78,12%)</option>
                  <option value="Alsace-Moselle">Alsace-Moselle (Taux conv. 76,82%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Date de début du contrat
                </label>
                <input
                  type="date"
                  value={config.dateDebutContrat}
                  onChange={(e) => updateField('dateDebutContrat', e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Majoration HS (&gt;45h) mensualisée ?
                </label>
                <select
                  value={config.majorationHSMensualisee ? 'Oui' : 'Non'}
                  onChange={(e) =>
                    updateField('majorationHSMensualisee', e.target.value === 'Oui')
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden"
                >
                  <option value="Non">Non (calculées au réel en fin de semaine)</option>
                  <option value="Oui">Oui (intégrées à la mensualisation)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  % Majoration Heures Supp. (min 10%)
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    step="1"
                    min="10"
                    value={Math.round(config.tauxMajorationHS * 100)}
                    onChange={(e) =>
                      updateField(
                        'tauxMajorationHS',
                        Math.max(0.1, Number(e.target.value) / 100)
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 pr-8 text-sm text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden"
                  />
                  <span className=" absolute right-3 top-2 text-sm text-slate-400">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 : Rémunération & Indemnités */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center gap-2 text-slate-800">
            <Euro className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold">2. Taux horaire & Indemnités (IE, IR, IK)</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 rounded-xl bg-indigo-50/70 p-3.5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-indigo-950">
                  Taux horaire NET (€ / h)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={Number((config.tauxHoraireBrut * conv).toFixed(2))}
                  onChange={(e) => handleTauxNetChange(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-base font-bold text-indigo-900 focus:border-indigo-600 focus:outline-hidden"
                />
                <span className="mt-1 block text-[11px] text-indigo-700">
                  Min. légal : {(synthese.bareme.txHoraireBrutMini * conv).toFixed(2)} € net/h
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Taux horaire BRUT (€ / h)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={config.tauxHoraireBrut}
                  onChange={(e) => updateField('tauxHoraireBrut', Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-semibold text-slate-800 focus:border-indigo-600 focus:outline-hidden"
                />
                <span className="mt-1 block text-[11px] text-slate-500">
                  Min. légal : {synthese.bareme.txHoraireBrutMini.toFixed(2)} € brut/h
                </span>
              </div>
            </div>

            {/* Indemnités d'entretien */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  IE horaire contractuelle (€ / heure)
                </label>
                <input
                  type="number"
                  step="0.005"
                  min={synthese.bareme.ieMinConvHeure}
                  value={config.ieHoraireContractuelle}
                  onChange={(e) =>
                    updateField('ieHoraireContractuelle', Number(e.target.value))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                />
                <span className="text-[11px] text-slate-500">
                  Min. conventionnel : {synthese.bareme.ieMinConvHeure} €/h (soit{' '}
                  {(synthese.bareme.ieMinConvHeure * 9).toFixed(2)} € pour 9h)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  IE minimum par jour d’accueil (€ / jour)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min={synthese.bareme.ieMinConvJour}
                  value={config.ieJournaliereContractuelle}
                  onChange={(e) =>
                    updateField('ieJournaliereContractuelle', Number(e.target.value))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                />
                <span className="text-[11px] text-slate-500">
                  Min. conventionnel : {synthese.bareme.ieMinConvJour.toFixed(2)} €/jour
                </span>
              </div>
            </div>

            {/* Repas & KM */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  {config.repas1Label || 'Déjeuner'} (€)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={config.repas1Tarif}
                  onChange={(e) => updateField('repas1Tarif', Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  {config.repas2Label || 'Goûter'} (€)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={config.repas2Tarif}
                  onChange={(e) => updateField('repas2Tarif', Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  {config.repas3Label || 'Autre repas'} (€)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={config.repas3Tarif}
                  onChange={(e) => updateField('repas3Tarif', Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  Indemnité KM (€/km)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={config.tarifKm}
                  onChange={(e) => updateField('tarifKm', Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 : Planning et Rythmes Hebdomadaires (Semaines A à F) */}
      {config.typeContrat !== 'Reel' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                3. Planning hebdomadaire du contrat (Semaines A, B, C, D, E, F)
              </h3>
              <p className="text-xs text-slate-500">
                Renseignez vos semaines-types. La Semaine A sert également à pré-remplir
                automatiquement vos feuilles de présence mensuelles.
              </p>
            </div>
            {config.semainesTypes.some((s) => !s.active) && (
              <button
                type="button"
                onClick={addRythmeSemaine}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                <Plus className="h-4 w-4" /> Ajouter un rythme de semaine (B, C...)
              </button>
            )}
          </div>

          {config.typeContrat === 'AC' && synthese.nbSemainesTotalAn !== 52 && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900">
              <Info className="h-4 w-4 shrink-0 text-amber-600" />
              En contrat d’Accueil 52 semaines (Année Complète), le total des semaines doit être égal à 52 (actuellement : {synthese.nbSemainesTotalAn} semaines).
            </div>
          )}

          {config.typeContrat === 'AI' && synthese.nbSemainesTotalAn > 46 && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900">
              <Info className="h-4 w-4 shrink-0 text-amber-600" />
              En contrat d’Accueil 46 semaines ou moins (Année Incomplète), le total des semaines ne doit pas dépasser 46 semaines (actuellement : {synthese.nbSemainesTotalAn} semaines).
            </div>
          )}

          <div className="space-y-4">
            {config.semainesTypes.map((sem, sIdx) => {
              if (!sem.active) return null;
              const totalH = sem.heuresParJour.reduce((a, b) => a + b, 0);
              const totalJ = sem.heuresParJour.filter((h) => h > 0).length;
              const hMaj = Math.max(0, totalH - 45);

              return (
                <div
                  key={sem.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                        {sem.id}
                      </span>
                      <div>
                        <span className="text-sm font-bold text-slate-800">
                          Semaine type {sem.id}
                        </span>
                        <span className="ml-3 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
                          {totalH} h / sem ({totalJ} j)
                          {hMaj > 0 ? ` dont ${hMaj}h majorées (>45h)` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-600">
                          Nb de semaines / an :
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="52"
                          value={sem.nbSemainesAn}
                          onChange={(e) =>
                            updateSemaine(sIdx, { nbSemainesAn: Number(e.target.value) })
                          }
                          className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-center text-sm font-bold text-slate-900"
                        />
                      </div>
                      {sIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => updateSemaine(sIdx, { active: false, nbSemainesAn: 0 })}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Supprimer ce rythme"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 pt-2">
                    {JOURS_SEMAINE_COURTS.map((jourNom, jIdx) => (
                      <div key={jourNom} className="text-center">
                        <label className="block text-[11px] font-semibold uppercase text-slate-500">
                          {jourNom}
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max="24"
                          value={sem.heuresParJour[jIdx]}
                          onChange={(e) =>
                            updateJourPlanning(sIdx, jIdx, Number(e.target.value))
                          }
                          className={`mt-1 w-full rounded-lg border px-2 py-1.5 text-center text-sm font-semibold ${
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
          </div>
        </div>
      )}

      {/* Section 4 : Identité Enfant, Employeur et Salarié (pour le Bulletin de Salaire) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-3 flex items-center gap-2 text-slate-800">
            <Baby className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold">Enfant accueilli & Règlement</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">
                Nom et Prénom de l’enfant
              </label>
              <input
                type="text"
                value={config.nomEnfant}
                onChange={(e) => updateField('nomEnfant', e.target.value)}
                placeholder="Ex: Léo Martin"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">
                Mode de règlement habituel
              </label>
              <input
                type="text"
                value={config.modeReglement}
                onChange={(e) => updateField('modeReglement', e.target.value)}
                placeholder="Ex: Virement bancaire / Pajemploi+"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">
                Valeur repas fournis par l’employeur (€/jour, pour impôts AM)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={config.repasFournisParentsValeurJour}
                onChange={(e) =>
                  updateField('repasFournisParentsValeurJour', Number(e.target.value))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-3 flex items-center gap-2 text-slate-800">
            <User className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold">Employeur (Parent)</h3>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600">Nom</label>
                <input
                  type="text"
                  value={config.employeurNom}
                  onChange={(e) => updateField('employeurNom', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Prénom</label>
                <input
                  type="text"
                  value={config.employeurPrenom}
                  onChange={(e) => updateField('employeurPrenom', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Adresse</label>
              <input
                type="text"
                value={config.employeurAdresse}
                onChange={(e) => updateField('employeurAdresse', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">N° Pajemploi</label>
              <input
                type="text"
                value={config.employeurNumPajemploi}
                onChange={(e) => updateField('employeurNumPajemploi', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-3 flex items-center gap-2 text-slate-800">
            <User className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold">Salarié(e) (Assistante Maternelle)</h3>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600">Nom</label>
                <input
                  type="text"
                  value={config.salarieNom}
                  onChange={(e) => updateField('salarieNom', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Prénom</label>
                <input
                  type="text"
                  value={config.salariePrenom}
                  onChange={(e) => updateField('salariePrenom', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Adresse</label>
              <input
                type="text"
                value={config.salarieAdresse}
                onChange={(e) => updateField('salarieAdresse', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">
                N° Sécurité Sociale
              </label>
              <input
                type="text"
                value={config.salarieNumSS}
                onChange={(e) => updateField('salarieNumSS', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
