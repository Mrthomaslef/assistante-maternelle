import {
  BaremePeriode,
  ContratConfig,
  FeuilleMensuelle,
  JourPresence,
  SituationJour,
} from '../types';
import { getBaremeForDate, getJoursFeries } from '../data/baremes';

export interface SyntheseContrat {
  bareme: BaremePeriode;
  nbSemainesTotalAn: number;
  heuresNormalesAn: number;
  heuresMajoreesAn: number;
  joursAn: number;
  heuresMensualiseesNormales: number;
  heuresMensualiseesMajorees: number;
  heuresMensualiseesTotal: number;
  joursMensualisesExact: number;
  joursMensualisesArrondi: number;
  heuresMoyenneParSemaine: number;
  tauxHoraireBrut: number;
  tauxHoraireNet: number;
  tauxHoraireMajoreBrut: number;
  tauxHoraireMajoreNet: number;
  mensualisationBruteNormale: number;
  mensualisationBruteMajoree: number;
  mensualisationBruteTotale: number;
  mensualisationNetteEstimee: number;
  ieHoraireRetenue: number;
  alerteTauxMiniLegal: boolean;
  alertePlafondCAFContrat: boolean;
}

export interface LigneCotisation {
  libelle: string;
  base: number;
  tauxSalarial: number;
  montantSalarial: number;
  tauxPatronal: number;
  montantPatronal: number;
}

export interface ResultatMensuel {
  contrat: SyntheseContrat;
  bareme: BaremePeriode;
  // Totaux feuille de présence
  totalHeuresPrevues: number;
  totalHeuresPotentielles: number;
  totalHeuresRealisees: number;
  totalHeuresADeduire: number;
  totalJoursPotentiels: number;
  totalJoursAbsence: number;
  totalHeuresComplementaires: number;
  totalHeuresMajPrevues: number;
  totalHeuresMajNonPrevues: number;
  totalJoursEnPlus: number;
  totalIE: number;
  totalRepas1: number;
  totalRepas2: number;
  totalRepas3: number;
  totalIR: number;
  totalKm: number;
  totalIK: number;
  // Rémunération brute
  salaireBaseMensuelBrut: number;
  hrsMensuMajoreesBrut: number;
  deductionAbsenceCourCassationBrut: number;
  heuresCompBrut: number;
  heuresMajPrevuesBrut: number;
  heuresMajNonPrevuesBrut: number;
  maj1erMaiBrut: number;
  majJFBrut: number;
  cpVersementBrut: number;
  regularisationNormaleBrut: number;
  regularisationMajBrut: number;
  primePrecariteBrut: number;
  soldeCPFinContratBrut: number;
  totalBrut: number;
  // Cotisations
  cotisations: LigneCotisation[];
  baseBrutHCHSExonerees: number;
  montantExonerationSalarialeHCHS: number; // valeur positive économisée (cotisation négative)
  totalCotisationsSalariales: number;
  totalCotisationsPatronales: number;
  // Nets & Indemnités
  salaireNetAvantImpot: number;
  montantNetSocial: number;
  salaireNetImposableHorsIEIR: number;
  salaireNetImposableAvecIEIR: number;
  indemniteRupture: number;
  totalIndemnites: number;
  montantImpotPAS: number;
  netAPayer: number;
  // Pajemploi
  pajemploi: {
    heuresNormales: number;
    joursActivite: number;
    nbCP: number;
    heuresComplementaires: number;
    heuresMajorees: number;
    tauxHoraireNet: number;
    salaireNetDeclare: number;
    ie: number;
    ir: number;
    ik: number;
    iccp: number;
    indemniteRupture: number;
    depassementPlafondCAF: boolean;
    ratioPlafondCAF: number;
  };
  // Régularisation AI (mois)
  regulAI: {
    heuresNormalesRealiseesAssimiliees: number;
    heuresNormalesPayees: number;
    ecartHeuresNormales: number;
    heuresMajRealisees: number;
    heuresMajPayees: number;
    ecartHeuresMaj: number;
  };
  // Déclaration revenus AM
  declarationRevenusAM: {
    nbJoursReelsPlus8h: number;
    nbHeuresReellesJoursMoins8h: number;
    nbJoursReelsAccueilTotal: number;
    salaireNetImposablePlusIEIR: number;
    indemniteRepasFournisParents: number;
  };
}

export function calculerSyntheseContrat(
  config: ContratConfig,
  anneeRef = 2026,
  moisRef = 10
): SyntheseContrat {
  const bareme = getBaremeForDate(config.region, anneeRef, moisRef);
  const conv = bareme.tauxConversionBrutNet;

  const actives = config.semainesTypes.filter((s) => s.active && s.nbSemainesAn > 0);

  let nbSemainesTotalAn = 0;
  let heuresNormalesAn = 0;
  let heuresMajoreesAn = 0;
  let joursAn = 0;

  for (const s of actives) {
    const hSem = s.heuresParJour.reduce((a, b) => a + b, 0);
    const jSem = s.heuresParJour.filter((h) => h > 0).length;
    const hNormSem = Math.min(45, hSem);
    const hMajSem = Math.max(0, hSem - 45);

    nbSemainesTotalAn += s.nbSemainesAn;
    heuresNormalesAn += s.nbSemainesAn * hNormSem;
    heuresMajoreesAn += s.nbSemainesAn * hMajSem;
    joursAn += s.nbSemainesAn * jSem;
  }

  const isReel = config.typeContrat === 'Reel';

  const heuresMensualiseesNormales = isReel ? 0 : heuresNormalesAn / 12;
  const heuresMensualiseesMajorees =
    isReel || !config.majorationHSMensualisee ? 0 : heuresMajoreesAn / 12;
  const heuresMensualiseesTotal = heuresMensualiseesNormales + heuresMensualiseesMajorees;

  const joursMensualisesExact = isReel ? 0 : joursAn / 12;
  const joursMensualisesArrondi = Math.ceil(joursMensualisesExact);

  const heuresMoyenneParSemaine =
    nbSemainesTotalAn > 0 ? (heuresNormalesAn + heuresMajoreesAn) / nbSemainesTotalAn : 0;

  const tauxHoraireBrut = config.tauxHoraireBrut;
  const tauxHoraireNet = Number((tauxHoraireBrut * conv).toFixed(4));
  const tauxHoraireMajoreBrut = tauxHoraireBrut * (1 + config.tauxMajorationHS);
  const tauxHoraireMajoreNet = Number((tauxHoraireMajoreBrut * conv).toFixed(4));

  const mensualisationBruteNormale = heuresMensualiseesNormales * tauxHoraireBrut;
  const mensualisationBruteMajoree = heuresMensualiseesMajorees * tauxHoraireMajoreBrut;
  const mensualisationBruteTotale = mensualisationBruteNormale + mensualisationBruteMajoree;
  const mensualisationNetteEstimee = mensualisationBruteTotale * conv;

  const ieHoraireRetenue = Math.max(bareme.ieMinConvHeure, config.ieHoraireContractuelle || 0);

  // Contrôle du minimum légal (Formule AR11 du 11/07/2026)
  const alerteTauxMiniLegal = tauxHoraireBrut < bareme.txHoraireBrutMini;

  // Contrôle plafond CAF (Formule AA10 du 13/09/2025)
  const dateStr = `${anneeRef}-${String(moisRef).padStart(2, '0')}-01`;
  let alertePlafondCAFContrat = false;
  if (dateStr < '2025-09-01') {
    if (joursMensualisesExact > 0 && mensualisationBruteTotale / joursMensualisesExact >= bareme.plafondCAF) {
      alertePlafondCAFContrat = true;
    }
  } else {
    if (tauxHoraireNet > 7) {
      alertePlafondCAFContrat = true;
    }
  }

  return {
    bareme,
    nbSemainesTotalAn,
    heuresNormalesAn,
    heuresMajoreesAn,
    joursAn,
    heuresMensualiseesNormales,
    heuresMensualiseesMajorees,
    heuresMensualiseesTotal,
    joursMensualisesExact,
    joursMensualisesArrondi,
    heuresMoyenneParSemaine,
    tauxHoraireBrut,
    tauxHoraireNet,
    tauxHoraireMajoreBrut,
    tauxHoraireMajoreNet,
    mensualisationBruteNormale,
    mensualisationBruteMajoree,
    mensualisationBruteTotale,
    mensualisationNetteEstimee,
    ieHoraireRetenue,
    alerteTauxMiniLegal,
    alertePlafondCAFContrat,
  };
}

/**
 * Calcule l'indemnité d'entretien (IE) d'une journée selon la CCN :
 * - Uniquement si l'enfant est réellement accueilli (heuresRealisees > 0)
 * - Minimum conventionnel par jour : 2,65 €
 * - Minimum conventionnel par heure : ex. 0,435 €/h (depuis juin 2026)
 */
export function calculerIEJour(
  heuresRealiseesJour: number,
  config: ContratConfig,
  bareme: BaremePeriode,
  ieForcage?: number | null
): number {
  if (ieForcage !== undefined && ieForcage !== null) {
    return ieForcage;
  }
  if (heuresRealiseesJour <= 0) {
    return 0;
  }
  const tarifHoraireIE = Math.max(bareme.ieMinConvHeure, config.ieHoraireContractuelle || 0);
  const minJour = Math.max(bareme.ieMinConvJour, config.ieJournaliereContractuelle || 0);
  return Number(Math.max(minJour, heuresRealiseesJour * tarifHoraireIE).toFixed(2));
}

/**
 * Applique automatiquement les règles de la Notice officielle (Tableau Contrat AI / Contrat AC)
 * lorsqu'on choisit un motif / situation pour un jour donné.
 */
export function appliquerSituationJour(
  jour: JourPresence,
  nouvelleSituation: SituationJour,
  heuresPlanningJour: number,
  typeContrat: ContratConfig['typeContrat']
): JourPresence {
  const hContrat = heuresPlanningJour;
  const updated: JourPresence = {
    ...jour,
    situation: nouvelleSituation,
  };

  switch (nouvelleSituation) {
    case 'normal':
      // Cas général : Col 1, 2, 3 = heures prévues au contrat
      updated.heuresPrevues = hContrat;
      updated.heuresPotentielles = hContrat;
      updated.heuresRealisees = hContrat;
      updated.heuresADeduire = 0;
      updated.heuresComplementaires = 0;
      if (hContrat > 0 && updated.repas1 === 0 && updated.repas2 === 0 && updated.repas3 === 0) {
        updated.repas1 = 1;
        updated.repas2 = hContrat > 5 ? 1 : 0;
        updated.repas3 = 0;
      }
      break;

    case 'convenance_pe':
      // Convenance personnelle employeur : Col 1 et 2 uniquement, H réalisées = 0, pas d'IE/IR/IK
      updated.heuresPrevues = hContrat;
      updated.heuresPotentielles = hContrat;
      updated.heuresRealisees = 0;
      updated.heuresADeduire = 0;
      updated.heuresComplementaires = 0;
      updated.repas1 = 0;
      updated.repas2 = 0;
      updated.repas3 = 0;
      updated.km = 0;
      if (!updated.commentaire) updated.commentaire = 'Absence convenance perso employeur';
      break;

    case 'absence_deduite':
      // Maladie enfant (certificat), convenance AM, sans solde, maladie AM sur sem travaillée : Col 1, 2 et 4
      updated.heuresPrevues = hContrat;
      updated.heuresPotentielles = hContrat;
      updated.heuresRealisees = 0;
      updated.heuresADeduire = hContrat;
      updated.heuresComplementaires = 0;
      updated.repas1 = 0;
      updated.repas2 = 0;
      updated.repas3 = 0;
      updated.km = 0;
      if (!updated.commentaire) updated.commentaire = 'Absence déduite (Cour de cassation)';
      break;

    case 'adaptation':
      // Pendant l'adaptation : Col 1 et 2 = planning normal, Col 3 = heures réelles, Col 4 = Col 1 - Col 3
      updated.heuresPrevues = hContrat;
      updated.heuresPotentielles = hContrat;
      const hReal = Math.min(hContrat, updated.heuresRealisees > 0 ? updated.heuresRealisees : Math.round(hContrat / 2));
      updated.heuresRealisees = hReal;
      updated.heuresADeduire = Math.max(0, hContrat - hReal);
      updated.heuresComplementaires = 0;
      if (!updated.commentaire) updated.commentaire = 'Période d’adaptation';
      break;

    case 'avant_apres_contrat':
      // Avant le début / Après la fin du contrat : Col 2 et Col 4
      updated.heuresPrevues = 0;
      updated.heuresPotentielles = hContrat;
      updated.heuresRealisees = 0;
      updated.heuresADeduire = hContrat;
      updated.heuresComplementaires = 0;
      updated.repas1 = 0;
      updated.repas2 = 0;
      updated.repas3 = 0;
      updated.km = 0;
      if (!updated.commentaire) updated.commentaire = 'Hors période de contrat';
      break;

    case 'semaine_absence_ai':
      // Pendant les semaines d'absence prévues au contrat (PE ou AM) en AI : Colonne 2 uniquement
      updated.heuresPrevues = 0;
      updated.heuresPotentielles = hContrat;
      updated.heuresRealisees = 0;
      updated.heuresADeduire = 0;
      updated.heuresComplementaires = 0;
      updated.repas1 = 0;
      updated.repas2 = 0;
      updated.repas3 = 0;
      updated.km = 0;
      if (!updated.commentaire) updated.commentaire = 'Semaine d’absence prévue au contrat (AI)';
      break;

    case 'conges_payes_am':
      // Pendant les CP de l'AM : en AC Col 1 et 2, en AI Col 2 uniquement
      if (typeContrat === 'AC') {
        updated.heuresPrevues = hContrat;
        updated.heuresPotentielles = hContrat;
      } else {
        updated.heuresPrevues = 0;
        updated.heuresPotentielles = hContrat;
      }
      updated.heuresRealisees = 0;
      updated.heuresADeduire = 0;
      updated.heuresComplementaires = 0;
      updated.repas1 = 0;
      updated.repas2 = 0;
      updated.repas3 = 0;
      updated.km = 0;
      if (!updated.commentaire) updated.commentaire = 'Congés payés AM';
      break;

    case 'ferie_chome':
      // Jour férié sur semaine travaillée : Col 1 et 2
      updated.heuresPrevues = hContrat;
      updated.heuresPotentielles = hContrat;
      updated.heuresRealisees = 0;
      updated.heuresADeduire = 0;
      updated.heuresComplementaires = 0;
      updated.repas1 = 0;
      updated.repas2 = 0;
      updated.repas3 = 0;
      updated.km = 0;
      if (!updated.commentaire) updated.commentaire = 'Jour férié chômé';
      break;

    case 'ferie_semaine_abs_ai':
      // Jour férié sur semaine d'absence prévue au contrat (AI) : Col 2 uniquement
      updated.heuresPrevues = 0;
      updated.heuresPotentielles = hContrat;
      updated.heuresRealisees = 0;
      updated.heuresADeduire = 0;
      updated.heuresComplementaires = 0;
      updated.repas1 = 0;
      updated.repas2 = 0;
      updated.repas3 = 0;
      updated.km = 0;
      if (!updated.commentaire) updated.commentaire = 'Jour férié sur semaine d’absence AI';
      break;

    case 'hors_contrat':
      // Heures complémentaires sur un jour non prévu au contrat : Col 3 et Col 6
      updated.heuresPrevues = 0;
      updated.heuresPotentielles = 0;
      const hComp = updated.heuresRealisees > 0 ? updated.heuresRealisees : 10;
      updated.heuresRealisees = hComp;
      updated.heuresADeduire = 0;
      updated.heuresComplementaires = hComp;
      if (!updated.commentaire) updated.commentaire = 'Accueil hors planning contrat';
      break;

    case 'repos':
    default:
      updated.heuresPrevues = 0;
      updated.heuresPotentielles = 0;
      updated.heuresRealisees = 0;
      updated.heuresADeduire = 0;
      updated.heuresComplementaires = 0;
      updated.heuresMajPrevues = 0;
      updated.heuresMajNonPrevues = 0;
      updated.repas1 = 0;
      updated.repas2 = 0;
      updated.repas3 = 0;
      updated.km = 0;
      break;
  }

  return updated;
}

/**
 * Génère les jours d'un mois avec pré-remplissage intelligent selon le contrat et les jours fériés
 */
export function genererJoursMois(
  annee: number,
  mois: number,
  config: ContratConfig
): JourPresence[] {
  const nbJours = new Date(annee, mois, 0).getDate();
  const feries = getJoursFeries(annee, config.region);
  const semPrincipale = config.semainesTypes.find((s) => s.active) || config.semainesTypes[0];

  const jours: JourPresence[] = [];
  for (let d = 1; d <= nbJours; d++) {
    const dateStr = `${annee}-${String(mois).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const jsDate = new Date(annee, mois - 1, d);
    // 0=Dimanche -> index 6, 1=Lundi -> index 0
    const idxJourSem = (jsDate.getDay() + 6) % 7;
    const hPlanning = semPrincipale ? semPrincipale.heuresParJour[idxJourSem] : 0;
    const nomFerie = feries[dateStr];

    let situation: SituationJour = hPlanning > 0 ? 'normal' : 'repos';
    let commentaire = '';

    if (config.dateDebutContrat && dateStr < config.dateDebutContrat && hPlanning > 0) {
      situation = 'avant_apres_contrat';
      commentaire = 'Avant début de contrat';
    } else if (nomFerie && hPlanning > 0) {
      situation = 'ferie_chome';
      commentaire = `Férié (${nomFerie})`;
    }

    const baseJour: JourPresence = {
      date: dateStr,
      situation,
      heuresPrevues: 0,
      heuresPotentielles: 0,
      heuresRealisees: 0,
      heuresADeduire: 0,
      heuresComplementaires: 0,
      heuresMajPrevues: 0,
      heuresMajNonPrevues: 0,
      repas1: 0,
      repas2: 0,
      repas3: 0,
      km: 0,
      commentaire,
    };

    jours.push(appliquerSituationJour(baseJour, situation, hPlanning, config.typeContrat));
  }

  return jours;
}

/**
 * Calcul complet de la Feuille de Présence et du Bulletin de Salaire mensuel
 * conforme aux formules exactes de la version du 11/07/2026.
 */
export function calculerResultatMensuel(
  config: ContratConfig,
  feuille: FeuilleMensuelle
): ResultatMensuel {
  const contrat = calculerSyntheseContrat(config, feuille.annee, feuille.mois);
  const bareme = contrat.bareme;
  const vars = feuille.variables;

  let totalHeuresPrevues = 0;
  let totalHeuresPotentielles = 0;
  let totalHeuresRealisees = 0;
  let totalHeuresADeduire = 0;
  let totalJoursPotentiels = 0;
  let totalJoursAbsence = 0;
  let totalHeuresComplementaires = 0;
  let totalHeuresMajPrevues = 0;
  let totalHeuresMajNonPrevues = 0;
  let totalJoursEnPlus = 0;
  let totalIE = 0;
  let totalRepas1 = 0;
  let totalRepas2 = 0;
  let totalRepas3 = 0;
  let totalKm = 0;

  let nbJoursReelsPlus8h = 0;
  let nbHeuresReellesJoursMoins8h = 0;
  let nbJoursReelsAccueilTotal = 0;

  for (const j of feuille.jours) {
    totalHeuresPrevues += j.heuresPrevues;
    totalHeuresPotentielles += j.heuresPotentielles;
    totalHeuresRealisees += j.heuresRealisees;
    totalHeuresADeduire += j.heuresADeduire;
    totalHeuresComplementaires += j.heuresComplementaires;
    totalHeuresMajPrevues += j.heuresMajPrevues;
    totalHeuresMajNonPrevues += j.heuresMajNonPrevues;

    if (j.heuresPotentielles > 0) {
      totalJoursPotentiels += 1;
      if (j.heuresADeduire >= j.heuresPotentielles) {
        totalJoursAbsence += 1;
      } else if (j.heuresADeduire > 0) {
        // Absence partielle (ex: adaptation ou départ anticipé)
        totalJoursAbsence += j.heuresADeduire / j.heuresPotentielles;
      }
    }

    if (j.heuresPrevues === 0 && j.heuresRealisees > 0) {
      totalJoursEnPlus += 1;
    }

    const ieJour = calculerIEJour(j.heuresRealisees, config, bareme, j.ieForcagle);
    totalIE += ieJour;

    totalRepas1 += j.repas1;
    totalRepas2 += j.repas2;
    totalRepas3 += j.repas3;
    totalKm += j.km;

    // Suivi fiscal AM (abattement fiscal : jours >= 8h vs heures des jours < 8h)
    if (j.heuresRealisees > 0) {
      nbJoursReelsAccueilTotal += 1;
      if (j.heuresRealisees >= 8) {
        nbJoursReelsPlus8h += 1;
      } else {
        nbHeuresReellesJoursMoins8h += j.heuresRealisees;
      }
    }
  }

  totalIE = Number(totalIE.toFixed(2));
  const totalIR = Number(
    (
      totalRepas1 * (config.repas1Tarif || 0) +
      totalRepas2 * (config.repas2Tarif || 0) +
      totalRepas3 * (config.repas3Tarif || 0)
    ).toFixed(2)
  );
  const totalIK = Number((totalKm * (config.tarifKm || 0)).toFixed(2));

  // ==================== REMUNERATION BRUTE ====================
  const isReel = config.typeContrat === 'Reel';
  const txBrut = contrat.tauxHoraireBrut;
  const txMajHS = config.tauxMajorationHS;
  const txMajHC = config.tauxMajorationHC;

  // Salaire de base mensuel (ou au réel)
  const salaireBaseMensuelBrut = isReel
    ? (totalHeuresRealisees - totalHeuresComplementaires - totalHeuresMajPrevues - totalHeuresMajNonPrevues) * txBrut
    : contrat.mensualisationBruteNormale;

  const hrsMensuMajoreesBrut = isReel ? 0 : contrat.mensualisationBruteMajoree;

  // Déduction d'absence par calcul Cour de Cassation :
  // Montant à déduire = Mensualisation brute * (Heures à déduire / Heures potentielles du mois)
  let deductionAbsenceCourCassationBrut = 0;
  if (!isReel && totalHeuresADeduire > 0 && totalHeuresPotentielles > 0) {
    const baseMensu = salaireBaseMensuelBrut + hrsMensuMajoreesBrut;
    deductionAbsenceCourCassationBrut = -Number(
      ((baseMensu * totalHeuresADeduire) / totalHeuresPotentielles).toFixed(4)
    );
  }

  const heuresCompBrut = totalHeuresComplementaires * txBrut * (1 + txMajHC);
  const heuresMajPrevuesBrut = config.majorationHSMensualisee
    ? 0
    : totalHeuresMajPrevues * txBrut * (1 + txMajHS);
  const heuresMajNonPrevuesBrut = totalHeuresMajNonPrevues * txBrut * (1 + txMajHS);

  const maj1erMaiBrut = (vars.heuresMaj1erMai || 0) * txBrut * 1.0; // +100%
  const majJFBrut = (vars.heuresMajJF || 0) * txBrut * (vars.tauxMajJF || 0.1);
  const cpVersementBrut = vars.cpVersementBrut || 0;
  const regularisationNormaleBrut = vars.regularisationNormaleBrut || 0;
  const regularisationMajBrut = vars.regularisationMajorationBrut || 0;
  const soldeCPFinContratBrut = vars.soldeCPFinContratBrut || 0;

  const sousTotalAvantPrecarite =
    salaireBaseMensuelBrut +
    hrsMensuMajoreesBrut +
    deductionAbsenceCourCassationBrut +
    heuresCompBrut +
    heuresMajPrevuesBrut +
    heuresMajNonPrevuesBrut +
    maj1erMaiBrut +
    majJFBrut +
    cpVersementBrut +
    regularisationNormaleBrut +
    regularisationMajBrut;

  const primePrecariteBrut = vars.inclurePrimePrecarite ? sousTotalAvantPrecarite * 0.1 : 0;

  const totalBrut = Math.max(
    0,
    Number((sousTotalAvantPrecarite + primePrecariteBrut + soldeCPFinContratBrut).toFixed(2))
  );

  // ==================== COTISATIONS SOCIALES ====================
  const assietteCSG = totalBrut * 0.9825;

  // Base des heures complémentaires et majorées ouvrant droit à l'exonération salariale (Formule DB46 du 03/11/2024)
  let baseBrutHCHSExonerees = 0;
  if (config.majorationHSMensualisee && salaireBaseMensuelBrut + hrsMensuMajoreesBrut > 0) {
    const partMajDansDeduction =
      (hrsMensuMajoreesBrut / (salaireBaseMensuelBrut + hrsMensuMajoreesBrut)) *
      deductionAbsenceCourCassationBrut;
    baseBrutHCHSExonerees =
      hrsMensuMajoreesBrut +
      partMajDansDeduction +
      heuresCompBrut +
      heuresMajNonPrevuesBrut +
      regularisationMajBrut;
  } else {
    baseBrutHCHSExonerees =
      heuresCompBrut +
      heuresMajPrevuesBrut +
      heuresMajNonPrevuesBrut +
      regularisationMajBrut;
  }
  baseBrutHCHSExonerees = Math.max(0, Number(baseBrutHCHSExonerees.toFixed(2)));

  // Montant de la réduction de cotisations salariales sur HC/HS (11,31%)
  const montantExonerationSalarialeHCHS = Number(
    (baseBrutHCHSExonerees * Math.abs(bareme.salExonerationHCHS)).toFixed(2)
  );

  // Plafond de 5€ sur la Contribution santé au travail patronale (Formule DI42 du 26/01/2025 : =MIN(DB42*DG42; 5))
  const montantPatContribSante = Math.min(totalBrut * bareme.patContribSante, 5);

  const cotisations: LigneCotisation[] = [
    {
      libelle: 'SANTÉ : Sécurité Sociale - maladie, maternité, inval, décès',
      base: totalBrut,
      tauxSalarial: bareme.salSanteMaladie,
      montantSalarial: totalBrut * bareme.salSanteMaladie,
      tauxPatronal: bareme.patSanteMaladie,
      montantPatronal: totalBrut * bareme.patSanteMaladie,
    },
    {
      libelle: 'SANTÉ : Accident du Travail et Maladies Professionnelles',
      base: totalBrut,
      tauxSalarial: bareme.salSanteATMP,
      montantSalarial: totalBrut * bareme.salSanteATMP,
      tauxPatronal: bareme.patSanteATMP,
      montantPatronal: totalBrut * bareme.patSanteATMP,
    },
    {
      libelle: 'RETRAITE : Sécurité Sociale',
      base: totalBrut,
      tauxSalarial: bareme.salRetraiteSS,
      montantSalarial: totalBrut * bareme.salRetraiteSS,
      tauxPatronal: bareme.patRetraiteSS,
      montantPatronal: totalBrut * bareme.patRetraiteSS,
    },
    {
      libelle: 'RETRAITE : Complémentaire IRCEM + CEG',
      base: totalBrut,
      tauxSalarial: bareme.salRetraiteIRCEM,
      montantSalarial: totalBrut * bareme.salRetraiteIRCEM,
      tauxPatronal: bareme.patRetraiteIRCEM,
      montantPatronal: totalBrut * bareme.patRetraiteIRCEM,
    },
    {
      libelle: 'FAMILLE',
      base: totalBrut,
      tauxSalarial: bareme.salFamille,
      montantSalarial: 0,
      tauxPatronal: bareme.patFamille,
      montantPatronal: totalBrut * bareme.patFamille,
    },
    {
      libelle: 'ASSURANCE CHÔMAGE',
      base: totalBrut,
      tauxSalarial: bareme.salChomage,
      montantSalarial: 0,
      tauxPatronal: bareme.patChomage,
      montantPatronal: totalBrut * bareme.patChomage,
    },
    {
      libelle: 'IRCEM Prévoyance + FNAL',
      base: totalBrut,
      tauxSalarial: bareme.salIrcemPrevoyance,
      montantSalarial: totalBrut * bareme.salIrcemPrevoyance,
      tauxPatronal: bareme.patIrcemPrevoyance,
      montantPatronal: totalBrut * bareme.patIrcemPrevoyance,
    },
    {
      libelle: 'Contribution santé au travail (plafonnée à 5 €)',
      base: totalBrut,
      tauxSalarial: 0,
      montantSalarial: 0,
      tauxPatronal: bareme.patContribSante,
      montantPatronal: montantPatContribSante,
    },
    {
      libelle: 'Formation Pro + Contribution dialogue social + CSA',
      base: totalBrut,
      tauxSalarial: 0,
      montantSalarial: 0,
      tauxPatronal: bareme.patFormationPro,
      montantPatronal: totalBrut * bareme.patFormationPro,
    },
    {
      libelle: 'CSG + CRDS non déductible (sur 98,25% du brut)',
      base: assietteCSG,
      tauxSalarial: bareme.salCsgCrdsNonDeductible,
      montantSalarial: assietteCSG * bareme.salCsgCrdsNonDeductible,
      tauxPatronal: 0,
      montantPatronal: 0,
    },
    {
      libelle: 'CSG déductible (sur 98,25% du brut)',
      base: assietteCSG,
      tauxSalarial: bareme.salCsgDeductible,
      montantSalarial: assietteCSG * bareme.salCsgDeductible,
      tauxPatronal: 0,
      montantPatronal: 0,
    },
    {
      libelle: 'Montant exonération heures complémentaires et majorées',
      base: baseBrutHCHSExonerees,
      tauxSalarial: bareme.salExonerationHCHS,
      montantSalarial: -montantExonerationSalarialeHCHS,
      tauxPatronal: 0,
      montantPatronal: 0,
    },
  ];

  const totalCotisationsSalarialesBrutes = cotisations
    .slice(0, -1)
    .reduce((acc, c) => acc + c.montantSalarial, 0);

  const totalCotisationsSalariales = Number(
    (totalCotisationsSalarialesBrutes - montantExonerationSalarialeHCHS).toFixed(2)
  );

  const totalCotisationsPatronales = Number(
    cotisations.reduce((acc, c) => acc + c.montantPatronal, 0).toFixed(2)
  );

  const salaireNetAvantImpot = Number((totalBrut - totalCotisationsSalariales).toFixed(2));
  const montantNetSocial = Number(
    (totalBrut - totalCotisationsSalarialesBrutes).toFixed(2)
  );

  const csgCrdsNonDeductibleMontant = assietteCSG * bareme.salCsgCrdsNonDeductible;
  // Salaire net imposable (hors IE/IR) : Salaire Net (hors exo HC/HS) + CSG/CRDS non déductible
  const salaireNetImposableHorsIEIR = Number(
    (
      totalBrut -
      totalCotisationsSalarialesBrutes +
      csgCrdsNonDeductibleMontant
    ).toFixed(2)
  );

  // Salaire net imposable avec IE et IR (pour la déclaration de revenus AM)
  const salaireNetImposableAvecIEIR = Number(
    (salaireNetImposableHorsIEIR + totalIE + totalIR).toFixed(2)
  );

  const indemniteRupture = Number((vars.indemniteRupture || 0).toFixed(2));
  const totalIndemnites = Number((totalIE + totalIR + totalIK + indemniteRupture).toFixed(2));

  const montantImpotPAS = Number(
    ((salaireNetImposableHorsIEIR * (config.tauxImpositionPAS || 0)) / 100).toFixed(2)
  );

  const netAPayer = Number(
    (salaireNetAvantImpot + totalIndemnites - montantImpotPAS).toFixed(2)
  );

  // ==================== DECLARATION PAJEMPLOI ====================
  // Formule BE58 du 02/06/2024 pour les heures normales Pajemploi :
  let heuresNormalesPajemploiExact = 0;
  if (txBrut > 0) {
    if (config.majorationHSMensualisee && salaireBaseMensuelBrut + hrsMensuMajoreesBrut > 0) {
      const ratioNorm =
        salaireBaseMensuelBrut / (salaireBaseMensuelBrut + hrsMensuMajoreesBrut);
      heuresNormalesPajemploiExact =
        contrat.heuresMensualiseesNormales +
        (deductionAbsenceCourCassationBrut * ratioNorm) / txBrut +
        (cpVersementBrut + regularisationNormaleBrut + soldeCPFinContratBrut) / txBrut;
    } else {
      const nbHeuresMajDeduites =
        totalHeuresPotentielles > 0 && config.majorationHSMensualisee
          ? (contrat.heuresMensualiseesMajorees * totalHeuresADeduire) / totalHeuresPotentielles
          : 0;
      heuresNormalesPajemploiExact =
        (isReel
          ? totalHeuresRealisees -
            totalHeuresComplementaires -
            totalHeuresMajPrevues -
            totalHeuresMajNonPrevues
          : contrat.heuresMensualiseesNormales) +
        (deductionAbsenceCourCassationBrut + cpVersementBrut + regularisationNormaleBrut) /
          txBrut -
        nbHeuresMajDeduites;
    }
  }
  const heuresNormalesPajemploi = Math.max(0, Math.round(heuresNormalesPajemploiExact));

  // Formule BE59 du 25/10/2024 pour les jours d'activité Pajemploi :
  // =SI(BO3="Réel"; X61-X62+AR55; ARRONDI.SUP(L10 - L10*X62/X61 + AR55 + (DH29+DH27)/BH9/(L9/L10); 0))
  let joursActivitePajemploi = 0;
  if (isReel) {
    joursActivitePajemploi = Math.max(
      0,
      Math.ceil(totalJoursPotentiels - totalJoursAbsence + totalJoursEnPlus)
    );
  } else {
    const ratioAbsJours =
      totalJoursPotentiels > 0 ? totalJoursAbsence / totalJoursPotentiels : 0;
    const heuresMoyJourContrat =
      contrat.joursMensualisesExact > 0
        ? contrat.heuresMensualiseesNormales / contrat.joursMensualisesExact
        : 8;
    const joursSupplRegul =
      txBrut > 0 && heuresMoyJourContrat > 0
        ? (soldeCPFinContratBrut + regularisationNormaleBrut) / txBrut / heuresMoyJourContrat
        : 0;
    joursActivitePajemploi = Math.max(
      0,
      Math.ceil(
        contrat.joursMensualisesExact -
          contrat.joursMensualisesExact * ratioAbsJours +
          totalJoursEnPlus +
          joursSupplRegul
      )
    );
  }

  const heuresComplementairesPajemploi = Math.round(totalHeuresComplementaires);
  const heuresMajoreesPajemploi = Math.round(
    (config.majorationHSMensualisee ? contrat.heuresMensualiseesMajorees : totalHeuresMajPrevues) +
      totalHeuresMajNonPrevues +
      (txBrut > 0 ? regularisationMajBrut / (txBrut * (1 + txMajHS)) : 0)
  );

  // ICCP net (Formule CM61 du 27/04/2024 : =DH30 * CK9)
  const iccpNet = Number((soldeCPFinContratBrut * bareme.tauxConversionBrutNet).toFixed(2));

  // Salaire net à déclarer sur Pajemploi (hors IE, IR, IK, Indemnité de rupture)
  const salaireNetDeclare = Number((salaireNetAvantImpot - iccpNet).toFixed(2));

  // Vérification Plafond CAF (Formule BH57 du 11/07/2026)
  // =SI((AY61+DB46+CN58+CN59)/(BE58+CE58+CE59) > PlafondCAF; "Dépassement plafond CAF"; "")
  const dateMoisStr = `${feuille.annee}-${String(feuille.mois).padStart(2, '0')}-01`;
  let depassementPlafondCAF = false;
  let ratioPlafondCAF = 0;

  if (dateMoisStr < '2025-09-01') {
    const nbJoursTotal = joursActivitePajemploi + (vars.nbJoursCPDeclares || 0);
    ratioPlafondCAF = nbJoursTotal > 0 ? totalBrut / nbJoursTotal : 0;
    depassementPlafondCAF = ratioPlafondCAF > bareme.plafondCAF;
  } else {
    const denomHeures =
      heuresNormalesPajemploi + heuresComplementairesPajemploi + heuresMajoreesPajemploi;
    ratioPlafondCAF =
      denomHeures > 0 ? salaireNetAvantImpot / denomHeures : contrat.tauxHoraireNet;
    depassementPlafondCAF = ratioPlafondCAF > bareme.plafondCAF;
  }

  // ==================== SUIVI REGULARISATION AI ====================
  const heuresNormalesRealiseesAssimiliees =
    totalHeuresRealisees -
    totalHeuresComplementaires -
    totalHeuresMajPrevues -
    totalHeuresMajNonPrevues +
    (totalHeuresPrevues - totalHeuresADeduire - (totalHeuresRealisees - totalHeuresComplementaires - totalHeuresMajPrevues - totalHeuresMajNonPrevues) > 0
      ? totalHeuresPrevues - totalHeuresADeduire - (totalHeuresRealisees - totalHeuresComplementaires - totalHeuresMajPrevues - totalHeuresMajNonPrevues)
      : 0);

  const heuresNormalesPayees =
    txBrut > 0 ? (salaireBaseMensuelBrut + deductionAbsenceCourCassationBrut) / txBrut : 0;

  const heuresMajRealisees = totalHeuresMajPrevues;
  const heuresMajPayees = config.majorationHSMensualisee
    ? contrat.heuresMensualiseesMajorees
    : totalHeuresMajPrevues;

  return {
    contrat,
    bareme,
    totalHeuresPrevues: Number(totalHeuresPrevues.toFixed(2)),
    totalHeuresPotentielles: Number(totalHeuresPotentielles.toFixed(2)),
    totalHeuresRealisees: Number(totalHeuresRealisees.toFixed(2)),
    totalHeuresADeduire: Number(totalHeuresADeduire.toFixed(2)),
    totalJoursPotentiels: Number(totalJoursPotentiels.toFixed(2)),
    totalJoursAbsence: Number(totalJoursAbsence.toFixed(2)),
    totalHeuresComplementaires: Number(totalHeuresComplementaires.toFixed(2)),
    totalHeuresMajPrevues: Number(totalHeuresMajPrevues.toFixed(2)),
    totalHeuresMajNonPrevues: Number(totalHeuresMajNonPrevues.toFixed(2)),
    totalJoursEnPlus,
    totalIE,
    totalRepas1,
    totalRepas2,
    totalRepas3,
    totalIR,
    totalKm: Number(totalKm.toFixed(2)),
    totalIK,
    salaireBaseMensuelBrut: Number(salaireBaseMensuelBrut.toFixed(2)),
    hrsMensuMajoreesBrut: Number(hrsMensuMajoreesBrut.toFixed(2)),
    deductionAbsenceCourCassationBrut: Number(deductionAbsenceCourCassationBrut.toFixed(2)),
    heuresCompBrut: Number(heuresCompBrut.toFixed(2)),
    heuresMajPrevuesBrut: Number(heuresMajPrevuesBrut.toFixed(2)),
    heuresMajNonPrevuesBrut: Number(heuresMajNonPrevuesBrut.toFixed(2)),
    maj1erMaiBrut: Number(maj1erMaiBrut.toFixed(2)),
    majJFBrut: Number(majJFBrut.toFixed(2)),
    cpVersementBrut: Number(cpVersementBrut.toFixed(2)),
    regularisationNormaleBrut: Number(regularisationNormaleBrut.toFixed(2)),
    regularisationMajBrut: Number(regularisationMajBrut.toFixed(2)),
    primePrecariteBrut: Number(primePrecariteBrut.toFixed(2)),
    soldeCPFinContratBrut: Number(soldeCPFinContratBrut.toFixed(2)),
    totalBrut,
    cotisations,
    baseBrutHCHSExonerees,
    montantExonerationSalarialeHCHS,
    totalCotisationsSalariales,
    totalCotisationsPatronales,
    salaireNetAvantImpot,
    montantNetSocial,
    salaireNetImposableHorsIEIR,
    salaireNetImposableAvecIEIR,
    indemniteRupture,
    totalIndemnites,
    montantImpotPAS,
    netAPayer,
    pajemploi: {
      heuresNormales: heuresNormalesPajemploi,
      joursActivite: joursActivitePajemploi,
      nbCP: vars.nbJoursCPDeclares || 0,
      heuresComplementaires: heuresComplementairesPajemploi,
      heuresMajorees: heuresMajoreesPajemploi,
      tauxHoraireNet: Number(contrat.tauxHoraireNet.toFixed(2)),
      salaireNetDeclare,
      ie: totalIE,
      ir: totalIR,
      ik: totalIK,
      iccp: iccpNet,
      indemniteRupture,
      depassementPlafondCAF,
      ratioPlafondCAF: Number(ratioPlafondCAF.toFixed(2)),
    },
    regulAI: {
      heuresNormalesRealiseesAssimiliees: Number(heuresNormalesRealiseesAssimiliees.toFixed(2)),
      heuresNormalesPayees: Number(heuresNormalesPayees.toFixed(2)),
      ecartHeuresNormales: Number(
        (heuresNormalesRealiseesAssimiliees - heuresNormalesPayees).toFixed(2)
      ),
      heuresMajRealisees: Number(heuresMajRealisees.toFixed(2)),
      heuresMajPayees: Number(heuresMajPayees.toFixed(2)),
      ecartHeuresMaj: Number((heuresMajRealisees - heuresMajPayees).toFixed(2)),
    },
    declarationRevenusAM: {
      nbJoursReelsPlus8h,
      nbHeuresReellesJoursMoins8h: Number(nbHeuresReellesJoursMoins8h.toFixed(2)),
      nbJoursReelsAccueilTotal,
      salaireNetImposablePlusIEIR: salaireNetImposableAvecIEIR,
      indemniteRepasFournisParents: Number(
        (nbJoursReelsAccueilTotal * (config.repasFournisParentsValeurJour || 0)).toFixed(2)
      ),
    },
  };
}
