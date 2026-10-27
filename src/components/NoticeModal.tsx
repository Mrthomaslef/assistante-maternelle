import React from 'react';
import { X, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const NoticeModal: React.FC<Props> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-indigo-950 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-indigo-300" />
            <div>
              <h2 className="text-base font-bold">
                Notice Officielle de Remplissage (Version du 11/07/2026)
              </h2>
              <p className="text-xs text-indigo-200">
                Règles de la Convention Collective Nationale des Assistants Maternels
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-indigo-200 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-6 text-xs leading-relaxed text-slate-700">
          {/* Nouvelles terminologies */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-indigo-950">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Nouvelles terminologies de la
              Convention Collective
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-indigo-900">
              <li>
                <strong>Accueil 52 semaines</strong> par période de 12 mois consécutifs
                (Anciennement <em>Année Complète - AC</em>)
              </li>
              <li>
                <strong>Accueil 46 semaines ou moins</strong> par période de 12 mois consécutifs
                (Anciennement <em>Année Incomplète - AI</em>)
              </li>
            </ul>
          </div>

          {/* Tableau récapitulatif des colonnes */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-slate-900">
              Tableau des cas de figure (appliqués automatiquement par le sélecteur Situation)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 font-bold text-slate-700">
                    <th className="p-2.5">Situation</th>
                    <th className="p-2.5">Contrat AI (≤ 46 sem.)</th>
                    <th className="p-2.5">Contrat AC (52 sem.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 font-semibold">Cas général travaillé</td>
                    <td colSpan={2} className="p-2.5">
                      <strong>Col 1 & 2 :</strong> Planning normal du contrat •{' '}
                      <strong>Col 3 :</strong> Heures réellement effectuées •{' '}
                      <strong>Col 4 :</strong> Heures à déduire (si départ anticipé/arrivée tardive
                      AM)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">
                      Avant le début / Après la fin du contrat
                    </td>
                    <td colSpan={2} className="p-2.5">
                      <strong>Col 2 (Potentielles) et Col 4 (À déduire)</strong> avec les heures du
                      planning
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">Pendant l’adaptation</td>
                    <td colSpan={2} className="p-2.5">
                      <strong>Col 1 & 2 :</strong> Planning normal • <strong>Col 3 :</strong> Heures
                      réellement effectuées • <strong>Col 4 :</strong> Heures non effectuées à
                      déduire
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">
                      Semaines d’absence prévues au contrat (PE ou AM)
                    </td>
                    <td className="p-2.5">
                      <strong>Colonne 2 uniquement</strong> (Heures potentielles)
                    </td>
                    <td className="p-2.5 text-slate-400">Non applicable (N/A)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">Pendant les Congés Payés de l’AM</td>
                    <td className="p-2.5 text-slate-400">Colonne 2 uniquement</td>
                    <td className="p-2.5">
                      <strong>Colonnes 1 et 2</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">
                      Congés sans solde / Enfant malade (avec certif.) / Maladie AM
                    </td>
                    <td className="p-2.5">
                      Semaine travaillée : <strong>Col 1, 2 et 4</strong>
                      <br />
                      Semaine d’absence AI : <strong>Col 2 et 4</strong> (si maladie AM)
                    </td>
                    <td className="p-2.5">
                      <strong>Colonnes 1, 2 et 4</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">
                      Jour férié (sur un jour prévu au contrat)
                    </td>
                    <td className="p-2.5">
                      Semaine travaillée : <strong>Col 1 et 2</strong>
                      <br />
                      Semaine d’absence AI : <strong>Col 2</strong>
                    </td>
                    <td className="p-2.5">
                      <strong>Colonnes 1 et 2</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">
                      Convenance personnelle de l’employeur
                    </td>
                    <td colSpan={2} className="p-2.5">
                      <strong>Colonnes 1 et 2 uniquement</strong> (Col 3 = 0h : journée payée sans
                      IE, ni IR, ni IK)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">
                      Heures complémentaires sur un jour non prévu
                    </td>
                    <td colSpan={2} className="p-2.5">
                      <strong>Colonnes 3 et 6</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Précisions détaillées */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="font-bold text-slate-900">
                1. Premier mois, Dernier mois & Adaptation
              </h4>
              <p className="mt-1">
                Si votre contrat ne débute pas le 1er du mois (ou ne se termine pas le dernier jour
                du mois) ou pendant la période d’adaptation, les heures non effectuées sont déduites
                par le <strong>calcul de la Cour de cassation</strong> :
              </p>
              <p className="mt-1 font-mono text-[11px] font-semibold text-indigo-800">
                Déduction = Mensualisation × (Heures à déduire ÷ Heures potentielles du mois)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="font-bold text-slate-900">
                2. Absence enfant : Convenance perso vs Maladie
              </h4>
              <p className="mt-1">
                • <strong>Convenance personnelle employeur</strong> (vous gardez votre enfant sans
                certificat médical ou visitez la famille) : le salaire est maintenu, seules les
                indemnités (IE, IR, IK) ne sont pas dues.
                <br />• <strong>Enfant malade avec certificat médical</strong> : déductible jusqu’à{' '}
                <strong>5 jours par année glissante</strong> (ou 14 jours consécutifs en cas
                d’hospitalisation), sauf clause contractuelle de maintien de salaire.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 md:col-span-2">
              <h4 className="flex items-center gap-1.5 font-bold text-slate-900">
                <AlertCircle className="h-4 w-4 text-amber-600" /> 3. Heures complémentaires et
                supplémentaires
              </h4>
              <p className="mt-1">
                Elles s’apprécient à la semaine :
                <br />• <strong>Heures complémentaires (Col 6)</strong> : heures réalisées au-delà
                du planning hebdomadaire prévu au contrat et <strong>jusqu’à 45h/semaine</strong>.
                <br />• <strong>Heures supplémentaires / majorées (Col 7 et 8)</strong> : heures
                réalisées <strong>au-delà de 45h/semaine</strong> (majorées d’au minimum 10%).
                <br />
                <em>Exemple :</em> Contrat de 38h/semaine, 48h réalisées = 7 heures complémentaires
                (de 38h à 45h) + 3 heures supplémentaires majorées (de 45h à 48h).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
