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
  Sliders,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
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
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [showFullPayslip, setShowFullPayslip] = useState(false);

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
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Carte Principale : Net à Payer */}
      <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-md print:hidden">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">
              {MOIS_NOMS[feuille.mois - 1]} {feuille.annee} • Net à verser à {config.salariePrenom || 'votre AM'}
            </span>
            <div className="mt-1 text-3xl font-extrabold text-emerald-400">
              {resultat.netAPayer.toFixed(2)} €
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowFullPayslip(true);
              setTimeout(() => window.print(), 100);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
          >
            <Printer className="h-4 w-4" /> PDF / Imprimer
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 text-xs">
          <div>
            <span className="block text-[11px] text-slate-400">Salaire net</span>
            <strong className="text-sm text-white">
              {resultat.salaireNetAvantImpot.toFixed(2)} €
            </strong>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400">Entretien (IE)</span>
            <strong className="text-sm text-white">{resultat.totalIE.toFixed(2)} €</strong>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400">Repas + KM</span>
            <strong className="text-sm text-white">
              {(resultat.totalIR + resultat.totalIK).toFixed(2)} €
            </strong>
          </div>
        </div>
      </div>

      {/* Alerte Plafond CAF si dépassement */}
      {p.depassementPlafondCAF && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900 print:hidden">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="text-xs">
            <p className="font-bold">Attention : Dépassement du plafond CAF !</p>
            <p className="mt-0.5">
              Le tarif calculé ({p.ratioPlafondCAF.toFixed(2)} €) dépasse le plafond CAF (
              {resultat.bareme.plafondCAF} €).
            </p>
          </div>
        </div>
      )}

      {/* Encadré Déclaration Pajemploi (Épuré, 2 colonnes sur mobile) */}
      <div className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-2xs print:hidden">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              À déclarer sur Pajemploi
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Touchez pour copier</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            {
              key: 'sn',
              label: 'Salaire net (hors IE/IR)',
              val: p.salaireNetDeclare.toFixed(2),
              unit: '€',
              primary: true,
            },
            {
              key: 'hn',
              label: 'Heures normales',
              val: p.heuresNormales,
              unit: 'h',
            },
            {
              key: 'ja',
              label: 'Jours d’activité',
              val: p.joursActivite,
              unit: 'j',
            },
            {
              key: 'ie',
              label: 'Indemnités entretien',
              val: p.ie.toFixed(2),
              unit: '€',
            },
            {
              key: 'ir',
              label: 'Indemnités repas',
              val: p.ir.toFixed(2),
              unit: '€',
            },
            {
              key: 'thn',
              label: 'Taux horaire net',
              val: p.tauxHoraireNet.toFixed(2),
              unit: '€',
            },
            ...(p.nbCP > 0
              ? [{ key: 'cp', label: 'Jours de CP', val: p.nbCP, unit: 'j' }]
              : []),
            ...(p.heuresComplementaires > 0
              ? [
                  {
                    key: 'hc',
                    label: 'Heures compl.',
                    val: p.heuresComplementaires,
                    unit: 'h',
                  },
                ]
              : []),
            ...(p.heuresMajorees > 0
              ? [
                  {
                    key: 'hm',
                    label: 'Heures majorées',
                    val: p.heuresMajorees,
                    unit: 'h',
                  },
                ]
              : []),
            ...(p.ik > 0
              ? [{ key: 'ik', label: 'Indemnités KM', val: p.ik.toFixed(2), unit: '€' }]
              : []),
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => copyValue(item.key, item.val)}
              className={`flex flex-col justify-between rounded-xl border p-3 text-left active:scale-[0.98] ${
                item.primary
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-slate-50/70 text-slate-900'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span
                  className={`text-[11px] font-medium ${
                    item.primary ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
                {copiedKey === item.key ? (
                  <Check
                    className={`h-3.5 w-3.5 ${
                      item.primary ? 'text-emerald-300' : 'text-emerald-600'
                    }`}
                  />
                ) : (
                  <Copy
                    className={`h-3.5 w-3.5 ${
                      item.primary ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  />
                )}
              </div>
              <div className="mt-1 text-lg font-extrabold">
                {item.val} <span className="text-xs font-normal">{item.unit}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Accordéon 1 : Ajustements ponctuels du mois */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs print:hidden">
        <button
          type="button"
          onClick={() => setShowAdjustments(!showAdjustments)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left"
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="h-4 w-4 text-indigo-600" />
            <div>
              <span className="block text-xs font-bold text-slate-800">
                Options ponctuelles du mois (Congés payés AI, CMG, Fin de contrat...)
              </span>
              <span className="text-[11px] text-slate-500">
                Optionnel — uniquement si vous avez un versement de CP ou une prime ce mois-ci
              </span>
            </div>
          </div>
          {showAdjustments ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {showAdjustments && (
          <div className="grid grid-cols-1 gap-3 border-t border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600">
                CMG reçu de la CAF (€) (pour calcul impôts)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={vars.cmgTouche}
                onChange={(e) => updateVar('cmgTouche', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">
                Versement CP en Brut (€) (en Année Incomplète)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={vars.cpVersementBrut}
                onChange={(e) => updateVar('cpVersementBrut', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
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
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">
                Régularisation / Solde CP fin de contrat (€ Brut)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={vars.soldeCPFinContratBrut}
                onChange={(e) =>
                  updateVar('soldeCPFinContratBrut', Number(e.target.value))
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Accordéon 2 : Bulletin de salaire complet (toujours visible à l'impression) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs print:border-0 print:shadow-none">
        <button
          type="button"
          onClick={() => setShowFullPayslip(!showFullPayslip)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left print:hidden"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-indigo-600" />
            <div>
              <span className="block text-xs font-bold text-slate-800">
                Voir le Bulletin de salaire détaillé (Brut, Cotisations, Net imposable)
              </span>
              <span className="text-[11px] text-slate-500">
                Total brut : {resultat.totalBrut.toFixed(2)} € • Net social :{' '}
                {resultat.montantNetSocial.toFixed(2)} €
              </span>
            </div>
          </div>
          {showFullPayslip ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>

        <div
          className={`${
            showFullPayslip ? 'block' : 'hidden print:block'
          } border-t border-slate-100 p-4 sm:p-6 print:border-0 print:p-0`}
        >
          {/* En-tête Bulletin */}
          <div className="border-b-2 border-slate-800 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-base font-extrabold uppercase text-slate-900 sm:text-lg">
                  Bulletin de Salaire — Assistante Maternelle
                </h1>
                <p className="text-[11px] text-slate-500">
                  CCN des assistants maternels du particulier employeur (NAF 88-91A)
                </p>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-slate-900">
                  {MOIS_NOMS[feuille.mois - 1]} {feuille.annee}
                </div>
                <div className="text-slate-600">Enfant : {config.nomEnfant}</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Employeur
                </div>
                <div className="font-bold text-slate-900">
                  {config.employeurPrenom} {config.employeurNom}
                </div>
                <div className="text-slate-600">{config.employeurAdresse}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Salarié(e)
                </div>
                <div className="font-bold text-slate-900">
                  {config.salariePrenom} {config.salarieNom}
                </div>
                <div className="text-slate-600">{config.salarieAdresse}</div>
              </div>
            </div>
          </div>

          {/* Rémunération brute */}
          <div className="mt-4">
            <h4 className="mb-2 text-xs font-bold uppercase text-slate-700">
              1. Rémunération Brute
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1">
                <span>
                  Salaire de base ({resultat.contrat.heuresMensualiseesBaseDF18.toFixed(2)}h ×{' '}
                  {resultat.contrat.tauxHoraireBrut.toFixed(3)}€)
                </span>
                <strong className="text-slate-900">
                  {resultat.salaireBaseMensuelBrut.toFixed(2)} €
                </strong>
              </div>

              {resultat.hrsMensuMajoreesBrut > 0 && (
                <div className="flex justify-between py-1">
                  <span>
                    Heures mensualisées majorées ({resultat.contrat.heuresMensualiseesMajoreesDF19.toFixed(2)}h)
                  </span>
                  <strong>+{resultat.hrsMensuMajoreesBrut.toFixed(2)} €</strong>
                </div>
              )}

              {resultat.deductionAbsenceCourCassationBrut !== 0 && (
                <div className="flex justify-between py-1 text-rose-700">
                  <span>
                    Absence déduite Cour de cassation ({resultat.totalHeuresADeduire}h /{' '}
                    {resultat.totalHeuresPotentielles}h)
                  </span>
                  <strong>{resultat.deductionAbsenceCourCassationBrut.toFixed(2)} €</strong>
                </div>
              )}

              {resultat.heuresCompBrut > 0 && (
                <div className="flex justify-between py-1">
                  <span>
                    Heures complémentaires ({resultat.totalHeuresComplementaires}h)
                  </span>
                  <strong>+{resultat.heuresCompBrut.toFixed(2)} €</strong>
                </div>
              )}

              {(resultat.heuresMajPrevuesBrut > 0 ||
                resultat.heuresMajNonPrevuesBrut > 0) && (
                <div className="flex justify-between py-1">
                  <span>Heures majorées (&gt;45h)</span>
                  <strong>
                    +
                    {(
                      resultat.heuresMajPrevuesBrut + resultat.heuresMajNonPrevuesBrut
                    ).toFixed(2)}{' '}
                    €
                  </strong>
                </div>
              )}

              {resultat.cpVersementBrut > 0 && (
                <div className="flex justify-between py-1">
                  <span>Congés payés versés</span>
                  <strong>+{resultat.cpVersementBrut.toFixed(2)} €</strong>
                </div>
              )}

              <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-extrabold text-slate-900">
                <span>Total Salaire Brut</span>
                <span>{resultat.totalBrut.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Cotisations sociales */}
          <div className="mt-4 overflow-x-auto">
            <h4 className="mb-2 text-xs font-bold uppercase text-slate-700">
              2. Cotisations Sociales
            </h4>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-left text-slate-600">
                  <th className="py-1.5">Cotisation</th>
                  <th className="py-1.5 text-right">Salarié</th>
                  <th className="py-1.5 text-right">Employeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resultat.cotisations.map((c, i) => (
                  <tr key={i}>
                    <td className="py-1 pr-2">{c.libelle}</td>
                    <td className="py-1 text-right font-medium">
                      {c.montantSalarial !== 0 ? `${c.montantSalarial.toFixed(2)} €` : '—'}
                    </td>
                    <td className="py-1 text-right text-slate-500">
                      {c.montantPatronal !== 0 ? `${c.montantPatronal.toFixed(2)} €` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-300 font-bold">
                  <td className="py-1.5">Total Cotisations</td>
                  <td className="py-1.5 text-right">
                    {resultat.totalCotisationsSalariales.toFixed(2)} €
                  </td>
                  <td className="py-1.5 text-right">
                    {resultat.totalCotisationsPatronales.toFixed(2)} €
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mentions fiscales AM */}
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Montant Net Social :</span>
              <strong>{resultat.montantNetSocial.toFixed(2)} €</strong>
            </div>
            <div className="mt-1 flex justify-between">
              <span>Net Imposable (hors IE/IR) :</span>
              <strong>{resultat.salaireNetImposableHorsIEIR.toFixed(2)} €</strong>
            </div>
            <div className="mt-1 flex justify-between">
              <span>
                Impôts AM (Jours ≥ 8h : {resultat.declarationRevenusAM.nbJoursReelsPlus8h}j |
                Heures &lt; 8h : {resultat.declarationRevenusAM.nbHeuresReellesJoursMoins8h}h)
              </span>
              <strong>
                Net imp. + IE/IR :{' '}
                {resultat.declarationRevenusAM.salaireNetImposablePlusIEIR.toFixed(2)} €
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
