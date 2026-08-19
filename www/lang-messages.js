// ===== ÜBERSETZUNGEN =====
let currentLanguage = 'de';

const translations = {
    de: {
    // ===== GEBÄUDETYPEN (für Dialoge & Nachrichten) =====
"Haus": "Haus",
"Lager": "Lager",
"Bauer": "Bauer",
"Holzfäller": "Holzfäller",
"Steinmetz": "Steinmetz",
"Wachturm": "Wachturm",
"Fischerhütte": "Fischerhütte",
"Grenzkontrolle": "Grenzkontrolle",
"Baustelle": "Baustelle",

// ===== BAU-NACHRICHTEN =====
"🔨 {type} wird gebaut... (10s)": "🔨 {type} wird gebaut... (10s)",
"🔨 {type} (P2) wird gebaut... (10s)": "🔨 {type} (P2) wird gebaut... (10s)",
"✅ {type} fertig gebaut!": "✅ {type} fertig gebaut!",
"✅ {type} (P2) fertig gebaut!": "✅ {type} (P2) fertig gebaut!",
"✅ NPC {type} fertig gebaut!": "✅ NPC {type} fertig gebaut!",
"🏗️ {type} Baubeginn...": "🏗️ {type} Baubeginn...",

// ===== UPGRADE-NACHRICHTEN =====
"⬆️ {type} auf Stufe {level} upgraded!": "⬆️ {type} auf Stufe {level} upgraded!",
"⬆️ {type} (P2) auf Stufe {level} upgraded!": "⬆️ {type} (P2) auf Stufe {level} upgraded!",
"⬆️ NPC {type} auf Stufe {level} upgraded!": "⬆️ NPC {type} auf Stufe {level} upgraded!",

// ===== ZERSTÖRungs-NACHRICHTEN =====
"💀 {type} abgerissen!": "💀 {type} abgerissen!",
"💀 {type} (P2) abgerissen!": "💀 {type} (P2) abgerissen!",
"💀 NPC {type} abgerissen!": "💀 NPC {type} abgerissen!",

// ===== BRAND-NACHRICHTEN =====
"🔥 {type} brennt!": "🔥 {type} brennt!",
"🔥 {type} (P2) brennt!": "🔥 {type} (P2) brennt!",
"🔥 NPC {type} brennt!": "🔥 NPC {type} brennt!",
"💀 {type} abgebrannt!": "💀 {type} abgebrannt!",
"💀 {type} (P2) abgebrannt!": "💀 {type} (P2) abgebrannt!",
"💀 NPC {type} abgebrannt!": "💀 NPC {type} abgebrannt!",
"💀 Baustelle abgebrannt!": "💀 Baustelle abgebrannt!",
"💀 Baustelle (P2) abgebrannt!": "💀 Baustelle (P2) abgebrannt!",
"💀 NPC Baustelle abgebrannt!": "💀 NPC Baustelle abgebrannt!",

// ===== FISCHERHÜTTE =====
"🐠 {type} fertig! {count} Wasser-Felder verfügbar": "🐠 {type} fertig! {count} Wasser-Felder verfügbar",
"🐠 {type} (P2) fertig! {count} Wasser-Felder verfügbar": "🐠 {type} (P2) fertig! {count} Wasser-Felder verfügbar",
"🐠 NPC {type} fertig!": "🐠 NPC {type} fertig!",
    // ===== NPC NACHRICHTEN =====
"🤖 NPC-Siedlung mit Grenzkontrolle gestartet!": "🤖 NPC-Siedlung mit Grenzkontrolle gestartet!",
"🤖 NPC hat kein Lager mehr! Versucht zu überleben...": "🤖 NPC hat kein Lager mehr! Versucht zu überleben...",
"🤖 NPC baut neues Lager!": "🤖 NPC baut neues Lager!",
"🤖 NPC SIEDLUNG ZUSAMMENGEBROCHEN!": "🤖 NPC SIEDLUNG ZUSAMMENGEBROCHEN!",
"🤖 NPC-Notfall-Einwohner erschienen!": "🤖 NPC-Notfall-Einwohner erschienen!",
"🤖 NPC baut Fischerhütte!": "🤖 NPC baut Fischerhütte!",
"🤖 NPC Fischerhütte fertig!": "🤖 NPC Fischerhütte fertig!",
"🤖 NPC baut Grenze!": "🤖 NPC baut Grenze!",
"🤖 NPC baut Grenzkontrolle bei": "🤖 NPC baut Grenzkontrolle bei",
"🤖 NPC Grenzkontrolle fertig!": "🤖 NPC Grenzkontrolle fertig!",
"✅ NPC {displayName} fertig gebaut!": "✅ NPC {displayName} fertig gebaut!",
"🤖 NPC upgraded": "🤖 NPC upgraded",
"⬆️ NPC upgraded {type} auf Stufe {level}!": "⬆️ NPC upgraded {type} auf Stufe {level}!",
"🤖 NPC hat 250 Einwohner - IMMER KRIEG!": "🤖 NPC hat 250 Einwohner - IMMER KRIEG!",
"🤖 NPC hat 500 Einwohner - IMMER KRIEG!": "🤖 NPC hat 500 Einwohner - IMMER KRIEG!",
"☠️ NPC bleibt im Krieg (Bevölkerung zu hoch)": "☠️ NPC bleibt im Krieg (Bevölkerung zu hoch)",
"🕊️ NPC kehrt in den Frieden zurück (5 Min. abgelaufen)": "🕊️ NPC kehrt in den Frieden zurück (5 Min. abgelaufen)",
"⚔️ NPC hat den Krieg erklärt!": "⚔️ NPC hat den Krieg erklärt!",
"🛡️ NPC-Schutz: {remaining}s verbleibend ({population} Einwohner)": "🛡️ NPC-Schutz: {remaining}s verbleibend ({population} Einwohner)",
"⚔️ NPC-Schutz aufgehoben! Feinde greifen jetzt an!": "⚔️ NPC-Schutz aufgehoben! Feinde greifen jetzt an!",
"🕊️ NPC hat weniger als 12 Einwohner - Schutz aktiviert": "🕊️ NPC hat weniger als 12 Einwohner - Schutz aktiviert",
"💀 NPC-Einwohner von Feind getötet!": "💀 NPC-Einwohner von Feind getötet!",
"💀 NPC hat kein Lager mehr!": "💀 NPC hat kein Lager mehr!",
"💀 NPC-Gebäude abgebrannt!": "💀 NPC-Gebäude abgebrannt!",
"💀 NPC Baustelle abgebrannt!": "💀 NPC Baustelle abgebrannt!",
"💀 NPC Grenzkontrolle abgebrannt!": "💀 NPC Grenzkontrolle abgebrannt!",
"🤖 NPC baut {type} bei ({x},{y})": "🤖 NPC baut {type} bei ({x},{y})",
"🤖 NPC baut Grenze! (Kein Platz für {type} & kein Upgrade möglich)": "🤖 NPC baut Grenze! (Kein Platz für {type} & kein Upgrade möglich)",
        // ===== START-DIALOG =====
        "start_title": "🏰 Siedlung",
        "start_mode": "Spielmodus",
        "start_single": "⚔️ Einzel",
        "start_split": "👥 2 Spieler",
        "start_network": "🌐 Netzwerk",
        "start_map": "Kartengröße",
        "start_micro": "🟩 Micro",
        "start_normal": "🟩 Normal",
        "start_stretched": "🟧 Schlauch",
        "start_difficulty": "Schwierigkeit (nur Einzel)",
        "start_easy": "🟢 Einfach",
        "start_hard": "🔴 Schwer",
        "start_resources": "Start-Ressourcen",
        "start_grain": "🌾 Getreide",
        "start_wood": "🪵 Holz",
        "start_stone": "🪨 Stein",
        "start_fish": "🐠 Fisch",
        "start_enemies": "🧟‍♂️ Gegneranzahl",
        "start_few": "🟢 Einzelne",
        "start_normal_enemies": "🟡 Normale",
        "start_many": "🔴 Viele",
        "start_extreme": "⚫ Extrem",
        "start_enemies_hint": "Bestimmt die Anzahl der Gegner im Spiel",
        "start_button": "🎮 Spiel starten",
        
        // ===== CONFIRM DIALOG =====
        "confirm_default": "Aktion bestätigen",
        "confirm_yes": "✅ Ja",
        "confirm_no": "❌ Nein",
        
        // ===== START-DIALOGE (Einzelmodus) =====
        "👉 Platziere deine Grenzkontrolle (kostenlos)": "👉 Platziere deine Grenzkontrolle (kostenlos)",
        
        "start_grenze": "🚩 Grenzkontrolle an dieser Stelle platzieren? (kostenlos)",
        "start_lager": "📦 Lager an dieser Stelle platzieren? (kostenlos)",
        "start_haus": "🏠 Haus an dieser Stelle platzieren? (kostenlos)",
        "start_grenze_effect": "Ermöglicht das Bauen in diesem Bereich",
        "start_lager_effect": "Dein erstes Lager",
        "start_haus_effect": "Dein erstes Haus mit 6 Einwohnern",
        "start_free": "✅ Startgebäude - kostenlos",
        "start_no_cost": "✅ Startgebäude - keine Kosten",
        
        // ===== SPLIT-START-DIALOGE (2 Spieler) =====
        "split_grenze_player1": "🚩 Grenzkontrolle für Spieler 1 platzieren? (kostenlos)",
        "split_lager_player1": "📦 Lager für Spieler 1 platzieren? (kostenlos)",
        "split_haus_player1": "🏠 Haus für Spieler 1 platzieren? (kostenlos)",
        "split_grenze_player2": "🚩 Grenzkontrolle für Spieler 2 platzieren? (kostenlos)",
        "split_lager_player2": "📦 Lager für Spieler 2 platzieren? (kostenlos)",
        "split_haus_player2": "🏠 Haus für Spieler 2 platzieren? (kostenlos)",
        
        // ===== NETZWERK-DIALOGE =====
        "network_host_grenze": "🚩 Grenzkontrolle für Host platzieren? (kostenlos)",
        "network_host_lager": "📦 Lager für Host platzieren? (kostenlos)",
        "network_host_haus": "🏠 Haus für Host platzieren? (kostenlos)",
        "network_client_grenze": "🚩 Grenzkontrolle für Client platzieren? (kostenlos)",
        "network_client_lager": "📦 Lager für Client platzieren? (kostenlos)",
        "network_client_haus": "🏠 Haus für Client platzieren? (kostenlos)",
        "network_host_grenze_phase": "👉 Host platziere deine Grenzkontrolle (oberes Drittel)",
        "network_host_lager_phase": "👉 Host platziere dein Lager (kostenlos)",
        "network_host_haus_phase": "👉 Host platziere dein Haus (kostenlos)",
        "network_client_grenze_phase": "👉 Client platziere deine Grenzkontrolle (unteres Drittel)",
        "network_client_lager_phase": "👉 Client platziere dein Lager (kostenlos)",
        "network_client_haus_phase": "👉 Client platziere dein Haus (kostenlos)",
        
        // ===== ABRISS-DIALOGE =====
        "destroy_grenze": "🚩 Grenzkontrolle (Level {level}) wirklich abreissen?",
        "destroy_building": "{type} (Level {level}) wirklich abreissen?",
        "destroy_grenze_p2": "🚩 Grenzkontrolle (P2) wirklich abreissen?",
        "destroy_building_p2": "{type} (P2) wirklich abreissen?",
        "destroy_no_refund": "Keine Rückerstattung!",
        
        // ===== UPGRADE-DIALOGE =====
        "upgrade_grenze": "🚩 Grenzkontrolle auf Stufe {level} upgraden?",
        "upgrade_building": "{type} auf Stufe {level} upgraden?",
        "upgrade_grenze_p2": "🚩 Grenzkontrolle (P2) auf Stufe {level} upgraden?",
        "upgrade_building_p2": "{type} (P2) auf Stufe {level} upgraden?",
        "upgrade_cost": "Kosten: {wood}🪵 {stone}🪨",
        "upgrade_effect": "Effekt: {desc}",
        
        // ===== HAUPTMENÜ-DIALOG =====
        "main_menu": "❌ Wirklich zum Hauptmenü?",
        "main_menu_cost": "Das Spiel wird neu gestartet!",
        "main_menu_effect": "⚠️ Alle Fortschritte gehen verloren!",
        
        // ===== GAME OVER =====
        "gameover_victory": "🎉 SIEG!",
        "gameover_all_buildings": "Du hast alle NPC-Gebäude erobert!",
        "gameover_defeat": "💀 NIEDERLAGE!",
        "gameover_no_lager": "Kein Lager - Deine Siedlung ist zusammengebrochen!",
        "gameover_npc_no_lager": "NPC hat kein Lager - Du hast gewonnen!",
        "gameover_destroyed": "Deine Siedlung wurde vollständig zerstört!",
        "gameover_p1_wins": "🎉 SPIELER 1 GEWINNT!",
        "gameover_p2_wins": "🎉 SPIELER 2 GEWINNT!",
        "gameover_draw": "⚖️ UNENTSCHIEDEN!",
        "gameover_p1_no_lager": "Spieler 1 hat kein Lager - Spieler 2 siegt!",
        "gameover_p2_no_lager": "Spieler 2 hat kein Lager - Spieler 1 siegt!",
        "gameover_both_no_lager": "Beide Spieler haben kein Lager mehr!",
        "gameover_p1_no_buildings": "Spieler 1 hat keine Gebäude mehr - Spieler 2 siegt!",
        "gameover_p2_no_buildings": "Spieler 2 hat keine Gebäude mehr - Spieler 1 siegt!",
        "gameover_both_no_buildings": "Beide Spieler haben keine Gebäude mehr!",
        
        // ===== RESTART / CONTINUE =====
        "restart": "🔄 Neues Spiel",
        "continue": "▶️ Weiterspielen",
        
        // ===== START-PHASE =====
        "start_phase_grenze": "👉 Platziere deine Grenzkontrolle (kostenlos)",
        "start_phase_lager": "👉 Platziere dein Lager (kostenlos)",
        "start_phase_haus": "👉 Platziere dein Haus (kostenlos)",
        "start_phase_grenze_p1": "👉 Spieler 1 platziere deine Grenzkontrolle (oberes Drittel)",
        "start_phase_grenze_p2": "👉 Spieler 2 platziere deine Grenzkontrolle (unteres Drittel)",
        "start_phase_lager_p1": "👉 Spieler 1 platziere dein Lager (kostenlos)",
        "start_phase_lager_p2": "👉 Spieler 2 platziere dein Lager (kostenlos)",
        "start_phase_haus_p1": "👉 Spieler 1 platziere dein Haus (kostenlos)",
        "start_phase_haus_p2": "👉 Spieler 2 platziere dein Haus (kostenlos)",
        
        // ===== TEMPORÄRE NACHRICHTEN (ALLE!) =====
        // ---- Fehler & Warnungen ----
        "❌ Diese Zelle ist bereits belegt!": "❌ Diese Zelle ist bereits belegt!",
        "❌ Jetzt ist der Client dran!": "❌ Jetzt ist der Client dran!",
        "❌ Jetzt ist der Host dran!": "❌ Jetzt ist der Host dran!",
        "❌ Du bist der Host - nutze deine Kamera!": "❌ Du bist der Host - nutze deine Kamera!",
        "❌ Du bist der Client - nutze deine Kamera!": "❌ Du bist der Client - nutze deine Kamera!",
        "❌ Host darf nur im oberen Drittel bauen!": "❌ Host darf nur im oberen Drittel bauen!",
        "❌ Client darf nur im unteren Drittel bauen!": "❌ Client darf nur im unteren Drittel bauen!",
        "❌ Jetzt ist Spieler 1 dran!": "❌ Jetzt ist Spieler 1 dran!",
        "❌ Jetzt ist Spieler 2 dran!": "❌ Jetzt ist Spieler 2 dran!",
        "❌ Spieler 1 darf nur im oberen Drittel bauen!": "❌ Spieler 1 darf nur im oberen Drittel bauen!",
        "❌ Spieler 2 darf nur im unteren Drittel bauen!": "❌ Spieler 2 darf nur im unteren Drittel bauen!",
        "❌ Nicht genug Ressourcen!": "❌ Nicht genug Ressourcen!",
        "❌ Außerhalb des Bau-Radius!": "❌ Außerhalb des Bau-Radius!",
        "❌ Kein Gebäude zum Abreissen gefunden!": "❌ Kein Gebäude zum Abreissen gefunden!",
        "❌ Kein Gebäude zum Upgraden gefunden!": "❌ Kein Gebäude zum Upgraden gefunden!",
        "❌ Nicht genug Ressourcen für Upgrade!": "❌ Nicht genug Ressourcen für Upgrade!",
        "❌ Gebäude kann nicht auf Wasser gebaut werden!": "❌ Gebäude kann nicht auf Wasser gebaut werden!",
        "❌ Maximale Anzahl Grenzkontrollen erreicht": "❌ Maximale Anzahl Grenzkontrollen erreicht",
        "❌ Auf Wasser kann nur eine Fischerhütte gebaut werden!": "❌ Auf Wasser kann nur eine Fischerhütte gebaut werden!",
        "❌ Fischerhütte muss auf festem Boden (Land) gebaut werden!": "❌ Fischerhütte muss auf festem Boden (Land) gebaut werden!",
        "❌ Keine Wasser-Felder in der Nähe für die Fischerhütte!": "❌ Keine Wasser-Felder in der Nähe für die Fischerhütte!",
        "❌ Keine Wasser-Felder in der Nähe für die Fischerhütte (P2)!": "❌ Keine Wasser-Felder in der Nähe für die Fischerhütte (P2)!",
        "❌ Zu nah an bestehender Grenze!": "❌ Zu nah an bestehender Grenze!",
        "❌ Baue zuerst eine Farm, einen Holzfäller, einen Steinmetz oder eine Fischerhütte!": "❌ Baue zuerst eine Farm, einen Holzfäller, einen Steinmetz oder eine Fischerhütte!",
        "❌ Startphase! Noch": "❌ Startphase! Noch",
        "❌ Frieden!": "❌ Frieden!",
        "❌ Lager muss innerhalb des Grenzkontroll-Radius liegen!": "❌ Lager muss innerhalb des Grenzkontroll-Radius liegen!",
        "❌ Haus muss innerhalb des Grenzkontroll-Radius liegen!": "❌ Haus muss innerhalb des Grenzkontroll-Radius liegen!",
        "❌ Nicht genug Ressourcen für": "❌ Nicht genug Ressourcen für",
        
        // ---- Erfolge & Bestätigungen ----
        "✅ Startgebäude - kostenlos": "✅ Startgebäude - kostenlos",
        "✅ Grenzkontrolle platziert! Jetzt Lager platzieren (innerhalb des Radius)": "✅ Grenzkontrolle platziert! Jetzt Lager platzieren (innerhalb des Radius)",
        "✅ Lager platziert! Jetzt Haus platzieren": "✅ Lager platziert! Jetzt Haus platzieren",
        "✅ fertig gebaut!": "✅ fertig gebaut!",
        "✅ Host platziert!": "✅ Host platziert!",
        "✅ platziert! Warte auf Host...": "✅ platziert! Warte auf Host...",
        "✅ Host Baubefehl ausgeführt:": "✅ Host Baubefehl ausgeführt:",
        "✅ Host Upgrade ausgeführt:": "✅ Host Upgrade ausgeführt:",
        "✅ Host Abriss ausgeführt:": "✅ Host Abriss ausgeführt:",
        "✅ Host Startgebäude platziert:": "✅ Host Startgebäude platziert:",
        "✅ Client Startgebäude platziert:": "✅ Client Startgebäude platziert:",
        
        // ---- Spiel-Status ----
        "🎮 Spiel gestartet! 6 Einwohner warten auf Befehle!": "🎮 Spiel gestartet! 6 Einwohner warten auf Befehle!",
        "🎮 Spiel gestartet! Beide Spieler sind bereit!": "🎮 Spiel gestartet! Beide Spieler sind bereit!",
        "🎮 Netzwerk-Spiel gestartet!": "🎮 Netzwerk-Spiel gestartet!",
        "👥 2-Spieler-Modus - platziert eure Startgebäude!": "👥 2-Spieler-Modus - platziert eure Startgebäude!",
        "🏗️ Baubeschränkung aufgehoben!": "🏗️ Baubeschränkung aufgehoben!",
        
        // ---- Gebäude ----
        "🔨 wird gebaut... (10s)": "🔨 wird gebaut... (10s)",
        "💀 Gebäude abgerissen": "💀 Gebäude abgerissen",
        "⬆️ Upgrade auf Stufe erfolgreich!": "⬆️ Upgrade auf Stufe erfolgreich!",
        "🚩 Grenzkontrolle wird gebaut...": "🚩 Grenzkontrolle wird gebaut...",
        "🚩 Grenzkontrolle fertig!": "🚩 Grenzkontrolle fertig!",
        "🚩 Grenzkontrolle (P2) fertig!": "🚩 Grenzkontrolle (P2) fertig!",
        "🚩 Grenzkontrolle (P2) wird gebaut...": "🚩 Grenzkontrolle (P2) wird gebaut...",
        "🚩 Grenzkontrolle Radius:": "🚩 Grenzkontrolle Radius:",
        "🚩 Grenzkontrolle (P2) Radius:": "🚩 Grenzkontrolle (P2) Radius:",
        "⬆️ Grenzkontrolle Radius:": "⬆️ Grenzkontrolle Radius:",
        "⬆️ Grenzkontrolle (P2) Radius:": "⬆️ Grenzkontrolle (P2) Radius:",
        "⬆️ Turm Reichweite auf": "⬆️ Turm Reichweite auf",
        "⬆️ Turm Kapazität auf": "⬆️ Turm Kapazität auf",
        "⬆️ Turm (P2) Reichweite auf": "⬆️ Turm (P2) Reichweite auf",
        "⬆️ Turm (P2) Kapazität auf": "⬆️ Turm (P2) Kapazität auf",
        "🐠 Fischerhütte fertig!": "🐠 Fischerhütte fertig!",
        "🐠 Fischerhütte wird gebaut...": "🐠 Fischerhütte wird gebaut...",
        "🐠 Fischerhütte (P2) fertig!": "🐠 Fischerhütte (P2) fertig!",
        "🐠 Fischerhütte (P2) wird gebaut...": "🐠 Fischerhütte (P2) wird gebaut...",
        
        // ---- NPC ----
        "🤖 NPC-Siedlung mit Grenzkontrolle gestartet!": "🤖 NPC-Siedlung mit Grenzkontrolle gestartet!",
        "🤖 NPC hat kein Lager mehr! Versucht zu überleben...": "🤖 NPC hat kein Lager mehr! Versucht zu überleben...",
        "🤖 NPC baut neues Lager!": "🤖 NPC baut neues Lager!",
        "🤖 NPC SIEDLUNG ZUSAMMENGEBROCHEN!": "🤖 NPC SIEDLUNG ZUSAMMENGEBROCHEN!",
        "🤖 NPC baut Fischerhütte!": "🤖 NPC baut Fischerhütte!",
        "🤖 NPC Fischerhütte fertig!": "🤖 NPC Fischerhütte fertig!",
        "🤖 NPC baut Grenze!": "🤖 NPC baut Grenze!",
        "🤖 NPC baut Grenzkontrolle bei": "🤖 NPC baut Grenzkontrolle bei",
        "🤖 NPC upgraded": "🤖 NPC upgraded",
        "🤖 NPC hat 250 Einwohner - IMMER KRIEG!": "🤖 NPC hat 250 Einwohner - IMMER KRIEG!",
        "🤖 NPC hat 500 Einwohner - IMMER KRIEG!": "🤖 NPC hat 500 Einwohner - IMMER KRIEG!",
        "💀 NPC-Einwohner von Feind getötet!": "💀 NPC-Einwohner von Feind getötet!",
        "💀 NPC hat kein Lager mehr!": "💀 NPC hat kein Lager mehr!",
        "💀 NPC-Gebäude abgebrannt!": "💀 NPC-Gebäude abgebrannt!",
        "💀 NPC Baustelle abgebrannt!": "💀 NPC Baustelle abgebrannt!",
        "💀 NPC Grenzkontrolle abgebrannt!": "💀 NPC Grenzkontrolle abgebrannt!",
        "🛡️ NPC-Schutz:": "🛡️ NPC-Schutz:",
        "⚔️ NPC-Schutz aufgehoben!": "⚔️ NPC-Schutz aufgehoben!",
        "🕊️ NPC hat weniger als 12 Einwohner - Schutz aktiviert": "🕊️ NPC hat weniger als 12 Einwohner - Schutz aktiviert",
        "☠️ NPC bleibt im Krieg (Bevölkerung zu hoch)": "☠️ NPC bleibt im Krieg (Bevölkerung zu hoch)",
        "🕊️ NPC kehrt in den Frieden zurück (5 Min. abgelaufen)": "🕊️ NPC kehrt in den Frieden zurück (5 Min. abgelaufen)",
        "⚔️ NPC hat den Krieg erklärt!": "⚔️ NPC hat den Krieg erklärt!",
        
        // ---- Einwohner ----
        "💀 Einwohner von Feind getötet!": "💀 Einwohner von Feind getötet!",
        "💀 Spieler 2 Einwohner von Feind getötet!": "💀 Spieler 2 Einwohner von Feind getötet!",
        "💀 KEIN LAGER FÜR SPIELER 2!": "💀 KEIN LAGER FÜR SPIELER 2!",
        
        // ---- Drache ----
        "🐉 EIN DRACHE IST ERWACHT!": "🐉 EIN DRACHE IST ERWACHT!",
        "🐉 DRACHE BESIEGT!": "🐉 DRACHE BESIEGT!",
        "🐉 Drache hat ein Gebäude zerstört!": "🐉 Drache hat ein Gebäude zerstört!",
        "🐉 Drache hat ein Gebäude (P2) zerstört!": "🐉 Drache hat ein Gebäude (P2) zerstört!",
        "🐉 Drache hat ein NPC-Gebäude zerstört!": "🐉 Drache hat ein NPC-Gebäude zerstört!",
        
        // ---- Feuer ----
        "🔥 brennt!": "🔥 brennt!",
        "💀 Gebäude abgebrannt!": "💀 Gebäude abgebrannt!",
        "💀 Gebäude (P2) abgebrannt!": "💀 Gebäude (P2) abgebrannt!",
        "💀 Grenzkontrolle abgebrannt!": "💀 Grenzkontrolle abgebrannt!",
        "💀 Grenzkontrolle (P2) abgebrannt!": "💀 Grenzkontrolle (P2) abgebrannt!",
        "💀 Baustelle abgebrannt!": "💀 Baustelle abgebrannt!",
        "💀 Baustelle (P2) abgebrannt!": "💀 Baustelle (P2) abgebrannt!",
        
        // ---- Feinde ----
        "⚔️ GROSSANGRIFF!": "⚔️ GROSSANGRIFF!",
        
        // ---- Modi ----
        "🕊️ FRIEDENSMODUS": "🕊️ FRIEDENSMODUS",
        "☠️ KRIEGSMODUS": "☠️ KRIEGSMODUS",
        "🕊️ Spieler kehrt in den Frieden zurück": "🕊️ Spieler kehrt in den Frieden zurück",
        
        // ---- UI ----
        "🔍 Reichweite an": "🔍 Reichweite an",
        "🔍 Reichweite aus": "🔍 Reichweite aus",
        "🔍 Reichweite an (beide Spieler)": "🔍 Reichweite an (beide Spieler)",
        "⏱️ 1x GESCHWINDIGKEIT": "⏱️ 1x GESCHWINDIGKEIT",
        "⏱️ 2x GESCHWINDIGKEIT": "⏱️ 2x GESCHWINDIGKEIT",
        "⏱️ 2x GESCHWINDIGKEIT (beide Spieler)": "⏱️ 2x GESCHWINDIGKEIT (beide Spieler)",
        "⏱️ 3x GESCHWINDIGKEIT": "⏱️ 3x GESCHWINDIGKEIT",
        "⏱️ 3x GESCHWINDIGKEIT (beide Spieler)": "⏱️ 3x GESCHWINDIGKEIT (beide Spieler)",
        "🔧 Toolbars eingeblendet": "🔧 Toolbars eingeblendet",
        "🔧 Toolbars ausgeblendet": "🔧 Toolbars ausgeblendet",
        "▶️ Spiel läuft weiter": "▶️ Spiel läuft weiter",
        
        // ---- Netzwerk ----
        "📡 Host-Modus - platziere deine Grenzkontrolle (oberes Drittel)": "📡 Host-Modus - platziere deine Grenzkontrolle (oberes Drittel)",
        "📡 Client-Modus - warte auf Host...": "📡 Client-Modus - warte auf Host...",
        "📡 Starte als Host...": "📡 Starte als Host...",
        "📡 Starte als Client...": "📡 Starte als Client...",
        "📤 Baubefehl an Host gesendet": "📤 Baubefehl an Host gesendet",
        "📤 Upgrade-Befehl an Host gesendet": "📤 Upgrade-Befehl an Host gesendet",
        "📤 Abriss-Befehl an Host gesendet": "📤 Abriss-Befehl an Host gesendet",
        "📤 Baubefehl an Host gesendet:": "📤 Baubefehl an Host gesendet:",
        "📤 Upgrade-Befehl an Host gesendet (ID:": "📤 Upgrade-Befehl an Host gesendet (ID:",
        "📤 Abriss-Befehl an Host gesendet (": "📤 Abriss-Befehl an Host gesendet (",
        "📥 Warte auf Host...": "📥 Warte auf Host...",
        "⏳ Warte auf Host": "⏳ Warte auf Host",
        "⏳ Client Baubefehl empfangen, warte auf Bestätigung": "⏳ Client Baubefehl empfangen, warte auf Bestätigung",
        "⏳ Client Upgrade empfangen, warte auf Bestätigung": "⏳ Client Upgrade empfangen, warte auf Bestätigung",
        "⏳ Client Abriss empfangen, warte auf Bestätigung": "⏳ Client Abriss empfangen, warte auf Bestätigung",
        "⏳ Client Start empfangen, warte auf Bestätigung": "⏳ Client Start empfangen, warte auf Bestätigung",
        
        // ---- Ressourcen ----
        "📦 Start-Ressourcen Spieler 1:": "📦 Start-Ressourcen Spieler 1:",
        "📦 Start-Ressourcen Spieler 2:": "📦 Start-Ressourcen Spieler 2:",
        "📦 Start-Ressourcen Host:": "📦 Start-Ressourcen Host:",
        "📦 Start-Ressourcen Client:": "📦 Start-Ressourcen Client:",
        "⚠️ Client hat keine Ressourcen vom Host erhalten!": "⚠️ Client hat keine Ressourcen vom Host erhalten!",
        "⚠️ Host startet Client-Ressourcen nicht!": "⚠️ Host startet Client-Ressourcen nicht!",
        
        // ===== GRENZ-EROBERUNG =====
        "🚩 Grenzkontrolle wurde von {player} erobert!": "🚩 Grenzkontrolle wurde von {player} erobert!",
        
        // ===== SPLIT-START =====
        "split_start_player1_grenze": "👉 Spieler 1 platziere deine Grenzkontrolle (oberes Drittel)",
        "split_start_player1_lager": "👉 Spieler 1 platziere dein Lager (kostenlos)",
        "split_start_player1_haus": "👉 Spieler 1 platziere dein Haus (kostenlos)",
        "split_start_player2_grenze": "👉 Spieler 2 platziere deine Grenzkontrolle (unteres Drittel)",
        "split_start_player2_lager": "👉 Spieler 2 platziere dein Lager (kostenlos)",
        "split_start_player2_haus": "👉 Spieler 2 platziere dein Haus (kostenlos)",
    },
    en: {
    // ===== BUILDING TYPES (for dialogs & messages) =====
"Haus": "House",
"Lager": "Warehouse",
"Bauer": "Farm",
"Holzfäller": "Lumberjack",
"Steinmetz": "Stonemason",
"Wachturm": "Watchtower",
"Fischerhütte": "Fisherman's Hut",
"Grenzkontrolle": "Border Control",
"Baustelle": "Construction Site",

// ===== BUILD MESSAGES =====
"🔨 {type} wird gebaut... (10s)": "🔨 {type} is being built... (10s)",
"🔨 {type} (P2) wird gebaut... (10s)": "🔨 {type} (P2) is being built... (10s)",
"✅ {type} fertig gebaut!": "✅ {type} finished building!",
"✅ {type} (P2) fertig gebaut!": "✅ {type} (P2) finished building!",
"✅ NPC {type} fertig gebaut!": "✅ NPC {type} finished building!",
"🏗️ {type} Baubeginn...": "🏗️ {type} construction started...",

// ===== UPGRADE MESSAGES =====
"⬆️ {type} auf Stufe {level} upgraded!": "⬆️ {type} upgraded to level {level}!",
"⬆️ {type} (P2) auf Stufe {level} upgraded!": "⬆️ {type} (P2) upgraded to level {level}!",
"⬆️ NPC {type} auf Stufe {level} upgraded!": "⬆️ NPC {type} upgraded to level {level}!",

// ===== DESTROY MESSAGES =====
"💀 {type} abgerissen!": "💀 {type} demolished!",
"💀 {type} (P2) abgerissen!": "💀 {type} (P2) demolished!",
"💀 NPC {type} abgerissen!": "💀 NPC {type} demolished!",

// ===== FIRE MESSAGES =====
"🔥 {type} brennt!": "🔥 {type} is burning!",
"🔥 {type} (P2) brennt!": "🔥 {type} (P2) is burning!",
"🔥 NPC {type} brennt!": "🔥 NPC {type} is burning!",
"💀 {type} abgebrannt!": "💀 {type} burned down!",
"💀 {type} (P2) abgebrannt!": "💀 {type} (P2) burned down!",
"💀 NPC {type} abgebrannt!": "💀 NPC {type} burned down!",
"💀 Baustelle abgebrannt!": "💀 Construction site burned down!",
"💀 Baustelle (P2) abgebrannt!": "💀 Construction site (P2) burned down!",
"💀 NPC Baustelle abgebrannt!": "💀 NPC construction site burned down!",

// ===== FISHERMAN'S HUT =====
"🐠 {type} fertig! {count} Wasser-Felder verfügbar": "🐠 {type} finished! {count} water fields available",
"🐠 {type} (P2) fertig! {count} Wasser-Felder verfügbar": "🐠 {type} (P2) finished! {count} water fields available",
"🐠 NPC {type} fertig!": "🐠 NPC {type} finished!",
    // ===== NPC MESSAGES =====
"🤖 NPC-Siedlung mit Grenzkontrolle gestartet!": "🤖 NPC settlement with border control started!",
"🤖 NPC hat kein Lager mehr! Versucht zu überleben...": "🤖 NPC has no warehouse! Trying to survive...",
"🤖 NPC baut neues Lager!": "🤖 NPC builds new warehouse!",
"🤖 NPC SIEDLUNG ZUSAMMENGEBROCHEN!": "🤖 NPC SETTLEMENT COLLAPSED!",
"🤖 NPC-Notfall-Einwohner erschienen!": "🤖 NPC emergency resident appeared!",
"🤖 NPC baut Fischerhütte!": "🤖 NPC builds Fisherman's hut!",
"🤖 NPC Fischerhütte fertig!": "🤖 NPC Fisherman's hut finished!",
"🤖 NPC baut Grenze!": "🤖 NPC builds border!",
"🤖 NPC baut Grenzkontrolle bei": "🤖 NPC builds border control at",
"🤖 NPC Grenzkontrolle fertig!": "🤖 NPC border control finished!",
"✅ NPC {displayName} fertig gebaut!": "✅ NPC {displayName} finished building!",
"🤖 NPC upgraded": "🤖 NPC upgraded",
"⬆️ NPC upgraded {type} auf Stufe {level}!": "⬆️ NPC upgraded {type} to level {level}!",
"🤖 NPC hat 250 Einwohner - IMMER KRIEG!": "🤖 NPC has 250 residents - ALWAYS WAR!",
"🤖 NPC hat 500 Einwohner - IMMER KRIEG!": "🤖 NPC has 500 residents - ALWAYS WAR!",
"☠️ NPC bleibt im Krieg (Bevölkerung zu hoch)": "☠️ NPC stays at war (population too high)",
"🕊️ NPC kehrt in den Frieden zurück (5 Min. abgelaufen)": "🕊️ NPC returns to peace (5 min. expired)",
"⚔️ NPC hat den Krieg erklärt!": "⚔️ NPC declared war!",
"🛡️ NPC-Schutz: {remaining}s verbleibend ({population} Einwohner)": "🛡️ NPC protection: {remaining}s remaining ({population} residents)",
"⚔️ NPC-Schutz aufgehoben! Feinde greifen jetzt an!": "⚔️ NPC protection lifted! Enemies are attacking now!",
"🕊️ NPC hat weniger als 12 Einwohner - Schutz aktiviert": "🕊️ NPC has less than 12 residents - protection activated",
"💀 NPC-Einwohner von Feind getötet!": "💀 NPC resident killed by enemy!",
"💀 NPC hat kein Lager mehr!": "💀 NPC has no warehouse!",
"💀 NPC-Gebäude abgebrannt!": "💀 NPC building burned down!",
"💀 NPC Baustelle abgebrannt!": "💀 NPC construction site burned down!",
"💀 NPC Grenzkontrolle abgebrannt!": "💀 NPC border control burned down!",
"🤖 NPC baut {type} bei ({x},{y})": "🤖 NPC builds {type} at ({x},{y})",
"🤖 NPC baut Grenze! (Kein Platz für {type} & kein Upgrade möglich)": "🤖 NPC builds border! (No space for {type} & no upgrade possible)",
        // ===== START DIALOG =====
        "start_title": "🏰 Settlement",
        "start_mode": "Game Mode",
        "start_single": "⚔️ Single",
        "start_split": "👥 2 Player",
        "start_network": "🌐 Network",
        "start_map": "Map Size",
        "start_micro": "🟩 Micro",
        "start_normal": "🟩 Normal",
        "start_stretched": "🟧 Stretched",
        "start_difficulty": "Difficulty (Single only)",
        "start_easy": "🟢 Easy",
        "start_hard": "🔴 Hard",
        "start_resources": "Starting Resources",
        "start_grain": "🌾 Grain",
        "start_wood": "🪵 Wood",
        "start_stone": "🪨 Stone",
        "start_fish": "🐠 Fish",
        "start_enemies": "🧟‍♂️ Enemy Count",
        "start_few": "🟢 Few",
        "start_normal_enemies": "🟡 Normal",
        "start_many": "🔴 Many",
        "start_extreme": "⚫ Extreme",
        "start_enemies_hint": "Determines the number of enemies in the game",
        "start_button": "🎮 Start Game",
        
        // ===== CONFIRM DIALOG =====
        "confirm_default": "Confirm Action",
        "confirm_yes": "✅ Yes",
        "confirm_no": "❌ No",
        
        // ===== START DIALOGS (Single Player) =====
        "start_grenze": "🚩 Place border control here? (free)",
        "start_lager": "📦 Place warehouse here? (free)",
        "start_haus": "🏠 Place house here? (free)",
        "start_grenze_effect": "Allows building in this area",
        "start_lager_effect": "Your first warehouse",
        "start_haus_effect": "Your first house with 6 residents",
        "start_free": "✅ Starting building - free",
        "start_no_cost": "✅ Starting building - no cost",
        
        // ===== SPLIT START DIALOGS (2 Player) =====
        "👉 Platziere deine Grenzkontrolle (kostenlos)": "👉 Place your border control (free)",
        "split_grenze_player1": "🚩 Place border control for Player 1? (free)",
        "split_lager_player1": "📦 Place warehouse for Player 1? (free)",
        "split_haus_player1": "🏠 Place house for Player 1? (free)",
        "split_grenze_player2": "🚩 Place border control for Player 2? (free)",
        "split_lager_player2": "📦 Place warehouse for Player 2? (free)",
        "split_haus_player2": "🏠 Place house for Player 2? (free)",
        
        // ===== NETWORK DIALOGS =====
        "network_host_grenze": "🚩 Place border control for Host? (free)",
        "network_host_lager": "📦 Place warehouse for Host? (free)",
        "network_host_haus": "🏠 Place house for Host? (free)",
        "network_client_grenze": "🚩 Place border control for Client? (free)",
        "network_client_lager": "📦 Place warehouse for Client? (free)",
        "network_client_haus": "🏠 Place house for Client? (free)",
        "network_host_grenze_phase": "👉 Host place your border control (top third)",
        "network_host_lager_phase": "👉 Host place your warehouse (free)",
        "network_host_haus_phase": "👉 Host place your house (free)",
        "network_client_grenze_phase": "👉 Client place your border control (bottom third)",
        "network_client_lager_phase": "👉 Client place your warehouse (free)",
        "network_client_haus_phase": "👉 Client place your house (free)",
        
        // ===== DESTROY DIALOGS =====
        "destroy_grenze": "🚩 Border control (Level {level}) really demolish?",
        "destroy_building": "{type} (Level {level}) really demolish?",
        "destroy_grenze_p2": "🚩 Border control (P2) really demolish?",
        "destroy_building_p2": "{type} (P2) really demolish?",
        "destroy_no_refund": "No refund!",
        
        // ===== UPGRADE DIALOGS =====
        "upgrade_grenze": "🚩 Border control to level {level} upgrade?",
        "upgrade_building": "{type} to level {level} upgrade?",
        "upgrade_grenze_p2": "🚩 Border control (P2) to level {level} upgrade?",
        "upgrade_building_p2": "{type} (P2) to level {level} upgrade?",
        "upgrade_cost": "Cost: {wood}🪵 {stone}🪨",
        "upgrade_effect": "Effect: {desc}",
        
        // ===== MAIN MENU DIALOG =====
        "main_menu": "❌ Really go to main menu?",
        "main_menu_cost": "The game will restart!",
        "main_menu_effect": "⚠️ All progress will be lost!",
        
        // ===== GAME OVER =====
        "gameover_victory": "🎉 VICTORY!",
        "gameover_all_buildings": "You conquered all NPC buildings!",
        "gameover_defeat": "💀 DEFEAT!",
        "gameover_no_lager": "No warehouse - Your settlement collapsed!",
        "gameover_npc_no_lager": "NPC has no warehouse - You win!",
        "gameover_destroyed": "Your settlement was completely destroyed!",
        "gameover_p1_wins": "🎉 PLAYER 1 WINS!",
        "gameover_p2_wins": "🎉 PLAYER 2 WINS!",
        "gameover_draw": "⚖️ DRAW!",
        "gameover_p1_no_lager": "Player 1 has no warehouse - Player 2 wins!",
        "gameover_p2_no_lager": "Player 2 has no warehouse - Player 1 wins!",
        "gameover_both_no_lager": "Both players have no warehouse!",
        "gameover_p1_no_buildings": "Player 1 has no buildings - Player 2 wins!",
        "gameover_p2_no_buildings": "Player 2 has no buildings - Player 1 wins!",
        "gameover_both_no_buildings": "Both players have no buildings!",
        
        // ===== RESTART / CONTINUE =====
        "restart": "🔄 New Game",
        "continue": "▶️ Continue Playing",
        
        // ===== START-PHASE =====
        "start_phase_grenze": "👉 Place your border control (free)",
        "start_phase_lager": "👉 Place your warehouse (free)",
        "start_phase_haus": "👉 Place your house (free)",
        "start_phase_grenze_p1": "👉 Player 1 place your border control (top third)",
        "start_phase_grenze_p2": "👉 Player 2 place your border control (bottom third)",
        "start_phase_lager_p1": "👉 Player 1 place your warehouse (free)",
        "start_phase_lager_p2": "👉 Player 2 place your warehouse (free)",
        "start_phase_haus_p1": "👉 Player 1 place your house (free)",
        "start_phase_haus_p2": "👉 Player 2 place your house (free)",
        
        // ===== TEMPORARY MESSAGES (ALL!) =====
        // ---- Errors & Warnings ----
        "❌ Diese Zelle ist bereits belegt!": "❌ This cell is already occupied!",
        "❌ Jetzt ist der Client dran!": "❌ Client's turn now!",
        "❌ Jetzt ist der Host dran!": "❌ Host's turn now!",
        "❌ Du bist der Host - nutze deine Kamera!": "❌ You are the Host - use your camera!",
        "❌ Du bist der Client - nutze deine Kamera!": "❌ You are the Client - use your camera!",
        "❌ Host darf nur im oberen Drittel bauen!": "❌ Host can only build in the top third!",
        "❌ Client darf nur im unteren Drittel bauen!": "❌ Client can only build in the bottom third!",
        "❌ Jetzt ist Spieler 1 dran!": "❌ Player 1's turn now!",
        "❌ Jetzt ist Spieler 2 dran!": "❌ Player 2's turn now!",
        "❌ Spieler 1 darf nur im oberen Drittel bauen!": "❌ Player 1 can only build in the top third!",
        "❌ Spieler 2 darf nur im unteren Drittel bauen!": "❌ Player 2 can only build in the bottom third!",
        "❌ Nicht genug Ressourcen!": "❌ Not enough resources!",
        "❌ Außerhalb des Bau-Radius!": "❌ Outside building radius!",
        "❌ Kein Gebäude zum Abreissen gefunden!": "❌ No building found to demolish!",
        "❌ Kein Gebäude zum Upgraden gefunden!": "❌ No building found to upgrade!",
        "❌ Nicht genug Ressourcen für Upgrade!": "❌ Not enough resources for upgrade!",
        "❌ Gebäude kann nicht auf Wasser gebaut werden!": "❌ Building cannot be built on water!",
        "❌ Maximale Anzahl Grenzkontrollen erreicht": "❌ Maximum number of border controls reached",
        "❌ Auf Wasser kann nur eine Fischerhütte gebaut werden!": "❌ Only a fisherman's hut can be built on water!",
        "❌ Fischerhütte muss auf festem Boden (Land) gebaut werden!": "❌ Fisherman's hut must be built on solid ground (land)!",
        "❌ Keine Wasser-Felder in der Nähe für die Fischerhütte!": "❌ No water fields nearby for the fisherman's hut!",
        "❌ Keine Wasser-Felder in der Nähe für die Fischerhütte (P2)!": "❌ No water fields nearby for the fisherman's hut (P2)!",
        "❌ Zu nah an bestehender Grenze!": "❌ Too close to existing border!",
        "❌ Baue zuerst eine Farm, einen Holzfäller, einen Steinmetz oder eine Fischerhütte!": "❌ Build a farm, lumberjack, stonemason or fisherman's hut first!",
        "❌ Startphase! Noch": "❌ Start phase!",
        "❌ Frieden!": "❌ Peace!",
        "❌ Lager muss innerhalb des Grenzkontroll-Radius liegen!": "❌ Warehouse must be within border control radius!",
        "❌ Haus muss innerhalb des Grenzkontroll-Radius liegen!": "❌ House must be within border control radius!",
        "❌ Nicht genug Ressourcen für": "❌ Not enough resources for",
        
        // ---- Success & Confirmations ----
        "✅ Startgebäude - kostenlos": "✅ Starting building - free",
        "✅ Grenzkontrolle platziert! Jetzt Lager platzieren (innerhalb des Radius)": "✅ Border control placed! Now place warehouse (within radius)",
        "✅ Lager platziert! Jetzt Haus platzieren": "✅ Warehouse placed! Now place house",
        "✅ fertig gebaut!": "✅ construction finished!",
        "✅ Host platziert!": "✅ Host placed!",
        "✅ platziert! Warte auf Host...": "✅ placed! Waiting for host...",
        "✅ Host Baubefehl ausgeführt:": "✅ Host build command executed:",
        "✅ Host Upgrade ausgeführt:": "✅ Host upgrade executed:",
        "✅ Host Abriss ausgeführt:": "✅ Host demolish executed:",
        "✅ Host Startgebäude platziert:": "✅ Host starting building placed:",
        "✅ Client Startgebäude platziert:": "✅ Client starting building placed:",
        
        // ---- Game Status ----
        "🎮 Spiel gestartet! 6 Einwohner warten auf Befehle!": "🎮 Game started! 6 residents await commands!",
        "🎮 Spiel gestartet! Beide Spieler sind bereit!": "🎮 Game started! Both players are ready!",
        "🎮 Netzwerk-Spiel gestartet!": "🎮 Network game started!",
        "👥 2-Spieler-Modus - platziert eure Startgebäude!": "👥 2-Player mode - place your starting buildings!",
        "🏗️ Baubeschränkung aufgehoben!": "🏗️ Building restriction lifted!",
        
        // ---- Buildings ----
        "🔨 wird gebaut... (10s)": "🔨 is being built... (10s)",
        "💀 Gebäude abgerissen": "💀 Building demolished",
        "⬆️ Upgrade auf Stufe erfolgreich!": "⬆️ Upgrade to level successful!",
        "🚩 Grenzkontrolle wird gebaut...": "🚩 Border control is being built...",
        "🚩 Grenzkontrolle fertig!": "🚩 Border control finished!",
        "🚩 Grenzkontrolle (P2) fertig!": "🚩 Border control (P2) finished!",
        "🚩 Grenzkontrolle (P2) wird gebaut...": "🚩 Border control (P2) is being built...",
        "🚩 Grenzkontrolle Radius:": "🚩 Border control radius:",
        "🚩 Grenzkontrolle (P2) Radius:": "🚩 Border control (P2) radius:",
        "⬆️ Grenzkontrolle Radius:": "⬆️ Border control radius:",
        "⬆️ Grenzkontrolle (P2) Radius:": "⬆️ Border control (P2) radius:",
        "⬆️ Turm Reichweite auf": "⬆️ Tower range to",
        "⬆️ Turm Kapazität auf": "⬆️ Tower capacity to",
        "⬆️ Turm (P2) Reichweite auf": "⬆️ Tower (P2) range to",
        "⬆️ Turm (P2) Kapazität auf": "⬆️ Tower (P2) capacity to",
        "🐠 Fischerhütte fertig!": "🐠 Fisherman's hut finished!",
        "🐠 Fischerhütte wird gebaut...": "🐠 Fisherman's hut is being built...",
        "🐠 Fischerhütte (P2) fertig!": "🐠 Fisherman's hut (P2) finished!",
        "🐠 Fischerhütte (P2) wird gebaut...": "🐠 Fisherman's hut (P2) is being built...",
        
        // ---- NPC ----
        // ===== NPC MESSAGES (MISSING) =====
"🤖 NPC-Notfall-Einwohner erschienen!": "🤖 NPC emergency resident appeared!",
"🤖 NPC Grenzkontrolle fertig!": "🤖 NPC border control finished!",
"🤖 NPC baut {type} bei ({x},{y})": "🤖 NPC builds {type} at ({x},{y})",
"🤖 NPC baut Grenze! (Kein Platz für {type} & kein Upgrade möglich)": "🤖 NPC builds border! (No space for {type} & no upgrade possible)",
        "🤖 NPC-Siedlung mit Grenzkontrolle gestartet!": "🤖 NPC settlement with border control started!",
        "🤖 NPC hat kein Lager mehr! Versucht zu überleben...": "🤖 NPC has no warehouse! Trying to survive...",
        "🤖 NPC baut neues Lager!": "🤖 NPC builds new warehouse!",
        "🤖 NPC SIEDLUNG ZUSAMMENGEBROCHEN!": "🤖 NPC SETTLEMENT COLLAPSED!",
        "🤖 NPC baut Fischerhütte!": "🤖 NPC builds Fisherman's hut!",
        "🤖 NPC Fischerhütte fertig!": "🤖 NPC Fisherman's hut finished!",
        "🤖 NPC baut Grenze!": "🤖 NPC builds border!",
        "🤖 NPC baut Grenzkontrolle bei": "🤖 NPC builds border control at",
        "🤖 NPC upgraded": "🤖 NPC upgraded",
        "🤖 NPC hat 250 Einwohner - IMMER KRIEG!": "🤖 NPC has 250 residents - ALWAYS WAR!",
        "🤖 NPC hat 500 Einwohner - IMMER KRIEG!": "🤖 NPC has 500 residents - ALWAYS WAR!",
        "💀 NPC-Einwohner von Feind getötet!": "💀 NPC resident killed by enemy!",
        "💀 NPC hat kein Lager mehr!": "💀 NPC has no warehouse!",
        "💀 NPC-Gebäude abgebrannt!": "💀 NPC building burned down!",
        "💀 NPC Baustelle abgebrannt!": "💀 NPC construction site burned down!",
        "💀 NPC Grenzkontrolle abgebrannt!": "💀 NPC border control burned down!",
        "🛡️ NPC-Schutz:": "🛡️ NPC protection:",
        "⚔️ NPC-Schutz aufgehoben!": "⚔️ NPC protection lifted!",
        "🕊️ NPC hat weniger als 12 Einwohner - Schutz aktiviert": "🕊️ NPC has less than 12 residents - protection activated",
        "☠️ NPC bleibt im Krieg (Bevölkerung zu hoch)": "☠️ NPC stays at war (population too high)",
        "🕊️ NPC kehrt in den Frieden zurück (5 Min. abgelaufen)": "🕊️ NPC returns to peace (5 min. expired)",
        "⚔️ NPC hat den Krieg erklärt!": "⚔️ NPC declared war!",
        
        // ---- Villagers ----
        "💀 Einwohner von Feind getötet!": "💀 Resident killed by enemy!",
        "💀 Spieler 2 Einwohner von Feind getötet!": "💀 Player 2 resident killed by enemy!",
        "💀 KEIN LAGER FÜR SPIELER 2!": "💀 NO WAREHOUSE FOR PLAYER 2!",
        
        // ---- Dragon ----
        "🐉 EIN DRACHE IST ERWACHT!": "🐉 A DRAGON HAS AWAKENED!",
        "🐉 DRACHE BESIEGT!": "🐉 DRAGON DEFEATED!",
        "🐉 Drache hat ein Gebäude zerstört!": "🐉 Dragon destroyed a building!",
        "🐉 Drache hat ein Gebäude (P2) zerstört!": "🐉 Dragon destroyed a building (P2)!",
        "🐉 Drache hat ein NPC-Gebäude zerstört!": "🐉 Dragon destroyed an NPC building!",
        
        // ---- Fire ----
        "🔥 brennt!": "🔥 is burning!",
        "💀 Gebäude abgebrannt!": "💀 Building burned down!",
        "💀 Gebäude (P2) abgebrannt!": "💀 Building (P2) burned down!",
        "💀 Grenzkontrolle abgebrannt!": "💀 Border control burned down!",
        "💀 Grenzkontrolle (P2) abgebrannt!": "💀 Border control (P2) burned down!",
        "💀 Baustelle abgebrannt!": "💀 Construction site burned down!",
        "💀 Baustelle (P2) abgebrannt!": "💀 Construction site (P2) burned down!",
        
        // ---- Enemies ----
        "⚔️ GROSSANGRIFF!": "⚔️ MASSIVE ATTACK!",
        
        // ---- Modes ----
        "🕊️ FRIEDENSMODUS": "🕊️ PEACE MODE",
        "☠️ KRIEGSMODUS": "☠️ WAR MODE",
        "🕊️ Spieler kehrt in den Frieden zurück": "🕊️ Player returns to peace",
        
        // ---- UI ----
        "🔍 Reichweite an": "🔍 Range on",
        "🔍 Reichweite aus": "🔍 Range off",
        "🔍 Reichweite an (beide Spieler)": "🔍 Range on (both players)",
        "⏱️ 1x GESCHWINDIGKEIT": "⏱️ 1x SPEED",
        "⏱️ 2x GESCHWINDIGKEIT": "⏱️ 2x SPEED",
        "⏱️ 2x GESCHWINDIGKEIT (beide Spieler)": "⏱️ 2x SPEED (both players)",
        "⏱️ 3x GESCHWINDIGKEIT": "⏱️ 3x SPEED",
        "⏱️ 3x GESCHWINDIGKEIT (beide Spieler)": "⏱️ 3x SPEED (both players)",
        "🔧 Toolbars eingeblendet": "🔧 Toolbars shown",
        "🔧 Toolbars ausgeblendet": "🔧 Toolbars hidden",
        "▶️ Spiel läuft weiter": "▶️ Game continues",
        
        // ---- Network ----
        "📡 Host-Modus - platziere deine Grenzkontrolle (oberes Drittel)": "📡 Host mode - place your border control (top third)",
        "📡 Client-Modus - warte auf Host...": "📡 Client mode - waiting for host...",
        "📡 Starte als Host...": "📡 Starting as Host...",
        "📡 Starte als Client...": "📡 Starting as Client...",
        "📤 Baubefehl an Host gesendet": "📤 Build command sent to Host",
        "📤 Upgrade-Befehl an Host gesendet": "📤 Upgrade command sent to Host",
        "📤 Abriss-Befehl an Host gesendet": "📤 Demolish command sent to Host",
        "📤 Baubefehl an Host gesendet:": "📤 Build command sent to Host:",
        "📤 Upgrade-Befehl an Host gesendet (ID:": "📤 Upgrade command sent to Host (ID:",
        "📤 Abriss-Befehl an Host gesendet (": "📤 Demolish command sent to Host (",
        "📥 Warte auf Host...": "📥 Waiting for host...",
        "⏳ Warte auf Host": "⏳ Waiting for Host",
        "⏳ Client Baubefehl empfangen, warte auf Bestätigung": "⏳ Client build command received, waiting for confirmation",
        "⏳ Client Upgrade empfangen, warte auf Bestätigung": "⏳ Client upgrade received, waiting for confirmation",
        "⏳ Client Abriss empfangen, warte auf Bestätigung": "⏳ Client demolish received, waiting for confirmation",
        "⏳ Client Start empfangen, warte auf Bestätigung": "⏳ Client start received, waiting for confirmation",
        
        // ---- Resources ----
        "📦 Start-Ressourcen Spieler 1:": "📦 Starting resources Player 1:",
        "📦 Start-Ressourcen Spieler 2:": "📦 Starting resources Player 2:",
        "📦 Start-Ressourcen Host:": "📦 Starting resources Host:",
        "📦 Start-Ressourcen Client:": "📦 Starting resources Client:",
        "⚠️ Client hat keine Ressourcen vom Host erhalten!": "⚠️ Client did not receive resources from Host!",
        "⚠️ Host startet Client-Ressourcen nicht!": "⚠️ Host does not start Client resources!",
        
        // ===== GRENZ-EROBERUNG =====
        "🚩 Grenzkontrolle wurde von {player} erobert!": "🚩 Border control was conquered by {player}!",
        
        // ===== SPLIT-START =====
        "split_start_player1_grenze": "👉 Player 1 place your border control (top third)",
        "split_start_player1_lager": "👉 Player 1 place your warehouse (free)",
        "split_start_player1_haus": "👉 Player 1 place your house (free)",
        "split_start_player2_grenze": "👉 Player 2 place your border control (bottom third)",
        "split_start_player2_lager": "👉 Player 2 place your warehouse (free)",
        "split_start_player2_haus": "👉 Player 2 place your house (free)",        
    }
};

// ============================================================
//  MESSAGE-QUEUE VARIABLEN
// ============================================================
let messageQueue = [];
let isMessageActive = false;
let messageHideTimeout = null;
let tempMessageElement = null;
let tempMessageTimer = 0;

// ============================================================
//  HILFSFUNKTION
// ============================================================
function t(key, params = {}) {
    if (!key) return key;
    let text = translations[currentLanguage]?.[key] || key;
    
    // Platzhalter ersetzen
    for (let [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v);
    }
    return text;
}

// ============================================================
//  showTemporaryMessage() - KOMPLETT MIT PARAMS
// ============================================================
function showTemporaryMessage(msg, color = '#fff', urgent = false, params = {}) {
    // ===== ÜBERSETZEN MIT PARAMS =====
    const translatedMsg = t(msg, params);
    
    if (urgent) {
        messageQueue = [];
        isMessageActive = false;
        if (messageHideTimeout) {
            clearTimeout(messageHideTimeout);
            messageHideTimeout = null;
        }
        tempMessage = translatedMsg;
        tempMessageColor = color;
        tempMessageTimer = 3.0;
        if (tempMessageElement) {
            tempMessageElement.textContent = translatedMsg;
            tempMessageElement.style.color = color;
            tempMessageElement.style.opacity = '1';
            if (SPLIT_SCREEN) {
                messageIsFlipped = false;
                messageRotationTimer = 0;
                tempMessageElement.style.transform = 'translate(-50%, 50%) rotate(0deg)';
                tempMessageElement.style.transition = 'opacity 0.3s ease, transform 0.5s ease';
            }
        }
        isMessageActive = true;
        return;
    }
    
    if (messageQueue.length < 100) {
        messageQueue.push({ msg: translatedMsg, color });
    } else {
        messageQueue.shift();
        messageQueue.push({ msg: translatedMsg, color });
    }
    
    if (!isMessageActive) {
        displayNextMessage();
    }
}

// ============================================================
//  displayNextMessage()
// ============================================================
function displayNextMessage() {
    if (messageHideTimeout) {
        clearTimeout(messageHideTimeout);
        messageHideTimeout = null;
    }
    if (messageQueue.length === 0) {
        isMessageActive = false;
        if (tempMessageElement) {
            tempMessageElement.style.opacity = '0';
        }
        return;
    }
    isMessageActive = true;
    const next = messageQueue.shift();
    tempMessage = next.msg;
    tempMessageColor = next.color;
    tempMessageTimer = 3.0;
    if (tempMessageElement) {
        tempMessageElement.textContent = next.msg;
        tempMessageElement.style.color = next.color;
        tempMessageElement.style.opacity = '1';
        if (SPLIT_SCREEN) {
            messageIsFlipped = false;
            messageRotationTimer = 0;
            tempMessageElement.style.transform = 'translate(-50%, 50%) rotate(0deg)';
            tempMessageElement.style.transition = 'opacity 0.3s ease, transform 0.5s ease';
        }
    }
}

// ============================================================
//  updateMessageDisplay()
// ============================================================
let messageRotationTimer = 0;
let messageIsFlipped = false;

function updateMessageDisplay(dt) {
    if (!tempMessageElement) return;
    if (tempMessageTimer <= 0 && isMessageActive) {
        tempMessageElement.style.opacity = '0';
        isMessageActive = false;
        if (messageHideTimeout) clearTimeout(messageHideTimeout);
        messageHideTimeout = setTimeout(() => {
            messageHideTimeout = null;
            displayNextMessage();
        }, 300);
        return;
    }
    if (tempMessageTimer <= 0) return;
    if (!SPLIT_SCREEN) return;
    messageRotationTimer += dt;
    if (messageRotationTimer >= 1.5) {
        messageRotationTimer = 0;
        messageIsFlipped = !messageIsFlipped;
        const rotation = messageIsFlipped ? 180 : 0;
        tempMessageElement.style.transform = `translate(-50%, 50%) rotate(${rotation}deg)`;
        tempMessageElement.style.transition = 'transform 0.5s ease';
        tempMessageElement.style.transform += ' scale(1.05)';
        setTimeout(() => {
            if (tempMessageElement && tempMessageTimer > 0) {
                tempMessageElement.style.transform = `translate(-50%, 50%) rotate(${rotation}deg) scale(1)`;
            }
        }, 150);
    }
}

// ============================================================
//  setupMessageDisplay()
// ============================================================
function setupMessageDisplay() {
    if (tempMessageElement) {
        tempMessageElement.remove();
        tempMessageElement = null;
    }
    const el = document.createElement('div');
    el.id = 'tempMessageDisplay';
    el.style.cssText = `
        position: absolute;
        bottom: 135px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 25;
        background: rgba(0,0,0,0.75);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        color: #fff;
        padding: 8px 16px;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 500;
        text-align: center;
        max-width: 90vw;
        word-wrap: break-word;
        white-space: normal;
        pointer-events: none;
        transition: opacity 0.3s ease;
        opacity: 0;
        border: 1px solid rgba(255,255,255,0.15);
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        font-family: 'Segoe UI', system-ui, sans-serif;
    `;
    document.getElementById('game-container').appendChild(el);
    tempMessageElement = el;

    if (SPLIT_SCREEN) {
        el.style.bottom = '50%';
        el.style.transform = 'translate(-50%, 50%)';
        el.style.transition = 'opacity 0.3s ease, transform 0.5s ease';
    }
}

// ============================================================
//  DIALOG HELFER
// ============================================================
function setDialogText(key, params = {}) {
    const el = document.getElementById('confirmText');
    if (el) {
        const text = t(key, params);
        el.textContent = text;
        el.dataset.i18n = key;
        el.dataset.original = text;
    }
}

function setDialogCost(key, params = {}) {
    const el = document.getElementById('costDisplay');
    if (el) {
        const text = t(key, params);
        el.textContent = text;
        el.dataset.i18n = key;
        el.dataset.original = text;
    }
}

function setDialogEffect(key, params = {}) {
    const el = document.getElementById('effectDisplay');
    if (el) {
        const text = t(key, params);
        el.textContent = text;
        el.dataset.i18n = key;
        el.dataset.original = text;
    }
}

// ============================================================
//  SPRACHE WECHSELN
// ============================================================
window.setLanguage = function(lang) {
    if (lang === currentLanguage) return;
    currentLanguage = lang;
    
    const btn = document.getElementById('langSwitchStart');
    if (btn) {
        btn.textContent = currentLanguage === 'de' ? '🇩🇪/🇬🇧' : '🇬🇧/🇩🇪';
    }
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (key && translations[currentLanguage]?.[key]) {
            el.textContent = translations[currentLanguage][key];
        }
    });
    
    updateCurrentDialog();
    translateGameOverTexts();
};

function updateCurrentDialog() {
    const dialog = document.getElementById('confirmDialog');
    if (!dialog || dialog.style.display !== 'block') return;
    
    dialog.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (key && translations[currentLanguage]?.[key]) {
            el.textContent = translations[currentLanguage][key];
        }
    });
}

function translateGameOverTexts() {
    const title = document.getElementById('gameOverTitle');
    const sub = document.getElementById('gameOverSub');
    
    if (title && title.textContent) {
        const original = title.dataset.original || title.textContent;
        const translated = t(original);
        if (translated !== original) {
            title.textContent = translated;
        }
        title.dataset.original = title.textContent;
    }
    if (sub && sub.textContent) {
        const original = sub.dataset.original || sub.textContent;
        const translated = t(original);
        if (translated !== original) {
            sub.textContent = translated;
        }
        sub.dataset.original = sub.textContent;
    }
}

// ============================================================
//  SEITE LADEN
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (key && translations[currentLanguage]?.[key]) {
            el.textContent = translations[currentLanguage][key];
        }
    });
    
    const langBtn = document.getElementById('langSwitchStart');
    if (langBtn) {
        langBtn.textContent = '🇬🇧/🇩🇪';
        langBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.setLanguage(currentLanguage === 'de' ? 'en' : 'de');
        });
    }
    
    translateGameOverTexts();
});