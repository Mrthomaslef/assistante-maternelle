import React, { useState } from 'react';
import {
  ContratConfig,
  ElementsVariablesBulletin,
  FeuilleMensuelle,
} from '../types';
import { ResultatMensuel } from '../utils/calculs';
import { MOIS_NOMS } from '../data/baremes';
import {
  Printer,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  config: ContratConfig;
  feuille: FeuilleMensuelle;
  resultat: ResultatMensuel;
  onChangeFeuille: (next: FeuilleMensuelle) => void;
}

export const BulletinSalaire: React.FC<Props> = ({
  config,
  feuille,
  resultat,
  onChangeFeuille,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const vars = feuille.variables;

  const updateVar = <K extends keyof ElementsVariablesBulletin>(
    key: K,
    value: ElementsVariablesBulletin[K]
  ) => {
    onChangeFeuille({
      ...feuille,
      variables: {
        ...vars,
        [key]: value,
      },
    });
  };

  const copyValue = (key: string, val: string | number) => {
    navigator.clipboard.writeText(String(val).replace('.', ','));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1600);
  };

  const p = resultat.pajemploi;

  return (
    <div className="space-y-6">
      {/* Barre d'actions et Alerte Plafond CAF */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Bulletin de Salaire & Déclaration Pajemploi — {MOIS_NOMS[feuille.mois - 1]}{' '}
            {feuille.annee}
          </h2>
          <p className="text-xs text-slate-500">
            Vérifiez les valeurs à déclarer sur Pajemploi et imprimez ou exportez en PDF le
            bulletin de salaire officiel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
        >
          <Printer className="h-4 w-4" /> Imprimer / Enregistrer en PDF
        </button>
      </div>

      {p.depassementPlafondCAF && (
        <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 print:hidden">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="text-sm">
            <p className="font-bold">Dépassement du plafond CAF détecté ce mois-ci !</p>
            <p>
              Le ratio calculé ({p.ratioPlafondCAF.toFixed(2)} €) dépasse le plafond CAF en
              vigueur ({resultat.bareme.plafondCAF} €). Risque de non-prise en charge du CMG par
              la CAF / Pajemploi.
            </p>
          </div>
        </div>
      )}

      {/* Encadré Déclaration Pajemploi (Prêt à copier) */}
      <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/40 p-6 shadow-xs print:hidden">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-indigo-950">
              Aide à la Déclaration Pajemploi (Valeurs exactes à déclarer)
            </h3>
          </div>
          <span className="text-xs text-indigo-700">
            Cliquez sur une case pour copier la valeur au format virgule
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {[
            { key: 'hn', label: 'Heures normales', val: p.heuresNormales, unit: 'h' },
            { key: 'ja', label: 'Jours d’activité', val: p.joursActivite, unit: 'j' },
            { key: 'cp', label: 'Jours de CP', val: p.nbCP, unit: 'j' },
            {
              key: 'hc',
              label: 'Heures compl.',
              val: p.heuresComplementaires,
              unit: 'h',
            },
            { key: 'hm', label: 'Heures majorées', val: p.heuresMajorees, unit: 'h' },
            {
              key: 'thn',
              label: 'Taux horaire net',
              val: p.tauxHoraireNet.toFixed(2),
              unit: '€',
            },
            {
              key: 'sn',
              label: 'Salaire net (hors ind.)',
              val: p.salaireNetDeclare.toFixed(2),
              unit: '€',
              highlight: true,
            },
            { key: 'ie', label: 'Indemnités entretien (IE)', val: p.ie.toFixed(2), unit: '€' },
            { key: 'ir', label: 'Indemnités repas (IR)', val: p.ir.toFixed(2), unit: '€' },
            { key: 'ik', label: 'Indemnités km (IK)', val: p.ik.toFixed(2), unit: '€' },
            { key: 'iccp', label: 'ICCP (Fin contrat)', val: p.iccp.toFixed(2), unit: '€' },
            {
              key: 'rup',
              label: 'Indemnité de rupture',
              val: p.indemniteRupture.toFixed(2),
              unit: '€',
            },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => copyValue(item.key, item.val)}
              className={`group flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                item.highlight
                  ? 'border-indigo-400 bg-indigo-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-2xs'
              }`}
            >
              <div className="flex w-full items-center justify-between gap-1">
                <span
                  className={`text-[11px] font-semibold ${
                    item.highlight ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
                {copiedKey === item.key ? (
                  <Check
                    className={`h-3.5 w-3.5 ${
                      item.highlight ? 'text-emerald-300' : 'text-emerald-600'
                    }`}
                  />
                ) : (
                  <Copy
                    className={`h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100 ${
                      item.highlight ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  />
                )}
              </div>
              <div className="mt-1.5 text-lg font-extrabold">
                {item.val} <span className="text-xs font-normal">{item.unit}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Éléments variables optionnels du mois (CP en AI, 1er mai, Régularisation, Fin de contrat) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs print:hidden">
        <div className="mb-4 flex items-center gap-2 text-slate-800">
          <Sliders className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold">
            Éléments ponctuels du mois (Congés payés AI, Jours fériés travaillés, Fin de contrat, CMG)
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-slate-600">
              Versement CP en Brut (€) (AI en juin / prise)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={vars.cpVersementBrut}
              onChange={(e) => updateVar('cpVersementBrut', Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">
              Nb jours CP à déclarer Pajemploi
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={vars.nbJoursCPDeclares}
              onChange={(e) => updateVar('nbJoursCPDeclares', Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">
              Heures travaillées le 1er Mai (Maj. 100%)
            </label>
            <input
              type="number"
              step="0.25"
              min="0"
              value={vars.heuresMaj1erMai}
              onChange={(e) => updateVar('heuresMaj1erMai', Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">
              Heures JF / Repos travaillées (Maj. 10%/25%)
            </label>
            <input
              type="number"
              step="0.25"
              min="0"
              value={vars.heuresMajJF}
              onChange={(e) => updateVar('heuresMajJF', Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">
              Régularisation heures normales (€ Brut)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={vars.regularisationNormaleBrut}
              onChange={(e) =>
                updateVar('regularisationNormaleBrut', Number(e.target.value))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">
              Solde CP fin de contrat — ICCP (€ Brut)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={vars.soldeCPFinContratBrut}
              onChange={(e) => updateVar('soldeCPFinContratBrut', Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">
              Indemnité de rupture (1/80e bruts, €)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={vars.indemniteRupture}
              onChange={(e) => updateVar('indemniteRupture', Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">
              CMG touché de la CAF ce mois (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={vars.cmgTouche}
              onChange={(e) => updateVar('cmgTouche', Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      {/* ===================== BULLETIN DE SALAIRE OFFICIEL (IMPRIMABLE) ===================== */}
      <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
        {/* En-tête Bulletin */}
        <div className="border-b-2 border-slate-800 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">
                Bulletin de Salaire — Assistante Maternelle
              </h1>
              <p className="text-xs font-medium text-slate-600">
                Convention collective nationale des assistants maternels du particulier employeur
                (Code NAF 88-91A)
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block rounded-lg bg-slate-900 px-3 py-1 text-sm font-bold text-white">
                Période : {MOIS_NOMS[feuille.mois - 1]} {feuille.annee}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-700">
                Enfant accueilli :{' '}
                <span className="font-bold text-indigo-700">
                  {config.nomEnfant || 'Non renseigné'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="font-bold uppercase text-slate-500">Employeur (Parent)</div>
              <div className="mt-1 font-bold text-slate-900">
                {config.employeurPrenom} {config.employeurNom}
              </div>
              <div className="text-slate-600">{config.employeurAdresse}</div>
              <div className="mt-1 text-slate-700">
                N° Pajemploi : <span className="font-semibold">{config.employeurNumPajemploi || '—'}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="font-bold uppercase text-slate-500">
                Salarié(e) — Assistante Maternelle
              </div>
              <div className="mt-1 font-bold text-slate-900">
                {config.salariePrenom} {config.salarieNom}
              </div>
              <div className="text-slate-600">{config.salarieAdresse}</div>
              <div className="mt-1 text-slate-700">
                N° S.S. : <span className="font-semibold">{config.salarieNumSS || '—'}</span> •
                Région : <span className="font-semibold">{config.region}</span>
              </div>
            </div>
          </div>

          {/* Récapitulatif des heures en haut du bulletin */}
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-100 p-2.5 text-[11px] sm:grid-cols-6">
            <div>
              <span className="text-slate-500">Contrat :</span>{' '}
              <strong className="text-slate-900">
                {config.typeContrat === 'AC'
                  ? '52 sem. (AC)'
                  : config.typeContrat === 'AI'
                  ? `${resultat.contrat.nbSemainesTotalAn} sem. (AI)`
                  : 'Au réel'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">H. réalisées :</span>{' '}
              <strong className="text-slate-900">{resultat.totalHeuresRealisees} h</strong>
            </div>
            <div>
              <span className="text-slate-500">H. à déduire :</span>{' '}
              <strong className="text-rose-700">{resultat.totalHeuresADeduire} h</strong>
            </div>
            <div>
              <span className="text-slate-500">H. compl. :</span>{' '}
              <strong className="text-slate-900">{resultat.totalHeuresComplementaires} h</strong>
            </div>
            <div>
              <span className="text-slate-500">H. maj. prévues :</span>{' '}
              <strong className="text-slate-900">{resultat.totalHeuresMajPrevues} h</strong>
            </div>
            <div>
              <span className="text-slate-500">H. maj. hors contrat :</span>{' '}
              <strong className="text-slate-900">{resultat.totalHeuresMajNonPrevues} h</strong>
            </div>
          </div>
        </div>

        {/* Tableau 1 : REMUNERATION BRUTE */}
        <div className="mt-4">
          <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            1. Rémunération Brute
          </h4>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-y border-slate-300 bg-slate-100 text-left font-bold text-slate-700">
                <th className="py-1.5 pl-2">Libellé</th>
                <th className="py-1.5 text-right">Base (€)</th>
                <th className="py-1.5 text-right">Nombre / Heures</th>
                <th className="py-1.5 pr-2 text-right">Montant Brut (€)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-1.5 pl-2 font-medium">
                  Salaire de base mensuel (heures mensualisées non majorées)
                </td>
                <td className="py-1.5 text-right">
                  {resultat.contrat.tauxHoraireBrut.toFixed(4)}
                </td>
                <td className="py-1.5 text-right">
                  {resultat.contrat.heuresMensualiseesNormales.toFixed(2)} h
                </td>
                <td className="py-1.5 pr-2 text-right font-semibold">
                  {resultat.salaireBaseMensuelBrut.toFixed(2)} €
                </td>
              </tr>

              {resultat.hrsMensuMajoreesBrut > 0 && (
                <tr>
                  <td className="py-1.5 pl-2">
                    Heures mensualisées majorées (+
                    {Math.round(config.tauxMajorationHS * 100)}%)
                  </td>
                  <td className="py-1.5 text-right">
                    {resultat.contrat.tauxHoraireMajoreBrut.toFixed(4)}
                  </td>
                  <td className="py-1.5 text-right">
                    {resultat.contrat.heuresMensualiseesMajorees.toFixed(2)} h
                  </td>
                  <td className="py-1.5 pr-2 text-right font-semibold">
                    {resultat.hrsMensuMajoreesBrut.toFixed(2)} €
                  </td>
                </tr>
              )}

              {resultat.deductionAbsenceCourCassationBrut !== 0 && (
                <tr className="text-rose-700">
                  <td className="py-1.5 pl-2">
                    Déduction d’absence (Calcul Cour de cassation :{' '}
                    {resultat.totalHeuresADeduire}h / {resultat.totalHeuresPotentielles}h pot.)
                  </td>
                  <td className="py-1.5 text-right">—</td>
                  <td className="py-1.5 text-right">-{resultat.totalHeuresADeduire} h</td>
                  <td className="py-1.5 pr-2 text-right font-semibold">
                    {resultat.deductionAbsenceCourCassationBrut.toFixed(2)} €
                  </td>
                </tr>
              )}

              {resultat.totalHeuresComplementaires > 0 && (
                <tr>
                  <td className="py-1.5 pl-2">
                    Heures complémentaires (hors contrat ≤ 45h)
                  </td>
                  <td className="py-1.5 text-right">
                    {(
                      resultat.contrat.tauxHoraireBrut *
                      (1 + config.tauxMajorationHC)
                    ).toFixed(4)}
                  </td>
                  <td className="py-1.5 text-right">
                    {resultat.totalHeuresComplementaires.toFixed(2)} h
                  </td>
                  <td className="py-1.5 pr-2 text-right font-semibold">
                    {resultat.heuresCompBrut.toFixed(2)} €
                  </td>
                </tr>
              )}

              {resultat.heuresMajPrevuesBrut > 0 && (
                <tr>
                  <td className="py-1.5 pl-2">
                    Heures majorées prévues au contrat (+
                    {Math.round(config.tauxMajorationHS * 100)}%)
                  </td>
                  <td className="py-1.5 text-right">
                    {resultat.contrat.tauxHoraireMajoreBrut.toFixed(4)}
                  </td>
                  <td className="py-1.5 text-right">
                    {resultat.totalHeuresMajPrevues.toFixed(2)} h
                  </td>
                  <td className="py-1.5 pr-2 text-right font-semibold">
                    {resultat.heuresMajPrevuesBrut.toFixed(2)} €
                  </td>
                </tr>
              )}

              {resultat.heuresMajNonPrevuesBrut > 0 && (
                <tr>
                  <td className="py-1.5 pl-2">
                    Heures majorées non prévues au contrat (+
                    {Math.round(config.tauxMajorationHS * 100)}%)
                  </td>
                  <td className="py-1.5 text-right">
                    {resultat.contrat.tauxHoraireMajoreBrut.toFixed(4)}
                  </td>
                  <td className="py-1.5 text-right">
                    {resultat.totalHeuresMajNonPrevues.toFixed(2)} h
                  </td>
                  <td className="py-1.5 pr-2 text-right font-semibold">
                    {resultat.heuresMajNonPrevuesBrut.toFixed(2)} €
                  </td>
                </tr>
              )}

              {resultat.maj1erMaiBrut > 0 && (
                <tr>
                  <td className="py-1.5 pl-2">Majoration 1er mai travaillé (+100%)</td>
                  <td className="py-1.5 text-right">
                    {resultat.contrat.tauxHoraireBrut.toFixed(4)}
                  </td>
                  <td className="py-1.5 text-right">{vars.heuresMaj1erMai} h</td>
                  <td className="py-1.5 pr-2 text-right font-semibold">
                    {resultat.maj1erMaiBrut.toFixed(2)} €
                  </td>
                </tr>
              )}

              {resultat.majJFBrut > 0 && (
                <tr>
                  <td className="py-1.5 pl-2">
                    Majoration Jour Férié / Jour de repos travaillé
                  </td>
                  <td className="py-1.5 text-right">
                    {(resultat.contrat.tauxHoraireBrut * vars.tauxMajJF).toFixed(4)}
                  </td>
                  <td className="py-1.5 text-right">{vars.heuresMajJF} h</td>
                  <td className="py-1.5 pr-2 text-right font-semibold">
                    {resultat.majJFBrut.toFixed(2)} €
                  </td>
                </tr>
              )}

              {resultat.cpVersementBrut > 0 && (
                <tr>
                  <td className="py-1.5 pl-2">Congés Payés (Versement)</td>
                  <td className="py-1.5 text-right">—</td>
                  <td className="py-1.5 text-right">{vars.nbJoursCPDeclares} j</td>
                  <td className="py-1.5 pr-2 text-right font-semibold">
                    {resultat.cpVersementBrut.toFixed(2)} €
                  </td>
                </tr>
              )}

              {resultat.regularisationNormaleBrut > 0 && (
                <tr>
                  <td className="py-1.5 pl-2">Régularisation de salaire (Année incomplète)</td>
                  <td className="py-1.5 text-right">—</td>
                  <td className="py-1.5 text-right">—</td>
                  <td className="py-1.5 pr-2 text-right font-semibold">
                    {resultat.regularisationNormaleBrut.toFixed(2)} €
                  </td>
                </tr>
              )}

              {resultat.soldeCPFinContratBrut > 0 && (
                <tr>
                  <td className="py-1.5 pl-2">
                    Solde de congés payés — ICCP (Fin de contrat)
                  </td>
                  <td className="py-1.5 text-right">—</td>
                  <td className="py-1.5 text-right">—</td>
                  <td className="py-1.5 pr-2 text-right font-semibold">
                    {resultat.soldeCPFinContratBrut.toFixed(2)} €
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-y-2 border-slate-800 bg-slate-100 font-extrabold text-slate-900">
                <td colSpan={3} className="py-2 pl-2 text-right uppercase">
                  Total Salaire Brut :
                </td>
                <td className="py-2 pr-2 text-right text-sm">
                  {resultat.totalBrut.toFixed(2)} €
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Tableau 2 : COTISATIONS SOCIALES */}
        <div className="mt-4">
          <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            2. Cotisations Sociales (Prises en charge CAF/MSA selon éligibilité CMG)
          </h4>
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-y border-slate-300 bg-slate-100 font-bold text-slate-700">
                <th className="py-1.5 pl-2 text-left">Organisme / Risque</th>
                <th className="py-1.5 text-right">Base (€)</th>
                <th className="py-1.5 text-right">Taux Sal.</th>
                <th className="py-1.5 text-right">Part Salariale (€)</th>
                <th className="py-1.5 text-right">Taux Pat.</th>
                <th className="py-1.5 pr-2 text-right">Part Patronale (€)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resultat.cotisations.map((c, i) => (
                <tr
                  key={i}
                  className={
                    c.montantSalarial < 0
                      ? 'bg-emerald-50/70 font-semibold text-emerald-800'
                      : ''
                  }
                >
                  <td className="py-1 pl-2">{c.libelle}</td>
                  <td className="py-1 text-right">{c.base.toFixed(2)}</td>
                  <td className="py-1 text-right">
                    {c.tauxSalarial !== 0 ? `${(c.tauxSalarial * 100).toFixed(2)}%` : '—'}
                  </td>
                  <td className="py-1 text-right font-medium">
                    {c.montantSalarial !== 0 ? `${c.montantSalarial.toFixed(2)} €` : '—'}
                  </td>
                  <td className="py-1 text-right">
                    {c.tauxPatronal !== 0 ? `${(c.tauxPatronal * 100).toFixed(3)}%` : '—'}
                  </td>
                  <td className="py-1 pr-2 text-right text-slate-600">
                    {c.montantPatronal !== 0 ? `${c.montantPatronal.toFixed(2)} €` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-y border-slate-400 bg-slate-100 font-bold text-slate-900">
                <td colSpan={3} className="py-1.5 pl-2 text-right uppercase">
                  Total des Cotisations Sociales :
                </td>
                <td className="py-1.5 text-right">
                  {resultat.totalCotisationsSalariales.toFixed(2)} €
                </td>
                <td></td>
                <td className="py-1.5 pr-2 text-right">
                  {resultat.totalCotisationsPatronales.toFixed(2)} €
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Section 3 : NET, INDEMNITES ET NET A PAYER */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Salaire Net (hors indemnités) :</span>
              <strong className="text-slate-900">
                {resultat.salaireNetAvantImpot.toFixed(2)} €
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Montant Net Social :</span>
              <strong className="text-slate-900">
                {resultat.montantNetSocial.toFixed(2)} €
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">
                Salaire Net Imposable (hors IE/IR) :
              </span>
              <strong className="text-slate-900">
                {resultat.salaireNetImposableHorsIEIR.toFixed(2)} €
              </strong>
            </div>
            <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-500">
              <div>
                <strong>Déclaration revenus AM (abattement fiscal) :</strong>
              </div>
              <div>
                • Jours réels de ≥ 8h :{' '}
                <strong>{resultat.declarationRevenusAM.nbJoursReelsPlus8h} j</strong> | Heures
                jours &lt; 8h :{' '}
                <strong>{resultat.declarationRevenusAM.nbHeuresReellesJoursMoins8h} h</strong>
              </div>
              <div>
                • Net imposable y compris IE & IR :{' '}
                <strong>
                  {resultat.declarationRevenusAM.salaireNetImposablePlusIEIR.toFixed(2)} €
                </strong>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border-2 border-slate-800 bg-slate-900 p-4 text-xs text-white">
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Salaire Net :</span>
                <span>+{resultat.salaireNetAvantImpot.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Indemnités d’entretien (IE) :</span>
                <span>+{resultat.totalIE.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Indemnités de repas (IR) :</span>
                <span>+{resultat.totalIR.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Indemnités kilométriques (IK) :</span>
                <span>+{resultat.totalIK.toFixed(2)} €</span>
              </div>
              {resultat.indemniteRupture > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Indemnité de rupture (1/80e) :</span>
                  <span>+{resultat.indemniteRupture.toFixed(2)} €</span>
                </div>
              )}
              {resultat.montantImpotPAS > 0 && (
                <div className="flex justify-between text-rose-300">
                  <span>Impôt sur le revenu (PAS {config.tauxImpositionPAS}%) :</span>
                  <span>-{resultat.montantImpotPAS.toFixed(2)} €</span>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-baseline justify-between border-t border-slate-700 pt-3">
              <div>
                <div className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                  Net à payer au salarié
                </div>
                <div className="text-[10px] text-slate-400">
                  Règlement : {config.modeReglement || 'Virement'}
                </div>
              </div>
              <div className="text-2xl font-extrabold text-emerald-400">
                {resultat.netAPayer.toFixed(2)} €
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-200 pt-2 text-[10px] text-slate-400">
          <span>
            Dans votre intérêt et pour vous aider à faire valoir vos droits, conservez ce
            bulletin de salaire sans limitation de durée.
          </span>
          <span>Conforme au modèle officiel Version du 11/07/2026</span>
        </div>
      </div>
    </div>
  );
};
