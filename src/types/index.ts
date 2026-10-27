export type RegionType = 'Autres' | 'Alsace-Moselle';

export type TypeContrat = 'AC' | 'AI' | 'Reel'; // AC = 52 semaines, AI = 46 semaines ou moins, Reel = Au réel

export interface BaremePeriode {
  region: RegionType;
  dateDeb: string; // YYYY-MM-DD
  dateFin: string; // YYYY-MM-DD
  tauxConversionBrutNet: number;
  ieMinConvJour: number;
  ieMinConvHeure: number;
  // Part salariale
  salSanteMaladie: number;
  salSanteATMP: number;
  salRetraiteSS: number;
  salRetraiteIRCEM: number;
  salFamille: number;
  salChomage: number;
  salIrcemPrevoyance: number;
  salContribSante: number;
  salFormationPro: number;
  salCsgCrdsNonDeductible: number; // sur 98.25% du brut
  salCsgDeductible: number; // sur 98.25% du brut
  salExonerationHCHS: number; // ex: -0.1131
  // Part patronale
  patSanteMaladie: number;
  patSanteATMP: number;
  patRetraiteSS: number;
  patRetraiteIRCEM: number;
  patFamille: number;
  patChomage: number;
  patIrcemPrevoyance: number;
  patContribSante: number; // plafonnée à 5€
  patFormationPro: number;
  // Plafonds et minimums
  plafondCAF: number; // avant sept 2025: plafond journalier brut (~59.40€), à partir de sept 2025: plafond horaire (8.00€ / 8.09€)
  smicHoraire: number;
  txHoraireBrutMini: number;
}

export interface SemaineType {
  id: string; // 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  label: string;
  active: boolean;
  nbSemainesAn: number;
  // Planning par jour de la semaine (Lundi=1 ... Dimanche=0 ou index 0=Lundi..6=Dimanche)
  heuresParJour: [number, number, number, number, number, number, number]; // Lun, Mar, Mer, Jeu, Ven, Sam, Dim
}

export interface ContratConfig {
  // Identité
  nomEnfant: string;
  dateDebutContrat: string;
  region: RegionType;
  typeContrat: TypeContrat;
  employeurNom: string;
  employeurPrenom: string;
  employeurAdresse: string;
  employeurNumPajemploi: string;
  salarieNom: string;
  salariePrenom: string;
  salarieAdresse: string;
  salarieNumSS: string;

  // Semaines et heures
  majorationHSMensualisee: boolean;
  tauxMajorationHS: number; // ex: 0.10 pour 10% (min légal 10%)
  tauxMajorationHC: number; // ex: 0 (facultatif)
  semainesTypes: SemaineType[];

  // Tarifs
  tauxHoraireBrut: number;
  ieHoraireContractuelle: number; // par heure (ex: 0.435 ou plus)
  ieJournaliereContractuelle: number; // forfait par jour minimum (ex: 2.65 ou 3.80)
  repas1Label: string;
  repas1Tarif: number;
  repas2Label: string;
  repas2Tarif: number;
  repas3Label: string;
  repas3Tarif: number;
  repasFournisParentsValeurJour: number; // pour déclaration revenus AM (si repas fournis par PE)
  tarifKm: number;
  tauxImpositionPAS: number; // prélèvement à la source en % (ex: 0)
  modeReglement: string;
}

export type SituationJour =
  | 'normal' // Cas général travaillé (Col 1, 2, 3)
  | 'convenance_pe' // Convenance perso employeur : payé sans IE/IR/IK (Col 1, 2, H réalisées = 0)
  | 'absence_deduite' // Maladie enfant avec certif, convenance AM, sans solde, arrêt maladie AM (Col 1, 2, 4)
  | 'adaptation' // Période d'adaptation (Col 1, 2, 3, et Col 4 = Col 1 - Col 3)
  | 'avant_apres_contrat' // Avant le début ou après la fin du contrat (Col 2 et Col 4)
  | 'semaine_absence_ai' // Semaine d'absence prévue au contrat en AI (Col 2 uniquement)
  | 'conges_payes_am' // Congés payés de l'AM (AC: Col 1 et 2, AI: rien)
  | 'ferie_chome' // Jour férié chômé sur jour prévu (Col 1 et 2, H réalisées = 0)
  | 'ferie_semaine_abs_ai' // Jour férié sur semaine d'absence AI (Col 2 uniquement)
  | 'hors_contrat' // Jour non prévu au contrat mais travaillé (Col 3 et Col 6)
  | 'repos'; // Jour non travaillé habituel (week-end / repos)

export interface JourPresence {
  date: string; // YYYY-MM-DD
  situation: SituationJour;
  heuresPrevues: number; // Col 1
  heuresPotentielles: number; // Col 2
  heuresRealisees: number; // Col 3
  heuresADeduire: number; // Col 4
  heuresComplementaires: number; // Col 6 (hors contrat <= 45h)
  heuresMajPrevues: number; // Col 7 (au-delà de 45h prévues au contrat)
  heuresMajNonPrevues: number; // Col 8 (hors contrat > 45h)
  repas1: number; // Col 11
  repas2: number; // Col 12
  repas3: number; // Col 13
  km: number; // Col 14 (déjà divisé par nb enfants ou brut)
  commentaire: string; // Col 15
  ieForcagle?: number | null; // optionnel si l'utilisateur veut forcer l'IE du jour
}

export interface ElementsVariablesBulletin {
  heuresMaj1erMai: number; // Majoration 1er mai travaillé (100%)
  tauxMajJF: number; // Taux majoration JF travaillé (min 10%) ou repos (min 25%), ex 0.10
  heuresMajJF: number; // Nb d'heures JF / repos travaillées à majorer
  cpVersementBrut: number; // Montant brut CP versés (en AI ou maintien/10%)
  nbJoursCPDeclares: number; // Nb de jours de CP à déclarer sur Pajemploi ce mois-ci
  regularisationNormaleBrut: number; // Régularisation heures normales (fin de contrat / AI)
  regularisationMajorationBrut: number; // Régularisation heures majorées
  inclurePrimePrecarite: boolean; // CDD uniquement (10%)
  soldeCPFinContratBrut: number; // Solde de congés payés (fin de contrat)
  indemniteRupture: number; // Indemnité de rupture (1/80e des salaires bruts versés, exonérée)
  cmgTouche: number; // Pour le suivi déclaration revenus / reste à charge
  commentaireBulletin: string;
  dateEdition: string;
}

export interface FeuilleMensuelle {
  id: string; // ex: "2026-10"
  annee: number;
  mois: number; // 1 à 12
  label: string; // ex: "2026_Octobre"
  jours: JourPresence[];
  variables: ElementsVariablesBulletin;
}
