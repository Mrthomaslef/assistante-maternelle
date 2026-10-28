import React, { useState } from 'react';
import { ContratConfig, FeuilleMensuelle } from '../types';
import { calculerResultatMensuel, calculerSyntheseContrat } from '../utils/calculs';
import { MOIS_NOMS } from '../data/baremes';
import {
  TrendingUp,
  Award,
  Landmark,
  Scale,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Palmtree,
  Briefcase,
} from 'lucide-react';

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
  const [showCPCalc, setShowCPCalc] = useState(false);
  const [showFranceTravail, setShowFranceTravail] = useState(false);
  const [nbEnfantsMoins15AM, setNbEnfantsMoins15AM] = useState(0);
  const [joursFractionnement, setJoursFractionnement] = useState(0);
  const [nbSemainesTravailleesAI, setNbSemainesTravailleesAI] = useState(44);

  const sorted = [...feuilles].sort((a, b) =>
    a.annee !== b.annee ? b.annee - a.annee : b.mois - b.mois
  );

  const lignes = sorted.map((f) => ({
    feuille: f,
    res: calculerResultatMensuel(config, f),
  }));

  const syntheseContrat = calculerSyntheseContrat(config);

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
  const cumulEcartHeuresMajAI = lignes.reduce(
    (acc, l) => acc + l.res.regulAI.ecartHeuresMaj,
    0
  );

  // Formule Régul de salaire du 02/04/2026 : =SI(B12+C12-D12-E12<0; 0; B12+C12-D12-E12)
  // Compensation entre heures normales et majorées, jamais de remboursement si trop-perçu employeur (<0 -> 0)
  const soldeRegulNormaleBrut = cumulEcartHeuresAI * config.tauxHoraireBrut;
  const soldeRegulMajBrut =
    cumulEcartHeuresMajAI *
    config.tauxHoraireBrut *
    (1 + config.tauxMajorationHS);
  const montantRegulAIBrut = Math.max(
    0,
    Number((soldeRegulNormaleBrut + soldeRegulMajBrut).toFixed(2))
  );

  // Indemnité de rupture (1/80e de tous les salaires bruts versés, si >= 9 mois d'ancienneté)
  const indemniteRuptureEstimee = cumulBrut / 80;

  // Calcul des Congés Payés selon la formule officielle de l'Excel (23/06/2024 & 11/07/2026) :
  // =SI((CP_base + Enfants*2)>30; 30; ARRONDI.SUP(CP_base + Enfants*2; 0)) + JoursFractionnement
  const cpBaseOuvrables =
    config.typeContrat === 'AC'
      ? Math.min(30, lignes.length * 2.5)
      : (nbSemainesTravailleesAI / 4) * 2.5;
  const cpOuvrablesAvantFrac = Math.min(
    30,
    Math.ceil(cpBaseOuvrables) + nbEnfantsMoins15AM * 2
  );
  const totalJoursCPOuvrablesAcquis = cpOuvrablesAvantFrac + joursFractionnement;

  // Maintien de salaire : (Nb jours ouvrables acquis / 6) * Heures moyennes par semaine * Taux horaire brut
  const montantCPMaintienSalaireBrut =
    (totalJoursCPOuvrablesAcquis / 6) *
    syntheseContrat.heuresMoyenneParSemaine *
    config.tauxHoraireBrut;
  // Règle des 10% : 10% des salaires bruts perçus sur la période de référence
  const montantCP10PourcentBrut = cumulBrut * 0.1;
  // On retient le plus favorable pour le salarié : MAX(Maintien, 10%)
  const montantCPRetenuBrut = Math.max(
    montantCPMaintienSalaireBrut,
    montantCP10PourcentBrut
  );

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
            Salaires nets + IE − CMG
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
            Hors CP : {cumulBrutHorsCP.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Accordéon 1 : Calculateur officiel des Congés Payés (Maintien vs 10%) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <button
          type="button"
          onClick={() => setShowCPCalc(!showCPCalc)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left"
        >
          <div className="flex items-center gap-2.5">
            <Palmtree className="h-4 w-4 text-teal-600" />
            <div>
              <span className="block text-xs font-bold text-slate-800">
                Calculateur Congés Payés (Maintien de salaire vs 10%)
              </span>
              <span className="text-[11px] text-slate-500">
                {totalJoursCPOuvrablesAcquis} j ouvrables acquis • Montant plus favorable :{' '}
                <strong>{montantCPRetenuBrut.toFixed(2)} € brut</strong>
              </span>
            </div>
          </div>
          {showCPCalc ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {showCPCalc && (
          <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-4 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {config.typeContrat === 'AI' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Nb semaines travaillées / assimilées (AI)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="52"
                    value={nbSemainesTravailleesAI}
                    onChange={(e) =>
                      setNbSemainesTravailleesAI(Number(e.target.value))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600">
                  Enfants &lt; 15 ans de l’AM au 30/04 (+2j/enf)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={nbEnfantsMoins15AM}
                  onChange={(e) => setNbEnfantsMoins15AM(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600">
                  Jours de fractionnement (+0 à 2j)
                </label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  value={joursFractionnement}
                  onChange={(e) =>
                    setJoursFractionnement(Number(e.target.value))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="block text-[11px] text-slate-500">
                  1. Méthode Maintien de salaire
                </span>
                <strong className="mt-0.5 block text-base text-slate-900">
                  {montantCPMaintienSalaireBrut.toFixed(2)} € brut
                </strong>
                <span className="text-[10px] text-slate-400">
                  ({totalJoursCPOuvrablesAcquis}j ÷ 6 ×{' '}
                  {syntheseContrat.heuresMoyenneParSemaine.toFixed(1)}h/sem)
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="block text-[11px] text-slate-500">
                  2. Méthode 10% des bruts
                </span>
                <strong className="mt-0.5 block text-base text-slate-900">
                  {montantCP10PourcentBrut.toFixed(2)} € brut
                </strong>
                <span className="text-[10px] text-slate-400">
                  (10% de {cumulBrut.toFixed(2)} € brut)
                </span>
              </div>

              <div className="rounded-xl border border-teal-300 bg-teal-50 p-3">
                <span className="block text-[11px] font-bold text-teal-800">
                  Montant retenu (le plus favorable)
                </span>
                <strong className="mt-0.5 block text-base text-teal-900">
                  {montantCPRetenuBrut.toFixed(2)} € brut
                </strong>
                <span className="text-[10px] text-teal-700">
                  Soit {(montantCPRetenuBrut * syntheseContrat.bareme.tauxConversionBrutNet).toFixed(2)} € net
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordéon 2 : Aide au remplissage France Travail */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <button
          type="button"
          onClick={() => setShowFranceTravail(!showFranceTravail)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left"
        >
          <div className="flex items-center gap-2.5">
            <Briefcase className="h-4 w-4 text-indigo-600" />
            <div>
              <span className="block text-xs font-bold text-slate-800">
                Aide à l’attestation France Travail (Fin de contrat)
              </span>
              <span className="text-[11px] text-slate-500">
                Salaires bruts hors ICCP et heures réellement effectuées par mois
              </span>
            </div>
          </div>
          {showFranceTravail ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {showFranceTravail && (
          <div className="border-t border-slate-100 p-4 text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500">
                  <th className="py-1.5">Mois</th>
                  <th className="py-1.5 text-right">Salaire Brut (hors ICCP)</th>
                  <th className="py-1.5 text-right">Heures réalisées</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lignes.map(({ feuille: f, res }) => (
                  <tr key={f.id}>
                    <td className="py-1.5 font-semibold">
                      {MOIS_NOMS[f.mois - 1]} {f.annee}
                    </td>
                    <td className="py-1.5 text-right font-medium">
                      {(res.totalBrut - res.soldeCPFinContratBrut).toFixed(2)} €
                    </td>
                    <td className="py-1.5 text-right">
                      {res.totalHeuresRealisees.toFixed(2)} h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Liste des mois enregistrés */}
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
                <span>
                  {res.declarationRevenusAM.nbJoursReelsAccueilTotal}j accueillis
                </span>
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
