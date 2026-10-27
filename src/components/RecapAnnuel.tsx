import React from 'react';
import { ContratConfig, FeuilleMensuelle } from '../types';
import { calculerResultatMensuel } from '../utils/calculs';
import { MOIS_NOMS } from '../data/baremes';
import { TrendingUp, Award, Landmark, Scale } from 'lucide-react';

interface Props {
  config: ContratConfig;
  feuilles: FeuilleMensuelle[];
  onSelectFeuille: (id: string) => void;
}

export const RecapAnnuel: React.FC<Props> = ({
  config,
  feuilles,
  onSelectFeuille,
}) => {
  const sorted = [...feuilles].sort((a, b) =>
    a.annee !== b.annee ? a.annee - b.annee : a.mois - b.mois
  );

  const lignes = sorted.map((f) => ({
    feuille: f,
    res: calculerResultatMensuel(config, f),
  }));

  const cumulBrut = lignes.reduce((acc, l) => acc + l.res.totalBrut, 0);
  const cumulBrutHorsCP = lignes.reduce(
    (acc, l) =>
      acc +
      (l.res.totalBrut - l.res.cpVersementBrut - l.res.soldeCPFinContratBrut),
    0
  );
  const cumulNetPaye = lignes.reduce((acc, l) => acc + l.res.netAPayer, 0);
  const cumulSalaireNetSeul = lignes.reduce(
    (acc, l) => acc + l.res.salaireNetAvantImpot,
    0
  );
  const cumulIE = lignes.reduce((acc, l) => acc + l.res.totalIE, 0);
  const cumulCMG = lignes.reduce(
    (acc, l) => acc + (l.feuille.variables.cmgTouche || 0),
    0
  );
  const cumulEcartHeuresAI = lignes.reduce(
    (acc, l) => acc + l.res.regulAI.ecartHeuresNormales,
    0
  );

  const montantRegulAIBrut = Math.max(0, cumulEcartHeuresAI * config.tauxHoraireBrut);
  const indemniteRuptureEstimee = cumulBrut / 80;
  const cp10PourcentBrut = cumulBrutHorsCP * 0.1;
  const resteAChargeFisc = Math.max(0, cumulSalaireNetSeul + cumulIE - cumulCMG);

  return (
    <div className="space-y-6">
      {/* Cartes de synthèse multi-mois */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
            <TrendingUp className="h-4 w-4 text-indigo-600" /> Total Salaires Bruts
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {cumulBrut.toFixed(2)} €
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Total Net payé (avec ind.) : {cumulNetPaye.toFixed(2)} €
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
            <Scale className="h-4 w-4 text-purple-600" /> Régularisation AI (Écart)
          </div>
          <div className="mt-2 text-2xl font-extrabold text-purple-800">
            {cumulEcartHeuresAI > 0 ? `+${cumulEcartHeuresAI.toFixed(2)}` : cumulEcartHeuresAI.toFixed(2)} h
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Soit dû à l’AM : <strong>{montantRegulAIBrut.toFixed(2)} € brut</strong>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
            <Award className="h-4 w-4 text-amber-600" /> Indemnité Rupture (1/80e) & CP 10%
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-700">
            {indemniteRuptureEstimee.toFixed(2)} €
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Base 10% CP (hors CP) : <strong>{cp10PourcentBrut.toFixed(2)} € brut</strong>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-800">
            <Landmark className="h-4 w-4 text-emerald-600" /> Crédit d’impôt Parent
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-800">
            {resteAChargeFisc.toFixed(2)} €
          </div>
          <div className="mt-1 text-xs text-emerald-700">
            À déclarer aux impôts (Salaires nets + IE - CMG)
          </div>
        </div>
      </div>

      {/* Tableau récapitulatif mensuel (Onglet Récapitulatif de l'Excel) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">
            Récapitulatif Chronologique des Bulletins Mensuels
          </h3>
          <p className="text-xs text-slate-500">
            Suivi mensuel des salaires bruts, nets, heures réalisées vs payées (régularisation
            Année Incomplète), France Travail et déclaration fiscale.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 font-bold text-slate-600">
                <th className="px-3 py-3">Mois</th>
                <th className="px-3 py-3 text-right">Salaire Brut</th>
                <th className="px-3 py-3 text-right">Brut hors CP</th>
                <th className="px-3 py-3 text-right">H. Payées</th>
                <th className="px-3 py-3 text-right">H. Réalisées</th>
                <th className="px-3 py-3 text-right">Écart AI (Réel - Payé)</th>
                <th className="px-3 py-3 text-right">Jours réels</th>
                <th className="px-3 py-3 text-right">Salaire Net</th>
                <th className="px-3 py-3 text-right">IE (€)</th>
                <th className="px-3 py-3 text-right">Net à payer</th>
                <th className="px-3 py-3 text-right">CMG CAF</th>
                <th className="px-3 py-3 text-right">À déclarer Impôts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lignes.map(({ feuille: f, res }) => {
                const brutHorsCP =
                  res.totalBrut - res.cpVersementBrut - res.soldeCPFinContratBrut;
                const cmg = f.variables.cmgTouche || 0;
                const aDeclarer = Math.max(
                  0,
                  res.salaireNetAvantImpot + res.totalIE - cmg
                );

                return (
                  <tr
                    key={f.id}
                    onClick={() => onSelectFeuille(f.id)}
                    className="cursor-pointer hover:bg-indigo-50/50"
                  >
                    <td className="px-3 py-2.5 font-bold text-indigo-700">
                      {MOIS_NOMS[f.mois - 1]} {f.annee}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold">
                      {res.totalBrut.toFixed(2)} €
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-600">
                      {brutHorsCP.toFixed(2)} €
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {res.regulAI.heuresNormalesPayees.toFixed(2)} h
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">
                      {res.totalHeuresRealisees.toFixed(2)} h
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right font-semibold ${
                        res.regulAI.ecartHeuresNormales > 0
                          ? 'text-amber-700'
                          : res.regulAI.ecartHeuresNormales < 0
                          ? 'text-slate-500'
                          : 'text-slate-400'
                      }`}
                    >
                      {res.regulAI.ecartHeuresNormales > 0 ? '+' : ''}
                      {res.regulAI.ecartHeuresNormales.toFixed(2)} h
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {res.declarationRevenusAM.nbJoursReelsAccueilTotal} j
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">
                      {res.salaireNetAvantImpot.toFixed(2)} €
                    </td>
                    <td className="px-3 py-2.5 text-right">{res.totalIE.toFixed(2)} €</td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-700">
                      {res.netAPayer.toFixed(2)} €
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-600">
                      {cmg.toFixed(2)} €
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                      {aDeclarer.toFixed(2)} €
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
