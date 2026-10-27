import React from 'react';
import {
  ContratConfig,
  FeuilleMensuelle,
  JourPresence,
  SituationJour,
} from '../types';
import {
  ResultatMensuel,
  appliquerSituationJour,
  calculerIEJour,
  genererJoursMois,
} from '../utils/calculs';
import { getJoursFeries, JOURS_SEMAINE_COURTS, MOIS_NOMS } from '../data/baremes';
import { RefreshCw, Info, Calculator, Sparkles } from 'lucide-react';

interface Props {
  config: ContratConfig;
  feuille: FeuilleMensuelle;
  resultat: ResultatMensuel;
  onChangeFeuille: (next: FeuilleMensuelle) => void;
}

const SITUATION_LABELS: { value: SituationJour; label: string; badgeClass: string }[] = [
  {
    value: 'normal',
    label: 'Normal travaillé (Col 1, 2, 3)',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    value: 'convenance_pe',
    label: 'Absence convenance employeur (Payé sans IE/IR - Col 1, 2)',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    value: 'absence_deduite',
    label: 'Absence déduite Cour de cassation (Maladie certif, conv. AM, sans solde - Col 1, 2, 4)',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  {
    value: 'adaptation',
    label: 'Période d’adaptation (Col 1, 2, 3, 4)',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    value: 'semaine_absence_ai',
    label: 'Semaine d’absence prévue au contrat AI (Col 2 uniquement)',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  {
    value: 'conges_payes_am',
    label: 'Congés payés AM (AC: Col 1&2 / AI: Col 2)',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  {
    value: 'ferie_chome',
    label: 'Jour férié chômé (Col 1, 2)',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  {
    value: 'avant_apres_contrat',
    label: 'Avant début / Après fin contrat (Col 2, 4)',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  {
    value: 'hors_contrat',
    label: 'Heures hors contrat sur jour non prévu (Col 3, 6)',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  },
  {
    value: 'repos',
    label: 'Jour non travaillé habituel / Repos',
    badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
  },
];

export const FeuillePresence: React.FC<Props> = ({
  config,
  feuille,
  resultat,
  onChangeFeuille,
}) => {
  const feries = getJoursFeries(feuille.annee, config.region);
  const semPrincipale =
    config.semainesTypes.find((s) => s.active) || config.semainesTypes[0];

  const getHeuresPlanningForDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const idxJourSem = (dt.getDay() + 6) % 7;
    return semPrincipale ? semPrincipale.heuresParJour[idxJourSem] : 0;
  };

  const handleSituationChange = (index: number, newSit: SituationJour) => {
    const jour = feuille.jours[index];
    const hPlanning = getHeuresPlanningForDate(jour.date);
    const updatedJour = appliquerSituationJour(
      jour,
      newSit,
      hPlanning,
      config.typeContrat
    );
    const nextJours = [...feuille.jours];
    nextJours[index] = updatedJour;
    onChangeFeuille({ ...feuille, jours: nextJours });
  };

  const updateJourField = <K extends keyof JourPresence>(
    index: number,
    key: K,
    value: JourPresence[K]
  ) => {
    const nextJours = [...feuille.jours];
    const current = { ...nextJours[index], [key]: value };

    // Si on est en mode adaptation et qu'on change les heures réalisées, recalculer les heures à déduire automatiquement
    if (current.situation === 'adaptation' && key === 'heuresRealisees') {
      const hReal = Number(value) || 0;
      current.heuresADeduire = Math.max(0, current.heuresPrevues - hReal);
    }

    nextJours[index] = current;
    onChangeFeuille({ ...feuille, jours: nextJours });
  };

  const reinitialiserDepuisContrat = () => {
    const nouveauxJours = genererJoursMois(feuille.annee, feuille.mois, config);
    onChangeFeuille({ ...feuille, jours: nouveauxJours });
  };

  return (
    <div className="space-y-6">
      {/* En-tête de la feuille de présence */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Feuille de présence — {MOIS_NOMS[feuille.mois - 1]} {feuille.annee}
          </h2>
          <p className="text-xs text-slate-500">
            Sélectionnez la situation de chaque journée pour remplir automatiquement les bonnes
            colonnes selon la Notice officielle, ou ajustez directement les nombres d’heures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={reinitialiserDepuisContrat}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Réinitialiser selon le planning du contrat
          </button>
        </div>
      </div>

      {/* Cartes de synthèse rapide du mois */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Heures réalisées</div>
          <div className="mt-1 text-xl font-bold text-slate-900">
            {resultat.totalHeuresRealisees} h
          </div>
          <div className="text-[11px] text-slate-400">
            Prévues : {resultat.totalHeuresPrevues} h
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">
            Heures potentielles (Col 2)
          </div>
          <div className="mt-1 text-xl font-bold text-indigo-700">
            {resultat.totalHeuresPotentielles} h
          </div>
          <div className="text-[11px] text-slate-400">
            {resultat.totalJoursPotentiels} jours potentiels
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">
            Heures à déduire (Col 4)
          </div>
          <div className="mt-1 text-xl font-bold text-rose-600">
            {resultat.totalHeuresADeduire} h
          </div>
          <div className="text-[11px] text-rose-600">
            {resultat.deductionAbsenceCourCassationBrut.toFixed(2)} € brut
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">
            Heures compl. / maj.
          </div>
          <div className="mt-1 text-xl font-bold text-cyan-700">
            {resultat.totalHeuresComplementaires} h /{' '}
            {resultat.totalHeuresMajPrevues + resultat.totalHeuresMajNonPrevues} h
          </div>
          <div className="text-[11px] text-slate-400">
            Exo salariale : +{resultat.montantExonerationSalarialeHCHS.toFixed(2)} €
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">
            Indemnités (IE + IR + IK)
          </div>
          <div className="mt-1 text-xl font-bold text-amber-700">
            {(resultat.totalIE + resultat.totalIR + resultat.totalIK).toFixed(2)} €
          </div>
          <div className="text-[11px] text-slate-400">
            IE {resultat.totalIE.toFixed(2)}€ • IR {resultat.totalIR.toFixed(2)}€
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-800">
            Net à payer ce mois
          </div>
          <div className="mt-1 text-xl font-extrabold text-emerald-700">
            {resultat.netAPayer.toFixed(2)} €
          </div>
          <div className="text-[11px] text-emerald-700">
            Salaire net : {resultat.salaireNetAvantImpot.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Tableau interactif des 15 colonnes */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="sticky left-0 z-10 bg-slate-100 px-3 py-3">Jour</th>
                <th className="min-w-[230px] px-2 py-3">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Situation (Auto-Notice)
                  </span>
                </th>
                <th className="px-2 py-3 text-center" title="Colonne 1 : Heures prévues au contrat">
                  Col 1<br />H. Prévues
                </th>
                <th
                  className="px-2 py-3 text-center text-indigo-700"
                  title="Colonne 2 : Heures potentielles (sert au calcul Cour de cassation)"
                >
                  Col 2<br />H. Potent.
                </th>
                <th
                  className="px-2 py-3 text-center text-emerald-800"
                  title="Colonne 3 : Heures réellement effectuées"
                >
                  Col 3<br />H. Réelles
                </th>
                <th
                  className="px-2 py-3 text-center text-rose-700"
                  title="Colonne 4 : Heures à déduire par calcul Cour de cassation"
                >
                  Col 4<br />À Déduire
                </th>
                <th
                  className="px-2 py-3 text-center text-cyan-800"
                  title="Colonne 6 : Heures complémentaires hors contrat (≤ 45h/sem)"
                >
                  Col 6<br />H. Compl.
                </th>
                <th
                  className="px-2 py-3 text-center text-purple-800"
                  title="Colonne 7 : Heures majorées (>45h) prévues au contrat"
                >
                  Col 7<br />H. Maj Prév.
                </th>
                <th
                  className="px-2 py-3 text-center text-purple-800"
                  title="Colonne 8 : Heures majorées (>45h) hors contrat"
                >
                  Col 8<br />H. Maj HC
                </th>
                <th
                  className="px-2 py-3 text-center"
                  title="Colonne 10 : Indemnité d'entretien du jour (calculée auto selon heures réelles)"
                >
                  Col 10<br />IE (€)
                </th>
                <th className="px-1.5 py-3 text-center" title="Colonne 11 : Repas 1">
                  {config.repas1Label || 'Repas 1'}
                </th>
                <th className="px-1.5 py-3 text-center" title="Colonne 12 : Repas 2">
                  {config.repas2Label || 'Repas 2'}
                </th>
                <th className="px-1.5 py-3 text-center" title="Colonne 13 : Repas 3">
                  {config.repas3Label || 'Repas 3'}
                </th>
                <th className="px-2 py-3 text-center" title="Colonne 14 : Nb de KM">
                  Col 14<br />KM
                </th>
                <th className="min-w-[160px] px-2 py-3" title="Colonne 15 : Commentaires">
                  Col 15 — Commentaire
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feuille.jours.map((jour, idx) => {
                const [y, m, d] = jour.date.split('-').map(Number);
                const jsDate = new Date(y, m - 1, d);
                const idxSem = (jsDate.getDay() + 6) % 7;
                const isWeekend = idxSem >= 5;
                const nomFerie = feries[jour.date];
                const ieJour = calculerIEJour(
                  jour.heuresRealisees,
                  config,
                  resultat.bareme,
                  jour.ieForcagle
                );
                const sitMeta =
                  SITUATION_LABELS.find((s) => s.value === jour.situation) ||
                  SITUATION_LABELS[0];

                return (
                  <tr
                    key={jour.date}
                    className={`transition-colors ${
                      nomFerie
                        ? 'bg-indigo-50/40'
                        : isWeekend && jour.heuresRealisees === 0 && jour.heuresPotentielles === 0
                        ? 'bg-slate-50/80 text-slate-400'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Date */}
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-inherit px-3 py-2 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="w-7 text-slate-500">
                          {JOURS_SEMAINE_COURTS[idxSem]}
                        </span>
                        <span className="font-bold text-slate-800">
                          {String(d).padStart(2, '0')}/{String(m).padStart(2, '0')}
                        </span>
                        {nomFerie && (
                          <span
                            className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700"
                            title={nomFerie}
                          >
                            Férié
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Sélecteur de situation */}
                    <td className="px-2 py-1.5">
                      <select
                        value={jour.situation}
                        onChange={(e) =>
                          handleSituationChange(idx, e.target.value as SituationJour)
                        }
                        className={`w-full rounded-lg border px-2 py-1 text-xs font-medium ${sitMeta.badgeClass}`}
                      >
                        {SITUATION_LABELS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Col 1 : Heures prévues */}
                    <td className="px-1.5 py-1.5 text-center">
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={jour.heuresPrevues}
                        onChange={(e) =>
                          updateJourField(idx, 'heuresPrevues', Number(e.target.value))
                        }
                        className="w-14 rounded border border-slate-200 bg-white px-1.5 py-1 text-center font-medium text-slate-800"
                      />
                    </td>

                    {/* Col 2 : Heures potentielles */}
                    <td className="px-1.5 py-1.5 text-center">
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={jour.heuresPotentielles}
                        onChange={(e) =>
                          updateJourField(idx, 'heuresPotentielles', Number(e.target.value))
                        }
                        className="w-14 rounded border border-indigo-200 bg-indigo-50/40 px-1.5 py-1 text-center font-semibold text-indigo-900"
                      />
                    </td>

                    {/* Col 3 : Heures réalisées */}
                    <td className="px-1.5 py-1.5 text-center">
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={jour.heuresRealisees}
                        onChange={(e) =>
                          updateJourField(idx, 'heuresRealisees', Number(e.target.value))
                        }
                        className={`w-14 rounded border px-1.5 py-1 text-center font-bold ${
                          jour.heuresRealisees > 0
                            ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900'
                            : 'border-slate-200 bg-white text-slate-400'
                        }`}
                      />
                    </td>

                    {/* Col 4 : Heures à déduire */}
                    <td className="px-1.5 py-1.5 text-center">
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={jour.heuresADeduire}
                        onChange={(e) =>
                          updateJourField(idx, 'heuresADeduire', Number(e.target.value))
                        }
                        className={`w-14 rounded border px-1.5 py-1 text-center font-bold ${
                          jour.heuresADeduire > 0
                            ? 'border-rose-300 bg-rose-50 text-rose-700'
                            : 'border-slate-200 bg-white text-slate-400'
                        }`}
                      />
                    </td>

                    {/* Col 6 : Heures complémentaires */}
                    <td className="px-1.5 py-1.5 text-center">
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={jour.heuresComplementaires}
                        onChange={(e) =>
                          updateJourField(idx, 'heuresComplementaires', Number(e.target.value))
                        }
                        className={`w-14 rounded border px-1.5 py-1 text-center font-semibold ${
                          jour.heuresComplementaires > 0
                            ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
                            : 'border-slate-200 bg-white text-slate-400'
                        }`}
                      />
                    </td>

                    {/* Col 7 : Heures maj prévues */}
                    <td className="px-1.5 py-1.5 text-center">
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={jour.heuresMajPrevues}
                        onChange={(e) =>
                          updateJourField(idx, 'heuresMajPrevues', Number(e.target.value))
                        }
                        className="w-12 rounded border border-slate-200 bg-white px-1 py-1 text-center text-slate-700"
                      />
                    </td>

                    {/* Col 8 : Heures maj non prévues */}
                    <td className="px-1.5 py-1.5 text-center">
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={jour.heuresMajNonPrevues}
                        onChange={(e) =>
                          updateJourField(idx, 'heuresMajNonPrevues', Number(e.target.value))
                        }
                        className="w-12 rounded border border-slate-200 bg-white px-1 py-1 text-center text-slate-700"
                      />
                    </td>

                    {/* Col 10 : IE */}
                    <td className="px-2 py-1.5 text-center font-semibold text-slate-700">
                      {ieJour > 0 ? `${ieJour.toFixed(2)} €` : '—'}
                    </td>

                    {/* Col 11, 12, 13 : Repas */}
                    <td className="px-1 py-1.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={jour.repas1}
                        onChange={(e) =>
                          updateJourField(idx, 'repas1', Number(e.target.value))
                        }
                        className="w-11 rounded border border-slate-200 bg-white px-1 py-1 text-center"
                      />
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={jour.repas2}
                        onChange={(e) =>
                          updateJourField(idx, 'repas2', Number(e.target.value))
                        }
                        className="w-11 rounded border border-slate-200 bg-white px-1 py-1 text-center"
                      />
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={jour.repas3}
                        onChange={(e) =>
                          updateJourField(idx, 'repas3', Number(e.target.value))
                        }
                        className="w-11 rounded border border-slate-200 bg-white px-1 py-1 text-center"
                      />
                    </td>

                    {/* Col 14 : KM */}
                    <td className="px-1.5 py-1.5 text-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={jour.km}
                        onChange={(e) =>
                          updateJourField(idx, 'km', Number(e.target.value))
                        }
                        className="w-14 rounded border border-slate-200 bg-white px-1.5 py-1 text-center"
                      />
                    </td>

                    {/* Col 15 : Commentaires */}
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={jour.commentaire}
                        onChange={(e) =>
                          updateJourField(idx, 'commentaire', e.target.value)
                        }
                        placeholder="Justification..."
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-900">
                <td colSpan={2} className="px-3 py-3 text-right uppercase">
                  Totaux du mois :
                </td>
                <td className="px-2 py-3 text-center">{resultat.totalHeuresPrevues} h</td>
                <td className="px-2 py-3 text-center text-indigo-700">
                  {resultat.totalHeuresPotentielles} h
                </td>
                <td className="px-2 py-3 text-center text-emerald-800">
                  {resultat.totalHeuresRealisees} h
                </td>
                <td className="px-2 py-3 text-center text-rose-700">
                  {resultat.totalHeuresADeduire} h
                </td>
                <td className="px-2 py-3 text-center text-cyan-800">
                  {resultat.totalHeuresComplementaires} h
                </td>
                <td className="px-2 py-3 text-center">{resultat.totalHeuresMajPrevues} h</td>
                <td className="px-2 py-3 text-center">
                  {resultat.totalHeuresMajNonPrevues} h
                </td>
                <td className="px-2 py-3 text-center">{resultat.totalIE.toFixed(2)} €</td>
                <td className="px-1 py-3 text-center">{resultat.totalRepas1}</td>
                <td className="px-1 py-3 text-center">{resultat.totalRepas2}</td>
                <td className="px-1 py-3 text-center">{resultat.totalRepas3}</td>
                <td className="px-2 py-3 text-center">{resultat.totalKm} km</td>
                <td className="px-2 py-3 text-xs text-slate-600">
                  IR : {resultat.totalIR.toFixed(2)} € | IK : {resultat.totalIK.toFixed(2)} €
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Encadré Explicatif du Calcul Cour de Cassation */}
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
        <div className="flex items-start gap-3">
          <Calculator className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
          <div className="space-y-2 text-xs text-slate-700">
            <h3 className="text-sm font-bold text-indigo-950">
              Détail de la Déduction d’Absence (Calcul Cour de Cassation)
            </h3>
            <p>
              Formule officielle :{' '}
              <code className="rounded bg-white px-2 py-0.5 font-mono font-semibold text-indigo-900">
                Salaire mensualisé × (Heures à déduire ÷ Heures potentielles du mois)
              </code>
            </p>
            <div className="grid grid-cols-2 gap-4 pt-1 sm:grid-cols-5">
              <div className="rounded-lg bg-white p-2.5 shadow-2xs">
                <span className="block text-[11px] text-slate-500">Heures à déduire</span>
                <span className="text-sm font-bold text-rose-700">
                  {resultat.totalHeuresADeduire} h
                </span>
              </div>
              <div className="rounded-lg bg-white p-2.5 shadow-2xs">
                <span className="block text-[11px] text-slate-500">Heures potentielles</span>
                <span className="text-sm font-bold text-indigo-700">
                  {resultat.totalHeuresPotentielles} h
                </span>
              </div>
              <div className="rounded-lg bg-white p-2.5 shadow-2xs">
                <span className="block text-[11px] text-slate-500">Soit à déduire (Brut)</span>
                <span className="text-sm font-bold text-rose-700">
                  {resultat.deductionAbsenceCourCassationBrut.toFixed(2)} €
                </span>
              </div>
              <div className="rounded-lg bg-white p-2.5 shadow-2xs">
                <span className="block text-[11px] text-slate-500">Jours potentiels</span>
                <span className="text-sm font-bold text-slate-800">
                  {resultat.totalJoursPotentiels} j
                </span>
              </div>
              <div className="rounded-lg bg-white p-2.5 shadow-2xs">
                <span className="block text-[11px] text-slate-500">Jours d’absence</span>
                <span className="text-sm font-bold text-slate-800">
                  {resultat.totalJoursAbsence} j
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
