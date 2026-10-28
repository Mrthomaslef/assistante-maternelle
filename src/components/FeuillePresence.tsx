import React, { useState } from 'react';
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
import {
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Utensils,
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';

interface Props {
  config: ContratConfig;
  feuille: FeuilleMensuelle;
  resultat: ResultatMensuel;
  onChangeFeuille: (next: FeuilleMensuelle) => void;
}

const SITUATIONS_RAPIDES: {
  value: SituationJour;
  shortLabel: string;
  desc: string;
  color: string;
  dot: string;
}[] = [
  {
    value: 'normal',
    shortLabel: 'Travaillé',
    desc: 'Journée normale selon planning',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  {
    value: 'convenance_pe',
    shortLabel: 'Absence gardée (Payée)',
    desc: 'Convenance parent : salaire maintenu sans IE/repas',
    color: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
  },
  {
    value: 'absence_deduite',
    shortLabel: 'Absence déduite',
    desc: 'Enfant malade (certificat), absence nounou ou sans solde',
    color: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-500',
  },
  {
    value: 'adaptation',
    shortLabel: 'Adaptation',
    desc: 'Heures non faites déduites (Cour de cassation)',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  {
    value: 'conges_payes_am',
    shortLabel: 'Congés / Abs. prévue',
    desc: 'Congés payés ou semaine d’absence prévue au contrat',
    color: 'bg-purple-50 text-purple-800 border-purple-200',
    dot: 'bg-purple-500',
  },
  {
    value: 'ferie_chome',
    shortLabel: 'Jour férié chômé',
    desc: 'Jour férié non travaillé (salaire maintenu, sans IE/repas)',
    color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  {
    value: 'hors_contrat',
    shortLabel: 'Jour en + (Hors contrat)',
    desc: 'Accueil sur un jour non prévu au planning (heures compl.)',
    color: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    dot: 'bg-cyan-500',
  },
  {
    value: 'repos',
    shortLabel: 'Repos / Week-end',
    desc: 'Jour habituellement non travaillé',
    color: 'bg-slate-100 text-slate-500 border-slate-200',
    dot: 'bg-slate-300',
  },
];

export const FeuillePresence: React.FC<Props> = ({
  config,
  feuille,
  resultat,
  onChangeFeuille,
}) => {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [masquerRepos, setMasquerRepos] = useState<boolean>(true);
  const [showAdvancedDay, setShowAdvancedDay] = useState<Record<string, boolean>>({});

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
    const sitToApply =
      newSit === 'conges_payes_am' && config.typeContrat === 'AI'
        ? 'semaine_absence_ai'
        : newSit;
    const updatedJour = appliquerSituationJour(
      jour,
      sitToApply,
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

    if (current.situation === 'adaptation' && key === 'heuresRealisees') {
      const hReal = Number(value) || 0;
      current.heuresADeduire = Math.max(0, current.heuresPrevues - hReal);
    }

    nextJours[index] = current;
    onChangeFeuille({ ...feuille, jours: nextJours });
  };

  const reinitialiserDepuisContrat = () => {
    if (
      window.confirm(
        'Réinitialiser tous les jours de ce mois avec le planning type du contrat ?'
      )
    ) {
      const nouveauxJours = genererJoursMois(feuille.annee, feuille.mois, config);
      onChangeFeuille({ ...feuille, jours: nouveauxJours });
    }
  };

  const getSituationInfo = (sit: SituationJour) => {
    if (sit === 'semaine_absence_ai' || sit === 'avant_apres_contrat') {
      return SITUATIONS_RAPIDES.find((s) => s.value === 'conges_payes_am')!;
    }
    return (
      SITUATIONS_RAPIDES.find((s) => s.value === sit) || SITUATIONS_RAPIDES[0]
    );
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Bandeau résumé ultra-lisible sur mobile */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-indigo-100">
              {MOIS_NOMS[feuille.mois - 1]} {feuille.annee} • {config.nomEnfant}
            </p>
            <p className="mt-0.5 text-2xl font-extrabold">
              {resultat.netAPayer.toFixed(2)} €{' '}
              <span className="text-xs font-normal text-indigo-100">net à payer</span>
            </p>
          </div>
          <div className="text-right text-xs text-indigo-100">
            <div>
              Salaire net : <strong>{resultat.salaireNetAvantImpot.toFixed(2)} €</strong>
            </div>
            <div>
              Frais (IE+Repas) :{' '}
              <strong>
                {(resultat.totalIE + resultat.totalIR + resultat.totalIK).toFixed(2)} €
              </strong>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/15 pt-3 text-center text-xs">
          <div className="rounded-xl bg-white/10 py-1.5">
            <span className="block text-[10px] text-indigo-200">Heures faites</span>
            <strong className="text-sm">{resultat.totalHeuresRealisees} h</strong>
          </div>
          <div className="rounded-xl bg-white/10 py-1.5">
            <span className="block text-[10px] text-indigo-200">Jours accueillis</span>
            <strong className="text-sm">
              {resultat.declarationRevenusAM.nbJoursReelsAccueilTotal} j
            </strong>
          </div>
          <div className="rounded-xl bg-white/10 py-1.5">
            <span className="block text-[10px] text-indigo-200">Heures déduites</span>
            <strong className="text-sm">{resultat.totalHeuresADeduire} h</strong>
          </div>
        </div>
      </div>

      {/* Barre de filtres simple */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMasquerRepos(true)}
            className={`rounded-lg px-3 py-1.5 transition ${
              masquerRepos
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Jours d’accueil
          </button>
          <button
            type="button"
            onClick={() => setMasquerRepos(false)}
            className={`rounded-lg px-3 py-1.5 transition ${
              !masquerRepos
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous ({feuille.jours.length} j)
          </button>
        </div>

        <button
          type="button"
          onClick={reinitialiserDepuisContrat}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-2xs active:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Réinitialiser
        </button>
      </div>

      {/* Liste de cartes par jour (ergonomique au pouce sur téléphone) */}
      <div className="space-y-2">
        {feuille.jours.map((jour, idx) => {
          const [y, m, d] = jour.date.split('-').map(Number);
          const jsDate = new Date(y, m - 1, d);
          const idxSem = (jsDate.getDay() + 6) % 7;
          const nomFerie = feries[jour.date];

          const isEmptyRepos =
            jour.situation === 'repos' &&
            jour.heuresRealisees === 0 &&
            jour.heuresPotentielles === 0 &&
            !nomFerie;

          if (masquerRepos && isEmptyRepos) {
            return null;
          }

          const isExpanded = expandedDate === jour.date;
          const sitInfo = getSituationInfo(jour.situation);
          const ieJour = calculerIEJour(
            jour.heuresRealisees,
            config,
            resultat.bareme,
            jour.ieForcagle
          );
          const nbRepasJour = jour.repas1 + jour.repas2 + jour.repas3;
          const isAdvOpen = !!showAdvancedDay[jour.date];

          return (
            <div
              key={jour.date}
              className={`overflow-hidden rounded-2xl border transition-all ${
                isExpanded
                  ? 'border-indigo-400 bg-white shadow-md'
                  : 'border-slate-200 bg-white shadow-2xs'
              }`}
            >
              {/* Ligne principale du jour (cliquable) */}
              <button
                type="button"
                onClick={() =>
                  setExpandedDate(isExpanded ? null : jour.date)
                }
                className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  {/* Pastille Date */}
                  <div
                    className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border text-xs ${
                      jour.heuresRealisees > 0
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        : jour.heuresADeduire > 0
                        ? 'border-rose-200 bg-rose-50 text-rose-900'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase leading-none">
                      {JOURS_SEMAINE_COURTS[idxSem]}
                    </span>
                    <span className="mt-0.5 text-sm font-extrabold leading-none">
                      {String(d).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Infos situation & résumé */}
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sitInfo.color}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${sitInfo.dot}`} />
                        {sitInfo.shortLabel}
                      </span>
                      {nomFerie && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                          {nomFerie}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">
                        {jour.heuresRealisees} h faites
                      </span>
                      {jour.heuresADeduire > 0 && (
                        <span className="font-semibold text-rose-600">
                          • -{jour.heuresADeduire} h déduites
                        </span>
                      )}
                      {jour.heuresComplementaires > 0 && (
                        <span className="font-semibold text-cyan-700">
                          • +{jour.heuresComplementaires} h compl.
                        </span>
                      )}
                      {ieJour > 0 && <span>• IE {ieJour.toFixed(2)} €</span>}
                      {nbRepasJour > 0 && (
                        <span>
                          • {nbRepasJour} repas
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-slate-400">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-indigo-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </button>

              {/* Cases à cocher directes des 3 indemnités repas sur chaque jour travaillé */}
              {jour.heuresRealisees > 0 && !isExpanded && (
                <div className="grid grid-cols-3 gap-1.5 border-t border-slate-100 bg-slate-50/50 px-3.5 py-2">
                  {[
                    {
                      field: 'repas1' as const,
                      label: config.repas1Label || 'Repas 1',
                      tarif: config.repas1Tarif,
                      val: jour.repas1,
                    },
                    {
                      field: 'repas2' as const,
                      label: config.repas2Label || 'Repas 2',
                      tarif: config.repas2Tarif,
                      val: jour.repas2,
                    },
                    {
                      field: 'repas3' as const,
                      label: config.repas3Label || 'Repas 3',
                      tarif: config.repas3Tarif,
                      val: jour.repas3,
                    },
                  ].map((r) => {
                    const checked = r.val > 0;
                    return (
                      <button
                        key={r.field}
                        type="button"
                        onClick={() => updateJourField(idx, r.field, checked ? 0 : 1)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition active:scale-[0.98] ${
                          checked
                            ? 'border-amber-400 bg-amber-50 text-amber-900'
                            : 'border-slate-200 bg-white text-slate-400'
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                            checked
                              ? 'border-amber-600 bg-amber-500 font-bold text-white'
                              : 'border-slate-300 bg-slate-50'
                          }`}
                        >
                          {checked ? '✓' : ''}
                        </span>
                        <span className="truncate">
                          {r.label} ({r.tarif.toFixed(2)}€)
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Panneau déplié pour modifier la journée facilement au doigt */}
              {isExpanded && (
                <div className="space-y-4 border-t border-slate-100 bg-slate-50/70 p-4">
                  {/* 1. Choix rapide de la situation */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Situation de la journée
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      {SITUATIONS_RAPIDES.map((s) => {
                        const isSelected =
                          jour.situation === s.value ||
                          (s.value === 'conges_payes_am' &&
                            jour.situation === 'semaine_absence_ai');
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => handleSituationChange(idx, s.value)}
                            className={`rounded-xl border px-2.5 py-2 text-left text-xs transition ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 font-bold text-white shadow-2xs'
                                : 'border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {s.shortLabel}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500">{sitInfo.desc}</p>
                  </div>

                  {/* 2. Heures & Repas de la journée */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Heures réellement effectuées */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Clock className="h-4 w-4 text-indigo-600" /> Heures gardées
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Prévu : {jour.heuresPrevues}h
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateJourField(
                              idx,
                              'heuresRealisees',
                              Math.max(0, jour.heuresRealisees - 0.5)
                            )
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-lg font-bold text-slate-700 active:bg-slate-200"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={jour.heuresRealisees}
                          onChange={(e) =>
                            updateJourField(
                              idx,
                              'heuresRealisees',
                              Number(e.target.value)
                            )
                          }
                          className="w-24 rounded-xl border border-slate-200 py-1.5 text-center text-base font-extrabold text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateJourField(
                              idx,
                              'heuresRealisees',
                              jour.heuresRealisees + 0.5
                            )
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-lg font-bold text-slate-700 active:bg-slate-200"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Repas du jour (3 indemnités repas cochables) */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Utensils className="h-4 w-4 text-amber-600" /> 3 Indemnités de repas
                      </span>
                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {[
                          {
                            field: 'repas1' as const,
                            label: config.repas1Label || 'Repas 1',
                            tarif: config.repas1Tarif,
                            val: jour.repas1,
                          },
                          {
                            field: 'repas2' as const,
                            label: config.repas2Label || 'Repas 2',
                            tarif: config.repas2Tarif,
                            val: jour.repas2,
                          },
                          {
                            field: 'repas3' as const,
                            label: config.repas3Label || 'Repas 3',
                            tarif: config.repas3Tarif,
                            val: jour.repas3,
                          },
                        ].map((r) => {
                          const checked = r.val > 0;
                          return (
                            <button
                              key={r.field}
                              type="button"
                              onClick={() =>
                                updateJourField(idx, r.field, checked ? 0 : 1)
                              }
                              className={`flex flex-col items-center justify-center rounded-xl border p-2 text-xs font-semibold transition ${
                                checked
                                  ? 'border-amber-400 bg-amber-50 text-amber-900'
                                  : 'border-slate-200 bg-slate-50 text-slate-400'
                              }`}
                            >
                              <span
                                className={`mb-1 flex h-5 w-5 items-center justify-center rounded border text-xs ${
                                  checked
                                    ? 'border-amber-600 bg-amber-500 font-bold text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {checked ? '✓' : ''}
                              </span>
                              <span className="truncate font-bold">{r.label}</span>
                              <span className="text-[10px] opacity-80">
                                {r.tarif.toFixed(2)} €
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Bouton pour afficher les options avancées (Heures compl., à déduire, KM, note) */}
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setShowAdvancedDay((prev) => ({
                          ...prev,
                          [jour.date]: !isAdvOpen,
                        }))
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      {isAdvOpen
                        ? 'Masquer les options avancées'
                        : 'Heures complémentaires, à déduire, KM ou commentaire...'}
                    </button>

                    {isAdvOpen && (
                      <div className="mt-3 grid grid-cols-2 gap-2.5 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600">
                            Col 1 • H. prévues
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={jour.heuresPrevues}
                            onChange={(e) =>
                              updateJourField(
                                idx,
                                'heuresPrevues',
                                Number(e.target.value)
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-indigo-700">
                            Col 2 • H. potentielles
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={jour.heuresPotentielles}
                            onChange={(e) =>
                              updateJourField(
                                idx,
                                'heuresPotentielles',
                                Number(e.target.value)
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-indigo-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-rose-700">
                            Col 4 • H. à déduire
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={jour.heuresADeduire}
                            onChange={(e) =>
                              updateJourField(
                                idx,
                                'heuresADeduire',
                                Number(e.target.value)
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-bold text-rose-700"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-cyan-700">
                            Col 6 • H. compl. (≤45h)
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={jour.heuresComplementaires}
                            onChange={(e) =>
                              updateJourField(
                                idx,
                                'heuresComplementaires',
                                Number(e.target.value)
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-bold text-cyan-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-purple-700">
                            Col 7 • H. maj prévues
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={jour.heuresMajPrevues}
                            onChange={(e) =>
                              updateJourField(
                                idx,
                                'heuresMajPrevues',
                                Number(e.target.value)
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-purple-700">
                            Col 8 • H. maj hors contrat
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={jour.heuresMajNonPrevues}
                            onChange={(e) =>
                              updateJourField(
                                idx,
                                'heuresMajNonPrevues',
                                Number(e.target.value)
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600">
                            Col 14 • Trajet (KM divisés par nb enfants)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={jour.km}
                            onChange={(e) =>
                              updateJourField(idx, 'km', Number(e.target.value))
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600">
                            Col 15 • Commentaire / Justification
                          </label>
                          <input
                            type="text"
                            value={jour.commentaire}
                            onChange={(e) =>
                              updateJourField(idx, 'commentaire', e.target.value)
                            }
                            placeholder="Ex: Enfant malade certificat, convenance AM..."
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
