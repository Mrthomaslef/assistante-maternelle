import React from 'react';
import { ContratConfig, FeuilleMensuelle } from '../types';
import { calculerResultatMensuel } from '../utils/calculs';
import { MOIS_NOMS } from '../data/baremes';
import { TrendingUp, Award, Landmark, Scale, ChevronRight } from 'lucide-react';

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
    a.annee !== b.annee ? b.annee - a.annee : b.mois - a.mois
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

  const montantRegulAIBrut = Math.max(
    0,
    cumulEcartHeuresAI * config.tauxHoraireBrut
  );
  const indemniteRuptureEstimee = cumulBrut / 80;
  const cp10PourcentBrut = cumulBrutHorsCP * 0.1;
  const resteAChargeFisc = Math.max(0, cumulSalaireNetSeul + cumulIE - cumulCMG);

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Cartes synthèse en grille 2x2 sur mobile */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <TrendingUp className="h-3.5 w-3.5 text-indigo-600" /> Total versé
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-slate-900">
            {cumulNetPaye.toFixed(2)} €
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            Brut : {cumulBrut.toFixed(2)} €
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
            <Landmark className="h-3.5 w-3.5 text-emerald-600" /> Impôts Parent
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-emerald-800">
            {resteAChargeFisc.toFixed(2)} €
          </div>
          <div className="mt-0.5 text-[10px] text-emerald-700">
            Reste à déclarer (hors CMG)
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <Scale className="h-3.5 w-3.5 text-purple-600" /> Régul. AI
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-purple-800">
            {montantRegulAIBrut.toFixed(2)} €
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            Écart : {cumulEcartHeuresAI > 0 ? '+' : ''}
            {cumulEcartHeuresAI.toFixed(1)} h
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <Award className="h-3.5 w-3.5 text-amber-600" /> Rupture (1/80e)
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-amber-700">
            {indemniteRuptureEstimee.toFixed(2)} €
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            CP 10% : {cp10PourcentBrut.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Liste des mois enregistrés (Cartes tactiles sur mobile) */}
      <div className="space-y-2.5">
        <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-slate-500">
          Historique des mois ({lignes.length})
        </h3>

        {lignes.map(({ feuille: f, res }) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onSelectFeuille(f.id)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition hover:border-indigo-300 active:scale-[0.99]"
          >
            <div>
              <div className="text-sm font-bold text-slate-900">
                {MOIS_NOMS[f.mois - 1]} {f.annee}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{res.totalHeuresRealisees}h faites</span>
                <span>•</span>
                <span>{res.declarationRevenusAM.nbJoursReelsAccueilTotal}j accueillis</span>
                {res.totalIE + res.totalIR > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      Frais {(res.totalIE + res.totalIR + res.totalIK).toFixed(2)} €
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-base font-extrabold text-emerald-700">
                  {res.netAPayer.toFixed(2)} €
                </div>
                <div className="text-[11px] text-slate-400">
                  Net : {res.salaireNetAvantImpot.toFixed(2)} €
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
