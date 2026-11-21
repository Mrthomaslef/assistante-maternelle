#!/bin/zsh
# Le 26 de chaque mois :
#  1. lit les messages du mois (Mabrouka + Marie) et repère les JOURNÉES COMPLÈTES d'absence de Mabrouka
#  2. publie public/data/absences.json (dates + motif court, jamais le texte des messages)
#  3. attend la mise en ligne puis envoie à Marie le lien du mois pré-rempli
# Usage : preparer_mois_marie.sh [YYYY-MM] [--dry-run]
set -u
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:/usr/bin:/bin"
REPO="/Users/thomaslefevre/Assistantematernelle"
LOG="$HOME/Library/Logs/rappel_marie_paie.log"
source "$HOME/.config/assmat/contacts.env"  # MARIE_TEL (hors dépôt public)
[[ -n "${DEST_TEL:-}" ]] && MARIE_TEL="$DEST_TEL"  # test : envoyer à un autre numéro
MOIS_ID="$(date +%Y-%m)"; DRY=0
for a in "$@"; do [[ "$a" == "--dry-run" ]] && DRY=1 || MOIS_ID="$a"; done
log() { echo "$(date '+%F %T') [$MOIS_ID] $*" | tee -a "$LOG"; }
NOMS=(janvier février mars avril mai juin juillet août septembre octobre novembre décembre)
MOIS_NOM="${NOMS[$((10#${MOIS_ID#*-}))]}"

if [[ -n "${MSGS_FILE:-}" ]]; then MSGS="$(cat "$MSGS_FILE")"; else MSGS="$(python3 -I "$REPO/scripts/extraire_messages_mabrouka.py" "$MOIS_ID" 2>>"$LOG")"; fi; [[ -n "$MSGS" ]] || { log "extraction échouée"; exit 1; }

PROMPT="Tu prépares la paie de Mabrouka, assistante maternelle d'Émile (planning : lundi, mardi, jeudi, vendredi 10h, mercredi 5h).
Voici les messages (iMessage/SMS/WhatsApp) avec Mabrouka et ceux de Marie (la maman) qui parlent d'elle, pour le mois ${MOIS_ID} (+ 7 jours avant).
Trouve UNIQUEMENT les journées COMPLÈTES du mois ${MOIS_ID} où Mabrouka n'a PAS accueilli Émile parce qu'ELLE était absente / indisponible (maladie, congé, formation sur la journée entière, rendez-vous toute la journée, « pas dispo », etc.).
NE PAS compter : retards des parents, départ anticipé ou récupération plus tôt, demi-journées, absence d'Émile décidée par les parents, rendez-vous en soirée, journées hors du mois ${MOIS_ID}.
En cas de doute, ne retire RIEN. S'il n'y a aucun message clair d'absence d'une journée complète, renvoie une liste vide.
Réponds UNIQUEMENT avec du JSON valide, sans texte autour : {\"absences\":[{\"date\":\"YYYY-MM-DD\",\"motif\":\"2-4 mots\"}]}

Messages :
${MSGS}"

REP="$(claude -p --output-format text "$PROMPT" 2>>"$LOG")" || { log "analyse claude échouée"; REP='{"absences":[]}'; ECHEC=1; }
ABS="$(python3 -I - "$MOIS_ID" "$REP" <<'PY'
import json, re, sys, datetime
mois, rep = sys.argv[1], sys.argv[2]
m = re.search(r"\{.*\}", rep, re.S)
try: data = json.loads(m.group(0)) if m else {"absences": []}
except Exception: data = {"absences": []}
ok = []
for a in data.get("absences", []):
    d = str(a.get("date", ""))
    try: jd = datetime.date.fromisoformat(d)
    except Exception: continue
    if d.startswith(mois) and jd.weekday() < 5 and d not in [x["date"] for x in ok]:
        ok.append({"date": d, "motif": str(a.get("motif", "absence"))[:40]})
print(json.dumps(sorted(ok, key=lambda x: x["date"]), ensure_ascii=False))
PY
)"
log "absences retenues : $ABS"

if [[ $DRY == 1 ]]; then echo "DRY-RUN — absences : $ABS"; exit 0; fi

# Publication
cd "$REPO" && git pull -q --rebase --autostash
GEN="$(date +%Y%m%d%H%M%S)"
python3 -I - "$REPO/public/data/absences.json" "$MOIS_ID" "$GEN" "$ABS" <<'PY'
import json, sys
p, mois, gen, abs_ = sys.argv[1:5]
try: d = json.load(open(p))
except Exception: d = {}
d[mois] = {"genere_le": gen, "absences": json.loads(abs_)}
json.dump(d, open(p, "w"), ensure_ascii=False, indent=1)
PY
git add public/data/absences.json && git commit -qm "data: absences Mabrouka $MOIS_ID (auto)" && git push -q || log "git push échoué"

URL_DATA="https://mrthomaslef.github.io/assistante-maternelle/data/absences.json"
for i in {1..40}; do curl -fs "$URL_DATA?t=$RANDOM" | grep -q "$GEN" && break; sleep 30; done

NB="$(python3 -c "import json,sys;print(len(json.loads(sys.argv[1])))" "$ABS")"
if [[ "$NB" == "0" ]]; then DETAIL="D'après nos messages, aucune absence de Mabrouka ce mois-ci, donc rien n'a été retiré."
else DETAIL="D'après nos messages, j'ai retiré ${NB} journée(s) d'absence de Mabrouka : $(python3 -c "
import json,sys,datetime
J=['lun','mar','mer','jeu','ven','sam','dim']
print(', '.join(f\"{J[datetime.date.fromisoformat(a['date']).weekday()]} {int(a['date'][8:])} ({a['motif']})\" for a in json.loads(sys.argv[1])))" "$ABS")."; fi

URL="https://mrthomaslef.github.io/assistante-maternelle/?mois=${MOIS_ID}"
MSG="Coucou Marie 😘 C'est le 26 : la feuille de Mabrouka pour ${MOIS_NOM} est pré-remplie. ${DETAIL} Tu peux vérifier que tout est bon avant qu'on la paie ? 👉 ${URL}"

osascript - "$MARIE_TEL" "$MSG" <<'APPLESCRIPT'
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
log "message envoyé à Marie ($?) : $URL"
