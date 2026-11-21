#!/bin/zsh
# Le 26 de chaque mois : envoie à Marie le lien de l'app AssMat pré-rempli sur le mois en cours
# pour qu'elle valide la feuille de présence avant de payer Mabrouka.
# Usage : rappel_marie_paie.sh [--dry-run]
MARIE="+33607688499"
MOIS_ID="$(date +%Y-%m)"
NOMS=(janvier février mars avril mai juin juillet août septembre octobre novembre décembre)
MOIS_NOM="${NOMS[$(date +%-m)]}"
URL="https://mrthomaslef.github.io/assistante-maternelle/?mois=${MOIS_ID}"
MSG="Coucou Marie 😘 C'est le 26 : la feuille de Mabrouka pour ${MOIS_NOM} est pré-remplie. Tu peux vérifier que tout est bon (absences, congés, fériés) avant qu'on la paie ? 👉 ${URL}"

if [[ "$1" == "--dry-run" ]]; then echo "$MSG"; exit 0; fi

osascript - "$MARIE" "$MSG" <<'APPLESCRIPT'
on run argv
  tell application "Messages"
    try
      send (item 2 of argv) to participant (item 1 of argv) of (1st account whose service type = iMessage)
    on error
      send (item 2 of argv) to participant (item 1 of argv) of (1st account whose service type = SMS)
    end try
  end tell
end run
APPLESCRIPT
echo "$(date '+%F %T') envoyé ($?) : $URL" >> "$HOME/Library/Logs/rappel_marie_paie.log"
