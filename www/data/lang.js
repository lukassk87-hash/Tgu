window.Game = window.Game || {};

Game.Lang = {
  current: 'de', // Standardsprache

  // ==========================================================
  // STARTMENÜ (aus index.html)
  // ==========================================================
  'menu_language': {
    de: 'Sprache', en: 'Language', fr: 'Langue', es: 'Idioma'
  },
  'menu_title': {
    de: 'RedCastle', en: 'RedCastle', fr: 'RedCastle', es: 'RedCastle'
  },
  'menu_subtitle': {
    de: 'Königreich in Gefahr', en: 'Kingdom in Danger', fr: 'Royaume en danger', es: 'Reino en peligro'
  },
  'menu_map_size': {
    de: 'Kartengröße', en: 'Map Size', fr: 'Taille de la carte', es: 'Tamaño del mapa'
  },
  'menu_start_resources': {
    de: 'Startressourcen', en: 'Starting Resources', fr: 'Ressources de départ', es: 'Recursos iniciales'
  },
  'menu_enemies': {
    de: 'Gegner', en: 'Enemies', fr: 'Ennemis', es: 'Enemigos'
  },
  'menu_raiders_spawn': {
    de: 'Räuberlager spawnen', en: 'Spawn Raider Camp', fr: 'Apparaître le camp de pillards', es: 'Aparecer campamento de saqueadores'
  },
  'menu_dragons_spawn': {
    de: 'Drachen spawnen', en: 'Spawn Dragons', fr: 'Apparaître les dragons', es: 'Aparecer dragones'
  },
  'menu_zombie_difficulty': {
    de: 'Zombie-Schwierigkeit', en: 'Zombie Difficulty', fr: 'Difficulté des zombies', es: 'Dificultad de zombis'
  },
  'menu_zombie_infects': {
    de: 'Zombies infizieren Einwohner', en: 'Zombies infect villagers', fr: 'Les zombies infectent les villageois', es: 'Los zombis infectan a los aldeanos'
  },
  'menu_zombie_infects_delayed': {
    de: 'Zombies werden erst 10 Minuten nach dem Spielstart ansteckend', en: 'Zombies become infectious 10 minutes after game start', fr: 'Les zombies deviennent infectieux 10 minutes après le début du jeu', es: 'Los zombis se vuelven infecciosos 10 minutos después del inicio'
  },
  'menu_first_zombie_spawn': {
    de: 'Erster Zombie-Angriff nach (Sekunden)', en: 'First zombie attack after (seconds)', fr: 'Première attaque de zombies après (secondes)', es: 'Primer ataque de zombis después de (segundos)'
  },
  'menu_seed': {
    de: 'Seed (leer = zufällig)', en: 'Seed (empty = random)', fr: 'Graine (vide = aléatoire)', es: 'Semilla (vacío = aleatorio)'
  },
  'menu_seed_placeholder': {
    de: 'z.B. Lukisupi', en: 'e.g. Lukisupi', fr: 'ex. Lukisupi', es: 'ej. Lukisupi'
  },
  'menu_new_map': {
    de: 'Neue Karte', en: 'New Map', fr: 'Nouvelle carte', es: 'Nuevo mapa'
  },
  'menu_load_game': {
    de: 'Spiel laden', en: 'Load Game', fr: 'Charger le jeu', es: 'Cargar partida'
  },
  'menu_footer': {
    de: '© 2026 Lukas Schulze König', en: '© 2026 Lukas Schulze König', fr: '© 2026 Lukas Schulze König', es: '© 2026 Lukas Schulze König'
  },

  // ==========================================================
  // HUD (aus js/hud.js - HTML-String)
  // ==========================================================
  'hud_build': {
    de: 'Bauen', en: 'Build', fr: 'Construire', es: 'Construir'
  },
  'hud_demolish': {
    de: 'Abreißen', en: 'Demolish', fr: 'Démolir', es: 'Demoler'
  },
  'hud_stats': {
    de: 'Statistik', en: 'Statistics', fr: 'Statistiques', es: 'Estadísticas'
  },
  'hud_villagers': {
    de: 'Einwohner', en: 'Villagers', fr: 'Villageois', es: 'Aldeanos'
  },
  'hud_economy': {
    de: 'Wirtschaft', en: 'Economy', fr: 'Économie', es: 'Economía'
  },
  'hud_debug': {
    de: 'Debug', en: 'Debug', fr: 'Debug', es: 'Debug'
  },
  'hud_place_castle_title': {
    de: 'Wo soll das Schloss stehen?', en: 'Where should the castle be?', fr: 'Où doit se trouver le château ?', es: '¿Dónde debe estar el castillo?'
  },
  'hud_place_castle_desc': {
    de: 'Tippe auf ein begehbares Feld.', en: 'Tap on a walkable tile.', fr: 'Appuyez sur une case praticable.', es: 'Toca una casilla transitable.'
  },
  
  // ==========================================================
// POPUPS: BUILD (aus popups-build.js)
// ==========================================================
'popup_build_title': {
  de: 'Gebäude bauen?',
  en: 'Build building?',
  fr: 'Construire un bâtiment ?',
  es: '¿Construir edificio?'
},
'popup_build_yes': {
  de: 'Bauen',
  en: 'Build',
  fr: 'Construire',
  es: 'Construir'
},
'popup_cancel': {
  de: 'Abbrechen',
  en: 'Cancel',
  fr: 'Annuler',
  es: 'Cancelar'
},
'popup_demolish_title': {
  de: 'Gebäude abreißen?',
  en: 'Demolish building?',
  fr: 'Démolir le bâtiment ?',
  es: '¿Demoler edificio?'
},
'popup_demolish_text': {
  de: 'Die Ressourcen werden nicht erstattet.',
  en: 'Resources will not be refunded.',
  fr: 'Les ressources ne seront pas remboursées.',
  es: 'Los recursos no se reembolsarán.'
},
'popup_demolish_yes': {
  de: 'Abreißen',
  en: 'Demolish',
  fr: 'Démolir',
  es: 'Demoler'
},
'popup_repair_title': {
  de: 'Siedlung reparieren?',
  en: 'Repair settlement?',
  fr: 'Réparer la colonie ?',
  es: '¿Reparar el asentamiento?'
},
'popup_repair_desc': {
  de: 'Diese Funktion überprüft alle Gebäude und Einwohner auf <b>Fehler in der Zuweisung</b>.',
  en: 'This function checks all buildings and villagers for <b>assignment errors</b>.',
  fr: 'Cette fonction vérifie tous les bâtiments et villageois pour des <b>erreurs d\'affectation</b>.',
  es: 'Esta función revisa todos los edificios y aldeanos en busca de <b>errores de asignación</b>.'
},
'popup_repair_what': {
  de: 'Was passiert?',
  en: 'What happens?',
  fr: 'Que se passe-t-il ?',
  es: '¿Qué sucede?'
},
'popup_repair_detail': {
  de: '• Alle Jobs werden neu vergeben.<br>• Einwohner, die nicht mehr existieren, werden aus Gebäuden entfernt.<br>• Krieger kehren in ihre Türme zurück.<br>• Arbeitslose Einwohner werden neu zugewiesen.<br><br><b style="color: #ff8a5c;">Deine Ressourcen und Gebäude bleiben unberührt!</b>',
  en: '• All jobs are reassigned.<br>• Villagers that no longer exist are removed from buildings.<br>• Warriors return to their towers.<br>• Unemployed villagers are reassigned.<br><br><b style="color: #ff8a5c;">Your resources and buildings remain untouched!</b>',
  fr: '• Tous les emplois sont réattribués.<br>• Les villageois qui n\'existent plus sont retirés des bâtiments.<br>• Les guerriers retournent dans leurs tours.<br>• Les villageois sans emploi sont réaffectés.<br><br><b style="color: #ff8a5c;">Vos ressources et bâtiments restent intacts !</b>',
  es: '• Todos los trabajos se reasignan.<br>• Los aldeanos que ya no existen se eliminan de los edificios.<br>• Los guerreros regresan a sus torres.<br>• Los aldeanos desempleados se reasignan.<br><br><b style="color: #ff8a5c;">¡Tus recursos y edificios permanecen intactos!</b>'
},
'popup_repair_yes': {
  de: '✓ Ja, jetzt reparieren',
  en: '✓ Yes, repair now',
  fr: '✓ Oui, réparer maintenant',
  es: '✓ Sí, reparar ahora'
},

// ==========================================================
// WINDOWS: STATS (aus windows-stats.js)
// ==========================================================
'window_stats_title': {
  de: 'Statistik',
  en: 'Statistics',
  fr: 'Statistiques',
  es: 'Estadísticas'
},
'window_stats_tab_resources': {
  de: 'Ressourcen',
  en: 'Resources',
  fr: 'Ressources',
  es: 'Recursos'
},
'window_stats_tab_enemies': {
  de: 'Gegner',
  en: 'Enemies',
  fr: 'Ennemis',
  es: 'Enemigos'
},
'window_stats_tab_production': {
  de: 'Gesamtproduktion',
  en: 'Total Production',
  fr: 'Production totale',
  es: 'Producción total'
},
'window_stats_tab_halloffame': {
  de: 'Hall of Fame',
  en: 'Hall of Fame',
  fr: 'Panthéon',
  es: 'Salón de la Fama'
},

// ==========================================================
// WINDOWS: VILLAGERS (aus windows-villagers.js)
// ==========================================================
'window_villagers_title': {
  de: 'Einwohner',
  en: 'Villagers',
  fr: 'Villageois',
  es: 'Aldeanos'
},
'window_villagers_tab_villagers': {
  de: 'Einwohner',
  en: 'Villagers',
  fr: 'Villageois',
  es: 'Aldeanos'
},
'window_villagers_tab_buildings': {
  de: 'Gebäude',
  en: 'Buildings',
  fr: 'Bâtiments',
  es: 'Edificios'
},
'window_villagers_tab_military': {
  de: 'Militär',
  en: 'Military',
  fr: 'Militaire',
  es: 'Ejército'
},

// ==========================================================
// WINDOWS: ECONOMY (aus windows-economy.js)
// ==========================================================
'window_eco_title': {
  de: 'Wirtschaft',
  en: 'Economy',
  fr: 'Économie',
  es: 'Economía'
},
'window_eco_tab_jobs': {
  de: 'Jobs',
  en: 'Jobs',
  fr: 'Emplois',
  es: 'Trabajos'
},
'window_eco_tab_resources': {
  de: 'Ressourcen-Transport',
  en: 'Resource Transport',
  fr: 'Transport de ressources',
  es: 'Transporte de recursos'
},
'window_eco_free_villagers': {
  de: 'Freie Dorfbewohner:',
  en: 'Free Villagers:',
  fr: 'Villageois libres :',
  es: 'Aldeanos libres:'
},
'window_eco_reserved_logistics': {
  de: 'Reservierte Logistiker:',
  en: 'Reserved Logistics:',
  fr: 'Logisticiens réservés :',
  es: 'Logística reservada:'
},

// ==========================================================
// WINDOWS: DEBUG (aus windows-debug.js)
// ==========================================================
'window_debug_title': {
  de: '🛠️ Debug & Log-Konsole',
  en: '🛠️ Debug & Log Console',
  fr: '🛠️ Console de débogage et de journal',
  es: '🛠️ Consola de depuración y registro'
},
'window_debug_placeholder': {
  de: 'JavaScript oder Befehl eingeben (z.B. help)...',
  en: 'Enter JavaScript or command (e.g. help)...',
  fr: 'Saisir du JavaScript ou une commande (ex. help)...',
  es: 'Ingrese JavaScript o comando (ej. help)...'
},
'window_debug_send': {
  de: 'Senden',
  en: 'Send',
  fr: 'Envoyer',
  es: 'Enviar'
},
'window_debug_log_title': {
  de: '📜 Log-Ausgabe',
  en: '📜 Log Output',
  fr: '📜 Sortie du journal',
  es: '📜 Salida del registro'
},

// ==========================================================
// POPUPS: PLAGUE (aus popups-plague.js)
// ==========================================================
'plague_ok': {
  de: 'Verstanden', en: 'Understood', fr: 'Compris', es: 'Entendido'
},
'plague_pig_title': {
  de: 'Schweinepest ausgebrochen!',
  en: 'Swine fever outbreak!',
  fr: 'Peste porcine déclarée !',
  es: '¡Brote de peste porcina!'
},
'plague_pig_desc': {
  de: 'Eine Seuche hat die Schweinebestände befallen. Alle Schweinewirte stellen die Arbeit für <b>3 Minuten</b> ein und die Hälfte deines Fleischvorrats ist vernichtet.',
  en: 'A plague has struck the pig stocks. All pig farmers stop working for <b>3 minutes</b> and half of your meat supply is destroyed.',
  fr: 'Une épidémie a frappé les porcs. Tous les éleveurs de porcs arrêtent de travailler pendant <b>3 minutes</b> et la moitié de vos réserves de viande est détruite.',
  es: 'Una plaga ha afectado a los cerdos. Todos los porcicultores dejan de trabajar durante <b>3 minutos</b> y la mitad de tu suministro de carne es destruido.'
},
'plague_rat_title': {
  de: 'Rattenplage ausgebrochen!',
  en: 'Rat infestation!',
  fr: 'Invasion de rats !',
  es: '¡Plaga de ratas!'
},
'plague_rat_desc': {
  de: 'Die Ratten haben sich über die Vorräte hergemacht. Die Hälfte deines Brotbestandes ist vernichtet und die Bäcker produzieren für <b>5 Minuten</b> nur noch die Hälfte.',
  en: 'The rats have raided the supplies. Half of your bread supply is destroyed and bakers only produce half for <b>5 minutes</b>.',
  fr: 'Les rats ont pillé les réserves. La moitié de vos réserves de pain est détruite et les boulangers ne produisent que la moitié pendant <b>5 minutes</b>.',
  es: 'Las ratas han saqueado los suministros. La mitad de tu suministro de pan es destruido y los panaderos solo producen la mitad durante <b>5 minutos</b>.'
},
'plague_drought_title': {
  de: 'Dürre ausgebrochen!',
  en: 'Drought!',
  fr: 'Sécheresse !',
  es: '¡Sequía!'
},
'plague_drought_desc': {
  de: 'Die Sonne brennt unbarmherzig auf die Felder. Alle Bauern können für <b>6 Minuten</b> kein Getreide produzieren.',
  en: 'The sun beats down mercilessly on the fields. All farmers cannot produce grain for <b>6 minutes</b>.',
  fr: 'Le soleil tape impitoyablement sur les champs. Tous les agriculteurs ne peuvent pas produire de céréales pendant <b>6 minutes</b>.',
  es: 'El sol golpea implacablemente los campos. Todos los agricultores no pueden producir grano durante <b>6 minutos</b>.'
},
'plague_infected_meat_title': {
  de: 'Infiziertes Fleisch!',
  en: 'Infected Meat!',
  fr: 'Viande infectée !',
  es: '¡Carne infectada!'
},
'plague_infected_meat_desc': {
  de: 'Das Schweinefleisch wurde beim letzten Zombieangriff mit Zombiefleisch kontaminiert. Dein gesamter Fleischvorrat ist verloren. Die Schlachter müssen <b>180 Sekunden</b> pausieren, um ihre Gebäude zu reinigen.<br><br><b style="color: #ff8a5c;">In den nächsten 60 Sekunden werden alle 5 Sekunden 2 Einwohner zu Zombies!</b>',
  en: 'The pork was contaminated with zombie meat during the last zombie attack. Your entire meat supply is lost. Butchers must pause for <b>180 seconds</b> to clean their buildings.<br><br><b style="color: #ff8a5c;">For the next 60 seconds, 2 villagers will turn into zombies every 5 seconds!</b>',
  fr: 'Le porc a été contaminé par de la viande de zombie lors de la dernière attaque. Toute votre réserve de viande est perdue. Les bouchers doivent faire une pause de <b>180 secondes</b> pour nettoyer leurs bâtiments.<br><br><b style="color: #ff8a5c;">Pendant les 60 prochaines secondes, 2 villageois se transformeront en zombies toutes les 5 secondes !</b>',
  es: 'La carne de cerdo se contaminó con carne de zombi durante el último ataque. Toda tu reserva de carne se ha perdido. Los carniceros deben hacer una pausa de <b>180 segundos</b> para limpiar sus edificios.<br><br><b style="color: #ff8a5c;">¡Durante los próximos 60 segundos, 2 aldeanos se convertirán en zombis cada 5 segundos!</b>'
},
'plague_pandemic_title': {
  de: 'Pandemie ausgebrochen',
  en: 'Pandemic Outbreak',
  fr: 'Pandémie déclarée',
  es: 'Brote de pandemia'
},
'plague_pandemic_desc': {
  de: 'Das Wasser war verseucht. Viele Einwohner sind krank geworden. In den Arztpraxen herrscht Ausnahmezustand – sie sind überfüllt.',
  en: 'The water was contaminated. Many villagers have fallen ill. The doctor\'s offices are in a state of emergency – they are overcrowded.',
  fr: 'L\'eau était contaminée. De nombreux villageois sont tombés malades. Les cabinets médicaux sont en état d\'urgence – ils sont surpeuplés.',
  es: 'El agua estaba contaminada. Muchos aldeanos se han enfermado. Las consultas médicas están en estado de emergencia: están abarrotadas.'
},

// ==========================================================
// POPUPS: COMBAT (aus popups-combat.js)
// ==========================================================
'popup_close': {
  de: 'Schließen',
  en: 'Close',
  fr: 'Fermer',
  es: 'Cerrar'
},
'combat_raider_title': {
  de: 'Räuberlager entdeckt!',
  en: 'Raider camp discovered!',
  fr: 'Camp de pillards découvert !',
  es: '¡Campamento de saqueadores descubierto!'
},
'combat_raider_desc': {
  de: 'In der Ferne wurde ein feindliches Dorf gesichtet. Seine Krieger werden deine Siedlung überfallen und Ressourcen stehlen.<br><br><em style="color: var(--parchment-dark);">Tipp: Du kannst das Lager erkunden, bevor der erste Angriff kommt.</em>',
  en: 'A hostile village has been sighted in the distance. Its warriors will raid your settlement and steal resources.<br><br><em style="color: var(--parchment-dark);">Tip: You can explore the camp before the first attack comes.</em>',
  fr: 'Un village hostile a été aperçu au loin. Ses guerriers pilleront votre colonie et voleront des ressources.<br><br><em style="color: var(--parchment-dark);">Astuce : Vous pouvez explorer le camp avant la première attaque.</em>',
  es: 'Se ha avistado una aldea hostil a lo lejos. Sus guerreros saquearán tu asentamiento y robarán recursos.<br><br><em style="color: var(--parchment-dark);">Consejo: Puedes explorar el campamento antes de que llegue el primer ataque.</em>'
},
'combat_raider_goto': {
  de: 'Zum Räuberlager',
  en: 'To the Raider Camp',
  fr: 'Vers le camp de pillards',
  es: 'Al campamento de saqueadores'
},
'combat_dragon_title': {
  de: 'Ein Drache naht!',
  en: 'A dragon approaches!',
  fr: 'Un dragon approche !',
  es: '¡Un dragón se acerca!'
},
'combat_dragon_goto': {
  de: 'Zum Drachen',
  en: 'To the Dragon',
  fr: 'Vers le dragon',
  es: 'Al dragón'
},
'combat_pack_title': {
  de: 'Ein Rudel Drachen greift an!',
  en: 'A pack of dragons attacks!',
  fr: 'Une meute de dragons attaque !',
  es: '¡Una manada de dragones ataca!'
},
'combat_pack_desc': {
  de: 'Drei junge Drachen haben deine Siedlung erspäht und greifen gleichzeitig aus verschiedenen Richtungen an. Sie sind noch unerfahren, aber in der Überzahl!<br><br><b style="color: #ff8a5c;">Rüste deine Verteidigung aus und halte sie auf Abstand!</b>',
  en: 'Three young dragons have spotted your settlement and are attacking simultaneously from different directions. They are still inexperienced, but outnumber you!<br><br><b style="color: #ff8a5c;">Equip your defense and keep them at bay!</b>',
  fr: 'Trois jeunes dragons ont repéré votre colonie et attaquent simultanément de différentes directions. Ils sont encore inexpérimentés, mais en supériorité numérique !<br><br><b style="color: #ff8a5c;">Équipez votre défense et tenez-les à distance !</b>',
  es: 'Tres jóvenes dragones han divisado tu asentamiento y atacan simultáneamente desde diferentes direcciones. ¡Aún son inexpertos, pero son más numerosos!<br><br><b style="color: #ff8a5c;">¡Equipa tu defensa y mantenlos a raya!</b>'
},
'combat_pack_goto': {
  de: 'Zum Kampf',
  en: 'To Battle',
  fr: 'Au combat',
  es: 'A la batalla'
},

// ==========================================================
// POPUPS: MISC (aus popups-misc.js)
// ==========================================================
'popup_ok': {
  de: 'Verstanden', en: 'Understood', fr: 'Compris', es: 'Entendido'
},
'popup_fire_title': {
  de: 'Feuer ausgebrochen!',
  en: 'Fire outbreak!',
  fr: 'Incendie déclaré !',
  es: '¡Incendio declarado!'
},
'popup_fire_desc': {
  de: 'Ein Gebäude steht in Flammen! Wenn das Feuer nicht gelöscht wird, brennt es zur Ruine nieder und kann sich auf umliegende Gebäude ausbreiten.<br><br><b style="color: #ff8a5c;">Baue eine Feuerwehr und sorge für genug Wasser, um Brände zu löschen!</b>',
  en: 'A building is on fire! If the fire is not extinguished, it will burn down to a ruin and can spread to surrounding buildings.<br><br><b style="color: #ff8a5c;">Build a fire station and ensure enough water to extinguish fires!</b>',
  fr: 'Un bâtiment est en feu ! Si le feu n\'est pas éteint, il brûlera jusqu\'à devenir une ruine et pourra se propager aux bâtiments voisins.<br><br><b style="color: #ff8a5c;">Construisez une caserne de pompiers et assurez-vous d\'avoir assez d\'eau pour éteindre les incendies !</b>',
  es: '¡Un edificio está en llamas! Si no se extingue el fuego, se reducirá a ruinas y puede propagarse a los edificios cercanos.<br><br><b style="color: #ff8a5c;">¡Construye un parque de bomberos y asegúrate de tener suficiente agua para apagar incendios!</b>'
},
'popup_fire_goto': {
  de: 'Zum Brand springen', en: 'Jump to Fire', fr: 'Aller au feu', es: 'Ir al incendio'
},
'popup_sickness_title': {
  de: 'Jemand ist krank geworden!', en: 'Someone got sick!', fr: 'Quelqu\'un est tombé malade !', es: '¡Alguien se ha enfermado!'
},
'popup_sickness_desc': {
  de: 'Einer deiner Bewohner ist erkrankt. Kranke Arbeiter sind nur noch <b>ein Drittel so produktiv</b>. Ohne Behandlung wird er nicht wieder gesund!',
  en: 'One of your villagers has fallen ill. Sick workers are only <b>one third as productive</b>. Without treatment, he will not recover!',
  fr: 'L\'un de vos villageois est tombé malade. Les travailleurs malades ne sont plus productifs qu\'<b>un tiers</b>. Sans traitement, il ne guérira pas !',
  es: 'Uno de tus aldeanos se ha enfermado. Los trabajadores enfermos son solo <b>un tercio de productivos</b>. ¡Sin tratamiento, no se recuperará!'
},
'popup_sickness_how': {
  de: 'So heilst du ihn:', en: 'How to heal him:', fr: 'Comment le guérir :', es: 'Cómo curarlo:'
},
'popup_sickness_step1': {
  de: '<b>Räuberlager zerstören</b> → du erhältst <b>Räuberkraut</b>.',
  en: '<b>Destroy the raider camp</b> → you receive <b>raider herb</b>.',
  fr: '<b>Détruire le camp de pillards</b> → vous recevez de l\'<b>herbe de pillard</b>.',
  es: '<b>Destruye el campamento de saqueadores</b> → recibirás <b>hierba de saqueador</b>.'
},
'popup_sickness_step2': {
  de: '<b>Apotheke bauen</b> → verarbeitet Räuberkraut + Futter zu <b>Antibiotika</b>.',
  en: '<b>Build a pharmacy</b> → processes raider herb + feed into <b>antibiotics</b>.',
  fr: '<b>Construire une pharmacie</b> → transforme l\'herbe de pillard + nourriture en <b>antibiotiques</b>.',
  es: '<b>Construye una farmacia</b> → procesa hierba de saqueador + pienso en <b>antibióticos</b>.'
},
'popup_sickness_step3': {
  de: '<b>Arztpraxis bauen</b> → der Arzt heilt kranke Bewohner mit Antibiotika.',
  en: '<b>Build a doctor\'s office</b> → the doctor heals sick villagers with antibiotics.',
  fr: '<b>Construire un cabinet médical</b> → le médecin soigne les villageois malades avec des antibiotiques.',
  es: '<b>Construye una consulta médica</b> → el médico cura a los aldeanos enfermos con antibióticos.'
},
'popup_virus_title': {
  de: 'Das Zombievirus hat sich weiterentwickelt!', en: 'The zombie virus has evolved!', fr: 'Le virus zombie a évolué !', es: '¡El virus zombi ha evolucionado!'
},
'popup_virus_desc': {
  de: 'Die Übertragung erfolgt jetzt auch von Zombie zu Mensch. Ab sofort können Zombies deine Einwohner infizieren.',
  en: 'Transmission now also occurs from zombie to human. From now on, zombies can infect your villagers.',
  fr: 'La transmission se fait désormais aussi de zombie à humain. Désormais, les zombies peuvent infecter vos villageois.',
  es: 'La transmisión ahora también ocurre de zombi a humano. A partir de ahora, los zombis pueden infectar a tus aldeanos.'
},
'popup_quake_title': {
  de: 'Ein gewaltiges Erdbeben!', en: 'A massive earthquake!', fr: 'Un tremblement de terre massif !', es: '¡Un terremoto masivo!'
},
'popup_quake_desc': {
  de: 'Die Erde bebte und hat große Schäden in deiner Siedlung hinterlassen:',
  en: 'The earth shook and left major damage in your settlement:',
  fr: 'La terre a tremblé et a causé d\'importants dégâts dans votre colonie :',
  es: 'La tierra tembló y dejó grandes daños en tu asentamiento:'
},
'popup_quake_buildings': {
  de: 'Gebäude wurden zerstört.', en: 'buildings were destroyed.', fr: 'bâtiments ont été détruits.', es: 'edificios fueron destruidos.'
},
'popup_quake_villagers': {
  de: 'Einwohner starben in den Trümmern.', en: 'villagers died in the rubble.', fr: 'villageois sont morts dans les décombres.', es: 'aldeanos murieron entre los escombros.'
},
'popup_quake_resources': {
  de: 'Ressourcen wurden vernichtet.', en: 'resources were destroyed.', fr: 'ressources ont été détruites.', es: 'recursos fueron destruidos.'
},
'popup_quake_fire': {
  de: 'Ein Feuer ist ausgebrochen!', en: 'A fire has broken out!', fr: 'Un incendie s\'est déclaré !', es: '¡Se ha declarado un incendio!'
},
'popup_quake_ok': {
  de: 'Ich baue wieder auf', en: 'I will rebuild', fr: 'Je vais reconstruire', es: 'Reconstruiré'
},
'popup_quake_sacrifice_btn': {
  de: 'Götter besänftigen (kostet 15% aller Rohstoffe)', en: 'Appease the gods (costs 15% of all resources)', fr: 'Apaiser les dieux (coûte 15% de toutes les ressources)', es: 'Aplacar a los dioses (cuesta 15% de todos los recursos)'
},
'popup_quake_sacrifice_sub': {
  de: 'Danach nie wieder Erdbeben!', en: 'Never again earthquakes!', fr: 'Plus jamais de tremblements de terre !', es: '¡Nunca más terremotos!'
},
'popup_sacrifice_title': {
  de: 'Opfergabe an die Götter?', en: 'Sacrifice to the gods?', fr: 'Sacrifice aux dieux ?', es: '¿Sacrificio a los dioses?'
},
'popup_sacrifice_desc': {
  de: 'Bist du sicher? Die Götter verlangen <b>15% aller deiner Rohstoffe</b>. Dafür werden sie dich für immer vor weiteren Erdbeben verschonen.',
  en: 'Are you sure? The gods demand <b>15% of all your resources</b>. In return, they will spare you from further earthquakes forever.',
  fr: 'Êtes-vous sûr ? Les dieux exigent <b>15 % de toutes vos ressources</b>. En échange, ils vous épargneront pour toujours d\'autres tremblements de terre.',
  es: '¿Estás seguro? Los dioses exigen el <b>15% de todos tus recursos</b>. A cambio, te perdonarán para siempre de más terremotos.'
},
'popup_sacrifice_yes': {
  de: 'Ja, opfern', en: 'Yes, sacrifice', fr: 'Oui, sacrifier', es: 'Sí, sacrificar'
},
'popup_sacrifice_no': {
  de: 'Nein, lieber nicht', en: 'No, rather not', fr: 'Non, plutôt pas', es: 'No, mejor no'
},

// ==========================================================
// POPUPS: WARNING (aus popups-warning.js)
// ==========================================================
'warning_hunger_title': {
  de: '⚠️ Hungersnot droht!', en: '⚠️ Famine imminent!', fr: '⚠️ Famine imminente !', es: '¡⚠️ Hambruna inminente!'
},
'warning_hunger_desc': {
  de: 'Die Nahrungsproduktion ist zu niedrig. In den letzten 5 Minuten wurde mehr Nahrung verbraucht als produziert.',
  en: 'Food production is too low. In the last 5 minutes, more food was consumed than produced.',
  fr: 'La production de nourriture est trop faible. Au cours des 5 dernières minutes, plus de nourriture a été consommée que produite.',
  es: 'La producción de alimentos es demasiado baja. En los últimos 5 minutos se consumió más comida de la que se produjo.'
},
'warning_hunger_tip': {
  de: 'Baue mehr Bäckereien oder Schlachter.', en: 'Build more bakeries or butchers.', fr: 'Construisez plus de boulangeries ou de boucheries.', es: 'Construye más panaderías o carnicerías.'
},
'warning_start_title': {
  de: '⚠️ Gefahr für die Siedlung!', en: '⚠️ Danger for the settlement!', fr: '⚠️ Danger pour la colonie !', es: '¡⚠️ Peligro para el asentamiento!'
},
'warning_start_desc': {
  de: 'Deine Siedlung ist nicht allein auf dieser Welt. Feinde werden kommen, um sie zu zerstören:',
  en: 'Your settlement is not alone in this world. Enemies will come to destroy it:',
  fr: 'Votre colonie n\'est pas seule dans ce monde. Des ennemis viendront pour la détruire :',
  es: 'Tu asentamiento no está solo en este mundo. Los enemigos vendrán a destruirlo:'
},
'warning_start_zombies': {
  de: '<b style="color: #7ad07a;">Zombies</b> steigen aus dem Boden und greifen deine Einwohner an.',
  en: '<b style="color: #7ad07a;">Zombies</b> rise from the ground and attack your villagers.',
  fr: 'Des <b style="color: #7ad07a;">zombies</b> sortent de terre et attaquent vos villageois.',
  es: 'Los <b style="color: #7ad07a;">zombis</b> salen de la tierra y atacan a tus aldeanos.'
},
'warning_start_raiders': {
  de: '<b style="color: #7ab4d8;">Räuber</b> bauen ein Lager in der Ferne und überfallen dich, um Ressourcen zu stehlen.',
  en: '<b style="color: #7ab4d8;">Raiders</b> build a camp in the distance and ambush you to steal resources.',
  fr: 'Les <b style="color: #7ab4d8;">pillards</b> construisent un camp au loin et vous attaquent pour voler des ressources.',
  es: 'Los <b style="color: #7ab4d8;">saqueadores</b> construyen un campamento a lo lejos y te emboscan para robar recursos.'
},
'warning_start_dragons': {
  de: '<b style="color: #ff8a5c;">Drachen</b> fallen vom Himmel und brennen deine Gebäude nieder.',
  en: '<b style="color: #ff8a5c;">Dragons</b> fall from the sky and burn down your buildings.',
  fr: 'Les <b style="color: #ff8a5c;">dragons</b> tombent du ciel et incendient vos bâtiments.',
  es: 'Los <b style="color: #ff8a5c;">dragones</b> caen del cielo y queman tus edificios.'
},
'warning_start_ready': {
  de: '<b>Rüste deine Verteidigung frühzeitig aus!</b> Baue Bogenschussanlagen, Wachtürme und bilde Krieger aus.',
  en: '<b>Equip your defense early!</b> Build archery towers, watchtowers, and train warriors.',
  fr: '<b>Équipez votre défense tôt !</b> Construisez des tours de tir à l\'arc, des tours de guet et formez des guerriers.',
  es: '<b>¡Equipa tu defensa a tiempo!</b> Construye torres de tiro con arco, torres de vigilancia y entrena guerreros.'
},
'warning_start_dragon_time': {
  de: '<b>Drachen-Warnung:</b> Der Drache erscheint kurz nachdem dein Dorf würdig ist, sich einem Drachen zu stellen.',
  en: '<b>Dragon Warning:</b> The dragon appears shortly after your village is worthy to face a dragon.',
  fr: '<b>Avertissement de dragon :</b> Le dragon apparaît peu de temps après que votre village soit digne d\'affronter un dragon.',
  es: '<b>Advertencia de dragón:</b> El dragón aparece poco después de que tu aldea sea digna de enfrentarse a un dragón.'
},
'warning_start_ok': {
  de: 'Verstanden, ich bin bereit!', en: 'Understood, I am ready!', fr: 'Compris, je suis prêt !', es: '¡Entendido, estoy listo!'
},
'warning_peace_title': {
  de: 'Willkommen in einer friedlichen Welt!', en: 'Welcome to a peaceful world!', fr: 'Bienvenue dans un monde paisible !', es: '¡Bienvenido a un mundo pacífico!'
},
'warning_peace_desc': {
  de: 'Es gibt keine Zombies, Räuber oder Drachen. Hier kannst du nach Belieben bauen und musst dich nicht um die Verteidigung deiner Siedlung kümmern.<br><br>Genieße den Frieden und baue dein Traumdorf!',
  en: 'There are no zombies, raiders, or dragons. Here you can build as you please and don\'t have to worry about defending your settlement.<br><br>Enjoy the peace and build your dream village!',
  fr: 'Il n\'y a pas de zombies, de pillards ou de dragons. Ici, vous pouvez construire à votre guise et ne pas vous soucier de la défense de votre colonie.<br><br>Profitez de la paix et construisez votre village de rêve !',
  es: 'No hay zombis, saqueadores ni dragones. Aquí puedes construir a tu gusto y no tienes que preocuparte por defender tu asentamiento.<br><br>¡Disfruta de la paz y construye tu aldea soñada!'
},
'warning_peace_ok': {
  de: 'Frieden genießen', en: 'Enjoy peace', fr: 'Profiter de la paix', es: 'Disfrutar de la paz'
},

// ==========================================================
// RESSOURCEN (für ui-core.js)
// ==========================================================
'res_wood': { de: 'Holz', en: 'Wood', fr: 'Bois', es: 'Madera' },
'res_stone': { de: 'Stein', en: 'Stone', fr: 'Pierre', es: 'Piedra' },
'res_grain': { de: 'Weizen', en: 'Grain', fr: 'Blé', es: 'Trigo' },
'res_fish': { de: 'Fisch', en: 'Fish', fr: 'Poisson', es: 'Pescado' },
'res_water': { de: 'Wasser', en: 'Water', fr: 'Eau', es: 'Agua' },
'res_beer': { de: 'Bier', en: 'Beer', fr: 'Bière', es: 'Cerveza' },
'res_woodPlank': { de: 'Bretter', en: 'Planks', fr: 'Planches', es: 'Tablas' },
'res_flour': { de: 'Mehl', en: 'Flour', fr: 'Farine', es: 'Harina' },
'res_bread': { de: 'Brot', en: 'Bread', fr: 'Pain', es: 'Pan' },
'res_arrows': { de: 'Pfeile', en: 'Arrows', fr: 'Flèches', es: 'Flechas' },
'res_feed': { de: 'Futter', en: 'Feed', fr: 'Nourriture', es: 'Pienso' },
'res_pig': { de: 'Schwein', en: 'Pig', fr: 'Porc', es: 'Cerdo' },
'res_meat': { de: 'Fleisch', en: 'Meat', fr: 'Viande', es: 'Carne' },
'res_dragonBone': { de: 'Drachenknochen', en: 'Dragon Bone', fr: 'Os de dragon', es: 'Hueso de dragón' },
'res_raiderHerb': { de: 'Räuberkraut', en: 'Raider Herb', fr: 'Herbe de pillard', es: 'Hierba de saqueador' },
'res_antibiotics': { de: 'Antibiotika', en: 'Antibiotics', fr: 'Antibiotiques', es: 'Antibióticos' },

// ==========================================================
// VILLAGERS (aus ui-villagers.js)
// ==========================================================
'status_unknown': { de: 'Unbekannt', en: 'Unknown', fr: 'Inconnu', es: 'Desconocido' },
'status_in_treatment': { de: 'In Behandlung', en: 'In treatment', fr: 'En traitement', es: 'En tratamiento' },

'task_go_to_work': { de: 'Unterwegs zur Arbeit', en: 'On the way to work', fr: 'En route vers le travail', es: 'De camino al trabajo' },
'task_go_to_post': { de: 'Unterwegs zum Posten', en: 'On the way to post', fr: 'En route vers le poste', es: 'De camino al puesto' },
'task_go_to_build': { de: 'Unterwegs zur Baustelle', en: 'On the way to construction site', fr: 'En route vers le chantier', es: 'De camino a la obra' },
'task_go_to_pickup': { de: 'Unterwegs zum Abholen', en: 'On the way to pickup', fr: 'En route pour la collecte', es: 'De camino a recoger' },
'task_go_to_dropoff': { de: 'Unterwegs zum Lager', en: 'On the way to storage', fr: 'En route vers le stockage', es: 'De camino al almacenamiento' },
'task_harvest_route': { de: 'Unterwegs zum Feld', en: 'On the way to field', fr: 'En route vers le champ', es: 'De camino al campo' },
'task_tree': { de: 'Unterwegs zum Baum', en: 'On the way to tree', fr: 'En route vers l\'arbre', es: 'De camino al árbol' },
'task_stone': { de: 'Unterwegs zum Stein', en: 'On the way to stone', fr: 'En route vers la pierre', es: 'De camino a la piedra' },
'task_fish': { de: 'Unterwegs zum Wasser', en: 'On the way to water', fr: 'En route vers l\'eau', es: 'De camino al agua' },
'task_plant': { de: 'Unterwegs zum Pflanzen', en: 'On the way to plant', fr: 'En route pour planter', es: 'De camino a plantar' },
'task_recipe_fetch': { de: 'Unterwegs zum Lager (Zutaten)', en: 'On the way to storage (ingredients)', fr: 'En route vers le stockage (ingrédients)', es: 'De camino al almacenamiento (ingredientes)' },
'task_recipe_return': { de: 'Unterwegs zur Produktion', en: 'On the way to production', fr: 'En route vers la production', es: 'De camino a la producción' },
'task_fetch_fish': { de: 'Unterwegs zum Fischholen', en: 'On the way to fetch fish', fr: 'En route pour chercher du poisson', es: 'De camino a buscar pescado' },
'task_fetch_fish_return': { de: 'Unterwegs mit Fisch', en: 'On the way with fish', fr: 'En route avec du poisson', es: 'De camino con pescado' },
'task_fetch_arrows': { de: 'Unterwegs zum Pfeileholen', en: 'On the way to fetch arrows', fr: 'En route pour chercher des flèches', es: 'De camino a buscar flechas' },
'task_fetch_arrows_return': { de: 'Unterwegs mit Pfeilen', en: 'On the way with arrows', fr: 'En route avec des flèches', es: 'De camino con flechas' },
'task_repair_fetch': { de: 'Unterwegs zum Material holen', en: 'On the way to fetch materials', fr: 'En route pour chercher des matériaux', es: 'De camino a buscar materiales' },
'task_repair_return': { de: 'Unterwegs zur Reparatur', en: 'On the way to repair', fr: 'En route vers la réparation', es: 'De camino a reparar' },
'task_water_fetch': { de: 'Unterwegs zum Wasserholen', en: 'On the way to fetch water', fr: 'En route pour chercher de l\'eau', es: 'De camino a buscar agua' },
'task_water_return': { de: 'Unterwegs zur Feuerwehr', en: 'On the way to fire station', fr: 'En route vers la caserne', es: 'De camino al parque de bomberos' },
'task_return_station': { de: 'Unterwegs zur Feuerwehr', en: 'On the way to fire station', fr: 'En route vers la caserne', es: 'De camino al parque de bomberos' },
'task_extinguish_fetch': { de: 'Unterwegs zum Wassertanken', en: 'On the way to refill water', fr: 'En route pour remplir d\'eau', es: 'De camino a recargar agua' },
'task_extinguish_go': { de: 'Unterwegs zum Feuer', en: 'On the way to fire', fr: 'En route vers le feu', es: 'De camino al fuego' },
'task_fetch_antibiotics': { de: 'Unterwegs zum Antibiotika holen', en: 'On the way to fetch antibiotics', fr: 'En route pour chercher des antibiotiques', es: 'De camino a buscar antibióticos' },
'task_to_praxis': { de: 'Unterwegs zur Arztpraxis', en: 'On the way to doctor\'s office', fr: 'En route vers le cabinet médical', es: 'De camino a la consulta médica' },
'task_back_to_work': { de: 'Unterwegs zurück zur Arbeit', en: 'On the way back to work', fr: 'En route vers le travail', es: 'De camino de vuelta al trabajo' },
'task_go_home': { de: 'Unterwegs nach Hause', en: 'On the way home', fr: 'En route vers la maison', es: 'De camino a casa' },
'task_return_post': { de: 'Unterwegs zum Posten', en: 'On the way to post', fr: 'En route vers le poste', es: 'De camino al puesto' },
'task_moving': { de: 'Unterwegs', en: 'On the way', fr: 'En route', es: 'De camino' },

'state_harvesting_hit': { de: 'Fällt Baum / Baut ab', en: 'Felling tree / chopping', fr: 'Abat l\'arbre', es: 'Talando árbol' },
'state_fishing': { de: 'Fischt im Wasser', en: 'Fishing in water', fr: 'Pêche dans l\'eau', es: 'Pesca en el agua' },
'state_harvesting': { de: 'Erntet Feld ab', en: 'Harvesting field', fr: 'Récolte du champ', es: 'Cosechando campo' },
'state_building': { de: 'Baut Gebäude', en: 'Building', fr: 'Construction', es: 'Construyendo' },
'state_repairing': { de: 'Repariert Gebäude', en: 'Repairing building', fr: 'Réparation du bâtiment', es: 'Reparando edificio' },
'state_extinguishing': { de: 'Löscht Feuer', en: 'Extinguishing fire', fr: 'Extinction du feu', es: 'Extinguiendo fuego' },
'state_vdefend': { de: 'Verteidigt das Reich', en: 'Defending the realm', fr: 'Défense du royaume', es: 'Defendiendo el reino' },
'state_vfightback': { de: 'Im Gegenangriff', en: 'Counter-attacking', fr: 'Contre-attaque', es: 'Contraatacando' },
'state_vfighting': { de: 'Kämpft gegen Räuber', en: 'Fighting raiders', fr: 'Combat contre les pillards', es: 'Luchando contra saqueadores' },
'state_zfighting': { de: 'Kämpft gegen Zombies', en: 'Fighting zombies', fr: 'Combat contre les zombies', es: 'Luchando contra zombis' },
'state_dragon_attack': { de: 'Kämpft gegen Drachen', en: 'Fighting dragons', fr: 'Combat contre les dragons', es: 'Luchando contra dragones' },
'state_wait_water': { de: 'Wartet auf Wasserbedarf', en: 'Waiting for water', fr: 'En attente d\'eau', es: 'Esperando agua' },
'state_wait_alarm': { de: 'Wartet auf Alarm', en: 'Waiting for alarm', fr: 'En attente d\'alarme', es: 'Esperando alarma' },
'state_sick': { de: 'Krank', en: 'Sick', fr: 'Malade', es: 'Enfermo' },
'state_wait_patient': { de: 'Wartet auf Patienten', en: 'Waiting for patients', fr: 'En attente de patients', es: 'Esperando pacientes' },
'state_search_wood_stone': { de: 'Sucht neuen Baum/Stein', en: 'Searching for new tree/stone', fr: 'Recherche d\'un nouvel arbre/pierre', es: 'Buscando nuevo árbol/piedra' },
'state_search_fish': { de: 'Sucht Fischgrund', en: 'Searching for fishing spot', fr: 'Recherche d\'un spot de pêche', es: 'Buscando lugar de pesca' },
'state_search_plant': { de: 'Sucht Pflanzplatz', en: 'Searching for planting spot', fr: 'Recherche d\'un spot de plantation', es: 'Buscando lugar para plantar' },
'state_wait_ingredients': { de: 'Wartet auf Zutaten', en: 'Waiting for ingredients', fr: 'En attente d\'ingrédients', es: 'Esperando ingredientes' },
'state_working': { de: 'Arbeitet', en: 'Working', fr: 'Travail', es: 'Trabajando' },
'state_idle': { de: 'Wartet auf Aufgabe', en: 'Waiting for task', fr: 'En attente de tâche', es: 'Esperando tarea' },
'state_pause': { de: 'Pause ({s}s)', en: 'Pause ({s}s)', fr: 'Pause ({s}s)', es: 'Pausa ({s}s)' },
'state_producing': { de: 'Produziert ({s}s)', en: 'Producing ({s}s)', fr: 'Production ({s}s)', es: 'Produciendo ({s}s)' },
'state_working_time': { de: 'Arbeitet ({s}s)', en: 'Working ({s}s)', fr: 'Travail ({s}s)', es: 'Trabajando ({s}s)' },
'state_wait_time': { de: 'Wartezeit ({s}s)', en: 'Wait time ({s}s)', fr: 'Temps d\'attente ({s}s)', es: 'Tiempo de espera ({s}s)' },
'state_sick_doctor': { de: 'Krank (Arzt)', en: 'Sick (Doctor)', fr: 'Malade (Médecin)', es: 'Enfermo (Médico)' },
'state_sick_slow': { de: '🤒 Krank (arbeitet langsam)', en: '🤒 Sick (working slowly)', fr: '🤒 Malade (travaille lentement)', es: '🤒 Enfermo (trabaja lento)' },

'ui_dead': { de: '• (verstorben)', en: '• (deceased)', fr: '• (décédé)', es: '• (fallecido)' },
'ui_lv': { de: 'Lv', en: 'Lv', fr: 'Nv', es: 'Nv' },
'ui_kills': { de: 'Kills:', en: 'Kills:', fr: 'Éliminations :', es: 'Asesinatos:' },
'ui_beer': { de: 'Bier:', en: 'Beer:', fr: 'Bière :', es: 'Cerveza:' },
'ui_yes': { de: '🍺 Ja', en: '🍺 Yes', fr: '🍺 Oui', es: '🍺 Sí' },
'ui_no': { de: '❌ Nein', en: '❌ No', fr: '❌ Non', es: '❌ No' },
'ui_vs_zombie': { de: 'vs. Zombie:', en: 'vs. Zombie:', fr: 'vs. Zombie :', es: 'vs. Zombi:' },
'ui_vs_raider': { de: 'vs. Räuber:', en: 'vs. Raider:', fr: 'vs. Pillard :', es: 'vs. Saqueador:' },

// ==========================================================
// UI PANEL RENDER (aus ui-panel-render.js)
// ==========================================================
'panel_status': { de: 'Status:', en: 'Status:', fr: 'Statut :', es: 'Estado:' },
'panel_progress': { de: 'Fortschritt:', en: 'Progress:', fr: 'Progrès :', es: 'Progreso:' },
'panel_fire_station': { de: 'Feuerwehr', en: 'Fire Station', fr: 'Caserne', es: 'Parque de bomberos' },
'panel_water': { de: 'Wasser:', en: 'Water:', fr: 'Eau :', es: 'Agua:' },
'panel_radius': { de: 'Einsatzradius:', en: 'Operation radius:', fr: 'Rayon d\'action :', es: 'Radio de acción:' },
'panel_water_per_trip': { de: 'Wasser pro Fahrt:', en: 'Water per trip:', fr: 'Eau par trajet :', es: 'Agua por viaje:' },
'panel_personnel': { de: 'Personal', en: 'Personnel', fr: 'Personnel', es: 'Personal' },
'panel_fighter': { de: '🔴 Löscher:', en: '🔴 Firefighter:', fr: '🔴 Pompier :', es: '🔴 Bombero:' },
'panel_refill': { de: '💧 Nachfüller:', en: '💧 Refiller:', fr: '💧 Remplisseur :', es: '💧 Rellenador:' },
'panel_no_fighter': { de: 'Kein Löscher', en: 'No firefighter', fr: 'Pas de pompier', es: 'Sin bombero' },
'panel_no_refill': { de: 'Kein Nachfüller', en: 'No refiller', fr: 'Pas de remplisseur', es: 'Sin rellenador' },
'panel_residents': { de: 'Bewohner', en: 'Residents', fr: 'Habitants', es: 'Residentes' },
'panel_doctor_office': { de: 'Arztpraxis', en: 'Doctor\'s Office', fr: 'Cabinet médical', es: 'Consulta médica' },
'panel_doctor': { de: 'Arzt:', en: 'Doctor:', fr: 'Médecin :', es: 'Médico:' },
'panel_no_doctor': { de: 'Kein Arzt', en: 'No doctor', fr: 'Pas de médecin', es: 'Sin médico' },
'panel_antibiotics': { de: 'Antibiotika:', en: 'Antibiotics:', fr: 'Antibiotiques :', es: 'Antibióticos:' },
'panel_treatment_time': { de: 'Behandlungszeit:', en: 'Treatment time:', fr: 'Temps de traitement :', es: 'Tiempo de tratamiento:' },
'panel_waiting_global': { de: 'Wartend (global):', en: 'Waiting (global):', fr: 'En attente (global) :', es: 'Esperando (global):' },
'panel_in_treatment': { de: '🏥 In Behandlung', en: '🏥 In treatment', fr: '🏥 En traitement', es: '🏥 En tratamiento' },
'panel_patient': { de: 'Patient:', en: 'Patient:', fr: 'Patient :', es: 'Paciente:' },
'panel_remaining': { de: 'Verbleibend:', en: 'Remaining:', fr: 'Restant :', es: 'Restante:' },
'panel_currently': { de: '🏥 Aktuell', en: '🏥 Currently', fr: '🏥 Actuellement', es: '🏥 Actualmente' },
'panel_no_patient': { de: 'Kein Patient in Behandlung', en: 'No patient in treatment', fr: 'Aucun patient en traitement', es: 'Ningún paciente en tratamiento' },
'panel_global_queue': { de: '⏳ Globale Warteschlange', en: '⏳ Global Queue', fr: '⏳ File d\'attente globale', es: '⏳ Cola global' },
'panel_patients_waiting': { de: 'Patienten warten auf den nächsten freien Arzt', en: 'Patients waiting for the next available doctor', fr: 'Patients en attente du prochain médecin disponible', es: 'Pacientes esperando al próximo médico disponible' },
'panel_military': { de: 'Militär', en: 'Military', fr: 'Militaire', es: 'Ejército' },
'panel_warriors': { de: 'Krieger:', en: 'Warriors:', fr: 'Guerriers :', es: 'Guerreros:' },
'panel_transport': { de: 'Transport', en: 'Transport', fr: 'Transport', es: 'Transporte' },
'panel_resource': { de: 'Ressource:', en: 'Resource:', fr: 'Ressource :', es: 'Recurso:' },
'panel_transport_prio': { de: 'Transport-Prio:', en: 'Transport Prio:', fr: 'Prio transport :', es: 'Prioridad transporte:' },
'panel_prio_high': { de: 'Wird bevorzugt abgeholt.', en: 'Collected with priority.', fr: 'Collecté en priorité.', es: 'Recogido con prioridad.' },
'panel_prio_med': { de: 'Wird bei Gelegenheit abgeholt.', en: 'Collected when possible.', fr: 'Collecté quand possible.', es: 'Recogido cuando sea posible.' },
'panel_prio_low': { de: 'Wird zuletzt abgeholt.', en: 'Collected last.', fr: 'Collecté en dernier.', es: 'Recogido al final.' },
'panel_pause_building': { de: '⏸ Gebäude stilllegen', en: '⏸ Pause building', fr: '⏸ Mettre en pause', es: '⏸ Pausar edificio' },
'panel_resume_building': { de: '▶ Gebäude wieder aktivieren', en: '▶ Resume building', fr: '▶ Réactiver le bâtiment', es: '▶ Reanudar edificio' },
'panel_arrow_stop': { de: 'Produktionsstop', en: 'Production Stop', fr: 'Arrêt de production', es: 'Parada de producción' },
'panel_current_global': { de: 'Aktuell (global):', en: 'Current (global):', fr: 'Actuel (global) :', es: 'Actual (global):' },
'panel_stop_at': { de: 'Stop ab (Stück):', en: 'Stop at (pieces):', fr: 'Arrêt à (pièces) :', es: 'Detener a (piezas):' },
'panel_stopped': { de: 'Gestoppt', en: 'Stopped', fr: 'Arrêté', es: 'Detenido' },
'panel_producing': { de: 'Produziert', en: 'Producing', fr: 'Production', es: 'Produciendo' },
'panel_defense': { de: 'Verteidigung', en: 'Defense', fr: 'Défense', es: 'Defensa' },
'panel_range': { de: 'Reichweite:', en: 'Range:', fr: 'Portée :', es: 'Alcance:' },
'panel_fire_rate': { de: 'Schussrate:', en: 'Fire rate:', fr: 'Cadence de tir :', es: 'Cadencia de tiro:' },
'panel_hit_chance': { de: 'Trefferquote nach Distanz', en: 'Hit chance by distance', fr: 'Chance de toucher par distance', es: 'Probabilidad de acierto por distancia' },
'panel_tiles': { de: 'Felder', en: 'tiles', fr: 'cases', es: 'casillas' },
'panel_dragon_fixed': { de: '🐉 Drache:', en: '🐉 Dragon:', fr: '🐉 Dragon :', es: '🐉 Dragón:' },
'panel_arrow_storage': { de: 'Pfeil-Lager (Turm)', en: 'Arrow storage (tower)', fr: 'Stock de flèches (tour)', es: 'Almacén de flechas (torre)' },
'panel_stock': { de: 'Vorrat:', en: 'Stock:', fr: 'Stock :', es: 'Existencias:' },
'panel_global_storage': { de: 'Global (Lager):', en: 'Global (storage):', fr: 'Global (stock) :', es: 'Global (almacén):' },
'panel_fetching_supplies': { de: 'holt Nachschub…', en: 'fetching supplies…', fr: 'cherche des fournitures…', es: 'buscando suministros…' },
'panel_next_shot': { de: 'Nächster Schuss:', en: 'Next shot:', fr: 'Prochain tir :', es: 'Siguiente disparo:' },
'panel_ready': { de: 'Bereit', en: 'Ready', fr: 'Prêt', es: 'Listo' },
'panel_no_archer': { de: 'Kein Schütze', en: 'No archer', fr: 'Pas d\'archer', es: 'Sin arquero' },
'panel_paused': { de: 'Pausiert', en: 'Paused', fr: 'En pause', es: 'Pausado' },
'panel_no_arrows': { de: 'Keine Pfeile', en: 'No arrows', fr: 'Pas de flèches', es: 'Sin flechas' },
'panel_reloading': { de: 'Nachladen', en: 'Reloading', fr: 'Rechargement', es: 'Recargando' },
'panel_resources_total': { de: 'Ressourcen (Gesamt)', en: 'Resources (Total)', fr: 'Ressources (Total)', es: 'Recursos (Total)' },
'panel_forester': { de: 'Förster', en: 'Forester', fr: 'Forestier', es: 'Guardabosques' },
'panel_current_status': { de: 'Aktueller Status:', en: 'Current status:', fr: 'Statut actuel :', es: 'Estado actual:' },
'panel_wait_plant': { de: 'Wartezeit (bei Pflanzung):', en: 'Wait time (on planting):', fr: 'Temps d\'attente (plantation) :', es: 'Tiempo de espera (al plantar):' },
'panel_no_fish': { de: '(kein Fisch)', en: '(no fish)', fr: '(pas de poisson)', es: '(sin pescado)' },
'panel_no_forester': { de: 'Kein Förster', en: 'No forester', fr: 'Pas de forestier', es: 'Sin guardabosques' },
'panel_output_storage': { de: 'Ausgangs-Lager', en: 'Output Storage', fr: 'Stock de sortie', es: 'Almacén de salida' },
'panel_production': { de: 'Produktion', en: 'Production', fr: 'Production', es: 'Producción' },
'panel_next_load': { de: 'Nächste Ladung in:', en: 'Next load in:', fr: 'Prochain chargement dans :', es: 'Próxima carga en:' },
'panel_amount': { de: 'Menge:', en: 'Amount:', fr: 'Quantité :', es: 'Cantidad:' },
'panel_fish_slots': { de: 'Fisch-Slots', en: 'Fish Slots', fr: 'Emplacements de poisson', es: 'Ranuras de pescado' },
'panel_slots': { de: 'Slots:', en: 'Slots:', fr: 'Emplacements :', es: 'Ranuras:' },
'panel_efficiency': { de: 'Effizienz:', en: 'Efficiency:', fr: 'Efficacité :', es: 'Eficiencia:' },
'panel_next_consumption': { de: 'Nächster Verbrauch:', en: 'Next consumption:', fr: 'Prochaine consommation :', es: 'Próximo consumo:' },
'panel_fetching_fish': { de: 'Holt Fische…', en: 'Fetching fish…', fr: 'Cherche du poisson…', es: 'Buscando pescado…' },
'panel_next_try': { de: 'Nächster Versuch:', en: 'Next try:', fr: 'Prochain essai :', es: 'Próximo intento:' },
'panel_ingredient_storage': { de: 'Zutaten-Lager', en: 'Ingredient Storage', fr: 'Stock d\'ingrédients', es: 'Almacén de ingredientes' },
'panel_recipe': { de: 'Rezept (alle {s}s)', en: 'Recipe (every {s}s)', fr: 'Recette (toutes les {s}s)', es: 'Receta (cada {s}s)' },
'panel_consumption': { de: 'Verbrauch:', en: 'Consumption:', fr: 'Consommation :', es: 'Consumo:' },
'panel_produces': { de: 'Produziert:', en: 'Produces:', fr: 'Produit :', es: 'Produce:' },
'panel_worker_sick': { de: 'Arbeiter krank:', en: 'Worker sick:', fr: 'Travailleur malade :', es: 'Trabajador enfermo:' },
'panel_wait_x3': { de: '×3 Wartezeit', en: '×3 wait time', fr: '×3 temps d\'attente', es: '×3 tiempo de espera' },
'panel_beer_storage': { de: 'Bier-Lager', en: 'Beer Storage', fr: 'Stock de bière', es: 'Almacén de cerveza' },
'panel_beer': { de: 'Bier', en: 'Beer', fr: 'Bière', es: 'Cerveza' },
'panel_residents_house': { de: 'Einwohner', en: 'Villagers', fr: 'Villageois', es: 'Aldeanos' },
'panel_next_resident': { de: 'Nächster Einwohner in:', en: 'Next villager in:', fr: 'Prochain villageois dans :', es: 'Próximo aldeano en:' },
'panel_residents_header': { de: 'Bewohner', en: 'Residents', fr: 'Habitants', es: 'Residentes' },
'panel_effect_radius': { de: 'Wirkungsradius', en: 'Effect radius', fr: 'Rayon d\'effet', es: 'Radio de efecto' },
'panel_radius_val': { de: 'Radius:', en: 'Radius:', fr: 'Rayon :', es: 'Radio:' },

'panel_in_range': { de: 'In Feuerwehr-Reichweite', en: 'In fire station range', fr: 'À portée des pompiers', es: 'En rango de bomberos' },
'panel_out_of_range': { de: 'Nicht in Feuerwehr-Reichweite', en: 'Not in fire station range', fr: 'Hors de portée des pompiers', es: 'Fuera del rango de bomberos' },
'panel_burning': { de: 'Gebäude brennt!', en: 'Building is burning!', fr: 'Le bâtiment brûle !', es: '¡El edificio está en llamas!' },
'panel_ruin_in': { de: 'Ruine in {s}s.', en: 'Ruin in {s}s.', fr: 'Ruine dans {s}s.', es: 'Ruina en {s}s.' },
'panel_spread_in': { de: 'Ausbreitung in {s}s', en: 'Spread in {s}s', fr: 'Propagation dans {s}s', es: 'Propagación en {s}s' },
'panel_spread_done': { de: 'Ausbreitung erfolgt', en: 'Spread occurred', fr: 'Propagation effectuée', es: 'Propagación realizada' },
'panel_water_to_extinguish': { de: 'Wasser zum Löschen:', en: 'Water to extinguish:', fr: 'Eau pour éteindre :', es: 'Agua para apagar:' },
'panel_missing': { de: '({s} fehlen noch)', en: '({s} still missing)', fr: '({s} manquants)', es: '({s} faltantes)' },
'panel_pig_plague': { de: 'Schweinepest aktiv!', en: 'Swine fever active!', fr: 'Peste porcine active !', es: '¡Peste porcina activa!' },
'panel_prod_stopped': { de: 'Produktion eingestellt - noch {s}s.', en: 'Production stopped - {s}s left.', fr: 'Production arrêtée - {s}s restantes.', es: 'Producción detenida - quedan {s}s.' },
'panel_rat_plague': { de: 'Rattenplage aktiv!', en: 'Rat infestation active!', fr: 'Invasion de rats active !', es: '¡Plaga de ratas activa!' },
'panel_prod_halved': { de: 'Produktion halbiert - noch {s}s.', en: 'Production halved - {s}s left.', fr: 'Production réduite de moitié - {s}s restantes.', es: 'Producción a la mitad - quedan {s}s.' },
'panel_drought': { de: 'Dürre aktiv!', en: 'Drought active!', fr: 'Sécheresse active !', es: '¡Sequía activa!' },
'panel_no_grain': { de: 'Kein Getreide - noch {s}s.', en: 'No grain - {s}s left.', fr: 'Pas de céréales - {s}s restantes.', es: 'Sin grano - quedan {s}s.' },
'panel_under_construction': { de: 'Im Bau', en: 'Under construction', fr: 'En construction', es: 'En construcción' },
'panel_save_game': { de: '💾 Spiel speichern', en: '💾 Save Game', fr: '💾 Sauvegarder le jeu', es: '💾 Guardar partida' },
'panel_jump_to_castle': { de: '🏰 Zum Schloss springen', en: '🏰 Jump to Castle', fr: '🏰 Aller au château', es: '🏰 Ir al castillo' },
'panel_stuck': { de: '🛠️ Klemmt etwas? Klicke hier', en: '🛠️ Something stuck? Click here', fr: '🛠️ Quelque chose bloque ? Cliquez ici', es: '🛠️ ¿Algo atascado? Haz clic aquí' },
'panel_autosave': { de: 'Autosave alle 5 Minuten', en: 'Autosave every 5 minutes', fr: 'Sauvegarde auto toutes les 5 minutes', es: 'Guardado automático cada 5 minutos' },
'panel_dragon_damage': { de: '🐉 Drachenschaden: {x}/{y}<br>Noch {z} Treffer bis zum Game Over!', en: '🐉 Dragon damage: {x}/{y}<br>{z} more hits until Game Over!', fr: '🐉 Dégâts du dragon : {x}/{y}<br>{z} coups avant Game Over !', es: '🐉 Daño del dragón: {x}/{y}<br>¡{z} golpes más hasta Game Over!' },

'dragon_flying': { de: 'Fliegend', en: 'Flying', fr: 'En vol', es: 'Volando' },
'dragon_attacking': { de: 'Greift an', en: 'Attacking', fr: 'Attaque', es: 'Atacando' },
'dragon_grounded': { de: 'Am Boden (wehrlos)', en: 'Grounded (defenseless)', fr: 'Au sol (sans défense)', es: 'En tierra (indefenso)' },
'dragon_hits': { de: 'Treffer:', en: 'Hits:', fr: 'Coups :', es: 'Golpes:' },
'dragon_ground_timer': { de: '⚔️ Boden-Timer', en: '⚔️ Ground Timer', fr: '⚔️ Minuteur au sol', es: '⚔️ Temporizador en tierra' },
'dragon_remaining': { de: 'Verbleibend:', en: 'Remaining:', fr: 'Restant :', es: 'Restante:' },
'dragon_warrior_req': { de: '5 Krieger müssen ihn innerhalb von 10 Sek erreichen!', en: '5 warriors must reach it within 10 sec!', fr: '5 guerriers doivent l\'atteindre en 10 sec !', es: '¡5 guerreros deben alcanzarlo en 10 seg!' },
'dragon_target': { de: '🎯 Ziel', en: '🎯 Target', fr: '🎯 Cible', es: '🎯 Objetivo' },
'dragon_building': { de: 'Gebäude:', en: 'Building:', fr: 'Bâtiment :', es: 'Edificio:' },
'dragon_position': { de: 'Position:', en: 'Position:', fr: 'Position :', es: 'Posición:' },
'dragon_castle_hits': { de: '🏰 Schloss getroffen: {x}× / 3', en: '🏰 Castle hit: {x}× / 3', fr: '🏰 Château touché : {x}× / 3', es: '🏰 Castillo golpeado: {x}× / 3' },

'ruin_destroyed': { de: '🏚️ Zerstört', en: '🏚️ Destroyed', fr: '🏚️ Détruit', es: '🏚️ Destruido' },
'ruin_building': { de: 'Gebäude:', en: 'Building:', fr: 'Bâtiment :', es: 'Edificio:' },
'ruin_desc': { de: 'Die Bauarbeiter reparieren dieses Gebäude automatisch, sobald genug Material im Lager ist.', en: 'The builders will automatically repair this building as soon as enough material is in storage.', fr: 'Les ouvriers répareront automatiquement ce bâtiment dès qu\'il y aura assez de matériel dans le stock.', es: 'Los constructores repararán automáticamente este edificio tan pronto como haya suficiente material en el almacén.' },
'ruin_material': { de: '🔧 Reparatur-Material', en: '🔧 Repair Material', fr: '🔧 Matériel de réparation', es: '🔧 Material de reparación' },
'ruin_in_storage': { de: 'im Lager)', en: 'in storage)', fr: 'dans le stock)', es: 'en el almacén)' },
'ruin_repairing': { de: '🔧 Reparatur läuft', en: '🔧 Repair in progress', fr: '🔧 Réparation en cours', es: '🔧 Reparación en curso' },
'ruin_progress': { de: 'Fortschritt:', en: 'Progress:', fr: 'Progrès :', es: 'Progreso:' },
'ruin_queue': { de: '⏳ Warteschlange', en: '⏳ Queue', fr: '⏳ File d\'attente', es: '⏳ Cola' },
'ruin_waiting_material': { de: 'Wartet auf Material', en: 'Waiting for material', fr: 'En attente de matériel', es: 'Esperando material' },

'raider_building': { de: 'Feindliches Gebäude', en: 'Hostile Building', fr: 'Bâtiment hostile', es: 'Edificio hostil' },
'raider_destroyed': { de: 'Zerstört', en: 'Destroyed', fr: 'Détruit', es: 'Destruido' },
'raider_warriors': { de: 'Krieger:', en: 'Warriors:', fr: 'Guerriers :', es: 'Guerreros:' },
'raider_dead': { de: 'Gefallen:', en: 'Fallen:', fr: 'Tombés :', es: 'Caídos:' },
'raider_next_respawn': { de: 'Nächster Respawn:', en: 'Next respawn:', fr: 'Prochain respawn :', es: 'Próximo respawn:' },
'raider_in_attack': { de: 'Im Angriff:', en: 'In attack:', fr: 'En attaque :', es: 'En ataque:' },
'raider_attack_running': { de: '⚠️ Angriff läuft', en: '⚠️ Attack in progress', fr: '⚠️ Attaque en cours', es: '⚠️ Ataque en curso' },
'raider_participants': { de: 'Teilnehmer:', en: 'Participants:', fr: 'Participants :', es: 'Participantes:' },
'raider_loot': { de: 'Beute:', en: 'Loot:', fr: 'Butin :', es: 'Botín:' },
'raider_loot_units': { de: '{s} Einheiten', en: '{s} units', fr: '{s} unités', es: '{s} unidades' },
'raider_loot_lost': { de: 'Beute verloren', en: 'Loot lost', fr: 'Butin perdu', es: 'Botín perdido' },
'raider_retreat': { de: 'Rückzug', en: 'Retreat', fr: 'Retraite', es: 'Retirada' },
'raider_march': { de: 'Marsch zum Schloss', en: 'March to castle', fr: 'Marche vers le château', es: 'Marcha al castillo' },
'raider_timer_frozen': { de: '🧊 Angriffs-Timer eingefroren', en: '🧊 Attack timer frozen', fr: '🧊 Minuteur d\'attaque gelé', es: '🧊 Temporizador de ataque congelado' },
'raider_timer_desc': { de: 'Gegenangriff läuft – Timer pausiert.', en: 'Counter-attack running – timer paused.', fr: 'Contre-attaque en cours – minuteur en pause.', es: 'Contraataque en curso – temporizador pausado.' },
'raider_next_attack': { de: 'Nächster Angriff', en: 'Next attack', fr: 'Prochaine attaque', es: 'Próximo ataque' },
'raider_in': { de: 'In:', en: 'In:', fr: 'Dans :', es: 'En:' },
'raider_counter_blocked': { de: 'GEGENANGRIFF GESPERRT', en: 'COUNTER-ATTACK LOCKED', fr: 'CONTRE-ATTAQUE BLOQUÉE', es: 'CONTRAATAQUE BLOQUEADO' },
'raider_avail_warriors': { de: 'Verfügbare Krieger:', en: 'Available warriors:', fr: 'Guerriers disponibles :', es: 'Guerreros disponibles:' },
'raider_defend_first': { de: '⚠️ Die Räuber greifen gerade an!<br>Verteidige zuerst dein Territorium.', en: '⚠️ The raiders are attacking right now!<br>Defend your territory first.', fr: '⚠️ Les pillards attaquent en ce moment !<br>Défendez d\'abord votre territoire.', es: '⚠️ ¡Los saqueadores están atacando ahora mismo!<br>Defiende tu territorio primero.' },
'raider_plan_counter': { de: 'GEGENANGRIFF PLANEN', en: 'PLAN COUNTER-ATTACK', fr: 'PLANIFIER UNE CONTRE-ATTAQUE', es: 'PLANIFICAR CONTRAATAQUE' },
'raider_selected': { de: 'Ausgewählt:', en: 'Selected:', fr: 'Sélectionnés :', es: 'Seleccionados:' },
'raider_start_counter': { de: 'Gegenangriff starten', en: 'Start counter-attack', fr: 'Lancer la contre-attaque', es: 'Iniciar contraataque' },
'raider_counter': { de: 'Gegenangriff', en: 'Counter-attack', fr: 'Contre-attaque', es: 'Contraataque' },
'raider_no_warriors': { de: 'Keine Krieger verfügbar (alle im Einsatz).', en: 'No warriors available (all deployed).', fr: 'Aucun guerrier disponible (tous déployés).', es: 'No hay guerreros disponibles (todos desplegados).' },

// ==========================================================
// STATISTICS (aus statistics.js)
// ==========================================================
'stats_time_1m': { de: '1 Minute', en: '1 Minute', fr: '1 Minute', es: '1 Minuto' },
'stats_time_5m': { de: '5 Minuten', en: '5 Minutes', fr: '5 Minutes', es: '5 Minutos' },
'stats_prod': { de: 'Prod.', en: 'Prod.', fr: 'Prod.', es: 'Prod.' },
'stats_cons': { de: 'Verbr.', en: 'Cons.', fr: 'Cons.', es: 'Cons.' },
'stats_diff': { de: 'Diff.', en: 'Diff.', fr: 'Diff.', es: 'Dif.' },
'stats_per_min': { de: 'Pro Min.', en: 'Per Min.', fr: 'Par Min.', es: 'Por Min.' },

'stats_group_defeated': { de: 'Gegner besiegt', en: 'Enemies defeated', fr: 'Ennemis vaincus', es: 'Enemigos derrotados' },
'stats_enemies_zombies': { de: 'Zombies getötet', en: 'Zombies killed', fr: 'Zombies tués', es: 'Zombis asesinados' },
'stats_enemies_raiders': { de: 'Räuber getötet', en: 'Raiders killed', fr: 'Pillards tués', es: 'Saqueadores asesinados' },
'stats_enemies_raider_castles': { de: 'Räuberlager zerstört', en: 'Raider camps destroyed', fr: 'Camps de pillards détruits', es: 'Campamentos de saqueadores destruidos' },
'stats_enemies_raider_houses': { de: 'Räuberhäuser zerstört', en: 'Raider houses destroyed', fr: 'Maisons de pillards détruites', es: 'Casas de saqueadores destruidas' },
'stats_enemies_dragons': { de: 'Drachen getötet', en: 'Dragons killed', fr: 'Dragons tués', es: 'Dragones asesinados' },
'stats_enemies_dragons_escaped': { de: 'Drachen entkommen', en: 'Dragons escaped', fr: 'Dragons échappés', es: 'Dragones escapados' },

'stats_group_health': { de: 'Gesundheit', en: 'Health', fr: 'Santé', es: 'Salud' },
'stats_health_healed': { de: 'Geheilte Patienten', en: 'Healed patients', fr: 'Patients guéris', es: 'Pacientes curados' },

'stats_group_losses': { de: 'Eigene Verluste', en: 'Own losses', fr: 'Pertes propres', es: 'Pérdidas propias' },
'stats_losses_zombified': { de: 'Zombifiziert', en: 'Zombified', fr: 'Zombifiés', es: 'Zombificados' },
'stats_losses_warriors': { de: 'Krieger gefallen', en: 'Warriors fallen', fr: 'Guerriers tombés', es: 'Guerreros caídos' },
'stats_losses_buildings': { 
  de: 'Gebäude vom Drachen angefackelt', 
  en: 'Buildings set on fire by dragon', 
  fr: 'Bâtiments incendiés par le dragon', 
  es: 'Edificios incendiados por el dragón' 
},


'stats_total_resources': { de: 'Alle Ressourcen', en: 'All resources', fr: 'Toutes les ressources', es: 'Todos los recursos' },

'stats_hof_title': { de: '🏆 HALL OF FAME', en: '🏆 HALL OF FAME', fr: '🏆 PANTHÉON', es: '🏆 SALÓN DE LA FAMA' },
'stats_hof_desc': { de: 'Die größten Krieger deines Reiches (Level 5)', en: 'The greatest warriors of your realm (Level 5)', fr: 'Les plus grands guerriers de votre royaume (Niveau 5)', es: 'Los mejores guerreros de tu reino (Nivel 5)' },
'stats_hof_empty': { de: 'Noch keine Level-5-Krieger vorhanden.', en: 'No level 5 warriors yet.', fr: 'Pas encore de guerriers de niveau 5.', es: 'Aún no hay guerreros de nivel 5.' },
'stats_hof_alive': { de: 'Lebende Legenden', en: 'Living Legends', fr: 'Légendes vivantes', es: 'Leyendas vivas' },
'stats_hof_dead': { de: 'Gefallene Helden', en: 'Fallen Heroes', fr: 'Héros tombés', es: 'Héroes caídos' },
'stats_hof_kills': { de: 'Kills', en: 'Kills', fr: 'Éliminations', es: 'Asesinatos' },

// ==========================================================
// JOB WINDOW (aus jobWindow.js)
// ==========================================================
'eco_job_priorities': { de: 'JOB-PRIORITÄTEN', en: 'JOB PRIORITIES', fr: 'PRIORITÉS DES EMPLOIS', es: 'PRIORIDADES DE TRABAJO' },
'eco_priority_top': { de: 'Oben = Höchste Priorität', en: 'Top = Highest Priority', fr: 'Haut = Priorité la plus élevée', es: 'Arriba = Máxima prioridad' },
'eco_transport_priorities': { de: 'TRANSPORT-PRIORITÄTEN', en: 'TRANSPORT PRIORITIES', fr: 'PRIORITÉS DE TRANSPORT', es: 'PRIORIDADES DE TRANSPORTE' },
'eco_transport_top': { de: 'Oben = Wird zuerst abgeholt', en: 'Top = Collected first', fr: 'Haut = Collecté en premier', es: 'Arriba = Recogido primero' },

'job_lumberjack': { de: 'Holzfäller', en: 'Lumberjack', fr: 'Bûcheron', es: 'Leñador' },
'job_forsthaus': { de: 'Förster', en: 'Forester', fr: 'Forestier', es: 'Guardabosques' },
'job_quarry': { de: 'Steinmetz', en: 'Stonemason', fr: 'Tailleur de pierre', es: 'Cantero' },
'job_fisher': { de: 'Fischer', en: 'Fisherman', fr: 'Pêcheur', es: 'Pescador' },
'job_farm': { de: 'Bauer', en: 'Farmer', fr: 'Agriculteur', es: 'Granjero' },
'job_sawmill': { de: 'Sägewerker', en: 'Sawyer', fr: 'Scieur', es: 'Aserrador' },
'job_mill': { de: 'Müller', en: 'Miller', fr: 'Meunier', es: 'Molineros' },
'job_bakery': { de: 'Bäcker', en: 'Baker', fr: 'Boulanger', es: 'Panadero' },
'job_brewery': { de: 'Brauer', en: 'Brewer', fr: 'Brasseur', es: 'Cervecero' },
'job_feedMaker': { de: 'Fütterer', en: 'Feeder', fr: 'Nourrisseur', es: 'Alimentador' },
'job_pigFarm': { de: 'Schweinebauer', en: 'Pig Farmer', fr: 'Éleveur de porcs', es: 'Porcicultor' },
'job_butcher': { de: 'Schlachter', en: 'Butcher', fr: 'Boucher', es: 'Carnicero' },
'job_well': { de: 'Brunnenwärter', en: 'Well Keeper', fr: 'Gardien de puits', es: 'Cuidador de pozo' },
'job_arrowSmith': { de: 'Pfeilschmied', en: 'Arrow Smith', fr: 'Forgeron de flèches', es: 'Herrero de flechas' },
'job_arrowTower': { de: 'Bogenschütze', en: 'Archer', fr: 'Archer', es: 'Arquero' },
'job_apotheke': { de: 'Apotheker', en: 'Apothecary', fr: 'Apothicaire', es: 'Boticario' },
'job_arztpraxis': { de: 'Arzt', en: 'Doctor', fr: 'Médecin', es: 'Médico' },
'job_fireStation': { de: 'Feuerwehrmann (Löscher)', en: 'Firefighter (Extinguish)', fr: 'Pompier (Extinction)', es: 'Bombero (Extinción)' },
'job_fireStationRefill': { de: 'Feuerwehrmann (Nachfüller)', en: 'Firefighter (Refill)', fr: 'Pompier (Remplissage)', es: 'Bombero (Relleno)' },
'job_warrior': { de: 'Krieger', en: 'Warrior', fr: 'Guerrier', es: 'Guerrero' },
'job_magier': { de: 'Magier', en: 'Mage', fr: 'Mage', es: 'Mago' },
'job_builder': { de: 'Baumeister', en: 'Builder', fr: 'Bâtisseur', es: 'Constructor' },

// ==========================================================
// INTERACTIONS & GEBÄUDENAMEN (aus interactions.js & buildingTypes.js)
// ==========================================================
'msg_castle_need_stone': { de: 'Dein Schloss braucht ein Steinvorkommen in unmittelbarer Nähe, um die Versorgung mit Baumaterial zu sichern. Suche einen anderen Platz!', en: 'Your castle needs a stone deposit nearby to secure the supply of building materials. Find another spot!', fr: 'Votre château a besoin d\'un gisement de pierre à proximité pour assurer l\'approvisionnement en matériaux de construction. Trouvez un autre endroit !', es: 'Tu castillo necesita un yacimiento de piedra cerca para asegurar el suministro de materiales de construcción. ¡Busca otro lugar!' },
'msg_build_castle_title': { de: 'Schloss bauen?', en: 'Build castle?', fr: 'Construire le château ?', es: '¿Construir castillo?' },
'msg_build_castle_desc': { de: 'Der Startpunkt deiner Siedlung.', en: 'The starting point of your settlement.', fr: 'Le point de départ de votre colonie.', es: 'El punto de partida de tu asentamiento.' },
'msg_build_confirm_title': { de: '{name} bauen?', en: 'Build {name}?', fr: 'Construire {name} ?', es: '¿Construir {name}?' },
'msg_build_cost': { de: 'Kosten: {cost}', en: 'Cost: {cost}', fr: 'Coût : {cost}', es: 'Costo: {cost}' },
'msg_build_free': { de: 'Keine Kosten', en: 'Free', fr: 'Gratuit', es: 'Gratis' },
'msg_demolish_castle': { de: 'Das Schloss kann nicht abgerissen werden!', en: 'The castle cannot be demolished!', fr: 'Le château ne peut pas être démoli !', es: '¡El castillo no se puede demoler!' },
'msg_demolish_burning': { de: 'Brennende Gebäude können nicht abgerissen werden!', en: 'Burning buildings cannot be demolished!', fr: 'Les bâtiments en feu ne peuvent pas être démolis !', es: '¡Los edificios en llamas no se pueden demoler!' },
'msg_demolish_confirm_title': { de: '{name} abreißen?', en: 'Demolish {name}?', fr: 'Démolir {name} ?', es: '¿Demoler {name}?' },
'msg_demolish_confirm_text': { de: 'Die Ressourcen werden nicht erstattet.', en: 'Resources will not be refunded.', fr: 'Les ressources ne seront pas remboursées.', es: 'Los recursos no se reembolsarán.' },

// GEBÄUDENAMEN (buildingTypes.js)
'building_castle': { de: 'Schloss', en: 'Castle', fr: 'Château', es: 'Castillo' },
'building_house': { de: 'Haus', en: 'House', fr: 'Maison', es: 'Casa' },
'building_lumberjack': { de: 'Holzfäller', en: 'Lumberjack', fr: 'Bûcheron', es: 'Leñador' },
'building_forsthaus': { de: 'Forsthaus', en: 'Forester\'s Lodge', fr: 'Maison forestière', es: 'Casa forestal' },
'building_quarry': { de: 'Steinmetz', en: 'Stonemason', fr: 'Tailleur de pierre', es: 'Cantero' },
'building_farm': { de: 'Bauer', en: 'Farm', fr: 'Ferme', es: 'Granja' },
'building_fisher': { de: 'Fischerhütte', en: 'Fisherman\'s Hut', fr: 'Cabane de pêcheur', es: 'Cabaña de pescador' },
'building_storage': { de: 'Lager', en: 'Storage', fr: 'Entrepôt', es: 'Almacén' },
'building_watchtower': { de: 'Festung', en: 'Fortress', fr: 'Forteresse', es: 'Fortaleza' },
'building_wachstube': { de: 'Wachstube', en: 'Guardhouse', fr: 'Poste de garde', es: 'Cuerpo de guardia' },
'building_wachposten': { de: 'Wachposten', en: 'Sentry', fr: 'Sentinelle', es: 'Centinela' },
'building_well': { de: 'Brunnen', en: 'Well', fr: 'Puits', es: 'Pozo' },
'building_brewery': { de: 'Bierbrauerei', en: 'Brewery', fr: 'Brasserie', es: 'Cervecería' },
'building_sawmill': { de: 'Sägewerk', en: 'Sawmill', fr: 'Scierie', es: 'Aserradero' },
'building_mill': { de: 'Mühle', en: 'Mill', fr: 'Moulin', es: 'Molino' },
'building_bakery': { de: 'Bäcker', en: 'Bakery', fr: 'Boulangerie', es: 'Panadería' },
'building_arrowSmith': { de: 'Pfeilschmiede', en: 'Fletching Workshop', fr: 'Forge de flèches', es: 'Herrería de flechas' },
'building_arrowTower': { de: 'Bogenschussanlage', en: 'Archery Tower', fr: 'Tour de tir à l\'arc', es: 'Torre de tiro con arco' },
'building_fireStation': { de: 'Feuerwehr', en: 'Fire Station', fr: 'Caserne de pompiers', es: 'Parque de bomberos' },
'building_apotheke': { de: 'Apotheke', en: 'Pharmacy', fr: 'Pharmacie', es: 'Farmacia' },
'building_arztpraxis': { de: 'Arztpraxis', en: 'Doctor\'s Office', fr: 'Cabinet médical', es: 'Consulta médica' },
'building_dragonLance': { de: 'Drachenlanze', en: 'Dragon Lance', fr: 'Lance de dragon', es: 'Lanza de dragón' },
'building_dragonWatchtower': { de: 'Drachenwachturm', en: 'Dragon Watchtower', fr: 'Tour de guet du dragon', es: 'Torre de vigilancia del dragón' },
'building_dragonFortress': { de: 'Drachenfestung', en: 'Dragon Fortress', fr: 'Forteresse du dragon', es: 'Fortaleza del dragón' },
'building_magierturm': { de: 'Magierturm', en: 'Mage Tower', fr: 'Tour du mage', es: 'Torre del mago' },
'building_feedMaker': { de: 'Futterhersteller', en: 'Feed Maker', fr: 'Fabricant de nourriture', es: 'Fabricante de pienso' },
'building_pigFarm': { de: 'Schweinewirt', en: 'Pig Farm', fr: 'Élevage de porcs', es: 'Granja de cerdos' },
'building_butcher': { de: 'Schlachter', en: 'Butcher', fr: 'Boucherie', es: 'Carnicería' },
'building_raiderCastle': { de: 'Räuberschloss', en: 'Raider Castle', fr: 'Château des pillards', es: 'Castillo de los saqueadores' },
'building_raiderWatchtower': { de: 'Räuberturm', en: 'Raider Tower', fr: 'Tour des pillards', es: 'Torre de los saqueadores' },

// ==========================================================
// HUD (aus ui/hud.js)
// ==========================================================
'hud_tutorial_banner': { 
  de: '<b>Baue zuerst die Grundversorgung:</b><br>Errichte je 1× Holzfäller, Steinmetz und Sägewerk (Baustelle reicht). Danach werden alle Gebäude freigeschaltet.', 
  en: '<b>Build the basic supply first:</b><br>Build 1x Lumberjack, Stonemason and Sawmill (construction site is enough). Then all buildings are unlocked.', 
  fr: '<b>Construisez d\'abord l\'approvisionnement de base :</b><br>Construisez 1 bûcheron, 1 tailleur de pierre et 1 scierie (le chantier suffit). Ensuite, tous les bâtiments sont débloqués.', 
  es: '<b>Construye primero el suministro básico:</b><br>Construye 1 leñador, 1 cantero y 1 aserradero (el sitio de construcción es suficiente). Luego se desbloquean todos los edificios.' 
},
'hud_total_villagers': { de: 'Gesamtanzahl', en: 'Total Amount', fr: 'Total', es: 'Total' },
'hud_sick': { de: 'Krank', en: 'Sick', fr: 'Malade', es: 'Enfermo' },
'hud_food_status': { de: 'Nahrungs-Status', en: 'Food Status', fr: 'Statut alimentaire', es: 'Estado alimenticio' },
'hud_without_food': { de: 'Ohne Nahrung', en: 'Without Food', fr: 'Sans nourriture', es: 'Sin comida' },
'hud_near_death': { de: 'Kurz vor Tod', en: 'Near Death', fr: 'Près de la mort', es: 'Cerca de la muerte' },
'hud_amount': { de: 'Anzahl', en: 'Amount', fr: 'Quantité', es: 'Cantidad' },
'hud_share': { de: 'Anteil', en: 'Share', fr: 'Part', es: 'Proporción' },
'hud_btn_activate': { de: '▶ Aktivieren', en: '▶ Activate', fr: '▶ Activer', es: '▶ Activar' },
'hud_btn_pause': { de: '⏸ Stilllegen', en: '⏸ Pause', fr: '⏸ Mettre en pause', es: '⏸ Pausar' },
'hud_active_count': { de: '{x} / {y} aktiv', en: '{x} / {y} active', fr: '{x} / {y} actifs', es: '{x} / {y} activos' },
'hud_military_title': { de: 'MILITÄRÜBERSICHT', en: 'MILITARY OVERVIEW', fr: 'VUE D\'ENSEMBLE MILITAIRE', es: 'RESUMEN MILITAR' },
'hud_military_desc': { de: 'Alle Krieger mit Level, Bier und Siegchancen', en: 'All warriors with level, beer and win chances', fr: 'Tous les guerriers avec niveau, bière et chances de victoire', es: 'Todos los guerreros con nivel, cerveza y probabilidades de victoria' },
'hud_no_post': { de: 'Ohne Posten', en: 'Without Post', fr: 'Sans poste', es: 'Sin puesto' },
'hud_no_warriors': { de: 'Keine Krieger vorhanden.', en: 'No warriors available.', fr: 'Aucun guerrier disponible.', es: 'No hay guerreros disponibles.' },
'hud_warriors_count': { de: '{x} Krieger', en: '{x} Warriors', fr: '{x} Guerriers', es: '{x} Guerreros' },
'hud_state_vdefend': { de: '⚠️ Verteidigt gerade!', en: '⚠️ Defending right now!', fr: '⚠️ Défend en ce moment !', es: '¡⚠️ Defendiendo ahora mismo!' },
'hud_state_zfighting': { de: '⚔️ Kämpft gegen Zombies!', en: '⚔️ Fighting zombies!', fr: '⚔️ Combat contre les zombies !', es: '¡⚔️ Luchando contra zombis!' },
'hud_state_vfightback': { de: '⚔️ Im Gegenangriff!', en: '⚔️ Counter-attacking!', fr: '⚔️ Contre-attaque !', es: '¡⚔️ Contraatacando!' },
'msg_no_data': { de: 'Keine Daten verfügbar.', en: 'No data available.', fr: 'Aucune donnée disponible.', es: 'No hay datos disponibles.' },
'msg_no_buildings': { de: 'Keine Gebäude vorhanden.', en: 'No buildings available.', fr: 'Aucun bâtiment disponible.', es: 'No hay edificios disponibles.' },
'msg_worker_in_combat': { de: 'Arbeiter ist im Kampf!', en: 'Worker is in combat!', fr: 'Le travailleur est au combat !', es: '¡El trabajador está en combate!' },
'msg_no_buildings_category': { de: 'Keine Gebäude in dieser Kategorie.', en: 'No buildings in this category.', fr: 'Aucun bâtiment dans cette catégorie.', es: 'No hay edificios en esta categoría.' },
'msg_free': { de: 'Kostenlos', en: 'Free', fr: 'Gratuit', es: 'Gratis' },

// Zusätzliche Job-Namen für die HUD-Liste
'job_free': { de: 'Freie Bürger', en: 'Free Citizens', fr: 'Citoyens libres', es: 'Ciudadanos libres' },
'job_worker': { de: 'Arbeiter', en: 'Worker', fr: 'Travailleur', es: 'Trabajador' },
'job_mage': { de: 'Magier', en: 'Mage', fr: 'Mage', es: 'Mago' },

// ==========================================================
// GAME SYSTEMS (aus gameSystems.js)
// ==========================================================
'sys_hunger_detail': { 
  de: 'Produktion: {prod} · Verbrauch: {cons} · Defizit: {def}', 
  en: 'Production: {prod} · Consumption: {cons} · Deficit: {def}', 
  fr: 'Production : {prod} · Consommation : {cons} · Déficit : {def}', 
  es: 'Producción: {prod} · Consumo: {cons} · Déficit: {def}' 
},

// ==========================================================
// MAIN RUNTIME (aus main-runtime.js)
// ==========================================================
'msg_warrior_lvl5_died': { de: '⚔️ {name} (Level 5) ist gefallen!', en: '⚔️ {name} (Level 5) has fallen!', fr: '⚔️ {name} (Niveau 5) est tombé !', es: '¡⚔️ {name} (Nivel 5) ha caído!' },
'msg_warrior_default_name': { de: 'Ein Krieger', en: 'A warrior', fr: 'Un guerrier', es: 'Un guerrero' },
'msg_loading_game': { de: 'Spiel laden...', en: 'Loading game...', fr: 'Chargement du jeu...', es: 'Cargando partida...' },
'msg_saving_game': { de: 'Spiel speichern...', en: 'Saving game...', fr: 'Sauvegarde du jeu...', es: 'Guardando partida...' },
'msg_no_savegame': { de: 'Kein Spielstand im internen Speicher gefunden!', en: 'No savegame found in internal storage!', fr: 'Aucune sauvegarde trouvée dans le stockage interne !', es: '¡No se encontró ninguna partida guardada en el almacenamiento interno!' },
'msg_load_error': { de: 'Fehler beim Laden: ', en: 'Error loading: ', fr: 'Erreur lors du chargement : ', es: 'Error al cargar: ' },
'msg_save_success': { de: 'Spielstand erfolgreich im internen Speicher gesichert!', en: 'Savegame successfully saved to internal storage!', fr: 'Sauvegarde enregistrée avec succès dans le stockage interne !', es: '¡Partida guardada con éxito en el almacenamiento interno!' },
'msg_save_error': { de: 'Fehler beim Speichern: ', en: 'Error saving: ', fr: 'Erreur lors de la sauvegarde : ', es: 'Error al guardar: ' },
'msg_autosave_success': { de: 'Autosave erfolgreich', en: 'Autosave successful', fr: 'Sauvegarde automatique réussie', es: 'Guardado automático exitoso' },
'msg_repaired_count': { de: 'Siedlung repariert! {count} Fehler behoben.', en: 'Settlement repaired! {count} errors fixed.', fr: 'Colonie réparée ! {count} erreurs corrigées.', es: '¡Asentamiento reparado! {count} errores corregidos.' },
'msg_no_errors': { de: 'Keine Fehler gefunden - alles in Ordnung!', en: 'No errors found - everything is fine!', fr: 'Aucune erreur trouvée - tout va bien !', es: 'No se encontraron errores, ¡todo está bien!' },
'msg_worker_in_combat': { de: 'Arbeiter ist im Kampf und kann nicht entlassen werden!', en: 'Worker is in combat and cannot be dismissed!', fr: 'Le travailleur est au combat et ne peut pas être licencié !', es: '¡El trabajador está en combate y no puede ser despedido!' },
'msg_warrior_in_combat': { de: 'Ein Krieger ist noch im Kampf! Stilllegung abgebrochen.', en: 'A warrior is still in combat! Shutdown aborted.', fr: 'Un guerrier est encore au combat ! Arrêt annulé.', es: '¡Un guerrero sigue en combate! Apagado cancelado.' },
'msg_building_paused': { de: '⏸ {name} wurde stillgelegt.', en: '⏸ {name} has been paused.', fr: '⏸ {name} a été mis en pause.', es: '⏸ {name} ha sido pausado.' },
'msg_building_resumed': { de: '▶ {name} ist wieder aktiv.', en: '▶ {name} is active again.', fr: '▶ {name} est de nouveau actif.', es: '▶ {name} está activo de nuevo.' },
'msg_raider_attacking': { de: 'Die Raeuber greifen gerade an! Verteidige zuerst dein Territorium.', en: 'The raiders are attacking right now! Defend your territory first.', fr: 'Les pillards attaquent en ce moment ! Défendez d\'abord votre territoire.', es: '¡Los saqueadores están atacando ahora mismo! Defiende tu territorio primero.' },
'msg_villager_gone': { de: 'Dieser Bewohner existiert nicht mehr.', en: 'This villager no longer exists.', fr: 'Ce villageois n\'existe plus.', es: 'Este aldeano ya no existe.' },
'msg_follow_camera': { de: '📍 Kamera folgt {name} – tippe oder wische, um zu stoppen.', en: '📍 Camera follows {name} – tap or swipe to stop.', fr: '📍 La caméra suit {name} – appuyez ou balayez pour arrêter.', es: '📍 La cámara sigue a {name}: toca o desliza para detener.' },
'msg_follow_stop': { de: 'Kamera-Follow beendet.', en: 'Camera follow stopped.', fr: 'Suivi de la caméra arrêté.', es: 'Seguimiento de cámara detenido.' },
'msg_found_herb': { de: '🌿 Ein seltener Fund! +1 Räuberkraut im Lager.', en: '🌿 A rare find! +1 raider herb in storage.', fr: '🌿 Une trouvaille rare ! +1 herbe de pillard dans le stock.', es: '🌿 ¡Un hallazgo raro! +1 hierba de saqueador en el almacén.' },
'msg_sick_1': { de: '🤒 1 Einwohner ist krank geworden!', en: '🤒 1 villager has fallen ill!', fr: '🤒 1 villageois est tombé malade !', es: '¡🤒 1 aldeano se ha enfermado!' },
'msg_sick_n': { de: '🤒 {count} Einwohner sind krank geworden!', en: '🤒 {count} villagers have fallen ill!', fr: '🤒 {count} villageois sont tombés malades !', es: '¡🤒 {count} aldeanos se han enfermado!' },
'msg_dragon_killed': { de: 'Drache (Level {level}) erledigt! +{meat} Fleisch, +{bone} Knochen', en: 'Dragon (Level {level}) defeated! +{meat} meat, +{bone} bones', fr: 'Dragon (Niveau {level}) vaincu ! +{meat} viande, +{bone} os', es: '¡Dragón (Nivel {level}) derrotado! +{meat} carne, +{bone} huesos' },
'msg_dragon_escaped': { de: 'Drache entkommen!', en: 'Dragon escaped!', fr: 'Dragon échappé !', es: '¡Dragón escapado!' },
'msg_dragon_info': { de: 'Level: <b>{level}</b><br>Stürzt nach <b>{maxHp} Pfeiltreffern</b> ab.<br>Kann von <b>{neededWarriors} Kriegern</b> besiegt werden.', en: 'Level: <b>{level}</b><br>Crashes after <b>{maxHp} arrow hits</b>.<br>Can be defeated by <b>{neededWarriors} warriors</b>.', fr: 'Niveau : <b>{level}</b><br>S\'écrase après <b>{maxHp} flèches</b>.<br>Peut être vaincu par <b>{neededWarriors} guerriers</b>.', es: 'Nivel: <b>{level}</b><br>Se estrella después de <b>{maxHp} flechas</b>.<br>Puede ser derrotado por <b>{neededWarriors} guerreros</b>.' },
'msg_gods_appeased': { de: 'Die Götter sind besänftigt. Keine Erdbeben mehr!', en: 'The gods are appeased. No more earthquakes!', fr: 'Les dieux sont apaisés. Plus de tremblements de terre !', es: 'Los dioses están aplacados. ¡No más terremotos!' },
'msg_no_resources_sacrifice': { de: 'Nicht genug Rohstoffe für eine Opfergabe!', en: 'Not enough resources for a sacrifice!', fr: 'Pas assez de ressources pour un sacrifice !', es: '¡No hay suficientes recursos para un sacrificio!' },
'msg_sacrifice_cost_title': { de: 'Folgende Opfergaben werden dargebracht:', en: 'The following offerings will be made:', fr: 'Les offrandes suivantes seront faites :', es: 'Se harán las siguientes ofrendas:' },
'msg_raider_spotted': { de: 'Raeuberlager gesichtet!', en: 'Raider camp spotted!', fr: 'Camp de pillards repéré !', es: '¡Campamento de saqueadores avistado!' },
'msg_dragon_approaching': { de: 'Ein Drache naht!', en: 'A dragon approaches!', fr: 'Un dragon approche !', es: '¡Un dragón se acerca!' },
'msg_tutorial_done': { de: 'Alle Gebaeude freigeschaltet!', en: 'All buildings unlocked!', fr: 'Tous les bâtiments sont débloqués !', es: '¡Todos los edificios desbloqueados!' },
'msg_fire_outbreak': { de: '🔥 {name} brennt!', en: '🔥 {name} is on fire!', fr: '🔥 {name} est en feu !', es: '¡🔥 {name} está en llamas!' },

// ==========================================================
// KAMPF & GAME OVER
// ==========================================================
'gameover_dragon': { 
  de: '💀 GAME OVER\n\nDer Drache hat dein Schloss zerstört.', 
  en: '💀 GAME OVER\n\nThe dragon has destroyed your castle.', 
  fr: '💀 GAME OVER\n\nLe dragon a détruit votre château.', 
  es: '💀 GAME OVER\n\nEl dragón ha destruido tu castillo.' 
},
'gameover_fire': { 
  de: '💀 GAME OVER\n\nDas Schloss ist abgebrannt.', 
  en: '💀 GAME OVER\n\nThe castle has burned down.', 
  fr: '💀 GAME OVER\n\nLe château a brûlé.', 
  es: '💀 GAME OVER\n\nEl castillo se ha quemado.' 
},
'combat_attack_running': { 
  de: '⚔️ Angriff auf Räuber ist im Gange...', 
  en: '⚔️ Attack on raiders is in progress...', 
  fr: '⚔️ L\'attaque contre les pillards est en cours...', 
  es: '⚔️ El ataque a los saqueadores está en curso...' 
},
'combat_victory': { 
  de: '🏆 Sieg! Alle Räuber im Territorium wurden besiegt.', 
  en: '🏆 Victory! All raiders in the territory have been defeated.', 
  fr: '🏆 Victoire ! Tous les pillards du territoire ont été vaincus.', 
  es: '🏆 Victoria! Todos los saqueadores del territorio han sido derrotados.' 
},

// ==========================================================
// FIRE MANAGER (aus fireManager.js)
// ==========================================================
'msg_fire_outbreak': { 
  de: '🔥 {name} brennt!', 
  en: '🔥 {name} is on fire!', 
  fr: '🔥 {name} est en feu !', 
  es: '¡🔥 {name} está en llamas!' 
},
'gameover_fire': { 
  de: '💀 GAME OVER\n\nDas Schloss ist abgebrannt.', 
  en: '💀 GAME OVER\n\nThe castle has burned down.', 
  fr: '💀 GAME OVER\n\nLe château a brûlé.', 
  es: '💀 GAME OVER\n\nEl castillo se ha quemado.' 
},

// ==========================================================
// PLAYER COMBAT (aus playerCombat.js)
// ==========================================================
'combat_attack_running': { 
  de: '⚔️ Angriff auf Räuber ist im Gange...', 
  en: '⚔️ Attack on raiders is in progress...', 
  fr: '⚔️ L\'attaque contre les pillards est en cours...', 
  es: '⚔️ El ataque a los saqueadores está en curso...' 
},
'combat_victory': { 
  de: '🏆 Sieg! Alle Räuber im Territorium wurden besiegt.', 
  en: '🏆 Victory! All raiders in the territory have been defeated.', 
  fr: '🏆 Victoire ! Tous les pillards du territoire ont été vaincus.', 
  es: '🏆 Victoria! Todos los saqueadores del territorio han sido derrotados.' 
},

// ==========================================================
// SAVEGAME (aus savegame.js)
// ==========================================================
'load_save_buildings': { de: 'Gebäude sichern...', en: 'Securing buildings...', fr: 'Sécurisation des bâtiments...', es: 'Asegurando edificios...' },
'load_save_villagers': { de: 'Einwohner sichern...', en: 'Securing villagers...', fr: 'Sécurisation des villageois...', es: 'Asegurando aldeanos...' },
'load_save_zombies': { de: 'Zombies sichern...', en: 'Securing zombies...', fr: 'Sécurisation des zombies...', es: 'Asegurando zombis...' },
'load_save_raiders': { de: 'Räuberlager sichern...', en: 'Securing raider camp...', fr: 'Sécurisation du camp de pillards...', es: 'Asegurando campamento de saqueadores...' },
'load_save_dragons': { de: 'Drachen sichern...', en: 'Securing dragons...', fr: 'Sécurisation des dragons...', es: 'Asegurando dragones...' },
'load_compress': { de: 'Daten komprimieren...', en: 'Compressing data...', fr: 'Compression des données...', es: 'Comprimiendo datos...' },
'load_done': { de: 'Fertig!', en: 'Done!', fr: 'Terminé !', es: '¡Listo!' },

'load_build_map': { de: 'Karte aufbauen...', en: 'Building map...', fr: 'Construction de la carte...', es: 'Construyendo mapa...' },
'load_build_buildings': { de: 'Gebäude aufbauen...', en: 'Building buildings...', fr: 'Construction des bâtiments...', es: 'Construyendo edificios...' },
'load_build_villagers': { de: 'Einwohner aufbauen...', en: 'Building villagers...', fr: 'Construction des villageois...', es: 'Construyendo aldeanos...' },
'load_build_combat': { de: 'Kampf-Entities aufbauen...', en: 'Building combat entities...', fr: 'Construction des entités de combat...', es: 'Construyendo entidades de combate...' },
'load_repair': { de: 'Zustände reparieren...', en: 'Repairing states...', fr: 'Réparation des états...', es: 'Reparando estados...' },
'load_assemble': { de: 'Welt zusammensetzen...', en: 'Assembling world...', fr: 'Assemblage du monde...', es: 'Ensamblando el mundo...' },

// ==========================================================
// BUILD & DEMOLISH (aus windows-build.js & popups-build.js)
// ==========================================================
'window_build_title': {
  de: 'Gebäude bauen', en: 'Build Buildings', fr: 'Construire des bâtiments', es: 'Construir edificios'
},
'window_build_tab_small': {
  de: 'Kleine Gebäude', en: 'Small Buildings', fr: 'Petits bâtiments', es: 'Edificios pequeños'
},
'window_build_tab_normal': {
  de: 'Normale Gebäude', en: 'Normal Buildings', fr: 'Bâtiments normaux', es: 'Edificios normales'
},
'window_build_tab_large': {
  de: 'Große Gebäude', en: 'Large Buildings', fr: 'Grands bâtiments', es: 'Edificios grandes'
},
'popup_build_title': {
  de: 'Gebäude bauen?', en: 'Build building?', fr: 'Construire un bâtiment ?', es: '¿Construir edificio?'
},
'popup_build_yes': {
  de: 'Bauen', en: 'Build', fr: 'Construire', es: 'Construir'
},
'popup_cancel': {
  de: 'Abbrechen', en: 'Cancel', fr: 'Annuler', es: 'Cancelar'
},
'popup_demolish_title': {
  de: 'Gebäude abreißen?', en: 'Demolish building?', fr: 'Démolir le bâtiment ?', es: '¿Demoler edificio?'
},
'popup_demolish_text': {
  de: 'Die Ressourcen werden nicht erstattet.', en: 'Resources will not be refunded.', fr: 'Les ressources ne seront pas remboursées.', es: 'Los recursos no se reembolsarán.'
},
'popup_demolish_yes': {
  de: 'Abreißen', en: 'Demolish', fr: 'Démolir', es: 'Demoler'
},
'popup_repair_title': {
  de: 'Siedlung reparieren?', en: 'Repair settlement?', fr: 'Réparer la colonie ?', es: '¿Reparar el asentamiento?'
},
'popup_repair_desc': {
  de: 'Diese Funktion überprüft alle Gebäude und Einwohner auf <b>Fehler in der Zuweisung</b>.', en: 'This function checks all buildings and villagers for <b>assignment errors</b>.', fr: 'Cette fonction vérifie tous les bâtiments et villageois pour des <b>erreurs d\'affectation</b>.', es: 'Esta función revisa todos los edificios y aldeanos en busca de <b>errores de asignación</b>.'
},
'popup_repair_what': {
  de: 'Was passiert?', en: 'What happens?', fr: 'Que se passe-t-il ?', es: '¿Qué sucede?'
},
'popup_repair_detail': {
  de: '• Alle Jobs werden neu vergeben.<br>• Einwohner, die nicht mehr existieren, werden aus Gebäuden entfernt.<br>• Krieger kehren in ihre Türme zurück.<br>• Arbeitslose Einwohner werden neu zugewiesen.<br><br><b style="color: #ff8a5c;">Deine Ressourcen und Gebäude bleiben unberührt!</b>', 
  en: '• All jobs are reassigned.<br>• Villagers that no longer exist are removed from buildings.<br>• Warriors return to their towers.<br>• Unemployed villagers are reassigned.<br><br><b style="color: #ff8a5c;">Your resources and buildings remain untouched!</b>', 
  fr: '• Tous les emplois sont réattribués.<br>• Les villageois qui n\'existent plus sont retirés des bâtiments.<br>• Les guerriers retournent dans leurs tours.<br>• Les villageois sans emploi sont réaffectés.<br><br><b style="color: #ff8a5c;">Vos ressources et bâtiments restent intacts !</b>', 
  es: '• Todos los trabajos se reasignan.<br>• Los aldeanos que ya no existen se eliminan de los edificios.<br>• Los guerreros regresan a sus torres.<br>• Los aldeanos desempleados se reasignan.<br><br><b style="color: #ff8a5c;">¡Tus recursos y edificios permanecen intactos!</b>'
},
'popup_repair_yes': {
  de: '✓ Ja, jetzt reparieren', en: '✓ Yes, repair now', fr: '✓ Oui, réparer maintenant', es: '✓ Sí, reparar ahora'
},

// ==========================================================
// GAME OVER
// ==========================================================
'gameover_zombie': { 
  de: 'Die Zombies haben dein Schloss überrannt und alle Einwohner gefressen.', 
  en: 'The zombies overran your castle and ate all the villagers.', 
  fr: 'Les zombies ont envahi votre château et dévoré tous les villageois.', 
  es: 'Los zombis invadieron tu castillo y devoraron a todos los aldeanos.' 
},
'gameover_dragon': { 
  de: 'Der Drache hat dein Schloss zerstört.', 
  en: 'The dragon has destroyed your castle.', 
  fr: 'Le dragon a détruit votre château.', 
  es: 'El dragón ha destruido tu castillo.' 
},
'gameover_fire': { 
  de: 'Das Schloss ist abgebrannt.', 
  en: 'The castle has burned down.', 
  fr: 'Le château a brûlé.', 
  es: 'El castillo se ha quemado.' 
},
'gameover_menu_btn': { 
  de: 'Zum Hauptmenü', 
  en: 'To Main Menu', 
  fr: 'Menu principal', 
  es: 'Menú principal' 
},

// ==========================================================
// ZOMBIE SIEGE WARNING (aus hud.js & zombies.js)
// ==========================================================
'siege_warning_title': { 
  de: '⚠️ ZOMBIES AM SCHLOSS!', 
  en: '⚠️ ZOMBIES AT THE CASTLE!', 
  fr: '⚠️ ZOMBIES AU CHÂTEAU !', 
  es: '¡⚠️ ZOMBIS EN EL CASTILLO!' 
},
'siege_warning_desc': { 
  de: 'Game Over in', 
  en: 'Game Over in', 
  fr: 'Game Over dans', 
  es: 'Game Over en' 
},
'siege_warning_hint': { 
  de: 'Schicke Krieger zum Schloss!', 
  en: 'Send warriors to the castle!', 
  fr: 'Envoyez des guerriers au château !', 
  es: '¡Envía guerreros al castillo!' 
},

// ==========================================================
// MISSING RESOURCES TOAST
// ==========================================================
'msg_missing_single': {
  de: '{item} fehlt',
  en: '{item} missing',
  fr: '{item} manquant',
  es: 'Falta {item}'
},
'msg_missing_plural': {
  de: 'Es fehlen: {list}',
  en: 'Missing: {list}',
  fr: 'Manque : {list}',
  es: 'Falta: {list}'
},

'pause_title': {
  de: 'Pausiert',
  en: 'Paused',
  fr: 'En pause',
  es: 'Pausado'
},
'pause_reason': {
  de: 'App war im Hintergrund',
  en: 'App was in background',
  fr: "L'application était en arrière-plan",
  es: 'La aplicación estaba en segundo plano'
},
'pause_resume': {
  de: 'Fortsetzen',
  en: 'Resume',
  fr: 'Reprendre',
  es: 'Continuar'
},
'menu_tutorial': {
  de: '📖 Tutorial',
  en: '📖 Tutorial',
  fr: '📖 Tutoriel',
  es: '📖 Tutorial'
},
'tutorial_button': {
  de: 'Tutorial',
  en: 'Tutorial',
  fr: 'Tutoriel',
  es: 'Tutorial'
},
'tutorial_title': {
  de: 'So funktioniert RedCastle',
  en: 'How RedCastle works',
  fr: 'Comment fonctionne RedCastle',
  es: 'Cómo funciona RedCastle'
},
'tutorial_goal_label': { de: 'Ziel:', en: 'Goal:', fr: 'Objectif :', es: 'Objetivo:' },
'tutorial_goal_text': {
  de: 'Überlebe so lange wie möglich. Du verlierst, wenn dein Schloss zerstört wird.',
  en: 'Survive as long as possible. You lose when your castle is destroyed.',
  fr: 'Survis le plus longtemps possible. Tu perds quand ton château est détruit.',
  es: 'Sobrevive el mayor tiempo posible. Pierdes cuando tu castillo es destruido.'
},
'tutorial_population_label': { de: 'Bevölkerung:', en: 'Population:', fr: 'Population :', es: 'Población:' },
'tutorial_population_text': {
  de: 'Alle 30 Sekunden wächst deine Bevölkerung – pro Haus und im Schloss – aber nur, wenn Brot oder Fleisch im Lager liegt.',
  en: 'Every 30 seconds your population grows – per house and in the castle – but only if bread or meat is in storage.',
  fr: 'Toutes les 30 secondes, ta population augmente – par maison et au château – mais seulement si du pain ou de la viande est stocké.',
  es: 'Cada 30 segundos crece tu población – por casa y en el castillo – pero solo si hay pan o carne en el almacén.'
},
'tutorial_food_label': { de: 'Nahrung:', en: 'Food:', fr: 'Nourriture :', es: 'Comida:' },
'tutorial_food_text': {
  de: 'Jeder Einwohner isst alle 2 Minuten. Erst Brot, dann Fleisch. Fehlt beides 4 Minuten lang, stirbt er.',
  en: 'Each villager eats every 2 minutes. First bread, then meat. If both are missing for 4 minutes, they die.',
  fr: 'Chaque habitant mange toutes les 2 minutes. D\'abord du pain, puis de la viande. Si les deux manquent pendant 4 minutes, il meurt.',
  es: 'Cada habitante come cada 2 minutos. Primero pan, luego carne. Si ambos faltan durante 4 minutos, muere.'
},
'tutorial_chains_label': { de: 'Lieferketten:', en: 'Supply chains:', fr: 'Chaînes d\'approvisionnement :', es: 'Cadenas de suministro:' },
'tutorial_chain_wood': {
  de: 'Holz → Sägewerk → <b>Holzplanken</b> (für fast alle Gebäude)',
  en: 'Wood → Sawmill → <b>Wood planks</b> (for almost all buildings)',
  fr: 'Bois → Scierie → <b>Planches</b> (pour presque tous les bâtiments)',
  es: 'Madera → Aserradero → <b>Tablas</b> (para casi todos los edificios)'
},
'tutorial_chain_bread': {
  de: 'Getreide → Mühle → Mehl; Mehl + Holz + Wasser → Bäcker → <b>Brot</b>',
  en: 'Grain → Mill → Flour; Flour + Wood + Water → Baker → <b>Bread</b>',
  fr: 'Céréales → Moulin → Farine ; Farine + Bois + Eau → Boulanger → <b>Pain</b>',
  es: 'Grano → Molino → Harina; Harina + Madera + Agua → Panadero → <b>Pan</b>'
},
'tutorial_chain_beer': {
  de: 'Getreide + Wasser → Brauerei → <b>Bier</b> (für Krieger)',
  en: 'Grain + Water → Brewery → <b>Beer</b> (for warriors)',
  fr: 'Céréales + Eau → Brasserie → <b>Bière</b> (pour les guerriers)',
  es: 'Grano + Agua → Cervecería → <b>Cerveza</b> (para guerreros)'
},
'tutorial_chain_meat': {
  de: 'Fisch + Getreide → Futter; Futter + Wasser → Schwein; Schwein → <b>Fleisch</b>',
  en: 'Fish + Grain → Feed; Feed + Water → Pig; Pig → <b>Meat</b>',
  fr: 'Poisson + Céréales → Nourriture ; Nourriture + Eau → Cochon ; Cochon → <b>Viande</b>',
  es: 'Pescado + Grano → Pienso; Pienso + Agua → Cerdo; Cerdo → <b>Carne</b>'
},
'tutorial_chain_arrows': {
  de: 'Holz + Stein → Pfeilschmiede → <b>Pfeile</b> (für Türme)',
  en: 'Wood + Stone → Arrow Smith → <b>Arrows</b> (for towers)',
  fr: 'Bois + Pierre → Forge de flèches → <b>Flèches</b> (pour les tours)',
  es: 'Madera + Piedra → Flechero → <b>Flechas</b> (para torres)'
},
'tutorial_chain_medicine': {
  de: 'Räuberkraut + Futter → Apotheke → <b>Antibiotika</b> → Arztpraxis heilt Kranke',
  en: 'Raider herb + Feed → Pharmacy → <b>Antibiotics</b> → Doctor\'s office heals the sick',
  fr: 'Herbe de pillard + Nourriture → Pharmacie → <b>Antibiotiques</b> → Cabinet médical soigne les malades',
  es: 'Hierba de saqueador + Pienso → Farmacia → <b>Antibióticos</b> → Consultorio médico cura a los enfermos'
},
'tutorial_storage_label': { de: 'Lager:', en: 'Storage:', fr: 'Stockage :', es: 'Almacén:' },
'tutorial_storage_text': {
  de: 'Lager verkürzen die Transportwege. Aber Vorsicht: Sie sind auch ein Ziel für Räuber.',
  en: 'Storages shorten transport routes. But beware: they are also a target for raiders.',
  fr: 'Les entrepôts raccourcissent les trajets. Mais attention : ils sont aussi une cible pour les pillards.',
  es: 'Los almacenes acortan las rutas de transporte. Pero cuidado: también son un objetivo para los saqueadores.'
},
'tutorial_tip_text': {
  de: 'Denke an deine Verteidigung. Zombies überrennen dein Lager, wenn du nicht genug Verteidigungsanlagen baust.',
  en: 'Think about your defense. Zombies will overrun your camp if you don\'t build enough defensive structures.',
  fr: 'Pense à ta défense. Les zombies submergeront ton camp si tu ne construis pas assez de défenses.',
  es: 'Piensa en tu defensa. Los zombis arrasarán tu campamento si no construyes suficientes defensas.'
},
'tutorial_dangers_label': { de: 'Gefahren:', en: 'Dangers:', fr: 'Dangers :', es: 'Peligros:' },
'tutorial_dangers_text': {
  de: 'Feuer (ab 15 Min – Feuerwehr bauen!), Krankheit (ab 15 Min – Apotheke + Arztpraxis), Zombies, Räuber, Drachen, Erdbeben.',
  en: 'Fire (from 15 min – build a fire station!), sickness (from 15 min – pharmacy + doctor\'s office), zombies, raiders, dragons, earthquakes.',
  fr: 'Incendie (à partir de 15 min – construis une caserne de pompiers !), maladie (à partir de 15 min – pharmacie + cabinet médical), zombies, pillards, dragons, tremblements de terre.',
  es: 'Incendio (desde 15 min – ¡construye un parque de bomberos!), enfermedad (desde 15 min – farmacia + consultorio médico), zombis, saqueadores, dragones, terremotos.'
},
'tutorial_tip_label': { de: 'Tipp:', en: 'Tip:', fr: 'Astuce :', es: 'Consejo:' },

'tutorial_raw_label': { de: 'Rohstoffe sammeln', en: 'Gathering resources', fr: 'Collecte des ressources', es: 'Recolección de recursos' },
'tutorial_raw_text': {
  de: 'Holz und Stein sind die zwei wichtigsten Baumaterialien. Beide werden für fast jedes Gebäude gebraucht – baue früh mehrere Holzfäller und Steinmetze.',
  en: 'Wood and stone are the two most important building materials. Both are needed for almost every building – build several lumberjacks and stonemasons early.',
  fr: 'Le bois et la pierre sont les deux matériaux de construction les plus importants. Les deux sont nécessaires pour presque tous les bâtiments – construis tôt plusieurs bûcherons et tailleurs de pierre.',
  es: 'La madera y la piedra son los dos materiales de construcción más importantes. Ambos se necesitan para casi todos los edificios – construye varios leñadores y canteros desde el principio.'
},
'tutorial_stone_direct': {
  de: 'direkt zum Bauen',
  en: 'directly for building',
  fr: 'directement pour construire',
  es: 'directamente para construir'
},
'tutorial_beer_label': { de: 'Bier ist wichtig!', en: 'Beer is important!', fr: 'La bière est importante !', es: '¡La cerveza es importante!' },
'tutorial_beer_text': {
  de: 'Krieger, die Bier haben, kämpfen deutlich stärker. Baue früh eine Brauerei und halte die Bier-Slots in Schloss und Wachstuben gefüllt.',
  en: 'Warriors with beer fight much stronger. Build a brewery early and keep the beer slots in the castle and guardhouses filled.',
  fr: 'Les guerriers qui ont de la bière se battent beaucoup plus fort. Construis tôt une brasserie et garde les emplacements de bière du château et des postes de garde remplis.',
  es: 'Los guerreros que tienen cerveza luchan mucho más fuerte. Construye una cervecería pronto y mantén llenos los espacios de cerveza en el castillo y los puestos de guardia.'
},
'tutorial_beer_note': { de: '(macht Krieger stärker!)', en: '(makes warriors stronger!)', fr: '(rend les guerriers plus forts !)', es: '(¡hace más fuertes a los guerreros!)' },
'tutorial_arrow_note': { de: '(für Türme)', en: '(for towers)', fr: '(pour les tours)', es: '(para torres)' },
'tutorial_med_note': { de: '(heilt Kranke)', en: '(heals the sick)', fr: '(soigne les malades)', es: '(cura a los enfermos)' },

'tutorial_forester_label': {
  de: 'Förster',
  en: 'Forester',
  fr: 'Forestier',
  es: 'Guardabosques'
},
'tutorial_forester_text': {
  de: 'Der Förster pflanzt neue Bäume. Ohne ihn gehen deinem Holzfäller irgendwann die Bäume aus.',
  en: 'The forester plants new trees. Without him, your lumberjack will eventually run out of trees.',
  fr: 'Le forestier plante de nouveaux arbres. Sans lui, ton bûcheron finira par manquer d\'arbres.',
  es: 'El guardabosques planta nuevos árboles. Sin él, tu leñador se quedará sin árboles tarde o temprano.'
},
'tutorial_dragon_text': {
  de: 'Der Drache erscheint erst, wenn du Bogenschützentürme und Pfeilschmieden gebaut hast.',
  en: 'The dragon only appears once you have built archer towers and arrow smithies.',
  fr: 'Le dragon n\'apparaît qu\'une fois que tu as construit des tours d\'archers et des forges de flèches.',
  es: 'El dragón solo aparece cuando hayas construido torres de arqueros y flecheros.'
},
'tutorial_raider_attack_text': {
  de: 'Räuberlager greifst du an, indem du auf das Hauptquartier klickst und dort den Angriffsbefehl auswählst.',
  en: 'You attack raider camps by clicking on the headquarters and selecting the attack command there.',
  fr: 'Tu attaques les camps de pillards en cliquant sur le quartier général et en y sélectionnant l\'ordre d\'attaque.',
  es: 'Atacas los campamentos de saqueadores haciendo clic en el cuartel general y seleccionando allí la orden de ataque.'
},
'tutorial_fire_label': {
  de: 'Feuerwehr',
  en: 'Fire station',
  fr: 'Caserne de pompiers',
  es: 'Parque de bomberos'
},
'tutorial_fire_text': {
  de: 'Feuer bricht nach 15 Minuten aus und breitet sich auf Nachbargebäude aus. Eine Feuerwehr löscht Brände in ihrem Radius – aber nur, wenn sie Wasser hat.',
  en: 'Fire breaks out after 15 minutes and spreads to neighboring buildings. A fire station extinguishes fires within its radius – but only if it has water.',
  fr: 'Le feu se déclare après 15 minutes et se propage aux bâtiments voisins. Une caserne de pompiers éteint les incendies dans son rayon – mais seulement si elle a de l\'eau.',
  es: 'El fuego estalla después de 15 minutos y se propaga a los edificios vecinos. Un parque de bomberos extingue incendios dentro de su radio – pero solo si tiene agua.'
},
'tutorial_fire_slots_text': {
  de: 'Die Feuerwehr hat zwei feste Plätze: einen Löscher und einen Wasser-Nachfüller. Der Nachfüller holt Wasser aus dem Lager, der Löscher bekämpft das Feuer.',
  en: 'The fire station has two fixed slots: a firefighter and a water refiller. The refiller fetches water from storage, the firefighter fights the fire.',
  fr: 'La caserne de pompiers a deux emplacements fixes : un pompier et un approvisionneur d\'eau. L\'approvisionneur prend de l\'eau dans l\'entrepôt, le pompier combat le feu.',
  es: 'El parque de bomberos tiene dos espacios fijos: un bombero y un surtidor de agua. El surtidor trae agua del almacén, el bombero combate el fuego.'
},
'tutorial_fisher_label': {
  de: 'Fischer',
  en: 'Fisher',
  fr: 'Pêcheur',
  es: 'Pescador'
},
'tutorial_fisher_text': {
  de: 'Der Fischer braucht Wasser mit Fisch in der Nähe. Ohne Fischgewässer kann er nicht arbeiten. Viele Gebäude verbrauchen Fisch als Betriebsressource. Ist kein Fisch im Lager, arbeiten diese Gebäude nur noch mit einem Viertel ihrer normalen Geschwindigkeit.',
  en: 'The fisher needs water with fish nearby. Without fishing waters, he cannot work. Many buildings consume fish as an operating resource. If there is no fish in storage, these buildings work at only a quarter of their normal speed.',
  fr: 'Le pêcheur a besoin d\'eau avec du poisson à proximité. Sans eaux poissonneuses, il ne peut pas travailler. De nombreux bâtiments consomment du poisson comme ressource de fonctionnement. S\'il n\'y a pas de poisson en stock, ces bâtiments ne fonctionnent qu\'au quart de leur vitesse normale.',
  es: 'El pescador necesita agua con peces cerca. Sin aguas con peces, no puede trabajar. Muchos edificios consumen pescado como recurso operativo. Si no hay pescado en el almacén, estos edificios funcionan solo a un cuarto de su velocidad normal.'
},
'tutorial_arrow_tower_label': {
  de: 'Bogenschützenanlage',
  en: 'Archer tower',
  fr: 'Tour d\'archers',
  es: 'Torre de arqueros'
},
'tutorial_arrow_tower_text': {
  de: 'Die Bogenschützenanlage verteidigt dein Territorium automatisch. Sie braucht Pfeile aus der Pfeilschmiede und einen Bogenschützen als Besatzung.',
  en: 'The archer tower automatically defends your territory. It needs arrows from the arrow smithy and an archer as crew.',
  fr: 'La tour d\'archers défend automatiquement ton territoire. Elle a besoin de flèches de la forge de flèches et d\'un archer comme équipage.',
  es: 'La torre de arqueros defiende tu territorio automáticamente. Necesita flechas del flechero y un arquero como tripulación.'
},
'tutorial_arrow_tower_range_text': {
  de: 'Je weiter ein Ziel entfernt ist, desto geringer die Trefferchance. Gegen Drachen trifft sie immer zu 75%.',
  en: 'The farther a target is, the lower the hit chance. Against dragons, it always hits at 75%.',
  fr: 'Plus la cible est éloignée, plus la chance de toucher est faible. Contre les dragons, elle touche toujours à 75 %.',
  es: 'Cuanto más lejos esté el objetivo, menor será la probabilidad de acierto. Contra dragones, siempre acierta al 75%.'
},
  // ==========================================================
  // HILFSFUNKTION
  // ==========================================================
  t(key) {
    const entry = this[key];
    if (!entry) {
      console.warn(`[Lang] Fehlender Schlüssel: ${key}`);
      return key;
    }
    return entry[this.current] || entry['de'] || key;
  }
};
