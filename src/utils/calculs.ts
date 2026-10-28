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
  heuresTotalesAn: number;
  heuresNormalesAn: number;
  heuresMajoreesAn: number;
  joursAn: number;
  // L9 et Z9 dans l'Excel :
  // Si Majoration HS Mensualisée = Non, DF18 contient toutes les heures mensualisées (y compris >45h au taux de base) et la majoration seule est payée en ligne 22.
  heuresMensualiseesBaseDF18: number;
  heuresMensualiseesMajoreesDF19: number;
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
  // Rémunération brute (Lignes DH18 à DH31 de l'Excel)
  salaireBaseMensuelBrut: number; // DH18
  hrsMensuMajoreesBrut: number; // DH19
  deductionAbsenceCourCassationBrut: number; // DH20 (négatif)
  heuresCompBrut: number; // DH21
  heuresMajPrevuesBrut: number; // DH22 (majoration seule si S3="Non", 0 si S3="Oui")
  heuresMajNonPrevuesBrut: number; // DH23
  maj1erMaiBrut: number; // DH24
  majJFBrut: number; // DH25
  cpVersementBrut: number; // DH26
  regularisationNormaleBrut: number; // DH27
  regularisationMajBrut: number; // DH28
  primePrecariteBrut: number; // DH29
  soldeCPFinContratBrut: number; // DH30
  totalBrut: number; // DH31
  // Cotisations
  cotisations: LigneCotisation[];
  baseBrutHCHSExonerees: number; // DB46
  montantExonerationSalarialeHCHS: number; // |DE46|
  totalCotisationsSalariales: number;
  totalCotisationsPatronales: number;
  // Nets & Indemnités
  salaireNetAvantImpot: number; // DH49
  montantNetSocial: number;
  salaireNetImposableHorsIEIR: number; // CV51 (avec exonération fiscale des HC/HS)
  salaireNetImposableAvecIEIR: number; // Déclaration revenus AM
  indemniteRupture: number;
  totalIndemnites: number;
  montantImpotPAS: number;
  netAPayer: number;
  // Pajemploi
  pajemploi: {
    heuresNormales: number; // BE58 arrondi
    joursActivite: number; // BE59
    nbCP: number;
    heuresComplementaires: number; // CE58
    heuresMajorees: number; // CE59
    tauxHoraireNet: number; // CB60
    salaireNetDeclare: number; // AY61
    ie: number;
    ir: number;
    ik: number;
    iccp: number; // CM61 (=DH30*CK9)
    indemniteRupture: number;
    depassementPlafondCAF: boolean; // BH57
    ratioPlafondCAF: number;
  };
  // Régularisation AI (mois)
  regulAI: {
    heuresNormalesRealiseesAssimiliees: number;
    heuresNormalesPayees: number;
    ecartHeuresNormales: number;
    heuresMajRealisees: number; // BF65
    heuresMajPayees: number; // CF65
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
  let heuresTotalesAn = 0;
  let heuresNormalesAn = 0;
  let heuresMajoreesAn = 0;
  let joursAn = 0;

  for (const s of actives) {
    const hSem = s.heuresParJour.reduce((a, b) => a + b, 0);
    const jSem = s.heuresParJour.filter((h) => h > 0).length;
    const hNormSem = Math.min(45, hSem);
    const hMajSem = Math.max(0, hSem - 45);

    nbSemainesTotalAn += s.nbSemainesAn;
    heuresTotalesAn += s.nbSemainesAn * hSem;
    heuresNormalesAn += s.nbSemainesAn * hNormSem;
    heuresMajoreesAn += s.nbSemainesAn * hMajSem;
    joursAn += s.nbSemainesAn * jSem;
  }

  const isReel = config.typeContrat === 'Reel';

  // Dans l'Excel :
  // - Si Majoration des HS Mensualisée (S3) = "Oui" :
  //   DF18 = heuresNormalesAn / 12 (au taux de base DD18)
  //   DF19 = heuresMajoreesAn / 12 (au taux majoré DD19)
  // - Si Majoration des HS Mensualisée (S3) = "Non" :
  //   DF18 = heuresTotalesAn / 12 (toutes les heures prévues sont mensualisées au taux de base 100%, et seule la majoration +10% est payée au réel en ligne 22)
  //   DF19 = 0
  const heuresMensualiseesBaseDF18 = isReel
    ? 0
    : config.majorationHSMensualisee
    ? heuresNormalesAn / 12
    : heuresTotalesAn / 12;

  const heuresMensualiseesMajoreesDF19 =
    isReel || !config.majorationHSMensualisee ? 0 : heuresMajoreesAn / 12;

  const heuresMensualiseesTotal = isReel ? 0 : heuresTotalesAn / 12;

  const joursMensualisesExact = isReel ? 0 : joursAn / 12;
  const joursMensualisesArrondi = Math.ceil(joursMensualisesExact);

  const heuresMoyenneParSemaine =
    nbSemainesTotalAn > 0 ? heuresTotalesAn / nbSemainesTotalAn : 0;

  const tauxHoraireBrut = config.tauxHoraireBrut;
  const tauxHoraireNet = Number((tauxHoraireBrut * conv).toFixed(4));
  const tauxHoraireMajoreBrut = tauxHoraireBrut * (1 + config.tauxMajorationHS);
  const tauxHoraireMajoreNet = Number((tauxHoraireMajoreBrut * conv).toFixed(4));

  const mensualisationBruteNormale = heuresMensualiseesBaseDF18 * tauxHoraireBrut;
  const mensualisationBruteMajoree =
    heuresMensualiseesMajoreesDF19 * tauxHoraireMajoreBrut;
  const mensualisationBruteTotale =
    mensualisationBruteNormale + mensualisationBruteMajoree;
  const mensualisationNetteEstimee = mensualisationBruteTotale * conv;

  const ieHoraireRetenue = Math.max(
    bareme.ieMinConvHeure,
    config.ieHoraireContractuelle || 0
  );

  // Formule AR11 du 11/07/2026 : contrôle du taux horaire brut mini légal
  const alerteTauxMiniLegal = tauxHoraireBrut < bareme.txHoraireBrutMini;

  // Formule AA10 du 13/09/2025 : contrôle plafond CAF sur le contrat
  const dateStr = `${anneeRef}-${String(moisRef).padStart(2, '0')}-01`;
  let alertePlafondCAFContrat = false;
  if (dateStr < '2025-09-01') {
    if (
      joursMensualisesExact > 0 &&
      mensualisationBruteTotale / joursMensualisesExact >= bareme.plafondCAF
    ) {
      alertePlafondCAFContrat = true;
    }
  } else {
    if (tauxHoraireBrut * conv > 7) {
      alertePlafondCAFContrat = true;
    }
  }

  return {
    bareme,
    nbSemainesTotalAn,
    heuresTotalesAn,
    heuresNormalesAn,
    heuresMajoreesAn,
    joursAn,
    heuresMensualiseesBaseDF18,
    heuresMensualiseesMajoreesDF19,
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
 * - Minimum légal / conventionnel par heure : ex. 0,435 €/h (depuis juin 2026)
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
  const tarifHoraireIE = Math.max(
    bareme.ieMinConvHeure,
    config.ieHoraireContractuelle || 0
  );
  const minJour = Math.max(
    bareme.ieMinConvJour,
    config.ieJournaliereContractuelle || 0
  );
  return Number(Math.max(minJour, heuresRealiseesJour * tarifHoraireIE).toFixed(2));
}

/**
 * Applique automatiquement les règles de la Notice officielle (Tableau Contrat AI / Contrat AC)
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
      if (
        hContrat > 0 &&
        updated.repas1 === 0 &&
        updated.repas2 === 0 &&
        updated.repas3 === 0
      ) {
        const [y, m, d] = jour.date.split('-').map(Number);
        const isMercredi = new Date(y, m - 1, d).getDay() === 3;
        updated.repas1 = 1;
        updated.repas2 = 1;
        updated.repas3 = isMercredi || hContrat <= 5 ? 0 : 1;
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
      if (!updated.commentaire)
        updated.commentaire = 'Absence convenance perso employeur';
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
      if (!updated.commentaire)
        updated.commentaire = 'Absence déduite (Cour de cassation)';
      break;

    case 'adaptation':
      // Pendant l'adaptation : Col 1 et 2 = planning normal, Col 3 = heures réelles, Col 4 = Col 1 - Col 3
      updated.heuresPrevues = hContrat;
      updated.heuresPotentielles = hContrat;
      const hReal = Math.min(
        hContrat,
        updated.heuresRealisees > 0
          ? updated.heuresRealisees
          : Math.round(hContrat / 2)
      );
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
      if (!updated.commentaire)
        updated.commentaire = 'Semaine d’absence prévue au contrat (AI)';
      break;

    case 'conges_payes_am':
      // Pendant les CP de l'AM : en AC Col 1 et 2, en AI rien (ou Col 2 si sem abs)
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
      if (!updated.commentaire)
        updated.commentaire = 'Jour férié sur semaine d’absence AI';
      break;

    case 'hors_contrat':
      // Heures complémentaires sur un jour non prévu au contrat : Col 3 et Col 6
      updated.heuresPrevues = 0;
      updated.heuresPotentielles = 0;
      const hComp = updated.heuresRealisees > 0 ? updated.heuresRealisees : 10;
      updated.heuresRealisees = hComp;
      updated.heuresADeduire = 0;
      updated.heuresComplementaires = hComp;
      if (!updated.commentaire)
        updated.commentaire = 'Accueil hors planning contrat';
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
 * Génère les jours d'un mois avec pré-remplissage selon le contrat et les jours fériés
 */
export function genererJoursMois(
  annee: number,
  mois: number,
  config: ContratConfig
): JourPresence[] {
  const nbJours = new Date(annee, mois, 0).getDate();
  const feries = getJoursFeries(annee, config.region);
  const semPrincipale =
    config.semainesTypes.find((s) => s.active) || config.semainesTypes[0];

  const jours: JourPresence[] = [];
  for (let d = 1; d <= nbJours; d++) {
    const dateStr = `${annee}-${String(mois).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const jsDate = new Date(annee, mois - 1, d);
    const idxJourSem = (jsDate.getDay() + 6) % 7;
    const hPlanning = semPrincipale ? semPrincipale.heuresParJour[idxJourSem] : 0;
    const nomFerie = feries[dateStr];

    let situation: SituationJour = hPlanning > 0 ? 'normal' : 'repos';
    let commentaire = '';

    if (
      config.dateDebutContrat &&
      dateStr < config.dateDebutContrat &&
      hPlanning > 0
    ) {
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

    jours.push(
      appliquerSituationJour(baseJour, situation, hPlanning, config.typeContrat)
    );
  }

  return jours;
}

/**
 * Calcul complet de la Feuille de Présence et du Bulletin de Salaire mensuel
 * conforme aux formules exactes de l'Excel (Version du 11/07/2026).
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
  let totalJoursPotentiels = 0; // X61 dans l'Excel
  let totalJoursAbsence = 0; // X62 dans l'Excel
  let totalHeuresComplementaires = 0;
  let totalHeuresMajPrevues = 0; // AH55 / DF22 dans l'Excel
  let totalHeuresMajNonPrevues = 0; // DF23 dans l'Excel
  let totalJoursEnPlus = 0; // AR55 dans l'Excel
  let totalIE = 0;
  let totalRepas1 = 0;
  let totalRepas2 = 0;
  let totalRepas3 = 0;
  let totalKm = 0;

  let nbJoursReelsPlus8h = 0;
  let nbHeuresReellesJoursMoins8h = 0;
  let nbJoursReelsAccueilTotal = 0; // AW56 dans l'Excel

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

  // ==================== REMUNERATION BRUTE (DH18..DH31) ====================
  const isReel = config.typeContrat === 'Reel';
  const DD18 = contrat.tauxHoraireBrut; // Base horaire brute
  const txMajHS = config.tauxMajorationHS;
  const txMajHC = config.tauxMajorationHC;
  const DD19 = DD18 * (1 + txMajHS); // Base horaire majorée (Hrs Mensu majorées)
  const DD21 = DD18 * (1 + txMajHC); // Base horaire HC
  const DD22 = DD18 * txMajHS; // Base Heures majorées prévues (seule la majoration ! ex: 0.90€ pour 9€)
  const DD23 = DD18 * (1 + txMajHS); // Base Heures majorées non prévues (ex: 9.90€ pour 9€)

  const DF18 = isReel
    ? Math.max(
        0,
        totalHeuresRealisees -
          totalHeuresComplementaires -
          totalHeuresMajPrevues -
          totalHeuresMajNonPrevues
      )
    : contrat.heuresMensualiseesBaseDF18;

  const DF19 = isReel ? 0 : contrat.heuresMensualiseesMajoreesDF19;
  const DF21 = totalHeuresComplementaires;
  const DF22 = config.majorationHSMensualisee ? 0 : totalHeuresMajPrevues;
  const DF23 = totalHeuresMajNonPrevues;

  // DH18 : Salaire de base mensuel heures mensualisées non majorées
  const DH18 = DF18 * DD18;
  // DH19 : Hrs Mensu majorées
  const DH19 = DF19 * DD19;

  // DH20 : Déduction d'absence par calcul Cour de Cassation
  let DH20 = 0;
  if (!isReel && totalHeuresADeduire > 0 && totalHeuresPotentielles > 0) {
    const baseMensu = DH18 + DH19;
    DH20 = -((baseMensu * totalHeuresADeduire) / totalHeuresPotentielles);
  }

  // DH21 : Heures complémentaires
  const DH21 = DF21 * DD21;
  // DH22 : Heures majorées prévues (majoration seule si S3="Non")
  const DH22 = DF22 * DD22;
  // DH23 : Heures majorées non prévues
  const DH23 = DF23 * DD23;
  // DH24 : Majoration 1er mai travaillé (100%)
  const DH24 = (vars.heuresMaj1erMai || 0) * DD18 * 1.0;
  // DH25 : Majoration JF / Jour de repos
  const DH25 = (vars.heuresMajJF || 0) * DD18 * (vars.tauxMajJF || 0.1);
  // DH26 : CP (versement)
  const DH26 = vars.cpVersementBrut || 0;
  // DH27 : Régularisation
  const DH27 = vars.regularisationNormaleBrut || 0;
  // DH28 : Régularisation heures majorées
  const DH28 = vars.regularisationMajorationBrut || 0;

  const sousTotalAvantPrecarite =
    DH18 + DH19 + DH20 + DH21 + DH22 + DH23 + DH24 + DH25 + DH26 + DH27 + DH28;

  // DH29 : Prime de précarité CDD uniquement (10%)
  const DH29 = vars.inclurePrimePrecarite ? sousTotalAvantPrecarite * 0.1 : 0;
  // DH30 : Solde de congés payés (fin de contrat)
  const DH30 = vars.soldeCPFinContratBrut || 0;

  // DH31 : Total brut
  const totalBrut = Math.max(
    0,
    Number((sousTotalAvantPrecarite + DH29 + DH30).toFixed(2))
  );

  // ==================== COTISATIONS SOCIALES ====================
  const assietteCSG = totalBrut * 0.9825;

  // Formule exacte DB46 du 03/11/2024 :
  // =SI(S3="Oui";((DH19/(DH19+DH18)*DH20/DD19)+DF19+DF23)*DD19;SOMME(DH19;DH21;DH23+DF22*(DD18+DD22)))
  let baseBrutHCHSExonerees = 0;
  if (config.majorationHSMensualisee) {
    const partDeductionMaj =
      DH19 + DH18 > 0 && DD19 > 0 ? ((DH19 / (DH19 + DH18)) * DH20) / DD19 : 0;
    baseBrutHCHSExonerees =
      (partDeductionMaj + DF19 + DF23) * DD19 + DH21 + DH28;
  } else {
    baseBrutHCHSExonerees =
      DH19 + DH21 + DH23 + DF22 * (DD18 + DD22) + DH28;
  }
  baseBrutHCHSExonerees = Math.max(0, Number(baseBrutHCHSExonerees.toFixed(2)));

  // DE46 : Montant exonération heures complémentaires et majorées (-11,31%)
  const montantExonerationSalarialeHCHS = Number(
    (baseBrutHCHSExonerees * Math.abs(bareme.salExonerationHCHS)).toFixed(2)
  );

  // Formule DI42 du 26/01/2025 : =MIN(DB42*DG42; 5)
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
      libelle: 'IRCEM Prevoyance + FNAL',
      base: totalBrut,
      tauxSalarial: bareme.salIrcemPrevoyance,
      montantSalarial: totalBrut * bareme.salIrcemPrevoyance,
      tauxPatronal: bareme.patIrcemPrevoyance,
      montantPatronal: totalBrut * bareme.patIrcemPrevoyance,
    },
    {
      libelle: 'Contribution santé au travail',
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

  // DH49 : Salaire net
  const salaireNetAvantImpot = Number(
    (totalBrut - totalCotisationsSalariales).toFixed(2)
  );
  const montantNetSocial = Number(
    (totalBrut - totalCotisationsSalarialesBrutes).toFixed(2)
  );

  // ==================== DECLARATION PAJEMPLOI (BE58, BE59, CM61, AY61) ====================
  // Formule exacte BE58 du 02/06/2024 :
  // =SI(S3="Oui";(SOMME(DF18+DH20*(DH18/(DH18+DH19)/DD18)+(DH26+DH27+DH29)/DD18));SOMME(DF18+SOMME(DH20;DH26;DH27)/DD18-DF22))
  let BE58 = 0;
  if (DD18 > 0) {
    if (config.majorationHSMensualisee) {
      const ratioNorm = DH18 + DH19 > 0 ? DH18 / (DH18 + DH19) : 1;
      BE58 = DF18 + (DH20 * ratioNorm) / DD18 + (DH26 + DH27 + DH29) / DD18;
    } else {
      BE58 = DF18 + (DH20 + DH26 + DH27) / DD18 - DF22;
    }
  }
  const heuresNormalesPajemploi = Math.max(0, Math.round(BE58));

  // Formule exacte BE59 du 25/10/2024 :
  // =SI(BO3="Réel";X61-X62+AR55;ARRONDI.SUP(L10-L10*X62/X61+AR55+(DH29+DH27)/BH9/(L9/L10);0))
  let joursActivitePajemploi = 0;
  if (isReel) {
    joursActivitePajemploi = Math.max(
      0,
      Math.ceil(totalJoursPotentiels - totalJoursAbsence + totalJoursEnPlus)
    );
  } else {
    const L10 = contrat.joursMensualisesExact;
    const L9 = contrat.heuresMensualiseesTotal;
    const ratioAbs =
      totalJoursPotentiels > 0 ? totalJoursAbsence / totalJoursPotentiels : 0;
    const hParJourContrat = L10 > 0 ? L9 / L10 : 8;
    const joursRegul =
      DD18 > 0 && hParJourContrat > 0
        ? (DH29 + DH27) / DD18 / hParJourContrat
        : 0;
    joursActivitePajemploi = Math.max(
      0,
      Math.ceil(L10 - L10 * ratioAbs + totalJoursEnPlus + joursRegul)
    );
  }

  const CE58 = Math.round(DF21); // Heures complémentaires Pajemploi
  const CE59 = Math.round(
    (config.majorationHSMensualisee ? DF19 : DF22) +
      DF23 +
      (DD19 > 0 ? DH28 / DD19 : 0)
  ); // Heures majorées Pajemploi

  // CM61 : ICCP net (=DH30 * CK9, formule du 27/04/2024)
  const CM61 = Number((DH30 * bareme.tauxConversionBrutNet).toFixed(2));

  // AY61 : Salaire net Pajemploi (hors IE, IR, IK, Rupture et ICCP)
  const AY61 = Number((salaireNetAvantImpot - CM61).toFixed(2));

  // CB60 : Taux horaire net
  const CB60 = Number(contrat.tauxHoraireNet.toFixed(4));

  // DE44 : CSG + CRDS non déductible
  const DE44 = assietteCSG * bareme.salCsgCrdsNonDeductible;

  // Formule CV51 du 27/04/2024 pour le Salaire Net Imposable :
  // =SI(DE46=0;AY61;ARRONDI(BE58;0)*CB60)+DH57+DE44+CM61
  // (Les heures complémentaires et majorées sont exonérées d'impôt sur le revenu !)
  const baseNetImposableHorsHCHS =
    montantExonerationSalarialeHCHS === 0
      ? AY61
      : Math.round(BE58) * CB60 + (DH24 + DH25) * bareme.tauxConversionBrutNet;

  const salaireNetImposableHorsIEIR = Number(
    (baseNetImposableHorsHCHS + DE44 + CM61).toFixed(2)
  );

  // Salaire net imposable avec IE et IR (pour la déclaration de revenus AM)
  const salaireNetImposableAvecIEIR = Number(
    (salaireNetImposableHorsIEIR + totalIE + totalIR).toFixed(2)
  );

  const indemniteRupture = Number((vars.indemniteRupture || 0).toFixed(2));
  const totalIndemnites = Number(
    (totalIE + totalIR + totalIK + indemniteRupture).toFixed(2)
  );

  const montantImpotPAS = Number(
    (
      (salaireNetImposableHorsIEIR * (config.tauxImpositionPAS || 0)) /
      100
    ).toFixed(2)
  );

  const netAPayer = Number(
    (salaireNetAvantImpot + totalIndemnites - montantImpotPAS).toFixed(2)
  );

  // Formule exacte BH57 du 11/07/2026 : Contrôle Dépassement plafond CAF
  // =SI((AY61+DB46+CN58+CN59)/(BE58+CE58+CE59) > PlafondCAF; "Dépassement plafond CAF"; "")
  const dateMoisStr = `${feuille.annee}-${String(feuille.mois).padStart(2, '0')}-01`;
  let depassementPlafondCAF = false;
  let ratioPlafondCAF = 0;

  if (dateMoisStr < '2025-09-01') {
    const nbJoursTotal = joursActivitePajemploi + (vars.nbJoursCPDeclares || 0);
    ratioPlafondCAF = nbJoursTotal > 0 ? totalBrut / nbJoursTotal : 0;
    depassementPlafondCAF = ratioPlafondCAF > bareme.plafondCAF;
  } else {
    const denomHeures = BE58 + CE58 + CE59;
    // Dans l'Excel, le numérateur compare le brut total (hors ICCP) rapporté aux heures totales ou le net + cotisations
    const numBrutCompare = totalBrut - DH30;
    ratioPlafondCAF = denomHeures > 0 ? numBrutCompare / denomHeures : DD18;
    depassementPlafondCAF = ratioPlafondCAF > bareme.plafondCAF;
  }

  // ==================== SUIVI REGULARISATION AI ====================
  const heuresNormalesRealiseesAssimiliees =
    totalHeuresRealisees -
    totalHeuresComplementaires -
    totalHeuresMajPrevues -
    totalHeuresMajNonPrevues +
    Math.max(
      0,
      totalHeuresPrevues -
        totalHeuresADeduire -
        (totalHeuresRealisees -
          totalHeuresComplementaires -
          totalHeuresMajPrevues -
          totalHeuresMajNonPrevues)
    );

  const heuresNormalesPayees = DD18 > 0 ? (DH18 + DH20) / DD18 : 0;

  // Formules BF65 et CF65 du 27/04/2024 :
  // BF65 = SI(S3="Oui"; AH55; 0)
  // CF65 = SI(S3="Oui"; CE59; 0)
  const heuresMajRealisees = config.majorationHSMensualisee
    ? totalHeuresMajPrevues
    : 0;
  const heuresMajPayees = config.majorationHSMensualisee ? CE59 : 0;

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
    salaireBaseMensuelBrut: Number(DH18.toFixed(2)),
    hrsMensuMajoreesBrut: Number(DH19.toFixed(2)),
    deductionAbsenceCourCassationBrut: Number(DH20.toFixed(2)),
    heuresCompBrut: Number(DH21.toFixed(2)),
    heuresMajPrevuesBrut: Number(DH22.toFixed(2)),
    heuresMajNonPrevuesBrut: Number(DH23.toFixed(2)),
    maj1erMaiBrut: Number(DH24.toFixed(2)),
    majJFBrut: Number(DH25.toFixed(2)),
    cpVersementBrut: Number(DH26.toFixed(2)),
    regularisationNormaleBrut: Number(DH27.toFixed(2)),
    regularisationMajBrut: Number(DH28.toFixed(2)),
    primePrecariteBrut: Number(DH29.toFixed(2)),
    soldeCPFinContratBrut: Number(DH30.toFixed(2)),
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
      heuresComplementaires: CE58,
      heuresMajorees: CE59,
      tauxHoraireNet: Number(contrat.tauxHoraireNet.toFixed(2)),
      salaireNetDeclare: AY61,
      ie: totalIE,
      ir: totalIR,
      ik: totalIK,
      iccp: CM61,
      indemniteRupture,
      depassementPlafondCAF,
      ratioPlafondCAF: Number(ratioPlafondCAF.toFixed(2)),
    },
    regulAI: {
      heuresNormalesRealiseesAssimiliees: Number(
        heuresNormalesRealiseesAssimiliees.toFixed(2)
      ),
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
        (
          nbJoursReelsAccueilTotal * (config.repasFournisParentsValeurJour || 0)
        ).toFixed(2)
      ),
    },
  };
}
