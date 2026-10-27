# Calculateur Assistante Maternelle (Présence, Bulletin de Salaire & Pajemploi)

Application web moderne permettant de calculer la rémunération mensuelle d'une **Assistante Maternelle**, d'éditer la **Feuille de présence** et le **Bulletin de salaire officiel**, et d'obtenir les montants exacts pour la **Déclaration Pajemploi** (conforme à la Convention Collective Nationale des Assistants Maternels du Particulier Employeur — **Version du 11/07/2026**).

## Fonctionnalités principales

1. **Paramétrage du Contrat & Mensualisation** :
   - Accueil **52 semaines** (Année Complète - AC), **46 semaines ou moins** (Année Incomplète - AI) ou **Contrat au Réel**.
   - Gestion multi-rythmes (**Semaines types A à F**) avec planning journalier du Lundi au Dimanche.
   - Conversion instantanée Brut ↔ Net selon la région (**Autres régions : 78,12%** / **Alsace-Moselle : 76,82%**).
   - Barèmes officiels intégrés de **2019 à 2026+** (SMIC, minimum conventionnel, indemnités d'entretien, plafond CAF CMG).
   - Alertes automatiques en cas de dépassement du plafond CAF ou de taux horaire inférieur au minimum légal.

2. **Feuille de Présence Mensuelle Interactive (15 colonnes)** :
   - **Sélecteur intelligent de situation par jour** appliquant automatiquement les règles de la Notice officielle :
     - *Jour normal travaillé* (Col 1, 2, 3)
     - *Absence convenance personnelle de l'employeur* (Journée maintenue sans IE/IR/IK — Col 1, 2)
     - *Absence déduite par calcul Cour de cassation* (Enfant malade avec certificat médical, convenance AM, sans solde — Col 1, 2, 4)
     - *Période d'adaptation* (Calcul automatique des heures non effectuées à déduire — Col 1, 2, 3, 4)
     - *Semaine d'absence prévue au contrat AI* (Col 2 uniquement)
     - *Congés payés AM*, *Jours fériés chômés*, *Avant début / Après fin de contrat*, *Heures hors contrat*.
   - Calcul automatique des **Indemnités d'Entretien (IE)** jour par jour selon la durée réelle d'accueil ($\ge 2,65\text{ €}$ min/jour et barème horaire conventionnel $0,435\text{ €/h}$).
   - Calcul des **Indemnités de Repas (IR)** et **Indemnités Kilométriques (IK)**.

3. **Bulletin de Salaire Officiel & Aide à la Déclaration Pajemploi** :
   - Calcul de la **déduction Cour de cassation** : $\text{Salaire mensualisé} \times \frac{\text{Heures à déduire}}{\text{Heures potentielles du mois}}$.
   - Calcul détaillé des cotisations salariales et patronales (incluant le plafond de $5\text{ €}$ sur la contribution santé au travail et l'**exonération salariale de 11,31%** sur les heures complémentaires et majorées).
   - Encadré **Déclaration Pajemploi** prêt à copier en 1 clic (Heures normales, Jours d'activité arrondis au supérieur, CP, HC, HS, Taux net, Salaire net, IE, IR, IK, ICCP).
   - Encadré **Déclaration de revenus de l'Assistante Maternelle** (calcul des jours $\ge 8\text{h}$ et des heures des jours $< 8\text{h}$ pour l'abattement fiscal).
   - **Impression A4 / Export PDF** intégré.

4. **Récapitulatif Multi-Mois, Régularisation AI & Impôts** :
   - Suivi chronologique de tous les mois, calcul de l'écart d'heures en Année Incomplète, estimation de l'indemnité de rupture ($1/80^\text{e}$) et du crédit d'impôt parent employeur.
   - Sauvegarde locale automatique dans le navigateur + Import/Export JSON.

## Démarrage rapide

```bash
npm install
npm run dev
```
