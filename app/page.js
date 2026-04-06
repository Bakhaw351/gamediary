"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const POPULAR_QUERIES = ["zelda","mario","elden ring","god of war","hades","cyberpunk","pokemon","sonic","final fantasy","resident evil"];
const PLATFORMS_FILTER = [
  "Tous",
  // Sony
  "PS5","PS4","PS3","PS2","PlayStation",
  // Microsoft
  "Xbox Series X","Xbox Series S","Xbox One","Xbox 360","Xbox",
  // Nintendo home
  "Nintendo Switch","Wii U","Wii","GameCube","Nintendo 64","Super Nintendo","NES",
  // Nintendo portables
  "Game Boy Advance","Game Boy Color","Game Boy","Nintendo DS","Nintendo 3DS","New Nintendo 3DS",
  // Sony portables
  "PSP","PS Vita",
  // PC / Cloud
  "PC","Steam Deck","Mac","Linux",
  // Mobile
  "iOS","Android",
  // Sega
  "Dreamcast","Sega Saturn","Sega Mega Drive","Sega Master System","Game Gear","Sega 32X",
  // Atari
  "Atari 2600","Atari 7800","Atari Jaguar","Atari Lynx",
  // Other
  "Neo Geo","TurboGrafx-16","3DO","Commodore 64","Amiga","Arcade",
];
const ALL_TAGS = ["Open World","RPG","Action","Aventure","Platformer","Roguelike","Souls-like","Simulation","Rétro","Difficile","Narratif","Multijoueur","Indie","Horreur","Sport","FPS","Puzzle"];

const STATUS_CONFIG = {
  wishlist:  { label: "Envie de jouer", icon: "🔖", color: "#a78bfa" },
  playing:   { label: "En cours",       icon: "🎮", color: "#ff6b35" },
  completed: { label: "Terminé",        icon: "🏆", color: "#ffd166" },
  dropped:   { label: "Abandonné",      icon: "💀", color: "#f87171" },
};

const RATING_LABELS = {
  1:"Nul", 2:"Mauvais", 3:"Médiocre", 4:"Décevant",
  5:"Correct", 6:"Bien", 7:"Très bien", 8:"Excellent",
  9:"Chef-d'œuvre", 10:"Parfait ✦",
};

const BADGES_DEF = [
  { id:"first",      icon:"🎮", label:{ fr:"Première note",   en:"First rating",     de:"Erste Wertung",    es:"Primera nota",    pt:"Primeira nota"    }, cond:(r,_)=>Object.keys(r).length>=1 },
  { id:"critic",     icon:"✍️", label:{ fr:"Critique",        en:"Critic",           de:"Kritiker",         es:"Crítico",         pt:"Crítico"          }, cond:(r,_)=>Object.values(r).filter(x=>x.comment?.length>10).length>=3 },
  { id:"collector",  icon:"📚", label:{ fr:"Collectionneur",  en:"Collector",        de:"Sammler",          es:"Coleccionista",   pt:"Colecionador"     }, cond:(r,_)=>Object.keys(r).length>=10 },
  { id:"explorer",   icon:"🧭", label:{ fr:"Explorateur",     en:"Explorer",         de:"Entdecker",        es:"Explorador",      pt:"Explorador"       }, cond:(_,s)=>Object.keys(s).length>=5 },
  { id:"completed",  icon:"🏆", label:{ fr:"Complétionniste", en:"Completionist",    de:"Perfektionist",    es:"Completista",     pt:"Perfeccionista"   }, cond:(_,s)=>Object.values(s).filter(x=>x==="completed").length>=3 },
  { id:"devoted",    icon:"⭐", label:{ fr:"Passionné",       en:"Devoted",          de:"Passioniert",      es:"Apasionado",      pt:"Apaixonado"       }, cond:(r,_)=>Object.values(r).some(x=>x.rating===10) },
  { id:"prolific",   icon:"🔥", label:{ fr:"Prolifique",      en:"Prolific",         de:"Produktiv",        es:"Prolífico",       pt:"Prolífico"        }, cond:(r,_)=>Object.keys(r).length>=25 },
  { id:"wishlister", icon:"🔖", label:{ fr:"Chasseur",        en:"Hunter",           de:"Jäger",            es:"Cazador",         pt:"Caçador"          }, cond:(_,s)=>Object.values(s).filter(x=>x==="wishlist").length>=5 },
];

/* ── TRANSLATIONS ─────────────────────────────────────────── */
const TRANSLATIONS = {
  fr: {
    s_wishlist:"Envie de jouer", s_playing:"En cours", s_completed:"Terminé", s_dropped:"Abandonné",
    r1:"Nul", r2:"Mauvais", r3:"Médiocre", r4:"Décevant", r5:"Correct", r6:"Bien", r7:"Très bien", r8:"Excellent", r9:"Chef-d'œuvre", r10:"Parfait ✦",
    all:"Tous", unknown:"Inconnu", videogame:"Jeu vidéo", multi:"Multi",
    home:"Accueil", explore:"Explorer", discover:"Découvrir", profile:"Profil",
    logout:"Déco", loginBtn:"Connexion",
    badge:"Votre journal JoystickLog",
    heroRate:"Notez", heroCritic:"Critiquez", heroShare:"Partagez",
    heroTagline:"De la Game Boy à la PS5, chaque jeu a marqué ta vie — fait par un gamer, pour les gamers.",
    heroDesc:"Des millions de jeux, une seule app pour cataloguer ton histoire gaming. De la Game Boy à la PS5.",
    startFree:"Commencer gratuitement →", exploreGames:"Explorer les jeux",
    igdbGames:"Jeux IGDB", free:"Gratuit", myRatings:"Mes notes", myList:"Ma liste",
    topRated:"Les mieux notés", topGames:"Top jeux", exploreAll:"Tout explorer →", loadError:"Chargement impossible.",
    scrollHint:"Défiler",
    igdbTag:"IGDB · Millions de jeux", exploreTitle:"Explorer", searchPlaceholder:"Titre, série, genre…",
    noResults:'Aucun résultat pour "{q}"', endResults:"— Fin des résultats —", searching:"Recherche…",
    discoverTag:"Recommandations", discoverTitle:"Découvrir",
    discoverDesc:"Sélectionne tes univers — on trouve ton prochain jeu parmi des millions de titres.",
    yourTastes:"Tes goûts", noDiscoResults:"Aucun résultat. Essaie d'autres préférences !", pickTastes:"Choisis tes goûts pour commencer",
    profileWaiting:"Ton profil t'attend",
    profileLoginDesc:"Connecte-toi pour suivre ta progression, noter tes jeux et construire ta collection.",
    loginArrow:"Se connecter →", player:"Joueur",
    gamesRated:"Jeux notés", inMyList:"Dans ma liste", wantToPlay:"Envie de jouer", avgRating:"Note moyenne",
    wishlistSection:"Envie de jouer", collection:"Collection",
    noRated:"Aucun jeu noté", startExplore:"Commence à explorer et noter des jeux", exploreArrow:"Explorer les jeux →",
    welcomeBack:"Bon retour 👋", joinJoystickLog:"Rejoindre JoystickLog",
    accessCollection:"Accède à ta collection", freeForever:"Gratuit, pour toujours",
    loginTab:"Connexion", signupTab:"Inscription",
    usernamePlaceholder:"Nom d'utilisateur", passwordPlaceholder:"Mot de passe (6 min)",
    loginSubmit:"Se connecter", signupSubmit:"Créer mon compte",
    fillFields:"Remplis tous les champs.", invalidEmail:"Adresse email invalide.", pwShort:"Mot de passe trop court (6 min).",
    accountCreated:"Compte créé ! Vérifie ton email.", badCreds:"Email ou mot de passe incorrect.",
    myRating:"Ma note", savedLabel:"Publiée", communityReviews:"Avis", ofCommunity:"de la communauté",
    reviewPublished:"Critique publiée", myReview:"Ma critique", rateGame:"Notez ce jeu",
    editBtn:"Modifier", choose:"Choisissez",
    reviewPlaceholder:"Partagez votre ressenti, vos points forts, ce qui vous a marqué…",
    loginToReview:"Connectez-vous pour écrire une critique",
    publishing:"Publication…", publishBtn:"Publier", loginBtn2:"Se connecter",
    readLess:"Réduire ↑", readMore:"Lire la suite ↓", synopsis:"Synopsis",
    platform:"Plateforme", releaseYear:"Année de sortie", mainGenre:"Genre principal",
    communityCount:"Avis communauté", beFirst:"Soyez le premier",
    dlcSection:"DLC & Extensions", content:"contenu", contents:"contenus",
    dlcDLC:"DLC", dlcExpansion:"Extension", dlcStandalone:"Extension standalone",
    communitySection:"Avis de la communauté", avisCount:"avis",
    noReviews:"Aucun avis pour l'instant.\nSoyez le premier à en laisser un !", member:"Membre",
    enableSound:"Activer le son", muteSound:"Couper le son",
    pseudoLabel:"Pseudo", pseudoSaved:"Pseudo sauvegardé !", pseudoPlaceholder:"Ton pseudo…",
    trendingTag:"Sorties récentes", trendingTitle:"Tendances",
    upcomingTag:"Prochainement", upcomingTitle:"Bientôt disponible",
    gemsTag:"Jeux sous-estimés", gemsTitle:"Pépites cachées",
    communityRatings:"Notes publiées", communityTracked:"Jeux suivis",
    activityTag:"Activité récente", activityTitle:"Feed communauté", noActivity:"Aucune activité pour l'instant",
    popularTag:"Le plus noté", popularTitle:"Populaire sur JoystickLog",
    badgesTag:"Tes accomplissements", badgesTitle:"Badges",
    listsTitle:"Mes listes", createList:"Nouvelle liste", listNamePlaceholder:"Nom de la liste…",
    addToList:"Ajouter à une liste", noLists:"Aucune liste créée", listCreated:"Liste créée !", addedToList:"Ajouté !",
    statsDistribution:"Distribution des notes", statsStatus:"Répartition des statuts",
    forgotPw:"Mot de passe oublié ?", forgotTitle:"Réinitialiser", forgotDesc:"Entrez votre email — on vous envoie un lien.",
    forgotSent:"Lien envoyé ! Vérifiez votre boîte mail.", backToLogin:"← Retour", sendLink:"Envoyer →",
    resetPwTitle:"Nouveau mot de passe", resetPwDesc:"Choisissez un nouveau mot de passe pour votre compte.",
    resetPwConfirm:"Confirmer le mot de passe", resetPwMismatch:"Les mots de passe ne correspondent pas.", resetPwDone:"Mot de passe mis à jour !", savePw:"Enregistrer",
    share:"Partager", shareX:"Partager sur X", copyLink:"Copier le lien", linkCopied:"Lien copié !",
    settings_title:"Paramètres", settings_save:"Enregistrer",
    settings_tab_profile:"Profil", settings_tab_account:"Compte", settings_tab_privacy:"Confidentialité", settings_tab_danger:"Danger",
    settings_username:"Nom d'utilisateur", settings_bio:"Bio", settings_bio_placeholder:"Dis-nous qui tu es en quelques mots…", settings_avatar:"Avatar",
    settings_current_email:"Email actuel :", settings_new_email:"Nouvel email", settings_change_email:"Changer l'email",
    settings_new_pw:"Nouveau mot de passe", settings_confirm_pw:"Confirmer le mot de passe", settings_change_pw:"Changer le mot de passe",
    settings_phone:"Numéro de téléphone", settings_phone_hint:"Utilisé uniquement pour la récupération de compte.",
    settings_public_profile:"Profil public", settings_public_desc:"Ton profil est visible par les autres joueurs.",
    settings_delete_title:"Supprimer mon compte", settings_delete_desc:"Cette action est irréversible. Toutes tes notes, avis et listes seront définitivement supprimés.",
    settings_delete_confirm_label:"Tape SUPPRIMER pour confirmer", settings_delete_btn:"Supprimer définitivement mon compte",
    settings_saved:"Modifications enregistrées !", settings_email_sent:"Email de confirmation envoyé !",
    settings_pw_saved:"Mot de passe mis à jour !", settings_err_username:"Le pseudo ne peut pas être vide.",
    settings_err_pw_match:"Les mots de passe ne correspondent pas.", settings_err_delete_confirm:"Tape exactement SUPPRIMER pour confirmer.",
  },
  en: {
    s_wishlist:"Want to play", s_playing:"Playing", s_completed:"Completed", s_dropped:"Dropped",
    r1:"Terrible", r2:"Bad", r3:"Poor", r4:"Disappointing", r5:"OK", r6:"Good", r7:"Very good", r8:"Excellent", r9:"Masterpiece", r10:"Perfect ✦",
    all:"All", unknown:"Unknown", videogame:"Video game", multi:"Multi",
    home:"Home", explore:"Explore", discover:"Discover", profile:"Profile",
    logout:"Logout", loginBtn:"Login",
    badge:"Your JoystickLog",
    heroRate:"Rate", heroCritic:"Review", heroShare:"Share",
    heroTagline:"From Game Boy to PS5, every game left its mark — made by a gamer, for gamers.",
    heroDesc:"Millions of games, one app to catalog your gaming history. From Game Boy to PS5.",
    startFree:"Get started for free →", exploreGames:"Explore games",
    igdbGames:"IGDB Games", free:"Free", myRatings:"My ratings", myList:"My list",
    topRated:"Top rated", topGames:"Top games", exploreAll:"Explore all →", loadError:"Failed to load.",
    scrollHint:"Scroll",
    igdbTag:"IGDB · Millions of games", exploreTitle:"Explore", searchPlaceholder:"Title, series, genre…",
    noResults:'No results for "{q}"', endResults:"— End of results —", searching:"Searching…",
    discoverTag:"Recommendations", discoverTitle:"Discover",
    discoverDesc:"Pick your favourite universes — we find your next game among millions of titles.",
    yourTastes:"Your tastes", noDiscoResults:"No results. Try different preferences!", pickTastes:"Pick your tastes to get started",
    profileWaiting:"Your profile awaits",
    profileLoginDesc:"Log in to track your progress, rate your games and build your collection.",
    loginArrow:"Log in →", player:"Player",
    gamesRated:"Games rated", inMyList:"In my list", wantToPlay:"Want to play", avgRating:"Avg rating",
    wishlistSection:"Want to play", collection:"Collection",
    noRated:"No games rated yet", startExplore:"Start exploring and rating games", exploreArrow:"Explore games →",
    welcomeBack:"Welcome back 👋", joinJoystickLog:"Join JoystickLog",
    accessCollection:"Access your collection", freeForever:"Free, forever",
    loginTab:"Login", signupTab:"Sign up",
    usernamePlaceholder:"Username", passwordPlaceholder:"Password (6 min)",
    loginSubmit:"Log in", signupSubmit:"Create my account",
    fillFields:"Please fill in all fields.", invalidEmail:"Invalid email address.", pwShort:"Password too short (6 min).",
    accountCreated:"Account created! Check your email.", badCreds:"Incorrect email or password.",
    myRating:"My rating", savedLabel:"Saved", communityReviews:"Reviews", ofCommunity:"from the community",
    reviewPublished:"Review published", myReview:"My review", rateGame:"Rate this game",
    editBtn:"Edit", choose:"Choose",
    reviewPlaceholder:"Share your thoughts, highlights, what stood out…",
    loginToReview:"Log in to write a review",
    publishing:"Publishing…", publishBtn:"Publish", loginBtn2:"Log in",
    readLess:"Show less ↑", readMore:"Read more ↓", synopsis:"Synopsis",
    platform:"Platform", releaseYear:"Release year", mainGenre:"Main genre",
    communityCount:"Community reviews", beFirst:"Be the first",
    dlcSection:"DLC & Extensions", content:"content", contents:"contents",
    dlcDLC:"DLC", dlcExpansion:"Expansion", dlcStandalone:"Standalone expansion",
    communitySection:"Community reviews", avisCount:"reviews",
    noReviews:"No reviews yet.\nBe the first to leave one!", member:"Member",
    enableSound:"Enable sound", muteSound:"Mute",
    pseudoLabel:"Username", pseudoSaved:"Username saved!", pseudoPlaceholder:"Your username…",
    trendingTag:"Recent releases", trendingTitle:"Trending",
    upcomingTag:"Coming soon", upcomingTitle:"Upcoming",
    gemsTag:"Underrated", gemsTitle:"Hidden gems",
    communityRatings:"Ratings", communityTracked:"Games tracked",
    activityTag:"Recent activity", activityTitle:"Community feed", noActivity:"No activity yet",
    popularTag:"Most rated", popularTitle:"Popular on JoystickLog",
    badgesTag:"Your achievements", badgesTitle:"Badges",
    listsTitle:"My lists", createList:"New list", listNamePlaceholder:"List name…",
    addToList:"Add to a list", noLists:"No lists yet", listCreated:"List created!", addedToList:"Added!",
    statsDistribution:"Rating distribution", statsStatus:"Status breakdown",
    forgotPw:"Forgot password?", forgotTitle:"Reset password", forgotDesc:"Enter your email — we'll send you a reset link.",
    forgotSent:"Link sent! Check your inbox.", backToLogin:"← Back", sendLink:"Send →",
    resetPwTitle:"New password", resetPwDesc:"Choose a new password for your account.",
    resetPwConfirm:"Confirm password", resetPwMismatch:"Passwords don't match.", resetPwDone:"Password updated!", savePw:"Save",
    share:"Share", shareX:"Share on X", copyLink:"Copy link", linkCopied:"Link copied!",
    settings_title:"Settings", settings_save:"Save",
    settings_tab_profile:"Profile", settings_tab_account:"Account", settings_tab_privacy:"Privacy", settings_tab_danger:"Danger",
    settings_username:"Username", settings_bio:"Bio", settings_bio_placeholder:"Tell us a bit about yourself…", settings_avatar:"Avatar",
    settings_current_email:"Current email:", settings_new_email:"New email", settings_change_email:"Change email",
    settings_new_pw:"New password", settings_confirm_pw:"Confirm password", settings_change_pw:"Change password",
    settings_phone:"Phone number", settings_phone_hint:"Only used for account recovery.",
    settings_public_profile:"Public profile", settings_public_desc:"Your profile is visible to other players.",
    settings_delete_title:"Delete my account", settings_delete_desc:"This action is irreversible. All your ratings, reviews and lists will be permanently deleted.",
    settings_delete_confirm_label:"Type DELETE to confirm", settings_delete_btn:"Permanently delete my account",
    settings_saved:"Changes saved!", settings_email_sent:"Confirmation email sent!",
    settings_pw_saved:"Password updated!", settings_err_username:"Username cannot be empty.",
    settings_err_pw_match:"Passwords don't match.", settings_err_delete_confirm:"Type exactly DELETE to confirm.",
  },
  de: {
    s_wishlist:"Möchte spielen", s_playing:"Spiele gerade", s_completed:"Abgeschlossen", s_dropped:"Abgebrochen",
    r1:"Schrecklich", r2:"Schlecht", r3:"Schwach", r4:"Enttäuschend", r5:"OK", r6:"Gut", r7:"Sehr gut", r8:"Hervorragend", r9:"Meisterwerk", r10:"Perfekt ✦",
    all:"Alle", unknown:"Unbekannt", videogame:"Videospiel", multi:"Multi",
    home:"Startseite", explore:"Entdecken", discover:"Empfehlungen", profile:"Profil",
    logout:"Abmelden", loginBtn:"Anmelden",
    badge:"Dein Gaming-Tagebuch",
    heroRate:"Bewerten", heroCritic:"Rezensieren", heroShare:"Teilen",
    heroTagline:"Von Game Boy bis PS5 — jedes Spiel hat eine Spur hinterlassen. Gemacht von einem Gamer, für Gamer.",
    heroDesc:"Millionen Spiele, eine App für deine Gaming-Geschichte. Von Game Boy bis PS5.",
    startFree:"Kostenlos starten →", exploreGames:"Spiele entdecken",
    igdbGames:"IGDB-Spiele", free:"Kostenlos", myRatings:"Meine Bewertungen", myList:"Meine Liste",
    topRated:"Am besten bewertet", topGames:"Top Spiele", exploreAll:"Alle anzeigen →", loadError:"Laden fehlgeschlagen.",
    scrollHint:"Scrollen",
    igdbTag:"IGDB · Millionen Spiele", exploreTitle:"Entdecken", searchPlaceholder:"Titel, Serie, Genre…",
    noResults:'Keine Ergebnisse für "{q}"', endResults:"— Ende der Ergebnisse —", searching:"Suche…",
    discoverTag:"Empfehlungen", discoverTitle:"Entdecken",
    discoverDesc:"Wähle deine Lieblingsuniversen — wir finden dein nächstes Spiel.",
    yourTastes:"Deine Vorlieben", noDiscoResults:"Keine Ergebnisse. Andere Vorlieben ausprobieren!", pickTastes:"Wähle deine Vorlieben",
    profileWaiting:"Dein Profil wartet", profileLoginDesc:"Melde dich an, um deinen Fortschritt zu verfolgen.",
    loginArrow:"Anmelden →", player:"Spieler",
    gamesRated:"Bewertete Spiele", inMyList:"In meiner Liste", wantToPlay:"Möchte spielen", avgRating:"Durchschnitt",
    wishlistSection:"Möchte spielen", collection:"Sammlung",
    noRated:"Noch keine Spiele bewertet", startExplore:"Entdecke und bewerte Spiele", exploreArrow:"Spiele entdecken →",
    welcomeBack:"Willkommen zurück 👋", joinJoystickLog:"JoystickLog beitreten",
    accessCollection:"Zugriff auf deine Sammlung", freeForever:"Kostenlos, für immer",
    loginTab:"Anmelden", signupTab:"Registrieren",
    usernamePlaceholder:"Benutzername", passwordPlaceholder:"Passwort (min. 6)",
    loginSubmit:"Anmelden", signupSubmit:"Konto erstellen",
    fillFields:"Bitte alle Felder ausfüllen.", invalidEmail:"Ungültige E-Mail-Adresse.", pwShort:"Passwort zu kurz (min. 6).",
    accountCreated:"Konto erstellt! E-Mail überprüfen.", badCreds:"Falsche E-Mail oder Passwort.",
    myRating:"Meine Bewertung", savedLabel:"Gespeichert", communityReviews:"Bewertungen", ofCommunity:"der Community",
    reviewPublished:"Rezension veröffentlicht", myReview:"Meine Rezension", rateGame:"Spiel bewerten",
    editBtn:"Bearbeiten", choose:"Wählen",
    reviewPlaceholder:"Teile deine Gedanken…", loginToReview:"Anmelden um zu rezensieren",
    publishing:"Veröffentliche…", publishBtn:"Veröffentlichen", loginBtn2:"Anmelden",
    readLess:"Weniger ↑", readMore:"Mehr lesen ↓", synopsis:"Synopsis",
    platform:"Plattform", releaseYear:"Erscheinungsjahr", mainGenre:"Hauptgenre",
    communityCount:"Community-Bewertungen", beFirst:"Sei der Erste",
    dlcSection:"DLC & Erweiterungen", content:"Inhalt", contents:"Inhalte",
    dlcDLC:"DLC", dlcExpansion:"Erweiterung", dlcStandalone:"Eigenständige Erweiterung",
    communitySection:"Community-Bewertungen", avisCount:"Bewertungen",
    noReviews:"Noch keine Bewertungen.\nSei der Erste!", member:"Mitglied",
    enableSound:"Ton aktivieren", muteSound:"Stummschalten",
    pseudoLabel:"Benutzername", pseudoSaved:"Benutzername gespeichert!", pseudoPlaceholder:"Dein Benutzername…",
    trendingTag:"Neue Releases", trendingTitle:"Angesagt",
    upcomingTag:"Demnächst", upcomingTitle:"Demnächst verfügbar",
    gemsTag:"Unterschätzt", gemsTitle:"Versteckte Perlen",
    communityRatings:"Bewertungen", communityTracked:"Verfolgte Spiele",
    activityTag:"Letzte Aktivität", activityTitle:"Community-Feed", noActivity:"Noch keine Aktivität",
    popularTag:"Am häufigsten bewertet", popularTitle:"Beliebt auf JoystickLog",
    badgesTag:"Deine Errungenschaften", badgesTitle:"Abzeichen",
    listsTitle:"Meine Listen", createList:"Neue Liste", listNamePlaceholder:"Listenname…",
    addToList:"Zur Liste hinzufügen", noLists:"Noch keine Listen", listCreated:"Liste erstellt!", addedToList:"Hinzugefügt!",
    statsDistribution:"Bewertungsverteilung", statsStatus:"Statusübersicht",
    settings_title:"Einstellungen", settings_save:"Speichern",
    settings_tab_profile:"Profil", settings_tab_account:"Konto", settings_tab_privacy:"Datenschutz", settings_tab_danger:"Gefahr",
    settings_username:"Benutzername", settings_bio:"Bio", settings_bio_placeholder:"Erzähl uns etwas über dich…", settings_avatar:"Avatar",
    settings_current_email:"Aktuelle E-Mail:", settings_new_email:"Neue E-Mail", settings_change_email:"E-Mail ändern",
    settings_new_pw:"Neues Passwort", settings_confirm_pw:"Passwort bestätigen", settings_change_pw:"Passwort ändern",
    settings_phone:"Telefonnummer", settings_phone_hint:"Wird nur zur Kontowiederherstellung verwendet.",
    settings_public_profile:"Öffentliches Profil", settings_public_desc:"Dein Profil ist für andere Spieler sichtbar.",
    settings_delete_title:"Konto löschen", settings_delete_desc:"Diese Aktion ist irreversibel. Alle Bewertungen, Rezensionen und Listen werden dauerhaft gelöscht.",
    settings_delete_confirm_label:"Gib LÖSCHEN ein, um zu bestätigen", settings_delete_btn:"Konto dauerhaft löschen",
    settings_saved:"Änderungen gespeichert!", settings_email_sent:"Bestätigungs-E-Mail gesendet!",
    settings_pw_saved:"Passwort aktualisiert!", settings_err_username:"Benutzername darf nicht leer sein.",
    settings_err_pw_match:"Passwörter stimmen nicht überein.", settings_err_delete_confirm:"Gib genau LÖSCHEN ein.",
  },
  es: {
    s_wishlist:"Quiero jugar", s_playing:"Jugando", s_completed:"Completado", s_dropped:"Abandonado",
    r1:"Pésimo", r2:"Malo", r3:"Mediocre", r4:"Decepcionante", r5:"Regular", r6:"Bueno", r7:"Muy bueno", r8:"Excelente", r9:"Obra maestra", r10:"Perfecto ✦",
    all:"Todos", unknown:"Desconocido", videogame:"Videojuego", multi:"Multi",
    home:"Inicio", explore:"Explorar", discover:"Descubrir", profile:"Perfil",
    logout:"Salir", loginBtn:"Iniciar sesión",
    badge:"Tu diario gamer",
    heroRate:"Valora", heroCritic:"Critica", heroShare:"Comparte",
    heroTagline:"De Game Boy a PS5, cada juego dejó su huella — hecho por un gamer, para gamers.",
    heroDesc:"Millones de juegos, una app para catalogar tu historia gamer. De Game Boy a PS5.",
    startFree:"Empezar gratis →", exploreGames:"Explorar juegos",
    igdbGames:"Juegos IGDB", free:"Gratis", myRatings:"Mis valoraciones", myList:"Mi lista",
    topRated:"Mejor valorados", topGames:"Top juegos", exploreAll:"Explorar todo →", loadError:"Error al cargar.",
    scrollHint:"Desplazar",
    igdbTag:"IGDB · Millones de juegos", exploreTitle:"Explorar", searchPlaceholder:"Título, saga, género…",
    noResults:'Sin resultados para "{q}"', endResults:"— Fin de resultados —", searching:"Buscando…",
    discoverTag:"Recomendaciones", discoverTitle:"Descubrir",
    discoverDesc:"Elige tus universos favoritos — encontramos tu próximo juego entre millones.",
    yourTastes:"Tus gustos", noDiscoResults:"Sin resultados. ¡Prueba otras preferencias!", pickTastes:"Elige tus gustos para empezar",
    profileWaiting:"Tu perfil te espera", profileLoginDesc:"Inicia sesión para seguir tu progreso.",
    loginArrow:"Iniciar sesión →", player:"Jugador",
    gamesRated:"Juegos valorados", inMyList:"En mi lista", wantToPlay:"Quiero jugar", avgRating:"Nota media",
    wishlistSection:"Quiero jugar", collection:"Colección",
    noRated:"Sin juegos valorados", startExplore:"Empieza a explorar y valorar juegos", exploreArrow:"Explorar juegos →",
    welcomeBack:"Bienvenido de vuelta 👋", joinJoystickLog:"Unirse a JoystickLog",
    accessCollection:"Accede a tu colección", freeForever:"Gratis, para siempre",
    loginTab:"Iniciar sesión", signupTab:"Registrarse",
    usernamePlaceholder:"Nombre de usuario", passwordPlaceholder:"Contraseña (mín. 6)",
    loginSubmit:"Iniciar sesión", signupSubmit:"Crear mi cuenta",
    fillFields:"Rellena todos los campos.", invalidEmail:"Dirección de email inválida.", pwShort:"Contraseña demasiado corta (mín. 6).",
    accountCreated:"¡Cuenta creada! Revisa tu email.", badCreds:"Email o contraseña incorrectos.",
    myRating:"Mi valoración", savedLabel:"Guardado", communityReviews:"Reseñas", ofCommunity:"de la comunidad",
    reviewPublished:"Reseña publicada", myReview:"Mi reseña", rateGame:"Valorar este juego",
    editBtn:"Editar", choose:"Elige",
    reviewPlaceholder:"Comparte tus impresiones…", loginToReview:"Inicia sesión para escribir una reseña",
    publishing:"Publicando…", publishBtn:"Publicar", loginBtn2:"Iniciar sesión",
    readLess:"Mostrar menos ↑", readMore:"Leer más ↓", synopsis:"Sinopsis",
    platform:"Plataforma", releaseYear:"Año de lanzamiento", mainGenre:"Género principal",
    communityCount:"Reseñas comunidad", beFirst:"Sé el primero",
    dlcSection:"DLC & Expansiones", content:"contenido", contents:"contenidos",
    dlcDLC:"DLC", dlcExpansion:"Expansión", dlcStandalone:"Expansión independiente",
    communitySection:"Reseñas de la comunidad", avisCount:"reseñas",
    noReviews:"Aún no hay reseñas.\n¡Sé el primero!", member:"Miembro",
    enableSound:"Activar sonido", muteSound:"Silenciar",
    pseudoLabel:"Usuario", pseudoSaved:"¡Usuario guardado!", pseudoPlaceholder:"Tu usuario…",
    trendingTag:"Lanzamientos recientes", trendingTitle:"Tendencias",
    upcomingTag:"Próximamente", upcomingTitle:"Próximos lanzamientos",
    gemsTag:"Infravalorados", gemsTitle:"Joyas ocultas",
    communityRatings:"Valoraciones", communityTracked:"Juegos seguidos",
    activityTag:"Actividad reciente", activityTitle:"Feed comunidad", noActivity:"Sin actividad por ahora",
    popularTag:"Más valorados", popularTitle:"Popular en JoystickLog",
    badgesTag:"Tus logros", badgesTitle:"Insignias",
    listsTitle:"Mis listas", createList:"Nueva lista", listNamePlaceholder:"Nombre de la lista…",
    addToList:"Añadir a una lista", noLists:"Sin listas", listCreated:"¡Lista creada!", addedToList:"¡Añadido!",
    statsDistribution:"Distribución de notas", statsStatus:"Desglose de estados",
    settings_title:"Ajustes", settings_save:"Guardar",
    settings_tab_profile:"Perfil", settings_tab_account:"Cuenta", settings_tab_privacy:"Privacidad", settings_tab_danger:"Peligro",
    settings_username:"Nombre de usuario", settings_bio:"Bio", settings_bio_placeholder:"Cuéntanos algo sobre ti…", settings_avatar:"Avatar",
    settings_current_email:"Email actual:", settings_new_email:"Nuevo email", settings_change_email:"Cambiar email",
    settings_new_pw:"Nueva contraseña", settings_confirm_pw:"Confirmar contraseña", settings_change_pw:"Cambiar contraseña",
    settings_phone:"Número de teléfono", settings_phone_hint:"Solo se usa para recuperación de cuenta.",
    settings_public_profile:"Perfil público", settings_public_desc:"Tu perfil es visible para otros jugadores.",
    settings_delete_title:"Eliminar mi cuenta", settings_delete_desc:"Esta acción es irreversible. Todas tus notas, reseñas y listas serán eliminadas permanentemente.",
    settings_delete_confirm_label:"Escribe ELIMINAR para confirmar", settings_delete_btn:"Eliminar permanentemente mi cuenta",
    settings_saved:"¡Cambios guardados!", settings_email_sent:"¡Email de confirmación enviado!",
    settings_pw_saved:"¡Contraseña actualizada!", settings_err_username:"El nombre de usuario no puede estar vacío.",
    settings_err_pw_match:"Las contraseñas no coinciden.", settings_err_delete_confirm:"Escribe exactamente ELIMINAR para confirmar.",
  },
  pt: {
    s_wishlist:"Quero jogar", s_playing:"Jogando", s_completed:"Completado", s_dropped:"Abandonado",
    r1:"Péssimo", r2:"Mau", r3:"Medíocre", r4:"Decepcionante", r5:"OK", r6:"Bom", r7:"Muito bom", r8:"Excelente", r9:"Obra-prima", r10:"Perfeito ✦",
    all:"Todos", unknown:"Desconhecido", videogame:"Jogo", multi:"Multi",
    home:"Início", explore:"Explorar", discover:"Descobrir", profile:"Perfil",
    logout:"Sair", loginBtn:"Entrar",
    badge:"Seu diário gamer",
    heroRate:"Avalie", heroCritic:"Critique", heroShare:"Compartilhe",
    heroTagline:"Do Game Boy ao PS5, cada jogo deixou sua marca — feito por um gamer, para gamers.",
    heroDesc:"Milhões de jogos, um app para catalogar sua história gamer. Do Game Boy ao PS5.",
    startFree:"Começar gratuitamente →", exploreGames:"Explorar jogos",
    igdbGames:"Jogos IGDB", free:"Grátis", myRatings:"Minhas notas", myList:"Minha lista",
    topRated:"Mais bem avaliados", topGames:"Top jogos", exploreAll:"Explorar tudo →", loadError:"Falha ao carregar.",
    scrollHint:"Rolar",
    igdbTag:"IGDB · Milhões de jogos", exploreTitle:"Explorar", searchPlaceholder:"Título, série, género…",
    noResults:'Sem resultados para "{q}"', endResults:"— Fim dos resultados —", searching:"Buscando…",
    discoverTag:"Recomendações", discoverTitle:"Descobrir",
    discoverDesc:"Escolha seus universos favoritos — encontramos seu próximo jogo.",
    yourTastes:"Seus gostos", noDiscoResults:"Sem resultados. Tente outras preferências!", pickTastes:"Escolha seus gostos para começar",
    profileWaiting:"Seu perfil espera por você", profileLoginDesc:"Entre para acompanhar seu progresso.",
    loginArrow:"Entrar →", player:"Jogador",
    gamesRated:"Jogos avaliados", inMyList:"Na minha lista", wantToPlay:"Quero jogar", avgRating:"Nota média",
    wishlistSection:"Quero jogar", collection:"Coleção",
    noRated:"Nenhum jogo avaliado", startExplore:"Comece a explorar e avaliar jogos", exploreArrow:"Explorar jogos →",
    welcomeBack:"Bem-vindo de volta 👋", joinJoystickLog:"Entrar no JoystickLog",
    accessCollection:"Acesse sua coleção", freeForever:"Grátis, para sempre",
    loginTab:"Entrar", signupTab:"Cadastrar",
    usernamePlaceholder:"Nome de usuário", passwordPlaceholder:"Senha (mín. 6)",
    loginSubmit:"Entrar", signupSubmit:"Criar minha conta",
    fillFields:"Preencha todos os campos.", invalidEmail:"Endereço de email inválido.", pwShort:"Senha muito curta (mín. 6).",
    accountCreated:"Conta criada! Verifique seu email.", badCreds:"Email ou senha incorretos.",
    myRating:"Minha nota", savedLabel:"Salvo", communityReviews:"Avaliações", ofCommunity:"da comunidade",
    reviewPublished:"Avaliação publicada", myReview:"Minha avaliação", rateGame:"Avaliar este jogo",
    editBtn:"Editar", choose:"Escolher",
    reviewPlaceholder:"Compartilhe suas impressões…", loginToReview:"Entre para escrever uma avaliação",
    publishing:"Publicando…", publishBtn:"Publicar", loginBtn2:"Entrar",
    readLess:"Mostrar menos ↑", readMore:"Ler mais ↓", synopsis:"Sinopse",
    platform:"Plataforma", releaseYear:"Ano de lançamento", mainGenre:"Gênero principal",
    communityCount:"Avaliações comunidade", beFirst:"Seja o primeiro",
    dlcSection:"DLC & Expansões", content:"conteúdo", contents:"conteúdos",
    dlcDLC:"DLC", dlcExpansion:"Expansão", dlcStandalone:"Expansão standalone",
    communitySection:"Avaliações da comunidade", avisCount:"avaliações",
    noReviews:"Ainda sem avaliações.\nSeja o primeiro!", member:"Membro",
    enableSound:"Ativar som", muteSound:"Silenciar",
    pseudoLabel:"Usuário", pseudoSaved:"Usuário salvo!", pseudoPlaceholder:"Seu usuário…",
    trendingTag:"Lançamentos recentes", trendingTitle:"Em alta",
    upcomingTag:"Em breve", upcomingTitle:"Próximos lançamentos",
    gemsTag:"Subestimados", gemsTitle:"Joias escondidas",
    communityRatings:"Avaliações", communityTracked:"Jogos seguidos",
    activityTag:"Atividade recente", activityTitle:"Feed comunidade", noActivity:"Sem atividade por enquanto",
    popularTag:"Mais avaliados", popularTitle:"Popular no JoystickLog",
    badgesTag:"Suas conquistas", badgesTitle:"Badges",
    listsTitle:"Minhas listas", createList:"Nova lista", listNamePlaceholder:"Nome da lista…",
    addToList:"Adicionar a uma lista", noLists:"Sem listas", listCreated:"Lista criada!", addedToList:"Adicionado!",
    statsDistribution:"Distribuição das notas", statsStatus:"Divisão por status",
    settings_title:"Configurações", settings_save:"Salvar",
    settings_tab_profile:"Perfil", settings_tab_account:"Conta", settings_tab_privacy:"Privacidade", settings_tab_danger:"Perigo",
    settings_username:"Nome de usuário", settings_bio:"Bio", settings_bio_placeholder:"Conta um pouco sobre você…", settings_avatar:"Avatar",
    settings_current_email:"Email atual:", settings_new_email:"Novo email", settings_change_email:"Alterar email",
    settings_new_pw:"Nova senha", settings_confirm_pw:"Confirmar senha", settings_change_pw:"Alterar senha",
    settings_phone:"Número de telefone", settings_phone_hint:"Usado apenas para recuperação de conta.",
    settings_public_profile:"Perfil público", settings_public_desc:"Seu perfil é visível para outros jogadores.",
    settings_delete_title:"Excluir minha conta", settings_delete_desc:"Esta ação é irreversível. Todas as suas notas, avaliações e listas serão excluídas permanentemente.",
    settings_delete_confirm_label:"Digite EXCLUIR para confirmar", settings_delete_btn:"Excluir permanentemente minha conta",
    settings_saved:"Alterações salvas!", settings_email_sent:"Email de confirmação enviado!",
    settings_pw_saved:"Senha atualizada!", settings_err_username:"O nome de usuário não pode estar vazio.",
    settings_err_pw_match:"As senhas não coincidem.", settings_err_delete_confirm:"Digite exatamente EXCLUIR para confirmar.",
  },
};

const detectLang = () => {
  if (typeof navigator === "undefined") return "fr";
  const code = (navigator.language || "fr").slice(0,2).toLowerCase();
  return TRANSLATIONS[code] ? code : "en";
};

const formatRating = r => r ? Math.min(10, Math.round(r / 10)) : null;
const formatCover  = url => {
  if (!url) return null;
  if (url.startsWith('http')) return url; // RAWG full URL
  return `https:${url.replace("t_thumb","t_cover_big_2x")}`; // IGDB relative URL
};
const formatYear   = ts  => ts  ? new Date(ts * 1000).getFullYear() : "—";
const formatGame   = g   => ({
  id:          g.id,
  title:       g.name || "Inconnu",
  platform:    g.platforms?.[0]?.name || null,
  allPlatforms:g.platforms?.map(p => p.name) || [],
  year:        formatYear(g.first_release_date),
  genre:       g.genres?.[0]?.name || null,
  cover:       formatCover(g.cover?.url),
  rating:      formatRating(g.rating),
  pressRating: g.aggregated_rating ? Math.round(g.aggregated_rating) : null,
  pressCount:  g.aggregated_rating_count || 0,
  reviews:     g.total_rating_count || 0,
  tags:        g.genres?.map(x => x.name)?.slice(0,4) || [],
  summary:     g.summary || "",
  videoId:     g.videos?.[0]?.video_id || null,
});

const timeAgo = ts => {
  if (!ts) return "";
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s/60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s/3600)} h`;
  return `il y a ${Math.floor(s/86400)} j`;
};

const rc = r => !r ? "rgba(255,255,255,.3)" : r >= 8 ? "#ffd166" : r >= 6 ? "#ff9a3c" : "#ff4d4d";

const PLATFORM_IDS = {
  "PS5":167,"PS4":48,"PS3":9,"PS2":8,"PlayStation":7,
  "Xbox Series X":169,"Xbox Series S":169,"Xbox One":49,"Xbox 360":12,"Xbox":11,
  "Nintendo Switch":130,"Nintendo Switch OLED":130,"Wii U":41,"Wii":5,"GameCube":21,
  "Nintendo 64":4,"Super Nintendo":19,"NES":18,
  "Game Boy Advance":24,"GBA SP":24,"Game Boy Color":22,"Game Boy":33,
  "Nintendo DS":20,"Nintendo 3DS":37,"New Nintendo 3DS":137,
  "PSP":38,"PS Vita":46,
  "PC":6,"Steam Deck":6,"Mac":14,"Linux":3,
  "iOS":39,"Android":34,
  "Dreamcast":23,"Sega Mega Drive":29,"Sega Saturn":32,
  "Sega Master System":35,"Sega Game Gear":35,"Sega 32X":30,
  "Atari 2600":59,"Atari 7800":60,"Atari Jaguar":62,"Atari Lynx":61,
  "Neo Geo":80,"TurboGrafx-16":86,"3DO":50,
  "Commodore 64":15,"Amiga":16,"Arcade":52,
};

/* ── CSS ─────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
  :root{
    --c-bg:#09080e;--c-nav:rgba(6,5,5,.9);--c-modal:#131020;
    --c-input:rgba(255,255,255,.03);--c-el:rgba(255,255,255,.018);
    --c-text:#ddd8d2;--c-text-2:rgba(255,255,255,.55);--c-text-3:rgba(255,255,255,.32);--c-text-4:rgba(255,255,255,.18);
    --c-border:rgba(255,255,255,.065);--c-border-s:rgba(255,255,255,.048);
    --c-card-a:#131020;--c-card-b:#0e0c18;--c-skel-a:#0f0d18;--c-skel-b:#1a1726;
  }
  [data-theme="light"]{
    --c-bg:#f4f0e8;--c-nav:rgba(247,244,238,.96);--c-modal:#ffffff;
    --c-input:rgba(0,0,0,.045);--c-el:rgba(0,0,0,.032);
    --c-text:#1c1917;--c-text-2:rgba(28,25,23,.6);--c-text-3:rgba(28,25,23,.38);--c-text-4:rgba(28,25,23,.24);
    --c-border:rgba(0,0,0,.09);--c-border-s:rgba(0,0,0,.065);
    --c-card-a:#ffffff;--c-card-b:#f8f5f0;--c-skel-a:#e8e4dc;--c-skel-b:#f0ece3;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{background:var(--c-bg);color:var(--c-text);font-family:'Plus Jakarta Sans',sans-serif;}
  ::-webkit-scrollbar{width:5px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#ff6b35,#7a2800);border-radius:99px;}
  textarea,input,button{font-family:'Space Grotesk',sans-serif;}

  @keyframes fadeUp   {from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}
  @keyframes fadeIn   {from{opacity:0;}to{opacity:1;}}
  @keyframes scaleIn  {from{opacity:0;transform:scale(.92);}to{opacity:1;transform:scale(1);}}
  @keyframes pulse    {0%,100%{opacity:.3;}50%{opacity:1;}}
  @keyframes spin     {to{transform:rotate(360deg);}}
  @keyframes shimmer  {from{background-position:-700px 0;}to{background-position:700px 0;}}
  @keyframes shine    {from{left:-80%;}to{left:130%;}}
  @keyframes float    {0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
  @keyframes bgDrift  {0%{transform:translateY(0);}33%{transform:translateY(-18px);}66%{transform:translateY(10px);}100%{transform:translateY(0);}}
  @keyframes jacketDrift{0%{transform:translateY(0) rotate(var(--rot));}50%{transform:translateY(-14px) rotate(var(--rot));}100%{transform:translateY(0) rotate(var(--rot));}}
  @keyframes marquee  {from{transform:translateX(0);}to{transform:translateX(-50%);}}
  @keyframes marqueeR {from{transform:translateX(-50%);}to{transform:translateX(0);}}
  @keyframes gradText {0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
  @keyframes bounceY  {0%,100%{transform:translateX(-50%) translateY(0);}60%{transform:translateX(-50%) translateY(8px);}}
  @keyframes popIn    {from{transform:scale(0) rotate(-12deg);opacity:0;}to{transform:scale(1) rotate(0);opacity:1;}}
  @keyframes revealLine{from{transform:scaleX(0);}to{transform:scaleX(1);}}
  .jacket-item,.cover-bg-item{will-change:transform;transform:translateZ(0);}
  @media (prefers-reduced-motion: reduce) {
    .jacket-item,.cover-bg-item,.hf1,.hf2,.hf3{animation:none!important;}
  }
  @media (max-width: 768px) {
    .jacket-item{display:none!important;}
    .cover-bg-item img{filter:none!important;}
    .cover-bg-item{animation:none!important;}
    .grad-text{animation:none!important;background-position:0% 50%;}
    .marquee-track{animation-duration:120s!important;}
    .marquee-track-r{animation-duration:140s!important;}
    .btn::after{animation:none!important;}
  }

  .fu  {animation:fadeUp .65s cubic-bezier(.22,1,.36,1) both;}
  .fu2 {animation:fadeUp .65s .12s cubic-bezier(.22,1,.36,1) both;}
  .fu3 {animation:fadeUp .65s .22s cubic-bezier(.22,1,.36,1) both;}
  .fu4 {animation:fadeUp .65s .34s cubic-bezier(.22,1,.36,1) both;}
  .fi  {animation:fadeIn .45s ease both;}
  .hf1{animation:float 5.2s ease-in-out infinite;}
  .hf2{animation:float 6.1s ease-in-out infinite .9s;}
  .hf3{animation:float 5.7s ease-in-out infinite 1.7s;}

  /* ── Cards ──────────────────────────────────────── */
  .card{
    cursor:pointer;border-radius:18px;overflow:hidden;
    background:linear-gradient(160deg,var(--c-card-a) 0%,var(--c-card-b) 100%);
    border:1px solid var(--c-border-s);
    transition:transform .42s cubic-bezier(.34,1.4,.64,1),box-shadow .42s,border-color .3s;
    position:relative;
  }
  .card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#ff6b35 30%,#ffd166 70%,transparent);opacity:0;transition:opacity .35s;z-index:4;}
  .card::after{content:'';position:absolute;inset:0;background:linear-gradient(145deg,rgba(255,255,255,.055) 0%,transparent 42%);opacity:0;transition:opacity .35s;z-index:1;pointer-events:none;border-radius:18px;}
  .card:hover{transform:translateY(-14px) scale(1.035);border-color:rgba(255,107,53,.3);box-shadow:0 48px 100px rgba(0,0,0,.82),0 0 0 1px rgba(255,107,53,.08),0 0 80px rgba(255,107,53,.07);}
  .card:hover::before,.card:hover::after{opacity:1;}
  .card img{transition:transform .7s cubic-bezier(.4,0,.2,1),filter .35s;}
  .card:hover img{transform:scale(1.09);filter:brightness(1.09) saturate(1.18);}
  .card-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse 60% 60% at 50% 50%,rgba(0,0,0,.6) 0%,transparent 70%);opacity:0;transition:opacity .3s;z-index:2;}
  .card:hover .card-play{opacity:1;}
  .play-btn{width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.07);backdrop-filter:blur(20px);border:1.5px solid rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;font-size:16px;transform:scale(.62);transition:transform .36s cubic-bezier(.34,1.4,.64,1),background .22s;}
  .card:hover .play-btn{transform:scale(1);}
  .play-btn:hover{background:rgba(255,107,53,.22)!important;border-color:rgba(255,107,53,.55)!important;}

  .row{background:var(--c-el);border:1px solid var(--c-border-s);border-radius:14px;transition:background .22s,border-color .22s,transform .22s;cursor:pointer;}
  .row:hover{background:rgba(255,107,53,.05);border-color:rgba(255,107,53,.2);transform:translateX(6px);}

  /* ── Buttons ────────────────────────────────────── */
  .btn{position:relative;overflow:hidden;background:linear-gradient(135deg,#ff6b35 0%,#ff9040 50%,#ffd166 100%);background-size:200% 100%;color:#130600;border:none;border-radius:13px;padding:12px 28px;font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:14px;cursor:pointer;transition:transform .15s,box-shadow .25s,background-position .45s;letter-spacing:.3px;box-shadow:0 4px 32px rgba(255,107,53,.35);}
  .btn::after{content:'';position:absolute;top:0;left:-80%;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.32),transparent);animation:shine 3s infinite;}
  .btn:hover{transform:translateY(-2px);box-shadow:0 16px 52px rgba(255,107,53,.54);background-position:100% 0;}
  .btn:active{transform:translateY(0);}
  .btn:disabled{opacity:.35;cursor:not-allowed;transform:none;box-shadow:none;}
  .btn:disabled::after{display:none;}
  .btn-ghost{background:transparent;border:1px solid var(--c-border);color:var(--c-text-3);cursor:pointer;border-radius:13px;padding:12px 24px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:14px;transition:all .22s;display:inline-flex;align-items:center;}
  .btn-ghost:hover{border-color:var(--c-text-2);color:var(--c-text);background:var(--c-el);}

  /* ── Inputs ─────────────────────────────────────── */
  .inp{background:var(--c-input);border:1px solid var(--c-border);border-radius:13px;color:var(--c-text);padding:13px 17px;font-size:14px;width:100%;outline:none;transition:border-color .22s,background .22s,box-shadow .22s;}
  .inp:focus{border-color:rgba(255,107,53,.55);background:var(--c-input);box-shadow:0 0 0 3px rgba(255,107,53,.1);}
  .inp::placeholder{color:var(--c-text-4);}

  /* ── Skeleton ───────────────────────────────────── */
  .skel{background:linear-gradient(90deg,var(--c-skel-a) 25%,var(--c-skel-b) 50%,var(--c-skel-a) 75%);background-size:700px 100%;animation:shimmer 2.2s infinite;border-radius:10px;}

  /* ── Nav ────────────────────────────────────────── */
  .nav-btn{background:transparent;border:none;padding:9px 20px;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;cursor:pointer;transition:color .2s;color:var(--c-text-3);letter-spacing:.2px;position:relative;}
  .nav-btn::after{content:'';position:absolute;bottom:-2px;left:50%;right:50%;height:2px;background:linear-gradient(90deg,#ff6b35,#ffd166);border-radius:2px;transition:left .28s cubic-bezier(.4,0,.2,1),right .28s cubic-bezier(.4,0,.2,1),opacity .2s;opacity:0;}
  .nav-btn:hover{color:var(--c-text-2);}
  .nav-btn.active{color:var(--c-text);}
  .nav-btn.active::after{left:20px;right:20px;opacity:1;}
  .nav-center{display:flex;}

  /* ── Chips & Tags ───────────────────────────────── */
  .chip{background:var(--c-el);border:1px solid var(--c-border);border-radius:99px;padding:5px 16px;font-size:12px;font-weight:600;font-family:'Space Grotesk',sans-serif;cursor:pointer;transition:all .22s;color:var(--c-text-3);white-space:nowrap;}
  .chip:hover{border-color:rgba(255,107,53,.4);color:#ff6b35;background:rgba(255,107,53,.07);}
  .chip.on{background:linear-gradient(135deg,rgba(255,107,53,.15),rgba(255,209,102,.08));border-color:rgba(255,107,53,.44);color:#ffd166;box-shadow:0 0 20px rgba(255,107,53,.15);}
  .tag{background:var(--c-el);border:1px solid var(--c-border);border-radius:12px;padding:10px 18px;font-size:13px;font-weight:600;font-family:'Space Grotesk',sans-serif;cursor:pointer;transition:all .22s;color:var(--c-text-3);position:relative;overflow:hidden;}
  .tag::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,107,53,.08),rgba(255,209,102,.04));opacity:0;transition:opacity .22s;}
  .tag:hover{border-color:rgba(255,107,53,.32);color:#ff9a3c;transform:translateY(-2px);}
  .tag:hover::after{opacity:1;}
  .tag.on{background:linear-gradient(135deg,rgba(255,107,53,.13),rgba(255,209,102,.07));border-color:rgba(255,107,53,.44);color:#ffd166;box-shadow:0 4px 24px rgba(255,107,53,.1),inset 0 1px 0 rgba(255,255,255,.07);}
  .tag.on::after{opacity:1;}

  .spin{width:18px;height:18px;border:2px solid rgba(255,107,53,.14);border-top-color:#ff6b35;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}
  .status-btn{border:none;border-radius:12px;padding:9px 17px;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:all .22s;display:flex;align-items:center;gap:6px;letter-spacing:.1px;}
  .status-btn:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.35);}

  /* ── Section headers ────────────────────────────── */
  .section-label{font-size:10px;color:rgba(255,107,53,.6);font-weight:700;font-family:'Space Grotesk',sans-serif;letter-spacing:3.5px;text-transform:uppercase;margin-bottom:8px;}
  .section-title{font-family:'Syne',sans-serif;font-weight:800;font-size:34px;color:var(--c-text);letter-spacing:-1.2px;line-height:1.02;}
  .sect-h{display:flex;align-items:center;gap:14px;}
  .sect-h::before{content:'';width:3px;height:26px;background:linear-gradient(to bottom,#ff6b35,#ffd166);border-radius:99px;flex-shrink:0;box-shadow:0 0 14px rgba(255,107,53,.55);}

  /* ── Horizontal scroll cards ─────────────────────── */
  .hcard{flex-shrink:0;width:152px;cursor:pointer;transition:transform .3s cubic-bezier(.34,1.4,.64,1);}
  .hcard:hover{transform:translateY(-8px);}
  .hcard-img{border-radius:14px;overflow:hidden;aspect-ratio:3/4;background:rgba(255,255,255,.04);margin-bottom:10px;box-shadow:0 10px 32px rgba(0,0,0,.55);position:relative;}
  .hcard:hover .hcard-img{box-shadow:0 22px 56px rgba(0,0,0,.75),0 0 24px rgba(255,107,53,.1);}

  /* ── Section divider ─────────────────────────────── */
  .sect-divider{height:1px;background:linear-gradient(90deg,transparent,var(--c-border) 20%,var(--c-border) 80%,transparent);margin:64px 0;}

  /* ── Gradient text ──────────────────────────────── */
  .grad-text{background:linear-gradient(135deg,#fff 0%,#ff6b35 38%,#ffd166 72%,#ffe5a0 100%);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradText 5s ease infinite;}
  @keyframes gradText{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}

  /* ── Marquee ────────────────────────────────────── */
  .marquee-wrap{overflow:hidden;white-space:nowrap;}
  .marquee-track{display:inline-flex;gap:28px;animation:marquee 80s linear infinite;will-change:transform;}
  .marquee-track-r{display:inline-flex;gap:28px;animation:marqueeR 95s linear infinite;will-change:transform;}
  .marquee-wrap:hover .marquee-track,.marquee-wrap:hover .marquee-track-r{animation-play-state:paused;}

  /* ── Cinematic game page ────────────────────────── */
  .cinematic-hero{position:relative;height:100vh;min-height:620px;overflow:hidden;display:flex;align-items:flex-end;}
  .cinematic-bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:brightness(.3) saturate(1.5);transform:scale(1.05);transition:transform 8s ease;}
  .cinematic-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(9,8,14,1) 0%,rgba(9,8,14,.82) 35%,rgba(9,8,14,.08) 72%,transparent 100%);}
  .cinematic-overlay-2{position:absolute;inset:0;background:linear-gradient(to right,rgba(9,8,14,.92) 0%,rgba(9,8,14,.12) 60%,transparent 100%);}
  .yt-bg-wrap{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
  .yt-bg-wrap iframe{position:absolute;top:50%;left:50%;width:177.78vh;height:100vh;min-width:100%;min-height:56.25vw;transform:translate(-50%,-50%);border:none;opacity:.62;}

  /* ── Stat cards ─────────────────────────────────── */
  .stat-card{background:var(--c-el);border:1px solid var(--c-border-s);border-radius:18px;padding:22px 26px;min-width:120px;transition:all .28s;position:relative;overflow:hidden;}
  .stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,107,53,.4),transparent);opacity:0;transition:opacity .28s;}
  .stat-card:hover{background:rgba(255,107,53,.04);border-color:rgba(255,107,53,.15);transform:translateY(-4px);box-shadow:0 20px 52px rgba(0,0,0,.15);}
  .stat-card:hover::before{opacity:1;}
  .stat-mini{background:var(--c-el);border:1px solid var(--c-border-s);border-radius:16px;padding:18px 22px;text-align:center;transition:all .26s;cursor:default;}
  .stat-mini:hover{background:rgba(255,107,53,.06);border-color:rgba(255,107,53,.2);transform:translateY(-3px);box-shadow:0 12px 36px rgba(0,0,0,.12);}

  /* ── Profile ────────────────────────────────────── */
  .profile-banner{position:relative;border-radius:22px;overflow:hidden;background:linear-gradient(135deg,rgba(255,107,53,.07) 0%,rgba(255,209,102,.03) 50%,rgba(167,139,250,.04) 100%);border:1px solid rgba(255,255,255,.07);padding:34px 30px 30px;}
  .profile-banner::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#ff6b35,#ffd166 55%,#a78bfa);}
  .bounce{animation:bounceY 2s ease-in-out infinite;}
  .glass-panel{background:var(--c-el);border:1px solid var(--c-border);border-radius:22px;backdrop-filter:blur(14px);}
  .gp-grid{display:grid;grid-template-columns:260px 1fr;gap:36px;align-items:start;}

  /* ── Activity feed ──────────────────────────────── */
  .activity-item{display:flex;gap:14px;padding:16px;border-radius:16px;border:1px solid var(--c-border-s);background:var(--c-el);transition:all .22s;cursor:pointer;}
  .activity-item:hover{background:rgba(255,107,53,.04);border-color:rgba(255,107,53,.15);transform:translateX(4px);}

  @media(max-width:900px){.gp-grid{grid-template-columns:1fr!important;}}

  /* ── Footer ──────────────────────────────────────────────── */
  .site-footer{border-top:1px solid var(--c-border);padding:48px 0 40px;margin-top:80px;}
  .site-footer a,.site-footer button{color:var(--c-text-3);background:none;border:none;cursor:pointer;font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:600;letter-spacing:.2px;text-decoration:none;transition:color .18s;padding:0;}
  .site-footer a:hover,.site-footer button:hover{color:var(--c-text);}
  .legal-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(12px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;}
  .legal-modal{background:var(--c-modal);border:1px solid var(--c-border);border-radius:22px;max-width:640px;width:100%;max-height:80vh;overflow-y:auto;padding:36px 38px;}
  @media(max-width:640px){.site-footer{margin-bottom:80px;}.legal-modal{padding:24px 20px;}}

  /* ── Mobile bottom nav ───────────────────────────────────── */
  .mob-nav-bar{display:none;position:fixed;bottom:0;left:0;right:0;z-index:200;background:var(--c-nav);backdrop-filter:blur(28px) saturate(180%);border-top:1px solid var(--c-border);padding-bottom:env(safe-area-inset-bottom,0);}
  .mob-nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;background:none;border:none;cursor:pointer;padding:8px 4px;color:var(--c-text-3);transition:color .18s;font-family:'Space Grotesk',sans-serif;}
  .mob-nav-btn.active{color:#ff6b35;}
  .mob-nav-btn svg{display:block;margin-bottom:1px;}
  .mob-nav-btn span{font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;}

  @media(max-width:768px){
    .hide-m{display:none!important;}
    .g2{grid-template-columns:repeat(2,1fr)!important;}
    /* ── Nav ── */
    .nav-center{display:none!important;}
    .nav-btn{padding:8px 10px!important;font-size:12px!important;}
    .mob-nav-bar{display:flex!important;}
    .top-nav{padding:0 16px!important;height:58px!important;}
    /* ── Layout ── */
    .main-container{padding:0 14px 96px!important;}
    /* ── Hero ── */
    .hero-txt{padding:48px 5% 52px!important;}
    .hero-h1{font-size:clamp(34px,9vw,60px)!important;letter-spacing:-1.5px!important;line-height:.9!important;}
    .hero-btns{flex-direction:column!important;align-items:stretch!important;gap:10px!important;}
    .hero-btns>*{width:100%!important;text-align:center!important;justify-content:center!important;}
    .hero-stats{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:8px!important;margin-top:28px!important;}
    /* ── Cards grid ── */
    .top-games-grid{grid-template-columns:1fr 1fr!important;}
    .top-games-grid>:first-child{grid-column:1/-1!important;}
    /* ── Explore ── */
    .explore-hdr{flex-direction:column!important;align-items:stretch!important;}
    .explore-search{width:100%!important;}
    .explore-search input{width:100%!important;}
    /* ── Misc ── */
    .section-title{font-size:24px!important;}
    .stat-mini{padding:12px 14px!important;}
  }
`;

/* ── RING ──────────────────────────────────────────────────── */
const Ring = ({ value, size = 52 }) => {
  const color = rc(value);
  const r = (size - 7) / 2;
  const circ = 2 * Math.PI * r;
  const fill = value ? (value / 10) * circ : 0;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={3} />
      {value && <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ filter:`drop-shadow(0 0 5px ${color}88)` }} />}
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill={value ? color : "rgba(255,255,255,.2)"}
        fontSize={size < 44 ? 10 : 12} fontWeight="800" fontFamily="'Syne',sans-serif">
        {value || "—"}
      </text>
    </svg>
  );
};

/* ── SKELETON ─────────────────────────────────────────────── */
const Skel = () => (
  <div style={{ borderRadius:14, overflow:"hidden", background:"#0c0d0f", border:"1px solid rgba(255,255,255,.05)" }}>
    <div className="skel" style={{ paddingBottom:"140%" }} />
    <div style={{ padding:"11px 13px 14px" }}>
      <div className="skel" style={{ height:13, width:"78%", marginBottom:6 }} />
      <div className="skel" style={{ height:10, width:"45%" }} />
    </div>
  </div>
);

/* ── COVER BACKGROUND ────────────────────────────────────── */
const BG_SLOTS = [
  { top:'-12%',   left:'-16%',   size:380, rot:'-10deg', dur:'32s', delay:'0s'   },
  { top:'4%',     right:'-15%',  size:340, rot:'7deg',   dur:'40s', delay:'-14s' },
  { top:'38%',    left:'-10%',   size:300, rot:'5deg',   dur:'50s', delay:'-30s' },
  { top:'33%',    right:'-10%',  size:280, rot:'-4deg',  dur:'38s', delay:'-18s' },
  { bottom:'-8%', left:'-14%',   size:340, rot:'4deg',   dur:'36s', delay:'-22s' },
  { bottom:'-10%',right:'-15%',  size:360, rot:'-6deg',  dur:'44s', delay:'-8s'  },
];
const CoverBackground = ({ covers }) => {
  if (!covers?.length) return null;
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden', contain:'strict' }}>
      {BG_SLOTS.map((p, i) => {
        const src = covers[i % covers.length];
        if (!src) return null;
        const s = { position:'absolute', width:p.size, opacity:0.12, animation:`bgDrift ${p.dur} ease-in-out infinite ${p.delay}`, overflow:'hidden', borderRadius:24 };
        if (p.top)    s.top    = p.top;
        if (p.bottom) s.bottom = p.bottom;
        if (p.left)   s.left   = p.left;
        if (p.right)  s.right  = p.right;
        return (
          <div key={i} className="cover-bg-item" style={s}>
            <img src={src} alt="" style={{ width:'100%', display:'block', borderRadius:24, transform:`rotate(${p.rot})`, filter:'blur(20px)' }} />
          </div>
        );
      })}
    </div>
  );
};

/* ── JACKET WALL — visible covers floating in bg ─────────── */
const JACKET_SLOTS = [
  { top:'6%',    left:'1%',    w:78,  rot:'-9deg',  dur:'58s', delay:'0s'    },
  { top:'38%',   left:'0.5%',  w:70,  rot:'5deg',   dur:'50s', delay:'-22s'  },
  { top:'70%',   left:'1.5%',  w:74,  rot:'-5deg',  dur:'63s', delay:'-37s'  },
  { top:'5%',    right:'1%',   w:76,  rot:'7deg',   dur:'52s', delay:'-10s'  },
  { top:'40%',   right:'0.5%', w:72,  rot:'-6deg',  dur:'60s', delay:'-30s'  },
  { top:'72%',   right:'1.5%', w:68,  rot:'4deg',   dur:'47s', delay:'-42s'  },
];
const JacketWall = ({ covers }) => {
  if (!covers?.length) return null;
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden', contain:'strict' }}>
      {JACKET_SLOTS.map((p, i) => {
        const src = covers[i % covers.length];
        if (!src) return null;
        const s = {
          position:'absolute', width:p.w,
          opacity:0.14,
          '--rot': p.rot,
          animation:`jacketDrift ${p.dur} ease-in-out infinite ${p.delay}`,
          transform:`rotate(${p.rot})`,
        };
        if (p.top)    s.top    = p.top;
        if (p.bottom) s.bottom = p.bottom;
        if (p.left)   s.left   = p.left;
        if (p.right)  s.right  = p.right;
        return (
          <div key={i} className="jacket-item" style={s}>
            <img src={src} alt="" style={{ width:'100%', display:'block', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,.6)' }} />
          </div>
        );
      })}
    </div>
  );
};

/* ── HORIZONTAL SCROLL SECTION ───────────────────────────── */
const HScrollSection = ({ games, onClick, accent = "#ff6b35", showDate = false }) => {
  const scrollRef = useRef(null);
  const scroll = dir => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 480, behavior: "smooth" });
  };
  return (
    <div style={{ position:"relative" }}>
      {/* Arrow left */}
      <button onClick={() => scroll(-1)} style={{ position:"absolute", left:-18, top:"38%", transform:"translateY(-50%)", zIndex:10, width:34, height:34, borderRadius:"50%", background:"rgba(15,12,24,.92)", border:"1px solid rgba(255,255,255,.12)", color:"rgba(255,255,255,.7)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 18px rgba(0,0,0,.6)", transition:"all .18s" }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,107,53,.5)";e.currentTarget.style.color="#ff6b35";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.12)";e.currentTarget.style.color="rgba(255,255,255,.7)";}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      {/* Scroll track */}
      <div ref={scrollRef} style={{ display:"flex", gap:14, overflowX:"auto", paddingBottom:12, scrollbarWidth:"none", msOverflowStyle:"none" }}>
        {games.map(g => (
          <div key={g.id} className="hcard" onClick={()=>onClick(g)}
            onMouseDown={ev=>{ if(ev.button===1){ ev.preventDefault(); window.open(`${window.location.origin}?game=${g.id}`,'_blank'); } }}>
            <div className="hcard-img">
              {g.cover
                ? <img src={g.cover} alt={g.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>🎮</div>
              }
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,.65) 0%,transparent 55%)", pointerEvents:"none" }} />
              {!showDate && g.rating && (
                <div style={{ position:"absolute", bottom:8, left:8, background:"rgba(0,0,0,.6)", backdropFilter:"blur(8px)", borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:800, color:accent, fontFamily:"'Syne',sans-serif", border:`1px solid ${accent}44`, display:"flex", alignItems:"center", gap:4 }}>
                  <span>★ {g.rating}</span>
                  <span style={{ fontSize:8, color:"rgba(255,255,255,.35)", fontWeight:700, letterSpacing:.5 }}>IGDB</span>
                </div>
              )}
              {showDate && g.year && (
                <div style={{ position:"absolute", bottom:8, left:8, background:"rgba(0,0,0,.6)", backdropFilter:"blur(8px)", borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:700, color:"rgba(255,255,255,.6)", fontFamily:"'Space Grotesk',sans-serif" }}>
                  {g.year}
                </div>
              )}
            </div>
            <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.82)", fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.35 }}>
              {g.title.length>22?g.title.slice(0,22)+"…":g.title}
            </div>
            {g.genre && <div style={{ fontSize:10, color:"rgba(255,255,255,.26)", fontFamily:"'Plus Jakarta Sans',sans-serif", marginTop:3 }}>{g.genre}</div>}
          </div>
        ))}
      </div>
      {/* Arrow right */}
      <button onClick={() => scroll(1)} style={{ position:"absolute", right:-18, top:"38%", transform:"translateY(-50%)", zIndex:10, width:34, height:34, borderRadius:"50%", background:"rgba(15,12,24,.92)", border:"1px solid rgba(255,255,255,.12)", color:"rgba(255,255,255,.7)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 18px rgba(0,0,0,.6)", transition:"all .18s" }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,107,53,.5)";e.currentTarget.style.color="#ff6b35";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.12)";e.currentTarget.style.color="rgba(255,255,255,.7)";}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  );
};

/* ── GAME CARD ────────────────────────────────────────────── */
const GameCard = ({ game, onClick, rank, userRating }) => {
  const [e, setE] = useState(false);
  return (
    <div className="card" onClick={() => onClick(game)}
      onMouseDown={ev => { if (ev.button === 1) { ev.preventDefault(); window.open(`${window.location.origin}?game=${game.id}`, '_blank'); } }}>
      <div style={{ position:"relative", paddingBottom:"148%", background:"#09090d" }}>
        {game.cover && !e
          ? <img src={game.cover} onError={() => setE(true)} alt={game.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, background:"linear-gradient(135deg,#0d0e12,#111318)" }}>
              <span style={{ fontSize:32 }}>🎮</span>
              <span style={{ color:"rgba(255,255,255,.15)", fontSize:10, textAlign:"center", padding:"0 10px", fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.3 }}>{game.title}</span>
            </div>
        }

        {/* Rich bottom gradient */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(5,6,10,1) 0%,rgba(5,6,10,.7) 32%,rgba(5,6,10,.12) 58%,transparent 82%)" }} />

        {/* Hover play */}
        <div className="card-play">
          <div className="play-btn">{game.videoId ? "▶" : "+"}</div>
        </div>

        {/* Top-left badge */}
        {rank
          ? <div style={{ position:"absolute", top:10, left:10, background:"linear-gradient(135deg,#ff6b35,#ffd166)", color:"#030401", borderRadius:7, padding:"2px 9px", fontSize:10, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif", boxShadow:"0 2px 12px rgba(255,107,53,.4)" }}>#{rank}</div>
          : game.videoId && <div style={{ position:"absolute", top:10, left:10, background:"rgba(0,0,0,.52)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,.1)", borderRadius:6, padding:"2px 8px", fontSize:9, color:"rgba(255,255,255,.6)", fontFamily:"'Space Grotesk',sans-serif", display:"flex", alignItems:"center", gap:3, letterSpacing:.4 }}>▶ trailer</div>
        }
        {userRating && <div style={{ position:"absolute", top:8, right:8 }}><Ring value={userRating} size={38} /></div>}

        {/* Info overlaid at bottom — poster style */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"0 11px 13px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}>
            <span style={{ background:"rgba(255,255,255,.09)", borderRadius:5, padding:"1px 7px", fontSize:9, fontWeight:700, color:"rgba(255,255,255,.38)", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:.3 }}>
              {game.platform ? (game.platform.length > 11 ? game.platform.slice(0,11)+"…" : game.platform) : "—"}
            </span>
            <span style={{ fontSize:9, color:"rgba(255,255,255,.25)", fontFamily:"'DM Sans',sans-serif" }}>{game.year}</span>
          </div>
          <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.92)", fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.28, letterSpacing:"-.1px" }}>
            {(game.title||"").length > 24 ? (game.title||"").slice(0,24)+"…" : (game.title||"")}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── FEATURED CARD ────────────────────────────────────────── */
const FeaturedCard = ({ game, onClick }) => {
  const [e, setE] = useState(false);
  return (
    <div className="card" onClick={() => onClick(game)} style={{ borderRadius:20 }}
      onMouseDown={ev => { if (ev.button === 1) { ev.preventDefault(); window.open(`${window.location.origin}?game=${game.id}`, '_blank'); } }}>
      <div style={{ position:"relative", height:400 }}>
        {game.cover && !e
          ? <img src={game.cover} onError={() => setE(true)} alt={game.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ height:"100%", background:"#111318", display:"flex", alignItems:"center", justifyContent:"center", fontSize:56 }}>🎮</div>}

        {/* Layered gradients for depth */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(5,6,10,1) 0%,rgba(5,6,10,.65) 38%,rgba(5,6,10,.08) 68%,transparent 100%)" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right,rgba(5,6,10,.38) 0%,transparent 55%)" }} />

        <div className="card-play">
          <div className="play-btn" style={{ width:60, height:60, fontSize:22 }}>{game.videoId ? "▶" : "+"}</div>
        </div>

        {/* Badges */}
        <div style={{ position:"absolute", top:14, left:14 }}>
          <span style={{ background:"linear-gradient(135deg,#ff6b35,#ffd166)", color:"#030401", borderRadius:9, padding:"4px 13px", fontSize:11, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif", boxShadow:"0 4px 18px rgba(255,107,53,.45)", letterSpacing:"-.1px" }}>#1</span>
        </div>

        {/* Content overlay */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"0 20px 24px" }}>
          {game.tags?.length > 0 && (
            <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
              {game.tags.slice(0,2).map(t => (
                <span key={t} style={{ background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.09)", color:"rgba(255,255,255,.45)", borderRadius:6, padding:"2px 9px", fontSize:10, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, letterSpacing:.2 }}>{t}</span>
              ))}
            </div>
          )}
          <div style={{ fontSize:11, color:"rgba(255,255,255,.32)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:500, marginBottom:7, letterSpacing:.2 }}>
            {game.platform?.split("(")[0].trim()} · {game.year}
          </div>
          <div style={{ fontSize:22, fontWeight:700, color:"#fff", fontFamily:"'Syne',sans-serif", lineHeight:1.1, letterSpacing:"-.4px" }}>{game.title}</div>
        </div>
      </div>
    </div>
  );
};

/* ── AUTH MODAL ───────────────────────────────────────────── */
const AuthModal = ({ onClose, onSuccess, t }) => {
  const [mode, setMode]         = useState("login");
  const [email, setEmail]       = useState("");
  const [pw, setPw]             = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const [ok, setOk]             = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef(null);
  const turnstileIdRef = useRef(null);

  useEffect(() => {
    if (mode !== "signup" || forgotMode || typeof window === "undefined") return;
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!sitekey) return;
    const render = () => {
      if (!window.turnstile || !turnstileRef.current) return;
      try {
        if (turnstileIdRef.current) window.turnstile.remove(turnstileIdRef.current);
        turnstileIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey,
          theme: "dark",
          callback: token => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(""),
          "error-callback": () => setCaptchaToken(""),
        });
      } catch(e) { console.error("Turnstile render error:", e); }
    };
    if (!window.turnstile) {
      if (!document.querySelector('script[src*="turnstile"]')) {
        const s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        s.async = true; s.defer = true;
        s.onload = render;
        document.head.appendChild(s);
      } else {
        const t = setInterval(() => { if (window.turnstile) { clearInterval(t); render(); } }, 100);
      }
    } else { render(); }
    return () => { if (turnstileIdRef.current && window.turnstile) { window.turnstile.remove(turnstileIdRef.current); turnstileIdRef.current = null; } };
  }, [mode, forgotMode]);

  const submit = async () => {
    if (!email || !pw) { setErr(t("fillFields")); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr(t("invalidEmail")); return; }
    if (pw.length < 6) { setErr(t("pwShort")); return; }
    setLoading(true); setErr(""); setOk("");
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        onSuccess(data.user); onClose();
      } else {
        if (!captchaToken) { setErr("Veuillez compléter le CAPTCHA"); setLoading(false); return; }
        const verifyRes = await fetch("/api/verify-captcha", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: captchaToken }),
        });
        const { success: captchaOk } = await verifyRes.json();
        if (!captchaOk) { setErr("CAPTCHA invalide, réessayez"); if (turnstileIdRef.current && window.turnstile) window.turnstile.reset(turnstileIdRef.current); setCaptchaToken(""); setLoading(false); return; }
        const uname = username.trim() || email.split("@")[0];
        const { data, error } = await supabase.auth.signUp({
          email, password: pw,
          options: { data: { username: uname }, emailRedirectTo: "https://joystick-log.com" },
        });
        if (error) throw error;
        if (data.user) await supabase.from("profiles").upsert({ id: data.user.id, username: uname });
        setOk(t("accountCreated"));
      }
    } catch (e) {
      setErr(e.message === "Invalid login credentials" ? t("badCreds") : e.message);
    }
    setLoading(false);
  };

  const sendResetLink = async () => {
    if (!email) { setErr(t("fillFields")); return; }
    setLoading(true); setErr(""); setOk("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://joystick-log.com",
      });
      if (error) throw error;
      setOk(t("forgotSent"));
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,.82)", backdropFilter:"blur(18px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, animation:"fadeIn .2s" }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:420, borderRadius:22, background:"var(--c-modal)", border:"1px solid var(--c-border)", overflow:"hidden", animation:"scaleIn .28s cubic-bezier(.34,1.3,.64,1)", boxShadow:"0 60px 120px rgba(0,0,0,.7), 0 0 80px rgba(255,107,53,.06)" }}>
        <div style={{ height:3, background:"linear-gradient(90deg,#ff6b35 0%,#ffd166 55%,#a78bfa 100%)" }} />
        <div style={{ padding:"26px 26px 30px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
            <div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:21, color:"var(--c-text)", marginBottom:3 }}>
                {forgotMode ? t("forgotTitle") : mode === "login" ? t("welcomeBack") : t("joinJoystickLog")}
              </h2>
              <p style={{ color:"var(--c-text-3)", fontSize:13 }}>
                {forgotMode ? t("forgotDesc") : mode === "login" ? t("accessCollection") : t("freeForever")}
              </p>
            </div>
            <button onClick={onClose} style={{ background:"var(--c-el)", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--c-text-3)", cursor:"pointer" }}>✕</button>
          </div>

          {!forgotMode && (
            <div style={{ display:"flex", gap:5, marginBottom:18, background:"var(--c-el)", borderRadius:10, padding:4 }}>
              {[["login",t("loginTab")],["signup",t("signupTab")]].map(([m,l]) => (
                <button key={m} onClick={() => { setMode(m); setErr(""); setOk(""); }}
                  style={{ flex:1, background:mode===m?"rgba(255,107,53,.13)":"transparent", color:mode===m?"#ffd166":"var(--c-text-3)", border:mode===m?"1px solid rgba(255,107,53,.28)":"1px solid transparent", borderRadius:7, padding:"8px", fontSize:13, fontFamily:"'Syne',sans-serif", fontWeight:700, cursor:"pointer", transition:"all .15s" }}>{l}</button>
              ))}
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {!forgotMode && mode === "signup" && (
              <input id="signup-username" name="username" autoComplete="username" className="inp" placeholder={t("usernamePlaceholder")} value={username} onChange={e => setUsername(e.target.value)} />
            )}
            <input id="auth-email" name="email" autoComplete="email" className="inp" type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key==="Enter" && (forgotMode ? sendResetLink() : submit())} />
            {!forgotMode && (
              <>
                <input id="auth-password" name="password" autoComplete={mode==="login"?"current-password":"new-password"} className="inp" type="password" placeholder={t("passwordPlaceholder")} value={pw}
                  onChange={e => setPw(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && submit()} />
                {mode === "login" && (
                  <button onClick={() => { setForgotMode(true); setErr(""); setOk(""); }}
                    style={{ background:"none", border:"none", color:"rgba(255,107,53,.6)", cursor:"pointer", fontSize:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, textAlign:"left", padding:0, transition:"color .15s" }}
                    onMouseEnter={e=>e.currentTarget.style.color="#ff6b35"}
                    onMouseLeave={e=>e.currentTarget.style.color="rgba(255,107,53,.6)"}>
                    {t("forgotPw")}
                  </button>
                )}
              </>
            )}
          </div>

          {!forgotMode && mode === "signup" && (
            <div ref={turnstileRef} style={{ marginTop:10 }} />
          )}

          {err && <div style={{ color:"#ff6b6b", fontSize:13, marginTop:10, padding:"9px 12px", background:"rgba(255,77,77,.07)", borderRadius:8, border:"1px solid rgba(255,77,77,.14)" }}>{err}</div>}
          {ok  && <div style={{ color:"#4ade80", fontSize:13, marginTop:10, padding:"9px 12px", background:"rgba(74,222,128,.07)", borderRadius:8, border:"1px solid rgba(74,222,128,.18)" }}>{ok}</div>}

          {forgotMode ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:16 }}>
              {!ok && (
                <button className="btn" onClick={sendResetLink} disabled={loading} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {loading && <div className="spin" style={{ width:15, height:15, borderWidth:2 }} />}
                  {loading ? "…" : t("sendLink")}
                </button>
              )}
              <button onClick={() => { setForgotMode(false); setErr(""); setOk(""); }}
                style={{ background:"none", border:"none", color:"rgba(255,255,255,.28)", cursor:"pointer", fontSize:13, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, padding:"6px 0", transition:"color .15s", textAlign:"left" }}
                onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,.65)"}
                onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.28)"}>
                {t("backToLogin")}
              </button>
            </div>
          ) : (
            <>
              {!ok && <button className="btn" onClick={submit} disabled={loading} style={{ marginTop:16, width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {loading && <div className="spin" style={{ width:15, height:15, borderWidth:2 }} />}
                {loading ? "…" : mode === "login" ? t("loginSubmit") : t("signupSubmit")}
              </button>}

              <div style={{ display:"flex", alignItems:"center", gap:10, margin:"14px 0 2px" }}>
                <div style={{ flex:1, height:1, background:"var(--c-border)" }} />
                <span style={{ fontSize:11, color:"var(--c-text-3)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, letterSpacing:1 }}>OU</span>
                <div style={{ flex:1, height:1, background:"var(--c-border)" }} />
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:2 }}>
                <button onClick={() => supabase.auth.signInWithOAuth({ provider:"google", options:{ redirectTo: typeof window !== "undefined" ? window.location.origin : "" } })}
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", padding:"11px 16px", background:"var(--c-el)", border:"1px solid var(--c-border)", borderRadius:10, color:"var(--c-text)", fontSize:14, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, cursor:"pointer", transition:"all .15s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#ff6b35"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="var(--c-border)"}>
                  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  Continuer avec Google
                </button>

                <button onClick={() => supabase.auth.signInWithOAuth({ provider:"discord", options:{ redirectTo: typeof window !== "undefined" ? window.location.origin : "" } })}
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", padding:"11px 16px", background:"var(--c-el)", border:"1px solid var(--c-border)", borderRadius:10, color:"var(--c-text)", fontSize:14, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, cursor:"pointer", transition:"all .15s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#5865F2"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="var(--c-border)"}>
                  <svg width="18" height="14" viewBox="0 0 71 55" fill="none"><path d="M60.1 4.9A58.6 58.6 0 0 0 45.7.4a40.8 40.8 0 0 0-1.8 3.7 54.2 54.2 0 0 0-16.2 0A40.5 40.5 0 0 0 25.9.4 58.5 58.5 0 0 0 11.4 4.9C1.6 19.4-1 33.5.3 47.4a59 59 0 0 0 18 9.1 44.5 44.5 0 0 0 3.8-6.2 38.4 38.4 0 0 1-6-2.9l1.5-1.1a42.2 42.2 0 0 0 36 0l1.5 1.1a38.3 38.3 0 0 1-6 2.9 44.4 44.4 0 0 0 3.8 6.2 58.8 58.8 0 0 0 18-9.1c1.5-15.6-2.6-29.6-10.8-42.4ZM23.7 39c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.2 6.4-7.2 6.5 3.2 6.4 7.2c0 3.9-2.9 7.1-6.4 7.1Zm23.5 0c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.2 6.4-7.2 6.5 3.2 6.4 7.2c0 3.9-2.8 7.1-6.4 7.1Z" fill="#5865F2"/></svg>
                  Continuer avec Discord
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── RESET PASSWORD MODAL ─────────────────────────────────── */
const ResetPasswordModal = ({ onClose, t }) => {
  const [pw, setPw]   = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk]   = useState(false);

  const submit = async () => {
    if (pw.length < 6) { setErr(t("pwShort")); return; }
    if (pw !== pw2)    { setErr(t("resetPwMismatch")); return; }
    setLoading(true); setErr("");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setErr(error.message); setLoading(false); return; }
    setOk(true);
    setTimeout(() => onClose(), 2200);
    setLoading(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,.82)", backdropFilter:"blur(18px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, animation:"fadeIn .2s" }}>
      <div style={{ width:"100%", maxWidth:420, borderRadius:22, background:"rgba(9,7,7,.98)", border:"1px solid rgba(255,255,255,.07)", overflow:"hidden", animation:"scaleIn .28s cubic-bezier(.34,1.3,.64,1)", boxShadow:"0 60px 120px rgba(0,0,0,.9)" }}>
        <div style={{ height:3, background:"linear-gradient(90deg,#ff6b35 0%,#ffd166 55%,#a78bfa 100%)" }} />
        <div style={{ padding:"26px 26px 30px" }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:21, color:"#fff", marginBottom:6 }}>{t("resetPwTitle")}</h2>
          <p style={{ color:"rgba(255,255,255,.28)", fontSize:13, marginBottom:22 }}>{t("resetPwDesc")}</p>
          {ok ? (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ width:52, height:52, borderRadius:14, background:"rgba(74,222,128,.1)", border:"1px solid rgba(74,222,128,.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, margin:"0 auto 14px" }}>✓</div>
              <div style={{ color:"#4ade80", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:15 }}>{t("resetPwDone")}</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              <input className="inp" type="password" placeholder={t("passwordPlaceholder")} value={pw} onChange={e => setPw(e.target.value)} />
              <input className="inp" type="password" placeholder={t("resetPwConfirm")} value={pw2} onChange={e => setPw2(e.target.value)} onKeyDown={e => e.key==="Enter" && submit()} />
              {err && <div style={{ color:"#ff6b6b", fontSize:13, padding:"9px 12px", background:"rgba(255,77,77,.07)", borderRadius:8, border:"1px solid rgba(255,77,77,.14)" }}>{err}</div>}
              <button className="btn" onClick={submit} disabled={loading} style={{ marginTop:4, width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {loading && <div className="spin" style={{ width:15, height:15, borderWidth:2 }} />}
                {loading ? "…" : t("savePw")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── REVIEW CARD (with collapsible replies) ───────────────── */
const ReviewCard = ({ rv, col, initials, rxCounts, myRx, rvReplies, isReplying, replyText, liked, likeCount, onUserClick, onLike, onReact, onReplyToggle, onReplyChange, onReplySubmit, onReplyCancel, onEditSave, user, onAuthRequired, EMOJIS, t }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(rv.comment || "");
  const [editSaving, setEditSaving] = useState(false);
  const isOwn = user?.id === rv.user_id;

  const saveEdit = async () => {
    const clean = (editText || "").replace(/[<>]/g, "").trim().slice(0, 2000);
    if (clean === (rv.comment || "")) { setEditing(false); return; }
    setEditSaving(true);
    try { await onEditSave(rv.user_id, clean); } catch(e) { console.error("saveEdit:", e); }
    setEditSaving(false);
    setEditing(false);
  };

  return (
    <div style={{ background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.055)", borderRadius:16, padding:"16px 18px", transition:"border-color .2s" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:rv.comment?12:10 }}>
        <div onClick={()=>rv.user_display && onUserClick(rv.user_display)}
          onMouseDown={ev=>{ if(ev.button===1&&rv.user_display){ ev.preventDefault(); window.open(`${window.location.origin}?user=${encodeURIComponent(rv.user_display)}`,'_blank'); } }}
          style={{ width:38, height:38, borderRadius:11, background:`linear-gradient(135deg,${col},${col}88)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13, color:"#0a0600", flexShrink:0, cursor:rv.user_display?"pointer":"default", transition:"opacity .15s" }}
          onMouseEnter={e=>{if(rv.user_display)e.currentTarget.style.opacity=".75";}}
          onMouseLeave={e=>{e.currentTarget.style.opacity="1";}}>
          {initials}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span onClick={()=>rv.user_display && onUserClick(rv.user_display)} style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, color:"rgba(255,255,255,.72)", cursor:rv.user_display?"pointer":"default" }}
              onMouseEnter={e=>{if(rv.user_display)e.currentTarget.style.color="#ff6b35";}}
              onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,.72)";}}>
              {rv.user_display || t("member")}
            </span>
            <span style={{ background:`${col}18`, border:`1px solid ${col}40`, borderRadius:6, padding:"1px 9px", fontSize:11, color:col, fontFamily:"'Syne',sans-serif", fontWeight:800 }}>{rv.rating}/10</span>
            <span style={{ fontSize:11, color:"rgba(255,255,255,.18)", fontFamily:"'DM Sans',sans-serif" }}>{RATING_LABELS[rv.rating]}</span>
          </div>
        </div>
        {isOwn && !editing && (
          <button onClick={()=>{ setEditText(rv.comment||""); setEditing(true); }}
            style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:11, color:"rgba(255,255,255,.3)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, flexShrink:0, transition:"all .15s" }}
            onMouseEnter={e=>{e.currentTarget.style.color="#ff6b35";e.currentTarget.style.borderColor="rgba(255,107,53,.3)";}}
            onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,.3)";e.currentTarget.style.borderColor="rgba(255,255,255,.07)";}}>
            ✏️ Modifier
          </button>
        )}
      </div>
      {/* Comment / Edit mode */}
      {editing ? (
        <div style={{ paddingLeft:50, marginBottom:12 }}>
          <textarea value={editText} onChange={e=>setEditText(e.target.value)} maxLength={2000} rows={3}
            style={{ width:"100%", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,107,53,.35)", borderRadius:10, color:"#fff", padding:"10px 12px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical", boxSizing:"border-box" }}
            autoFocus />
          <div style={{ display:"flex", gap:8, marginTop:6 }}>
            <button onClick={saveEdit} disabled={editSaving}
              style={{ background:"rgba(255,107,53,.15)", border:"1px solid rgba(255,107,53,.35)", borderRadius:8, color:"#ff6b35", cursor:"pointer", padding:"6px 16px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:12 }}>
              {editSaving ? "…" : "Sauvegarder"}
            </button>
            <button onClick={()=>setEditing(false)}
              style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:8, color:"rgba(255,255,255,.35)", cursor:"pointer", padding:"6px 14px", fontSize:12 }}>
              Annuler
            </button>
          </div>
        </div>
      ) : rv.comment ? (
        <p style={{ color:"rgba(255,255,255,.48)", fontSize:13, lineHeight:1.75, fontFamily:"'DM Sans',sans-serif", fontStyle:"italic", margin:"0 0 12px", paddingLeft:50 }}>"{rv.comment}"</p>
      ) : null}
      {/* Actions bar */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", paddingLeft:50, alignItems:"center" }}>
        <button onClick={() => onLike(rv.user_id)}
          style={{ background: liked ? "rgba(239,68,68,.14)" : "rgba(255,255,255,.03)", border:`1px solid ${liked ? "rgba(239,68,68,.45)" : "rgba(255,255,255,.07)"}`, borderRadius:20, padding:"4px 12px", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:5, transition:"all .18s", lineHeight:1, color: liked ? "#ef4444" : "rgba(255,255,255,.35)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700 }}>
          <span style={{ fontSize:15 }}>{liked ? "❤️" : "🤍"}</span>
          {likeCount > 0 && <span style={{ fontSize:12 }}>{likeCount}</span>}
        </button>
        <div style={{ width:1, height:18, background:"rgba(255,255,255,.07)", flexShrink:0 }} />
        {EMOJIS.map(emoji => {
          const count = rxCounts[emoji] || 0;
          const active = myRx.includes(emoji);
          return (
            <button key={emoji} onClick={() => onReact(rv.user_id, emoji)}
              style={{ background: active ? "rgba(255,107,53,.14)" : "rgba(255,255,255,.03)", border:`1px solid ${active ? "rgba(255,107,53,.35)" : "rgba(255,255,255,.07)"}`, borderRadius:20, padding:"4px 10px", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", gap:5, transition:"all .18s", lineHeight:1 }}>
              {emoji}
              {count > 0 && <span style={{ fontSize:11, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color: active ? "#ff6b35" : "rgba(255,255,255,.35)" }}>{count}</span>}
            </button>
          );
        })}
        <div style={{ width:1, height:18, background:"rgba(255,255,255,.07)", flexShrink:0 }} />
        {!isOwn && (
          <button onClick={onReplyToggle}
            style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:20, padding:"4px 12px", cursor:"pointer", fontSize:12, color:"rgba(255,255,255,.4)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, transition:"all .18s" }}
            onMouseEnter={e=>{e.currentTarget.style.color="#ff6b35";e.currentTarget.style.borderColor="rgba(255,107,53,.3)";}}
            onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,.4)";e.currentTarget.style.borderColor="rgba(255,255,255,.07)";}}>
            ↩ Répondre
          </button>
        )}
      </div>
      {/* Reply input */}
      {isReplying && (
        <div style={{ marginTop:10, paddingLeft:50, display:"flex", gap:8 }}>
          <input value={replyText} onChange={e=>onReplyChange(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); onReplySubmit(); } if(e.key==="Escape") onReplyCancel(); }}
            placeholder="Votre réponse… (max 500 car.)" maxLength={500}
            style={{ flex:1, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,107,53,.3)", borderRadius:10, color:"#fff", padding:"8px 12px", fontSize:13, fontFamily:"'Space Grotesk',sans-serif", outline:"none" }}
            autoFocus />
          <button onClick={onReplySubmit} style={{ background:"rgba(255,107,53,.15)", border:"1px solid rgba(255,107,53,.35)", borderRadius:10, color:"#ff6b35", cursor:"pointer", padding:"0 14px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13 }}>↵</button>
          <button onClick={onReplyCancel} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, color:"rgba(255,255,255,.35)", cursor:"pointer", padding:"0 12px", fontSize:13 }}>✕</button>
        </div>
      )}
      {/* Collapsible replies */}
      {rvReplies.length > 0 && (
        <div style={{ paddingLeft:50, marginTop:10 }}>
          <button onClick={()=>setShowReplies(v=>!v)}
            style={{ background:"none", border:"none", color:"rgba(255,107,53,.7)", cursor:"pointer", fontSize:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, padding:0, transition:"color .15s" }}
            onMouseEnter={e=>e.currentTarget.style.color="#ff6b35"}
            onMouseLeave={e=>e.currentTarget.style.color="rgba(255,107,53,.7)"}>
            {showReplies ? "▲ Masquer" : `▼ Voir les réponses (${rvReplies.length})`}
          </button>
          {showReplies && (
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:8, borderLeft:"2px solid rgba(255,107,53,.15)", paddingLeft:12 }}>
              {rvReplies.map((rep,i) => (
                <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                  <div onClick={()=>rep.user_display && onUserClick(rep.user_display)}
                    style={{ width:26, height:26, borderRadius:8, background:"rgba(255,107,53,.18)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontFamily:"'Syne',sans-serif", fontWeight:800, color:"#ff6b35", flexShrink:0, cursor:rep.user_display?"pointer":"default" }}>
                    {rep.user_display?.slice(0,2).toUpperCase()||"?"}
                  </div>
                  <div>
                    <span onClick={()=>rep.user_display && onUserClick(rep.user_display)} style={{ fontSize:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:"rgba(255,255,255,.6)", cursor:rep.user_display?"pointer":"default", marginRight:8 }}
                      onMouseEnter={e=>{if(rep.user_display)e.currentTarget.style.color="#ff6b35";}}
                      onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,.6)";}}>
                      {rep.user_display || t("member")}
                    </span>
                    <span style={{ fontSize:13, color:"rgba(255,255,255,.45)", fontFamily:"'DM Sans',sans-serif" }}>{rep.content}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── CINEMATIC GAME PAGE ──────────────────────────────────── */
const GamePage = ({ game, onClose, onNavigate, user, userRatings, setUserRatings, userStatus, setUserStatus, onAuthRequired, username, userLists, lang, onUserClick, t }) => {
  const [myR, setMyR] = useState(userRatings[game.id]?.rating || 0);
  const [hovR, setHovR] = useState(0);
  const [txt, setTxt] = useState(userRatings[game.id]?.comment || "");
  const [saved, setSaved] = useState(!!userRatings[game.id]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(userStatus[game.id] || null);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(true);
  const [communityReviews, setCommunityReviews] = useState([]);
  const [reactions, setReactions] = useState({});
  const [myReactions, setMyReactions] = useState({});
  const [likes, setLikes] = useState({});
  const [myLikes, setMyLikes] = useState(new Set());
  const [replies, setReplies] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [dlcs, setDlcs] = useState([]);
  const [series, setSeries] = useState([]);
  const [showListMenu, setShowListMenu] = useState(false);
  const [addedToList, setAddedToList] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [translatedSummary, setTranslatedSummary] = useState(null);
  const [translating, setTranslating] = useState(false);

  const [fullGame, setFullGame] = useState(game);
  const g = fullGame;

  useEffect(() => {
    if (game.summary || game.videoId || (game.allPlatforms?.length > 0)) { setFullGame(game); return; }
    const ctrl = new AbortController();
    const isRawg = String(game.id).startsWith("rawg_");
    const url = isRawg
      ? `/api/games?rawgId=${String(game.id).replace("rawg_", "")}`
      : `/api/games?id=${game.id}`;
    fetch(url, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => { if (data?.id) setFullGame(fg => ({ ...fg, ...formatGame(data) })); })
      .catch(e => { if (e.name !== 'AbortError') console.warn('fullGame fetch:', e); });
    return () => ctrl.abort();
  }, [game.id]);

  const DLC_LABELS = { 1:t("dlcDLC"), 2:t("dlcExpansion"), 4:t("dlcStandalone") };

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/games/dlcs?id=${game.id}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        if (data && !Array.isArray(data)) {
          setDlcs(data.dlcs || []);
          setSeries(data.series || []);
        }
      })
      .catch(e => { if (e.name !== 'AbortError') console.warn('DLC fetch error:', e); });
    return () => ctrl.abort();
  }, [game.id]);

  useEffect(() => {
    if (!fullGame.summary || lang === "en") { setTranslatedSummary(null); return; }
    const ctrl = new AbortController();
    setTranslating(true);
    setTranslatedSummary(null);
    fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(fullGame.summary)}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        const translated = (Array.isArray(data?.[0]) ? data[0] : []).map(s => s?.[0]).filter(Boolean).join("") || null;
        setTranslatedSummary(translated);
      })
      .catch(e => { if (e.name !== 'AbortError') console.warn('Translation error:', e); })
      .finally(() => setTranslating(false));
    return () => ctrl.abort();
  }, [game.id, lang]);

  const BANNED_WORDS = ["connard","connasse","salope","pute","fdp","fils de pute","enculé","enculer","niquer","nique","tg","ta gueule","batard","bâtard","merde","putain de","espèce de","ordure","bitch","asshole","motherfucker","fucker","cunt","whore","nigger","faggot","retard","idiot","imbecile","moron","crétin","abruti","con ","conne ","gros con"];
  const containsBanned = (text) => {
    const low = text.toLowerCase();
    return BANNED_WORDS.some(w => low.includes(w));
  };

  const submitReply = async (reviewerUserId) => {
    if (!user) { onAuthRequired(); return; }
    const clean = replyText.replace(/[<>]/g, "").trim().slice(0, 500);
    if (!clean) return;
    if (containsBanned(clean)) { setReplyText(""); return; }
    const display = (username || user.user_metadata?.username || user.email?.split("@")[0] || "").replace(/[<>]/g,"").slice(0,50);
    const { error } = await supabase.from("replies").insert({
      game_id: game.id, reviewer_user_id: reviewerUserId,
      user_id: user.id, user_display: display, content: clean,
    });
    if (!error) {
      setReplies(p => ({ ...p, [reviewerUserId]: [...(p[reviewerUserId]||[]), { user_id: user.id, user_display: display, content: clean, created_at: new Date().toISOString() }] }));
      setReplyingTo(null); setReplyText("");
    }
  };

  const editComment = async (reviewerUserId, newComment) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) return;
      const userDisplay = username || user?.user_metadata?.username || user?.email?.split("@")[0] || "";
      const rating = userRatings[game.id]?.rating || myR;
      if (!rating || rating < 1 || rating > 10) return;
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ gameId: game.id, rating, comment: newComment, gameTitle: game.title, gameCover: game.cover, userDisplay }),
      });
      if (res.ok) {
        setCommunityReviews(p => p.map(r => r.user_id === reviewerUserId ? { ...r, comment: newComment } : r));
      }
    } catch(e) { console.error("editComment:", e); }
  };

  const EMOJIS = ["🔥","💯","😂","👏","😮","🎮"];

  const fetchCommunity = async () => {
    const { data } = await supabase.from("ratings")
      .select("*").eq("game_id", game.id)
      .not("comment", "is", null).neq("comment", "")
      .order("created_at", { ascending: false });
    if (data) setCommunityReviews(data);

    const { data: repData } = await supabase.from("replies")
      .select("*").eq("game_id", game.id)
      .order("created_at", { ascending: true });
    if (repData) {
      const r = {};
      repData.forEach(rep => {
        if (!r[rep.reviewer_user_id]) r[rep.reviewer_user_id] = [];
        r[rep.reviewer_user_id].push(rep);
      });
      setReplies(r);
    }

    const { data: rxData } = await supabase.from("reactions").select("*").eq("game_id", game.id);
    if (rxData) {
      const r = {};
      rxData.forEach(rx => {
        if (!r[rx.reviewer_id]) r[rx.reviewer_id] = {};
        r[rx.reviewer_id][rx.emoji] = (r[rx.reviewer_id][rx.emoji] || 0) + 1;
      });
      setReactions(r);
      if (user) {
        const mine = {};
        rxData.filter(rx => rx.user_id === user.id).forEach(rx => {
          if (!mine[rx.reviewer_id]) mine[rx.reviewer_id] = [];
          mine[rx.reviewer_id].push(rx.emoji);
        });
        setMyReactions(mine);
      }
    }

    const { data: likeData } = await supabase.from("likes").select("*").eq("game_id", game.id);
    if (likeData) {
      const counts = {};
      likeData.forEach(l => { counts[l.reviewer_id] = (counts[l.reviewer_id] || 0) + 1; });
      setLikes(counts);
      if (user) setMyLikes(new Set(likeData.filter(l => l.user_id === user.id).map(l => l.reviewer_id)));
    }
  };

  const toggleLike = async (reviewerUserId) => {
    if (!user) { onAuthRequired(); return; }
    const liked = myLikes.has(reviewerUserId);
    if (liked) {
      await supabase.from("likes").delete()
        .eq("user_id", user.id).eq("game_id", game.id).eq("reviewer_id", reviewerUserId);
      setMyLikes(p => { const s = new Set(p); s.delete(reviewerUserId); return s; });
      setLikes(p => ({ ...p, [reviewerUserId]: Math.max(0, (p[reviewerUserId] || 1) - 1) }));
    } else {
      await supabase.from("likes").upsert(
        { user_id: user.id, game_id: game.id, reviewer_id: reviewerUserId },
        { onConflict: "user_id,game_id,reviewer_id" }
      );
      setMyLikes(p => new Set([...p, reviewerUserId]));
      setLikes(p => ({ ...p, [reviewerUserId]: (p[reviewerUserId] || 0) + 1 }));
    }
  };

  useEffect(() => { fetchCommunity(); }, [game.id]);

  const addToList = async (listId, listName) => {
    if (!user) { onAuthRequired(); return; }
    await supabase.from("list_games").upsert(
      { list_id:listId, game_id:game.id, game_title:game.title, game_cover:game.cover },
      { onConflict:"list_id,game_id" }
    );
    setAddedToList(listName);
    setShowListMenu(false);
    setTimeout(() => setAddedToList(null), 2500);
  };

  const toggleReaction = async (reviewerUserId, emoji) => {
    if (!user) { onAuthRequired(); return; }
    const already = myReactions[reviewerUserId]?.includes(emoji);
    if (already) {
      await supabase.from("reactions").delete()
        .eq("user_id", user.id).eq("game_id", game.id)
        .eq("reviewer_id", reviewerUserId).eq("emoji", emoji);
      setMyReactions(p => ({ ...p, [reviewerUserId]: (p[reviewerUserId]||[]).filter(e=>e!==emoji) }));
      setReactions(p => ({ ...p, [reviewerUserId]: { ...p[reviewerUserId], [emoji]: Math.max(0,(p[reviewerUserId]?.[emoji]||1)-1) } }));
    } else {
      await supabase.from("reactions").upsert(
        { user_id:user.id, game_id:game.id, reviewer_id:reviewerUserId, emoji },
        { onConflict:"user_id,game_id,reviewer_id,emoji" }
      );
      setMyReactions(p => ({ ...p, [reviewerUserId]: [...(p[reviewerUserId]||[]), emoji] }));
      setReactions(p => ({ ...p, [reviewerUserId]: { ...p[reviewerUserId], [emoji]: (p[reviewerUserId]?.[emoji]||0)+1 } }));
    }
  };

  useEffect(() => {
    const esc = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => setBgLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = e => setScrolled(e.target.scrollTop > 80);

  const setStatus = async (status) => {
    if (!user) { onAuthRequired(); return; }
    setStatusLoading(true);
    const prevStatus = currentStatus;
    const newStatus = currentStatus === status ? null : status;
    setCurrentStatus(newStatus);
    setUserStatus(p => ({ ...p, [game.id]: newStatus }));
    let err;
    if (newStatus) {
      ({ error: err } = await supabase.from("game_status").upsert({
        user_id: user.id, game_id: game.id, status: newStatus,
        game_title: game.title, game_cover: game.cover,
        game_platform: game.platform, game_year: String(game.year),
      }, { onConflict: "user_id,game_id" }));
    } else {
      ({ error: err } = await supabase.from("game_status").delete().eq("user_id", user.id).eq("game_id", game.id));
    }
    if (err) {
      console.error('setStatus error:', err);
      setCurrentStatus(prevStatus);
      setUserStatus(p => ({ ...p, [game.id]: prevStatus }));
    }
    setStatusLoading(false);
  };

  const publish = async () => {
    if (!user) { onAuthRequired(); return; }
    if (!myR || myR < 1 || myR > 10) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setLoading(false); return; }
      const userDisplay = username || user.user_metadata?.username || user.email?.split("@")[0] || "";
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ gameId: String(game.id), rating: myR, comment: txt, gameTitle: game.title, gameCover: game.cover, userDisplay }),
      });
      let result = {};
      try { result = await res.json(); } catch { /* non-JSON response */ }
      if (res.ok && result.ok) {
        const safeComment = txt.replace(/[<>]/g, "").trim().slice(0, 2000);
        setUserRatings(p => ({...p, [game.id]:{rating:myR, comment:safeComment}}));
        setSaved(true);
        fetchCommunity();
      } else if (res.status === 422) {
        alert("Votre commentaire contient des mots inappropriés.");
      } else {
        alert("Erreur lors de la sauvegarde. Réessayez.");
      }
    } catch(e) {
      console.error("publish error:", e);
      alert("Erreur réseau. Vérifiez votre connexion.");
    }
    setLoading(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:999, background:"#060708", overflowY:"auto", animation:"fadeIn .3s" }} onScroll={handleScroll}>
      
      {/* Close button */}
      <button onClick={onClose} style={{ position:"fixed", top:20, left:20, zIndex:1001, background:"rgba(0,0,0,.65)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,.12)", borderRadius:99, width:42, height:42, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,.7)", cursor:"pointer", fontSize:18, transition:"all .2s" }}
        onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,.1)"; e.currentTarget.style.color="#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.background="rgba(0,0,0,.65)"; e.currentTarget.style.color="rgba(255,255,255,.7)"; }}>
        ←
      </button>

      {/* Sticky mini header */}
      <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:1000, height:62, display:"flex", alignItems:"center", padding:"0 80px", background: scrolled ? "rgba(6,7,8,.92)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,.05)" : "none", transition:"all .3s" }}>
        {scrolled && (
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {game.cover && <div style={{ width:32, height:42, borderRadius:5, overflow:"hidden" }}><img src={game.cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /></div>}
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, color:"#fff" }}>{game.title}</span>
          </div>
        )}
      </div>

      {/* Cinematic Hero */}
      <div className="cinematic-hero">
        {fullGame.videoId ? (
          <>
            {game.cover && (
              <div className="cinematic-bg" style={{ backgroundImage:`url(${game.cover})`, transform:"scale(1)", filter:"brightness(.15) saturate(1.2)" }} />
            )}
            <div className="yt-bg-wrap">
              <iframe
                key={muted}
                src={`https://www.youtube.com/embed/${fullGame.videoId}?autoplay=1&mute=${muted?1:0}&controls=0&loop=1&playlist=${fullGame.videoId}&playsinline=1&disablekb=1&modestbranding=1&rel=0`}
                allow="autoplay; encrypted-media"
              />
            </div>
            {/* Mute toggle */}
            <button onClick={()=>setMuted(m=>!m)} style={{ position:"absolute", bottom:28, right:28, zIndex:10, width:38, height:38, borderRadius:"50%", background:"rgba(0,0,0,.45)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,.12)", color:"rgba(255,255,255,.75)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, transition:"all .2s" }}
              title={muted?t("enableSound"):t("muteSound")}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,107,53,.25)";e.currentTarget.style.borderColor="rgba(255,107,53,.5)";e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(0,0,0,.45)";e.currentTarget.style.borderColor="rgba(255,255,255,.12)";e.currentTarget.style.color="rgba(255,255,255,.75)";}}>
              {muted ? "🔇" : "🔊"}
            </button>
          </>
        ) : (
          game.cover && (
            <div className="cinematic-bg" style={{ backgroundImage:`url(${game.cover})`, transform: bgLoaded ? "scale(1)" : "scale(1.08)", transition:"transform 1.2s ease, filter .8s ease", filter: bgLoaded ? "brightness(.35) saturate(1.3)" : "brightness(0) saturate(1)" }} />
          )
        )}
        <div className="cinematic-overlay" />
        <div className="cinematic-overlay-2" />

        <div style={{ position:"relative", zIndex:2, padding:"0 48px 56px", maxWidth:900, width:"100%", animation:"slideUp .6s .2s cubic-bezier(.4,0,.2,1) both" }}>
          {/* Badges */}
          <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ background:"rgba(255,107,53,.15)", color:"#ffd166", border:"1px solid rgba(255,107,53,.3)", borderRadius:99, padding:"4px 14px", fontSize:12, fontFamily:"'Syne',sans-serif", fontWeight:700 }}>
              {game.platform ? game.platform.split("(")[0].trim() : t("multi")}
            </span>
            <span style={{ color:"rgba(255,255,255,.4)", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{game.year}</span>
            {fullGame.genre && <span style={{ color:"rgba(255,255,255,.4)", fontSize:13 }}>· {fullGame.genre}</span>}
            {fullGame.tags.slice(0,3).map(t => (
              <span key={t} style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", color:"rgba(255,255,255,.45)", borderRadius:6, padding:"3px 10px", fontSize:11 }}>#{t}</span>
            ))}
          </div>

          {/* Title */}
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(32px,5vw,68px)", lineHeight:.92, letterSpacing:"-2px", color:"#fff", marginBottom:20, textShadow:"0 2px 40px rgba(0,0,0,.8)" }}>
            {game.title}
          </h1>

          {/* Summary */}
          {fullGame.summary && (
            <p style={{ fontSize:15, color:"rgba(255,255,255,.5)", maxWidth:560, lineHeight:1.75, fontFamily:"'DM Sans',sans-serif", marginBottom:28 }}>
              {(() => { const s = translatedSummary || fullGame.summary; return s.length > 240 ? s.slice(0,240)+"…" : s; })()}
            </p>
          )}

          {/* Stats row */}
          <div style={{ display:"flex", gap:28, marginBottom:32, flexWrap:"wrap", alignItems:"center" }}>
            {userRatings[game.id] && (
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Ring value={userRatings[game.id].rating} size={52} />
                <div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.3)", fontFamily:"'DM Sans',sans-serif" }}>{t("myRating")}</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.55)", fontFamily:"'DM Sans',sans-serif" }}>{t("savedLabel")}</div>
                </div>
              </div>
            )}
            {communityReviews.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:"#ffd166" }}>{communityReviews.length}</div>
                <div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.3)", fontFamily:"'DM Sans',sans-serif" }}>{t("communityReviews")}</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.55)", fontFamily:"'DM Sans',sans-serif" }}>{t("ofCommunity")}</div>
                </div>
              </div>
            )}
            {game.pressRating && (
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:52, height:52, borderRadius:"50%", background: game.pressRating >= 75 ? "rgba(255,209,102,.08)" : game.pressRating >= 60 ? "rgba(255,107,53,.08)" : "rgba(248,113,113,.08)", border:`1px solid ${game.pressRating >= 75 ? "rgba(255,209,102,.25)" : game.pressRating >= 60 ? "rgba(255,107,53,.25)" : "rgba(248,113,113,.25)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color: game.pressRating >= 75 ? "#ffd166" : game.pressRating >= 60 ? "#ff9a3c" : "#f87171" }}>
                  {game.pressRating}
                </div>
                <div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.3)", fontFamily:"'DM Sans',sans-serif" }}>Score presse</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.55)", fontFamily:"'DM Sans',sans-serif" }}>{game.pressCount} média{game.pressCount > 1 ? "s" : ""}</div>
                  <a href={`https://www.metacritic.com/search/${encodeURIComponent(game.title)}/`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:11, color:"rgba(255,107,53,.7)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:3, marginTop:3, transition:"color .15s" }}
                    onMouseEnter={e=>e.currentTarget.style.color="#ff6b35"}
                    onMouseLeave={e=>e.currentTarget.style.color="rgba(255,107,53,.7)"}>
                    Voir sur Metacritic →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Status buttons */}
          <div style={{ display:"flex", gap:9, flexWrap:"wrap", alignItems:"center" }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const on = currentStatus === key;
              return (
                <button key={key} className="status-btn" onClick={() => setStatus(key)}
                  style={{ background: on ? `${cfg.color}22` : "rgba(255,255,255,.07)", color: on ? cfg.color : "rgba(255,255,255,.5)", border:`1px solid ${on ? cfg.color+"55" : "rgba(255,255,255,.12)"}`, boxShadow: on ? `0 0 14px ${cfg.color}33` : "none" }}>
                  <span>{cfg.icon}</span>
                  <span style={{ fontFamily:"'Syne',sans-serif" }}>{t(`s_${key}`)}</span>
                  {statusLoading && on && <div className="spin" style={{ width:12, height:12, borderWidth:2 }} />}
                </button>
              );
            })}

            {/* Add to list */}
            {user && userLists?.length > 0 && (
              <div style={{ position:"relative" }}>
                <button onClick={()=>setShowListMenu(m=>!m)}
                  style={{ background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", borderRadius:11, padding:"9px 17px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer", color:"rgba(255,255,255,.5)", display:"flex", alignItems:"center", gap:6, transition:"all .2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,107,53,.4)";e.currentTarget.style.color="#ffd166";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.12)";e.currentTarget.style.color="rgba(255,255,255,.5)";}}>
                  📋 {addedToList ? `✓ ${addedToList}` : t("addToList")}
                </button>
                {showListMenu && (
                  <div style={{ position:"absolute", top:"calc(100% + 8px)", left:0, zIndex:50, background:"#161210", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:6, minWidth:180, boxShadow:"0 20px 50px rgba(0,0,0,.7)" }}>
                    {userLists.map(list => (
                      <button key={list.id} onClick={()=>addToList(list.id, list.name)}
                        style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", color:"rgba(255,255,255,.7)", padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, transition:"all .15s" }}
                        onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,107,53,.1)";e.currentTarget.style.color="#fff";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color="rgba(255,255,255,.7)";}}>
                        📋 {list.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── SHARE BUTTON ── */}
            <div style={{ position:"relative" }}>
              <button
                onClick={() => {
                  const url = `${window.location.origin}?game=${game.id}`;
                  if (navigator.share) {
                    navigator.share({ title: game.title, text: `${game.title} — JoystickLog`, url }).catch(()=>{});
                  } else {
                    setShowShareMenu(m => !m);
                  }
                }}
                style={{ background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", borderRadius:11, padding:"9px 17px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer", color:"rgba(255,255,255,.5)", display:"flex", alignItems:"center", gap:6, transition:"all .2s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,107,53,.4)";e.currentTarget.style.color="#ffd166";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.12)";e.currentTarget.style.color="rgba(255,255,255,.5)";}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                {t("share")}
              </button>
              {showShareMenu && (
                <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, zIndex:50, background:"#161210", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:6, minWidth:190, boxShadow:"0 20px 50px rgba(0,0,0,.7)" }}>
                  {[
                    { icon:"𝕏", label: t("shareX"), action: () => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${game.title} — ${window.location.origin}?game=${game.id}`)}`,'_blank'); setShowShareMenu(false); }},
                    { icon:"🔗", label: linkCopied ? t("linkCopied") : t("copyLink"), action: () => { navigator.clipboard.writeText(`${window.location.origin}?game=${game.id}`); setLinkCopied(true); setTimeout(()=>setLinkCopied(false),2000); setShowShareMenu(false); }},
                  ].map(item => (
                    <button key={item.label} onClick={item.action}
                      style={{ display:"flex", alignItems:"center", gap:10, width:"100%", textAlign:"left", background:"none", border:"none", color:"rgba(255,255,255,.7)", padding:"9px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, transition:"all .15s" }}
                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,107,53,.1)";e.currentTarget.style.color="#fff";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color="rgba(255,255,255,.7)";}}>
                      <span style={{ fontSize:15 }}>{item.icon}</span>{item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content below hero */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"52px 32px 100px" }}>
        <div className="gp-grid" style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:32, alignItems:"start" }}>

          {/* ── LEFT SIDEBAR ── */}
          <div>
            {/* Cover with ember glow */}
            {game.cover && (
              <div style={{ borderRadius:18, overflow:"hidden", border:"1px solid rgba(255,255,255,.09)", boxShadow:"0 40px 90px rgba(0,0,0,.85), 0 0 70px rgba(255,107,53,.1)", marginBottom:20 }}>
                <div style={{ paddingBottom:"140%", position:"relative" }}>
                  <img src={game.cover} alt={game.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                </div>
              </div>
            )}

            {/* Ma note sidebar */}
            <div style={{ background: myR ? "rgba(255,107,53,.06)" : "rgba(255,255,255,.025)", border:`1px solid ${myR ? "rgba(255,107,53,.22)" : "rgba(255,255,255,.06)"}`, borderRadius:14, padding:"14px 10px", textAlign:"center", transition:"all .3s", marginBottom:18 }}>
              <div style={{ fontSize:9, color: myR ? "rgba(255,107,53,.7)" : "rgba(255,255,255,.22)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>{t("myRating")}</div>
              <Ring value={myR || null} size={52} />
              <div style={{ fontSize:10, color:"rgba(255,255,255,.22)", fontFamily:"'DM Sans',sans-serif", marginTop:8 }}>
                {myR ? RATING_LABELS[myR] : "—"}
              </div>
            </div>

            {/* Status buttons — vertical */}
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const on = currentStatus === key;
                return (
                  <button key={key} className="status-btn" onClick={() => setStatus(key)}
                    style={{ width:"100%", justifyContent:"flex-start", background: on ? `${cfg.color}18` : "rgba(255,255,255,.04)", color: on ? cfg.color : "rgba(255,255,255,.38)", border:`1px solid ${on ? cfg.color+"44" : "rgba(255,255,255,.07)"}`, boxShadow: on ? `0 0 18px ${cfg.color}22` : "none", padding:"10px 14px", borderRadius:12, fontSize:13 }}>
                    <span style={{ fontSize:15, marginRight:8 }}>{cfg.icon}</span>
                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>{t(`s_${key}`)}</span>
                    {statusLoading && on && <div className="spin" style={{ width:12, height:12, borderWidth:2, marginLeft:"auto" }} />}
                    {on && !statusLoading && <span style={{ marginLeft:"auto", fontSize:10, opacity:.6 }}>✓</span>}
                  </button>
                );
              })}
            </div>

            {/* ── Affiliate buy button ── */}
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:9, color:"rgba(255,255,255,.18)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Acheter</div>
              <a
                href={`https://www.instant-gaming.com/?igr=gamer-f4e324`}
                target="_blank" rel="noopener noreferrer sponsored"
                style={{ display:"flex", alignItems:"center", gap:10, background:"linear-gradient(135deg,rgba(0,180,80,.12),rgba(0,220,100,.06))", border:"1px solid rgba(0,200,80,.25)", borderRadius:12, padding:"11px 14px", textDecoration:"none", transition:"all .22s", cursor:"pointer", marginBottom:8 }}
                onMouseEnter={e=>{ e.currentTarget.style.background="linear-gradient(135deg,rgba(0,180,80,.22),rgba(0,220,100,.12))"; e.currentTarget.style.borderColor="rgba(0,200,80,.5)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="linear-gradient(135deg,rgba(0,180,80,.12),rgba(0,220,100,.06))"; e.currentTarget.style.borderColor="rgba(0,200,80,.25)"; e.currentTarget.style.transform=""; }}>
                <svg width="20" height="20" viewBox="0 0 40 40" fill="none" style={{ flexShrink:0 }}>
                  <rect width="40" height="40" rx="8" fill="#00c853"/>
                  <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fill="white">⚡</text>
                </svg>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.85)", fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.2 }}>Instant Gaming</div>
                  <div style={{ fontSize:10, color:"rgba(0,200,80,.7)", fontFamily:"'Space Grotesk',sans-serif", marginTop:1 }}>Meilleur prix →</div>
                </div>
              </a>
              <a
                href={`https://www.amazon.fr/s?k=${encodeURIComponent(game.title)}&i=videogames&tag=joysticklog-21&ref=sr_nr_n_1`}
                target="_blank" rel="noopener noreferrer sponsored"
                style={{ display:"flex", alignItems:"center", gap:10, background:"linear-gradient(135deg,rgba(255,153,0,.1),rgba(255,180,0,.05))", border:"1px solid rgba(255,153,0,.22)", borderRadius:12, padding:"11px 14px", textDecoration:"none", transition:"all .22s", cursor:"pointer" }}
                onMouseEnter={e=>{ e.currentTarget.style.background="linear-gradient(135deg,rgba(255,153,0,.2),rgba(255,180,0,.1))"; e.currentTarget.style.borderColor="rgba(255,153,0,.48)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="linear-gradient(135deg,rgba(255,153,0,.1),rgba(255,180,0,.05))"; e.currentTarget.style.borderColor="rgba(255,153,0,.22)"; e.currentTarget.style.transform=""; }}>
                <svg width="20" height="20" viewBox="0 0 40 40" fill="none" style={{ flexShrink:0 }}>
                  <rect width="40" height="40" rx="8" fill="#ff9900"/>
                  <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="18" fill="white">a</text>
                </svg>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.85)", fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.2 }}>Amazon.fr</div>
                  <div style={{ fontSize:10, color:"rgba(255,153,0,.75)", fontFamily:"'Space Grotesk',sans-serif", marginTop:1 }}>Voir sur Amazon →</div>
                </div>
              </a>
              <div style={{ fontSize:8.5, color:"rgba(255,255,255,.12)", fontFamily:"'DM Sans',sans-serif", marginTop:6, lineHeight:1.5 }}>
                Liens affiliés — commission sans surcoût pour toi.
              </div>
            </div>
          </div>

          {/* ── RIGHT MAIN ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* ── RATING CARD ── */}
            <div style={{ background:"rgba(255,255,255,.022)", border:"1px solid rgba(255,255,255,.07)", borderRadius:20, overflow:"hidden" }}>
              {/* Card top accent */}
              <div style={{ height:2, background: saved ? `linear-gradient(90deg,${rc(myR)},${rc(myR)}88,transparent)` : "linear-gradient(90deg,rgba(255,255,255,.06),transparent)" }} />
              <div style={{ padding:"24px 26px 26px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <div style={{ fontSize:10, color:"rgba(255,107,53,.65)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:3, textTransform:"uppercase" }}>
                    {saved ? t("reviewPublished") : user ? t("myReview") : t("rateGame")}
                  </div>
                  {saved && (
                    <button onClick={() => setSaved(false)} style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.09)", borderRadius:8, color:"rgba(255,255,255,.35)", cursor:"pointer", fontSize:11, padding:"5px 12px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, transition:"all .15s" }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,107,53,.35)";e.currentTarget.style.color="#ff6b35";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.09)";e.currentTarget.style.color="rgba(255,255,255,.35)";}}>
                      {t("editBtn")}
                    </button>
                  )}
                </div>

                {!saved ? (
                  <>
                    {/* Big number preview */}
                    <div style={{ display:"flex", alignItems:"flex-end", gap:14, marginBottom:22 }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:80, fontWeight:800, lineHeight:1, color: (hovR||myR) ? rc(hovR||myR) : "rgba(255,255,255,.07)", transition:"color .12s", filter:(hovR||myR) ? `drop-shadow(0 0 28px ${rc(hovR||myR)}66)` : "none" }}>
                        {hovR || myR || "?"}
                      </div>
                      <div style={{ paddingBottom:12 }}>
                        <div style={{ fontSize:18, color:"rgba(255,255,255,.12)", fontFamily:"'Syne',sans-serif", fontWeight:700, lineHeight:1, marginBottom:5 }}>/10</div>
                        <div style={{ fontSize:14, color:(hovR||myR) ? rc(hovR||myR) : "rgba(255,255,255,.18)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, transition:"color .12s", minWidth:120 }}>
                          {(hovR||myR) ? t(`r${hovR||myR}`) : t("choose")}
                        </div>
                      </div>
                    </div>

                    {/* Equalizer bars */}
                    <div style={{ display:"flex", gap:5, alignItems:"flex-end", height:76, marginBottom:22, padding:"0 2px" }}>
                      {Array.from({length:10},(_,i) => {
                        const v=i+1, on=v<=(hovR||myR), col=rc(v);
                        const barH = Math.round(12 + (v/10)*88);
                        return (
                          <div key={v}
                            onClick={() => user ? setMyR(v) : onAuthRequired()}
                            onMouseEnter={() => setHovR(v)}
                            onMouseLeave={() => setHovR(0)}
                            title={`${v} — ${RATING_LABELS[v]}`}
                            style={{ flex:1, height:`${barH}%`, borderRadius:"4px 4px 0 0", background: on ? `linear-gradient(to top,${col},${col}bb)` : "rgba(255,255,255,.06)", cursor:"pointer", transition:"all .18s cubic-bezier(.34,1.4,.64,1)", transform:hovR===v?"scaleY(1.1)":"scaleY(1)", transformOrigin:"bottom", boxShadow:on?`0 -4px 16px ${col}44`:"none" }}
                          />
                        );
                      })}
                    </div>

                    {/* Number labels under bars */}
                    <div style={{ display:"flex", gap:5, marginBottom:20, padding:"0 2px" }}>
                      {Array.from({length:10},(_,i) => {
                        const v=i+1, on=v<=(hovR||myR);
                        return <div key={v} style={{ flex:1, textAlign:"center", fontSize:10, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", color: on ? rc(v) : "rgba(255,255,255,.14)", transition:"color .12s" }}>{v}</div>;
                      })}
                    </div>

                    {/* Textarea */}
                    <textarea value={txt} onChange={e => setTxt(e.target.value.slice(0,500))}
                      placeholder={user ? t("reviewPlaceholder") : t("loginToReview")}
                      disabled={!user}
                      rows={4}
                      style={{ width:"100%", background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:12, color:"rgba(255,255,255,.8)", padding:"14px 16px", fontSize:14, resize:"none", outline:"none", transition:"border-color .18s, background .18s", lineHeight:1.65, fontFamily:"'DM Sans',sans-serif", opacity:user?1:.45 }}
                      onFocus={e=>{e.target.style.borderColor="rgba(255,107,53,.4)";e.target.style.background="rgba(255,255,255,.045)";}}
                      onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.07)";e.target.style.background="rgba(255,255,255,.03)";}}
                    />
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,.16)", fontFamily:"'Space Grotesk',sans-serif" }}>{txt.length}/500</span>
                      <button className="btn" onClick={publish} disabled={loading||(!myR&&!!user)} style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 28px" }}>
                        {loading && <div className="spin" style={{ width:14, height:14, borderWidth:2 }} />}
                        {loading ? t("publishing") : user ? `${t("publishBtn")}${myR ? ` · ${myR}/10` : ""}` : t("loginBtn2")}
                      </button>
                    </div>
                  </>
                ) : (
                  /* ── Review card ── */
                  <div style={{ animation:"fadeIn .3s" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:20, padding:"18px 20px", background:`linear-gradient(135deg,${rc(myR)}0e,${rc(myR)}06)`, border:`1px solid ${rc(myR)}28`, borderRadius:14 }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:64, fontWeight:800, lineHeight:1, color:rc(myR), filter:`drop-shadow(0 0 22px ${rc(myR)}55)`, flexShrink:0 }}>{myR}</div>
                      <div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"#fff", marginBottom:4 }}>{RATING_LABELS[myR]}</div>
                        <div style={{ display:"flex", gap:4 }}>
                          {Array.from({length:10},(_,i) => (
                            <div key={i} style={{ width:20, height:4, borderRadius:2, background: i<myR ? rc(myR) : "rgba(255,255,255,.08)", transition:"background .2s" }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {txt && (
                      <blockquote style={{ margin:0, padding:"16px 20px 16px 20px", borderLeft:`3px solid ${rc(myR)}55`, background:"rgba(255,255,255,.02)", borderRadius:"0 12px 12px 0" }}>
                        <p style={{ color:"rgba(255,255,255,.55)", fontSize:14, lineHeight:1.75, fontFamily:"'DM Sans',sans-serif", fontStyle:"italic", margin:0 }}>"{txt}"</p>
                      </blockquote>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── SYNOPSIS ── */}
            {fullGame.summary && (
              <div style={{ background:"rgba(255,255,255,.022)", border:"1px solid rgba(255,255,255,.07)", borderRadius:20, padding:"22px 26px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <div style={{ fontSize:10, color:"rgba(255,107,53,.65)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:3, textTransform:"uppercase" }}>{t("synopsis")}</div>
                  {translating && <div className="spin" style={{ width:12, height:12, borderWidth:1.5 }} />}
                </div>
                <p style={{ color:"rgba(255,255,255,.52)", fontSize:14, lineHeight:1.85, fontFamily:"'DM Sans',sans-serif", margin:0 }}>
                  {(() => { const s = translatedSummary || fullGame.summary || ""; return expanded || s.length <= 300 ? s : s.slice(0,300)+"…"; })()}
                </p>
                {(translatedSummary || fullGame.summary || "").length > 300 && (
                  <button onClick={() => setExpanded(!expanded)} style={{ background:"none", border:"none", color:"rgba(255,107,53,.7)", cursor:"pointer", fontSize:13, padding:"10px 0 0", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>
                    {expanded ? t("readLess") : t("readMore")}
                  </button>
                )}
              </div>
            )}

            {/* ── INFO GRID ── */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
              {[
                { icon:"🖥", label:t("platform"), value: (() => { const p = (fullGame.allPlatforms?.length > 0 ? fullGame.allPlatforms : [fullGame.platform]).filter(Boolean); const shown = p.slice(0,5).map(x=>x.split("(")[0].trim()).join(", "); return p.length > 5 ? shown + ` +${p.length-5}` : shown; })() },
                { icon:"📅", label:t("releaseYear"), value:fullGame.year },
                { icon:"🎭", label:t("mainGenre"), value:fullGame.genre },
                { icon:"💬", label:t("communityCount"), value:communityReviews.length > 0 ? `${communityReviews.length} ${t("avisCount")}` : t("beFirst") },
              ].map(({ icon, label, value }) => (
                <div key={label} className="stat-card" style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:40, height:40, borderRadius:11, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,.2)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:14, color:"rgba(255,255,255,.78)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tags */}
            {fullGame.tags.length > 0 && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {fullGame.tags.map(t => (
                  <span key={t} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", color:"rgba(255,255,255,.38)", borderRadius:8, padding:"6px 14px", fontSize:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, letterSpacing:.3 }}>#{t}</span>
                ))}
              </div>
            )}

            {/* ── SÉRIE ── */}
            {series.length > 0 && (
              <div style={{ background:"rgba(255,255,255,.022)", border:"1px solid rgba(255,255,255,.07)", borderRadius:20, overflow:"hidden" }}>
                <div style={{ height:2, background:"linear-gradient(90deg,#ffd166,#ff9a3c 55%,transparent)" }} />
                <div style={{ padding:"22px 26px 26px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                    <div className="sect-h">
                      <span style={{ fontSize:10, color:"rgba(255,209,102,.8)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:3, textTransform:"uppercase" }}>Série</span>
                    </div>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,.2)", fontFamily:"'Space Grotesk',sans-serif" }}>{series.length} jeu{series.length>1?"x":""}</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))", gap:10 }}>
                    {series.map(g => {
                      const cover = g.cover?.url ? `https:${g.cover.url.replace("t_thumb","t_cover_big")}` : null;
                      const year = g.first_release_date ? new Date(g.first_release_date*1000).getFullYear() : null;
                      return (
                        <div key={g.id} onClick={()=>{ if(onNavigate) onNavigate(g); }} style={{ cursor:"pointer", transition:"transform .2s" }}
                          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-4px)"}
                          onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                          <div style={{ borderRadius:10, overflow:"hidden", border:"1px solid rgba(255,255,255,.08)", marginBottom:6, paddingBottom:"140%", position:"relative", background:"#0d0b09" }}>
                            {cover
                              ? <img src={cover} alt={g.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                              : <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🎮</div>
                            }
                          </div>
                          <div style={{ fontSize:11, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:"rgba(255,255,255,.7)", lineHeight:1.2, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.name}</div>
                          {year && <div style={{ fontSize:10, color:"rgba(255,255,255,.25)", fontFamily:"'DM Sans',sans-serif" }}>{year}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── DÉRIVÉS (DLC / Extensions) ── */}
            {dlcs.length > 0 && (
              <div style={{ background:"rgba(255,255,255,.022)", border:"1px solid rgba(255,255,255,.07)", borderRadius:20, overflow:"hidden" }}>
                <div style={{ height:2, background:"linear-gradient(90deg,#a78bfa,#ff6b35 55%,transparent)" }} />
                <div style={{ padding:"22px 26px 26px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                    <div className="sect-h">
                      <span style={{ fontSize:10, color:"rgba(167,139,250,.8)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:3, textTransform:"uppercase" }}>{t("dlcSection")}</span>
                    </div>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,.2)", fontFamily:"'Space Grotesk',sans-serif" }}>{dlcs.length} {dlcs.length>1?t("contents"):t("content")}</span>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {dlcs.map(dlc => {
                      const cover = dlc.cover?.url ? `https:${dlc.cover.url.replace("t_thumb","t_cover_big")}` : null;
                      const year = dlc.first_release_date ? new Date(dlc.first_release_date*1000).getFullYear() : null;
                      const typeLabel = DLC_LABELS[dlc.category] || t("dlcDLC");
                      return (
                        <div key={dlc.id} style={{ display:"flex", alignItems:"center", gap:14, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.05)", borderRadius:14, padding:"12px 14px", transition:"all .2s", cursor:"default" }}
                          onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(167,139,250,.22)"; e.currentTarget.style.background="rgba(167,139,250,.04)"; }}
                          onMouseLeave={e=>{ e.currentTarget.style.borderColor="rgba(255,255,255,.05)"; e.currentTarget.style.background="rgba(255,255,255,.02)"; }}>
                          {cover
                            ? <img src={cover} alt={dlc.name} style={{ width:42, height:56, borderRadius:8, objectFit:"cover", flexShrink:0, border:"1px solid rgba(255,255,255,.08)" }} />
                            : <div style={{ width:42, height:56, borderRadius:8, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>🎮</div>
                          }
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, color:"rgba(255,255,255,.82)", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{dlc.name}</div>
                            <div style={{ display:"flex", gap:7, alignItems:"center", flexWrap:"wrap" }}>
                              <span style={{ background:"rgba(167,139,250,.12)", border:"1px solid rgba(167,139,250,.25)", borderRadius:5, padding:"1px 8px", fontSize:10, color:"rgba(167,139,250,.85)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700 }}>{typeLabel}</span>
                              {year && <span style={{ fontSize:11, color:"rgba(255,255,255,.22)", fontFamily:"'DM Sans',sans-serif" }}>{year}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── AVIS COMMUNAUTÉ ── */}
            <div style={{ background:"rgba(255,255,255,.022)", border:"1px solid rgba(255,255,255,.07)", borderRadius:20, overflow:"hidden" }}>
              <div style={{ height:2, background:"linear-gradient(90deg,#ffd166,#ff6b35 55%,transparent)" }} />
              <div style={{ padding:"22px 26px 26px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                  <div className="sect-h">
                    <span style={{ fontSize:10, color:"rgba(255,209,102,.75)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:3, textTransform:"uppercase" }}>{t("communitySection")}</span>
                  </div>
                  {communityReviews.length > 0 && (
                    <span style={{ fontSize:11, color:"rgba(255,255,255,.2)", fontFamily:"'Space Grotesk',sans-serif" }}>{communityReviews.length} {t("avisCount")}</span>
                  )}
                </div>

                {communityReviews.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"28px 0", color:"rgba(255,255,255,.15)", fontFamily:"'DM Sans',sans-serif" }}>
                    <div style={{ fontSize:32, marginBottom:10 }}>✍️</div>
                    <div style={{ fontSize:13 }}>{t("noReviews").split("\n").map((l,i)=><span key={i}>{l}{i===0&&<br/>}</span>)}</div>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    {communityReviews.map(rv => {
                      const col = rc(rv.rating);
                      const initials = rv.user_display ? rv.user_display.slice(0,2).toUpperCase() : "??";
                      const rxCounts = reactions[rv.user_id] || {};
                      const myRx = myReactions[rv.user_id] || [];
                      const rvReplies = replies[rv.user_id] || [];
                      const isReplying = replyingTo === rv.user_id;
                      return (
                        <ReviewCard key={rv.user_id}
                          rv={rv} col={col} initials={initials} rxCounts={rxCounts} myRx={myRx}
                          rvReplies={rvReplies} isReplying={isReplying} replyText={replyText}
                          liked={myLikes.has(rv.user_id)} likeCount={likes[rv.user_id]||0}
                          onUserClick={onUserClick} onLike={toggleLike} onReact={toggleReaction}
                          onReplyToggle={()=>{ setReplyingTo(isReplying?null:rv.user_id); setReplyText(""); }}
                          onReplyChange={setReplyText} onReplySubmit={()=>submitReply(rv.user_id)}
                          onReplyCancel={()=>{ setReplyingTo(null); setReplyText(""); }}
                          onEditSave={editComment}
                          user={user} onAuthRequired={onAuthRequired}
                          EMOJIS={EMOJIS} t={t} />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

/* ── AVATAR GALLERY ───────────────────────────────────────── */
// lorelei-neutral = serious/neutral expression by default
// ── CUSTOM SVG AVATARS ────────────────────────────────────────
// Each avatar is a self-contained SVG string: bg gradient + face + unique hat
const mkSvg = (bg1, bg2, face, hat) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient>
  <clipPath id="c"><rect width="100" height="100" rx="18"/></clipPath>
</defs>
<rect width="100" height="100" rx="18" fill="url(#bg)"/>
<!-- neck -->
<rect x="41" y="68" width="18" height="14" rx="4" fill="#c8956b"/>
<!-- shoulders -->
<ellipse cx="50" cy="88" rx="28" ry="14" fill="#1a1a2e"/>
<!-- head -->
<ellipse cx="50" cy="54" rx="20" ry="22" fill="#c8956b"/>
<!-- ears -->
<ellipse cx="30" cy="55" rx="4" ry="5" fill="#c8956b"/>
<ellipse cx="70" cy="55" rx="4" ry="5" fill="#c8956b"/>
<!-- eyes -->
${face}
<!-- hat -->
${hat}
</svg>`)}`;

// face variants
const FACE_STERN  = `<ellipse cx="43" cy="52" rx="3.5" ry="2.5" fill="#1a0a00"/><ellipse cx="57" cy="52" rx="3.5" ry="2.5" fill="#1a0a00"/><path d="M44 48 Q43 46 42 48" stroke="#6b4226" stroke-width="1.5" fill="none"/><path d="M56 48 Q57 46 58 48" stroke="#6b4226" stroke-width="1.5" fill="none"/><path d="M44 62 Q50 60 56 62" stroke="#6b4226" stroke-width="1.5" fill="none"/>`;
const FACE_FIERCE = `<ellipse cx="43" cy="52" rx="3.5" ry="2" fill="#1a0a00"/><ellipse cx="57" cy="52" rx="3.5" ry="2" fill="#1a0a00"/><path d="M41 47 Q43 45 45 47" stroke="#5a3010" stroke-width="2" fill="none"/><path d="M55 47 Q57 45 59 47" stroke="#5a3010" stroke-width="2" fill="none"/><path d="M45 63 Q50 61 55 63" stroke="#6b4226" stroke-width="1.5" fill="none"/>`;
const FACE_CALM   = `<ellipse cx="43" cy="53" rx="3" ry="3.5" fill="#1a0a00"/><ellipse cx="57" cy="53" rx="3" ry="3.5" fill="#1a0a00"/><circle cx="44" cy="52" r="1" fill="white" opacity=".6"/><circle cx="58" cy="52" r="1" fill="white" opacity=".6"/><path d="M45 63 Q50 65 55 63" stroke="#6b4226" stroke-width="1.5" fill="none"/>`;
const FACE_DARK   = `<ellipse cx="43" cy="52" rx="3.5" ry="3" fill="#ff3030" opacity=".9"/><ellipse cx="57" cy="52" rx="3.5" ry="3" fill="#ff3030" opacity=".9"/><path d="M44 63 Q50 61 56 63" stroke="#8b0000" stroke-width="1.5" fill="none"/>`;
const FACE_GLOWING= `<ellipse cx="43" cy="52" rx="3.5" ry="3" fill="#00cfff"/><ellipse cx="57" cy="52" rx="3.5" ry="3" fill="#00cfff"/><circle cx="43" cy="52" r="2" fill="white" opacity=".5"/><circle cx="57" cy="52" r="2" fill="white" opacity=".5"/><path d="M45 63 Q50 65 55 63" stroke="#00cfff" stroke-width="1.5" fill="none"/>`;
const FACE_WISE   = `<ellipse cx="43" cy="53" rx="3" ry="3" fill="#2a1a00"/><ellipse cx="57" cy="53" rx="3" ry="3" fill="#2a1a00"/><path d="M40 47 Q43 45 46 47" stroke="#4a3010" stroke-width="1.8" fill="none"/><path d="M54 47 Q57 45 60 47" stroke="#4a3010" stroke-width="1.8" fill="none"/><path d="M42 38 Q43 36 45 38" stroke="#888" stroke-width="1.2" fill="none"/><path d="M55 38 Q57 36 59 38" stroke="#888" stroke-width="1.2" fill="none"/><path d="M45 63 Q50 65 55 63" stroke="#6b4226" stroke-width="1.5" fill="none"/>`;

// hat definitions
const HAT_KNIGHT    = `<path d="M30 44 Q30 25 50 23 Q70 25 70 44 Z" fill="#888"/><rect x="25" y="42" width="50" height="6" rx="2" fill="#666"/><rect x="32" y="30" width="36" height="20" rx="2" fill="#777"/><rect x="43" y="36" width="14" height="10" rx="1" fill="#1a1a2e"/>`;
const HAT_VIKING    = `<path d="M28 46 Q30 25 50 22 Q70 25 72 46 Z" fill="#8B4513"/><rect x="24" y="44" width="52" height="7" rx="2" fill="#6B3410"/><ellipse cx="24" cy="46" rx="6" ry="4" fill="#e8d5a0"/><ellipse cx="76" cy="46" rx="6" ry="4" fill="#e8d5a0"/><path d="M38 22 Q35 14 32 10" stroke="#8B4513" stroke-width="3" fill="none"/><path d="M62 22 Q65 14 68 10" stroke="#8B4513" stroke-width="3" fill="none"/>`;
const HAT_MAGE      = `<polygon points="50,5 30,45 70,45" fill="#4a0080"/><polygon points="50,5 30,45 70,45" fill="none" stroke="#9b30ff" stroke-width="1"/><rect x="24" y="43" width="52" height="7" rx="3" fill="#6a00b0"/><circle cx="50" cy="8" r="4" fill="#ffd700"/><path d="M42 20 L46 24 M54 18 L50 23" stroke="#ffd700" stroke-width="1" fill="none"/>`;
const HAT_NINJA     = `<rect x="28" y="32" width="44" height="28" rx="4" fill="#1a1a1a"/><rect x="28" y="50" width="44" height="12" rx="4" fill="#111"/><rect x="28" y="46" width="44" height="8" fill="#222"/><rect x="25" y="52" width="10" height="4" rx="1" fill="#1a1a1a"/><rect x="65" y="52" width="10" height="4" rx="1" fill="#1a1a1a"/>`;
const HAT_PIRATE    = `<path d="M22 46 Q25 28 50 24 Q75 28 78 46 Z" fill="#1a1a1a"/><rect x="18" y="44" width="64" height="8" rx="3" fill="#111"/><path d="M38 32 L50 26 L62 32" stroke="white" stroke-width="2" fill="none"/><circle cx="50" cy="26" r="3" fill="white"/><rect x="44" y="20" width="12" height="8" rx="1" fill="white"/><rect x="48" y="16" width="4" height="8" rx="1" fill="white"/>`;
const HAT_SAMURAI   = `<path d="M25 44 Q28 30 50 26 Q72 30 75 44" fill="#8B0000" stroke="#600" stroke-width="1"/><path d="M20 44 Q22 36 50 32 Q78 36 80 44" fill="none" stroke="#8B0000" stroke-width="3"/><rect x="24" y="42" width="52" height="6" rx="1" fill="#600"/><path d="M42 26 Q50 20 58 26" fill="#ffd700" stroke="#cc9900" stroke-width="1"/>`;
const HAT_WIZARD    = `<polygon points="50,3 28,46 72,46" fill="#1a3a6b"/><polygon points="50,3 28,46 72,46" fill="none" stroke="#4488ff" stroke-width="1.5"/><rect x="22" y="44" width="56" height="8" rx="4" fill="#2a4a8b"/><circle cx="42" cy="25" r="2" fill="#fff" opacity=".7"/><circle cx="58" cy="32" r="1.5" fill="#fff" opacity=".7"/><circle cx="50" cy="18" r="1.5" fill="#ffd700"/><circle cx="35" cy="38" r="1" fill="#fff" opacity=".5"/>`;
const HAT_ARCHER    = `<path d="M30 42 Q32 28 50 25 Q68 28 70 42" fill="#2d5a1b" stroke="#1a3a0a" stroke-width="1"/><path d="M35 34 Q50 28 65 34" fill="none" stroke="#1a3a0a" stroke-width="1.5"/><rect x="28" y="40" width="44" height="7" rx="2" fill="#1a3a0a"/><rect x="47" y="18" width="6" height="10" rx="1" fill="#8B4513"/><path d="M44 18 L50 12 L56 18" fill="#8B4513"/>`;
const HAT_PALADIN   = `<path d="M30 44 Q30 24 50 20 Q70 24 70 44 Z" fill="#c0a020"/><rect x="25" y="42" width="50" height="7" rx="2" fill="#a08010"/><path d="M42 34 L50 28 L58 34 L58 44 L42 44 Z" fill="#e0c040"/><path d="M50 28 L50 44 M42 36 L58 36" stroke="#c0a020" stroke-width="1.5"/>`;
const HAT_BERSERKER = `<path d="M28 46 Q28 28 50 24 Q72 28 72 46 Z" fill="#5a2a00"/><rect x="24" y="44" width="52" height="7" rx="2" fill="#3a1a00"/><path d="M28 36 Q24 28 20 30" stroke="#5a2a00" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M72 36 Q76 28 80 30" stroke="#5a2a00" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M36 26 Q34 18 38 16" stroke="#8B0000" stroke-width="2.5" fill="none"/><path d="M64 26 Q66 18 62 16" stroke="#8B0000" stroke-width="2.5" fill="none"/>`;
const HAT_DRUID     = `<path d="M30 45 Q32 32 50 28 Q68 32 70 45" fill="#2d5a1b"/><rect x="26" y="43" width="48" height="7" rx="3" fill="#1a3a0a"/><path d="M40 32 Q42 24 50 22 Q58 24 60 32" fill="#3a7a20"/><circle cx="50" cy="22" r="4" fill="#5aaa30"/><path d="M44 24 Q42 18 38 20 M56 24 Q58 18 62 20" stroke="#2d5a1b" stroke-width="1.5" fill="none"/>`;
const HAT_SPY       = `<path d="M22 46 Q25 30 50 26 Q75 30 78 46 Z" fill="#1a1a1a"/><rect x="18" y="44" width="64" height="7" rx="2" fill="#111"/><rect x="30" y="50" width="40" height="4" fill="#111"/><ellipse cx="50" cy="26" rx="15" ry="4" fill="#222"/>`;
const HAT_CYBORG    = `<path d="M28 46 Q28 26 50 22 Q72 26 72 46 Z" fill="#2a2a3a"/><rect x="24" y="44" width="52" height="7" rx="2" fill="#1a1a2a"/><rect x="38" y="26" width="24" height="16" rx="3" fill="#00cfff" opacity=".3"/><rect x="38" y="26" width="24" height="16" rx="3" fill="none" stroke="#00cfff" stroke-width="1.5"/><circle cx="44" cy="34" r="3" fill="#00cfff"/><circle cx="56" cy="34" r="3" fill="#ff3030"/><path d="M28 38 L34 38 M66 38 L72 38" stroke="#00cfff" stroke-width="2"/>`;
const HAT_DEMON     = `<path d="M30 46 Q30 28 50 24 Q70 28 70 46 Z" fill="#4a0000"/><rect x="26" y="44" width="48" height="7" rx="2" fill="#300000"/><path d="M34 30 Q30 18 28 12" stroke="#8B0000" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M66 30 Q70 18 72 12" stroke="#8B0000" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M34 30 Q32 22 36 16" stroke="#ff3030" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M66 30 Q68 22 64 16" stroke="#ff3030" stroke-width="2" stroke-linecap="round" fill="none"/>`;
const HAT_ANGEL     = `<ellipse cx="50" cy="22" rx="22" ry="5" fill="none" stroke="#ffd700" stroke-width="3"/><path d="M20 38 Q10 28 15 20 Q22 28 30 32" fill="#fff" opacity=".9"/><path d="M80 38 Q90 28 85 20 Q78 28 70 32" fill="#fff" opacity=".9"/>`;
const HAT_GHOST     = `<path d="M28 56 Q28 28 50 24 Q72 28 72 56 L65 50 L58 56 L50 50 L42 56 L35 50 Z" fill="#ddeeff" opacity=".9"/><rect x="28" y="24" width="44" height="32" rx="22" fill="#ddeeff" opacity=".85"/>`;
const HAT_ROBOT     = `<rect x="28" y="22" width="44" height="28" rx="6" fill="#3a3a4a"/><rect x="32" y="26" width="36" height="20" rx="4" fill="#2a2a3a"/><rect x="34" y="28" width="14" height="10" rx="2" fill="#00cfff" opacity=".8"/><rect x="52" y="28" width="14" height="10" rx="2" fill="#ff3030" opacity=".8"/><rect x="28" y="48" width="44" height="6" rx="2" fill="#3a3a4a"/><rect x="36" y="20" width="8" height="6" rx="2" fill="#555"/><rect x="56" y="20" width="8" height="6" rx="2" fill="#555"/>`;
const HAT_GLADIATOR = `<path d="M28 44 Q30 26 50 22 Q70 26 72 44" fill="#8B6914"/><path d="M28 44 L22 52 L24 54 L30 46" fill="#7a5810"/><path d="M72 44 L78 52 L76 54 L70 46" fill="#7a5810"/><rect x="26" y="42" width="48" height="7" rx="2" fill="#6a4808"/><path d="M40 28 Q50 22 60 28" stroke="#ffd700" stroke-width="2" fill="none"/>`;
const HAT_GUARD     = `<path d="M32 44 Q32 26 50 22 Q68 26 68 44 Z" fill="#556b2f"/><rect x="26" y="42" width="48" height="7" rx="2" fill="#3a4a1a"/><path d="M44 22 L50 16 L56 22" fill="#ffd700"/>`;
const HAT_RANGER    = `<path d="M22 46 Q26 30 50 26 Q74 30 78 46 Z" fill="#5c4a1e"/><rect x="20" y="44" width="60" height="7" rx="3" fill="#3c2a0e"/><path d="M35 36 Q50 30 65 36" fill="#4a3a10" stroke="#3c2a0e" stroke-width="1"/><circle cx="50" cy="30" r="3" fill="#8B4513"/>`;
const HAT_HUNTER    = `<path d="M26 46 Q28 30 50 26 Q72 30 74 46 Z" fill="#4a3010"/><rect x="22" y="44" width="56" height="7" rx="3" fill="#3a2008"/><path d="M35 32 L50 26 L65 32" fill="#2d1a00"/><path d="M44 18 Q50 14 56 18 Q50 22 44 18" fill="#8B4513"/>`;
const HAT_SORCERER  = `<polygon points="50,4 26,46 74,46" fill="#2a0044"/><rect x="20" y="44" width="60" height="8" rx="4" fill="#3a0066"/><circle cx="50" cy="4" r="5" fill="#ff44ff"/><path d="M38 28 Q44 22 50 28 Q56 22 62 28" stroke="#ff44ff" stroke-width="1.5" fill="none" opacity=".7"/>`;
const HAT_MONK      = `<path d="M32 46 Q32 30 50 26 Q68 30 68 46" fill="#cc6600"/><rect x="28" y="44" width="44" height="7" rx="2" fill="#aa4400"/><path d="M36 32 Q50 26 64 32" fill="none" stroke="#aa4400" stroke-width="2"/>`;
const HAT_ROGUE     = `<path d="M24 46 Q26 30 50 26 Q74 30 76 46 Z" fill="#1a1a2e"/><rect x="20" y="44" width="60" height="7" rx="3" fill="#111"/><path d="M28 38 Q50 32 72 38" fill="#222" stroke="#111" stroke-width="1"/><path d="M42 24 Q50 18 58 24" fill="#1a1a2e"/>`;
const HAT_THIEF     = `<path d="M30 46 Q32 34 50 30 Q68 34 70 46" fill="#2a1a00"/><rect x="26" y="44" width="48" height="7" rx="2" fill="#1a0e00"/><path d="M35 34 Q50 28 65 34 Q60 40 50 38 Q40 40 35 34" fill="#3a2a00"/>`;
const HAT_BARD      = `<path d="M24 46 Q26 28 50 24 Q74 28 76 46 Z" fill="#8B008B"/><rect x="20" y="44" width="60" height="7" rx="3" fill="#6a006a"/><path d="M68 30 Q76 22 74 18" stroke="#ffd700" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="74" cy="16" r="4" fill="#ffd700"/>`;
const HAT_ALIEN     = `<ellipse cx="50" cy="28" rx="26" ry="18" fill="#00440a" opacity=".9"/><ellipse cx="50" cy="28" rx="20" ry="14" fill="#006610" opacity=".9"/><ellipse cx="38" cy="18" rx="6" ry="9" fill="#00440a"/><ellipse cx="62" cy="18" rx="6" ry="9" fill="#00440a"/>`;
const HAT_ZOMBIE    = `<path d="M30 46 Q28 28 50 24 Q72 28 70 46 Z" fill="#2d4a00"/><rect x="26" y="44" width="48" height="7" rx="2" fill="#1a3000"/><path d="M35 30 Q36 24 40 26 M60 28 Q64 22 65 26" stroke="#5a7a00" stroke-width="2" fill="none"/><path d="M42 36 L44 32 M55 36 L53 30" stroke="#1a3000" stroke-width="2"/>`;
const HAT_DRAGON    = `<path d="M30 44 Q30 26 50 22 Q70 26 70 44" fill="#8B0000"/><path d="M30 34 Q20 22 22 14 Q28 22 34 28" fill="#8B0000"/><path d="M70 34 Q80 22 78 14 Q72 22 66 28" fill="#8B0000"/><rect x="26" y="42" width="48" height="7" rx="2" fill="#600000"/><path d="M40 24 Q50 18 60 24" stroke="#ffd700" stroke-width="2" fill="none"/>`;
const HAT_PILOT     = `<path d="M28 46 Q28 28 50 24 Q72 28 72 46 Z" fill="#1a2a3a"/><rect x="24" y="44" width="52" height="7" rx="2" fill="#111"/><rect x="32" y="28" width="36" height="18" rx="8" fill="#2a3a4a"/><rect x="34" y="30" width="32" height="14" rx="6" fill="#00cfff" opacity=".3"/><path d="M24 38 L30 36 M70 38 L76 36" stroke="#555" stroke-width="2"/>`;
const HAT_ENGINEER  = `<path d="M30 46 Q30 28 50 24 Q70 28 70 46 Z" fill="#3a3a00"/><rect x="26" y="44" width="48" height="7" rx="2" fill="#2a2a00"/><rect x="38" y="22" width="24" height="10" rx="2" fill="#5a5a00"/><rect x="44" y="16" width="4" height="8" fill="#888"/><rect x="52" y="16" width="4" height="8" fill="#888"/><circle cx="50" cy="26" r="3" fill="#ffd700"/>`;

// locked hats
const HAT_CROWN     = `<path d="M28 44 L34 26 L42 38 L50 20 L58 38 L66 26 L72 44 Z" fill="#ffd700" stroke="#cc9900" stroke-width="1"/><rect x="26" y="42" width="48" height="8" rx="3" fill="#cc9900"/><circle cx="50" cy="20" r="3" fill="#ff4444"/><circle cx="34" cy="26" r="2" fill="#4444ff"/><circle cx="66" cy="26" r="2" fill="#44ff44"/>`;
const HAT_MEDAL     = `<path d="M32 44 Q32 28 50 24 Q68 28 68 44" fill="#888"/><rect x="28" y="42" width="44" height="7" rx="2" fill="#666"/><circle cx="50" cy="30" r="10" fill="#ffd700" stroke="#cc9900" stroke-width="1.5"/><text x="50" y="34" text-anchor="middle" font-size="10" fill="#8B6914" font-weight="bold">1</text>`;
const HAT_QUILL     = `<path d="M26 46 Q28 30 50 26 Q72 30 74 46 Z" fill="#2a1a3a"/><rect x="22" y="44" width="56" height="7" rx="3" fill="#1a0a2a"/><path d="M60 22 Q72 10 76 6 Q74 16 66 26 Q64 28 60 26 Z" fill="#ddeeff"/><path d="M62 24 Q70 14 72 10" stroke="#aabbcc" stroke-width="1" fill="none"/>`;
const HAT_HEART     = `<path d="M30 46 Q30 28 50 24 Q70 28 70 46 Z" fill="#4a0020"/><rect x="26" y="44" width="48" height="7" rx="2" fill="#300010"/><path d="M50 36 Q44 28 38 30 Q34 32 36 38 Q38 44 50 50 Q62 44 64 38 Q66 32 62 30 Q56 28 50 36 Z" fill="#ff1a4a" transform="scale(0.45) translate(61, 12)"/>`;
const HAT_BOOK      = `<path d="M30 46 Q30 28 50 24 Q70 28 70 46 Z" fill="#1a3a5a"/><rect x="26" y="44" width="48" height="7" rx="2" fill="#0a2a4a"/><rect x="36" y="26" width="28" height="20" rx="2" fill="#c8a060"/><rect x="49" y="26" width="2" height="20" fill="#8B6914"/><path d="M38 30 L48 30 M38 34 L48 34 M38 38 L48 38" stroke="#8B6914" stroke-width="1"/>`;
const HAT_FIRE      = `<path d="M30 46 Q30 28 50 24 Q70 28 70 46 Z" fill="#3a1400"/><rect x="26" y="44" width="48" height="7" rx="2" fill="#2a0a00"/><path d="M50 24 Q44 16 46 10 Q50 16 54 10 Q56 16 58 12 Q56 20 60 18 Q56 26 50 24 Z" fill="#ff6600"/><path d="M50 24 Q46 18 48 14 Q50 18 52 14 Q52 20 54 18 Q52 24 50 24 Z" fill="#ffcc00"/>`;
const HAT_SKULL     = `<path d="M30 46 Q30 28 50 24 Q70 28 70 46 Z" fill="#1a1a1a"/><rect x="26" y="44" width="48" height="7" rx="2" fill="#111"/><ellipse cx="50" cy="30" rx="10" ry="10" fill="#ddd"/><ellipse cx="45" cy="28" rx="3" ry="4" fill="#1a1a1a"/><ellipse cx="55" cy="28" rx="3" ry="4" fill="#1a1a1a"/><path d="M44 37 L46 35 L48 37 L50 35 L52 37 L54 35 L56 37" stroke="#1a1a1a" stroke-width="1.5" fill="none"/>`;

// Build avatar SVG from components
const AVATAR_SVGS = {
  warrior:      mkSvg("#1a0a00","#3a1a00", FACE_FIERCE,  HAT_BERSERKER),
  knight:       mkSvg("#0a0a1a","#1a1a3a", FACE_STERN,   HAT_KNIGHT),
  berserker:    mkSvg("#1a0000","#3a0000", FACE_FIERCE,  HAT_BERSERKER),
  paladin:      mkSvg("#1a1400","#2a2400", FACE_CALM,    HAT_PALADIN),
  gladiator:    mkSvg("#1a0a00","#2a1500", FACE_FIERCE,  HAT_GLADIATOR),
  guard:        mkSvg("#0a1a00","#1a3000", FACE_STERN,   HAT_GUARD),
  mage:         mkSvg("#1a0030","#2a0050", FACE_WISE,    HAT_MAGE),
  wizard:       mkSvg("#0a0a2a","#0a1a4a", FACE_WISE,    HAT_WIZARD),
  druid:        mkSvg("#0a1a00","#1a3000", FACE_CALM,    HAT_DRUID),
  sorcerer:     mkSvg("#200030","#300050", FACE_FIERCE,  HAT_SORCERER),
  bard:         mkSvg("#200020","#380038", FACE_CALM,    HAT_BARD),
  monk:         mkSvg("#1a0a00","#2a1500", FACE_CALM,    HAT_MONK),
  ninja:        mkSvg("#0a0a0a","#1a1a1a", FACE_STERN,   HAT_NINJA),
  rogue:        mkSvg("#0a0a1a","#141428", FACE_STERN,   HAT_ROGUE),
  thief:        mkSvg("#1a0a00","#241400", FACE_STERN,   HAT_THIEF),
  spy:          mkSvg("#0a0a0a","#181818", FACE_CALM,    HAT_SPY),
  samurai:      mkSvg("#1a0000","#2a0808", FACE_STERN,   HAT_SAMURAI),
  archer:       mkSvg("#0a1400","#142000", FACE_CALM,    HAT_ARCHER),
  ranger:       mkSvg("#0a1a00","#142800", FACE_STERN,   HAT_RANGER),
  hunter:       mkSvg("#1a0a00","#281400", FACE_FIERCE,  HAT_HUNTER),
  pilot:        mkSvg("#000a1a","#001430", FACE_CALM,    HAT_PILOT),
  engineer:     mkSvg("#1a1400","#282000", FACE_CALM,    HAT_ENGINEER),
  cyborg:       mkSvg("#000a1a","#001428", FACE_GLOWING, HAT_CYBORG),
  robot:        mkSvg("#0a0a14","#141420", FACE_GLOWING, HAT_ROBOT),
  alien:        mkSvg("#000a00","#001400", FACE_GLOWING, HAT_ALIEN),
  zombie:       mkSvg("#0a1400","#101a00", FACE_DARK,    HAT_ZOMBIE),
  demon:        mkSvg("#1a0000","#2a0000", FACE_DARK,    HAT_DEMON),
  ghost:        mkSvg("#0a0a1a","#0a1428", FACE_CALM,    HAT_GHOST),
  angel:        mkSvg("#1a1400","#2a2800", FACE_CALM,    HAT_ANGEL),
  dragon:       mkSvg("#1a0000","#2a0808", FACE_FIERCE,  HAT_DRAGON),
  pirate:       mkSvg("#0a0a00","#1a1400", FACE_FIERCE,  HAT_PIRATE),
  viking:       mkSvg("#1a0a00","#2a1000", FACE_FIERCE,  HAT_VIKING),
  // locked
  rookie:       mkSvg("#001a10","#003020", FACE_CALM,    HAT_MEDAL),
  scout:        mkSvg("#001a10","#003020", FACE_STERN,   HAT_MEDAL),
  veteran:      mkSvg("#1a1000","#2a2000", FACE_STERN,   HAT_MEDAL),
  legend:       mkSvg("#1a0a00","#2a1400", FACE_FIERCE,  HAT_CROWN),
  immortal:     mkSvg("#1a0030","#2a0050", FACE_FIERCE,  HAT_CROWN),
  godlike:      mkSvg("#1a1000","#ffd70022", FACE_GLOWING,HAT_CROWN),
  critic:       mkSvg("#0a0a2a","#141440", FACE_WISE,    HAT_QUILL),
  journalist:   mkSvg("#0a0a2a","#141440", FACE_WISE,    HAT_BOOK),
  fanboy:       mkSvg("#1a0010","#2a0020", FACE_CALM,    HAT_HEART),
  hater:        mkSvg("#1a0000","#2a0000", FACE_DARK,    HAT_SKULL),
  completionist:mkSvg("#1a1000","#2a2000", FACE_STERN,   HAT_CROWN),
  champion:     mkSvg("#1a0a00","#2a1400", FACE_FIERCE,  HAT_CROWN),
  dreamer:      mkSvg("#0a0a2a","#101040", FACE_CALM,    HAT_HEART),
  collector:    mkSvg("#001a10","#002a20", FACE_CALM,    HAT_BOOK),
  curator:      mkSvg("#0a0a2a","#14143a", FACE_WISE,    HAT_BOOK),
  speedrunner:  mkSvg("#1a0a00","#2a1000", FACE_FIERCE,  HAT_MEDAL),
  dropout:      mkSvg("#0a0a0a","#141414", FACE_DARK,    HAT_SKULL),
  devotee:      mkSvg("#1a0010","#2a0020", FACE_CALM,    HAT_HEART),
  pessimist:    mkSvg("#0a0a00","#141400", FACE_DARK,    HAT_SKULL),
  balanced:     mkSvg("#0a0a1a","#141428", FACE_CALM,    HAT_BOOK),
  explorer2:    mkSvg("#001a10","#003020", FACE_STERN,   HAT_MEDAL),
  wanderer:     mkSvg("#0a1400","#142000", FACE_CALM,    HAT_RANGER),
  nomad:        mkSvg("#1a0a00","#281000", FACE_STERN,   HAT_RANGER),
  hardcore:     mkSvg("#1a0000","#2a0000", FACE_FIERCE,  HAT_FIRE),
  perfectionist:mkSvg("#1a1400","#2a2000", FACE_WISE,    HAT_CROWN),
  retrogamer:   mkSvg("#0a0a1a","#101030", FACE_CALM,    HAT_MEDAL),
  indie:        mkSvg("#0a1a10","#102820", FACE_CALM,    HAT_QUILL),
  marathon:     mkSvg("#1a0a00","#2a1000", FACE_STERN,   HAT_FIRE),
  archivist:    mkSvg("#0a0a2a","#10103a", FACE_WISE,    HAT_BOOK),
  oracle:       mkSvg("#1a0030","#280050", FACE_GLOWING, HAT_CROWN),
  overlord:     mkSvg("#1a0000","#300000", FACE_DARK,    HAT_CROWN),
  phantom:      mkSvg("#0a0a1a","#0a1428", FACE_GLOWING, HAT_SKULL),
  titan:        mkSvg("#0a0a0a","#181818", FACE_FIERCE,  HAT_CROWN),
};

const FREE_AVATARS = [
  { id:"warrior",    label:"Warrior"    },
  { id:"knight",     label:"Knight"     },
  { id:"berserker",  label:"Berserker"  },
  { id:"paladin",    label:"Paladin"    },
  { id:"gladiator",  label:"Gladiator"  },
  { id:"guard",      label:"Guard"      },
  { id:"mage",       label:"Mage"       },
  { id:"wizard",     label:"Wizard"     },
  { id:"druid",      label:"Druid"      },
  { id:"sorcerer",   label:"Sorcerer"   },
  { id:"bard",       label:"Bard"       },
  { id:"monk",       label:"Monk"       },
  { id:"ninja",      label:"Ninja"      },
  { id:"rogue",      label:"Rogue"      },
  { id:"thief",      label:"Thief"      },
  { id:"spy",        label:"Spy"        },
  { id:"samurai",    label:"Samurai"    },
  { id:"archer",     label:"Archer"     },
  { id:"ranger",     label:"Ranger"     },
  { id:"hunter",     label:"Hunter"     },
  { id:"pilot",      label:"Pilot"      },
  { id:"engineer",   label:"Engineer"   },
  { id:"cyborg",     label:"Cyborg"     },
  { id:"robot",      label:"Robot"      },
  { id:"alien",      label:"Alien"      },
  { id:"zombie",     label:"Zombie"     },
  { id:"demon",      label:"Demon"      },
  { id:"ghost",      label:"Ghost"      },
  { id:"angel",      label:"Angel"      },
  { id:"dragon",     label:"Dragon"     },
  { id:"pirate",     label:"Pirate"     },
  { id:"viking",     label:"Viking"     },
];

const LOCKED_AVATARS = [
  { id:"legend",      label:"Legend",      cond:(r,_) => Object.keys(r).length >= 50 },
  { id:"grandmaster", label:"Grandmaster", cond:(r,_) => Object.keys(r).length >= 100 },
  { id:"champion",    label:"Champion",    cond:(r,_) => Object.values(r).some(x=>x.rating===10) },
  { id:"critic",      label:"Critic",      cond:(r,_) => Object.values(r).filter(x=>x.comment?.length>10).length >= 5 },
  { id:"completionist",label:"Completionist",cond:(_,s)=>Object.values(s).filter(x=>x==="completed").length>=10 },
  { id:"collector2",  label:"Collector",   cond:(r,_) => Object.keys(r).length >= 25 },
  { id:"explorer2",   label:"Explorer",    cond:(_,s) => Object.keys(s).length >= 10 },
  { id:"hunter2",     label:"Hunter",      cond:(_,s) => Object.values(s).filter(x=>x==="wishlist").length>=10 },
  { id:"speedrunner", label:"Speedrunner", cond:(r,_) => Object.keys(r).length >= 10 },
  { id:"veteran",     label:"Veteran",     cond:(r,_) => Object.keys(r).length >= 30 },
  { id:"elite",       label:"Elite",       cond:(r,_) => Object.keys(r).length >= 75 },
  { id:"phantom",     label:"Phantom",     cond:(_,s) => Object.values(s).filter(x=>x==="dropped").length>=5 },
  { id:"warlord",     label:"Warlord",     cond:(r,_) => Object.values(r).filter(x=>x.rating<=3).length>=5 },
  { id:"overlord",    label:"Overlord",    cond:(r,_) => Object.keys(r).length >= 150 },
  { id:"shadow",      label:"Shadow",      cond:(_,s) => Object.values(s).filter(x=>x==="playing").length>=3 },
  { id:"titan",       label:"Titan",       cond:(r,_) => Object.keys(r).length >= 200 },
  { id:"oracle",      label:"Oracle",      cond:(r,_) => Object.values(r).filter(x=>x.comment?.length>50).length>=10 },
  { id:"prophet",     label:"Prophet",     cond:(r,_) => Object.values(r).filter(x=>x.rating>=9).length>=10 },
  { id:"divine",      label:"Divine",      cond:(r,_) => Object.values(r).filter(x=>x.rating===10).length>=5 },
  { id:"immortal",    label:"Immortal",    cond:(r,_) => Object.keys(r).length >= 300 },
  { id:"dragon2",     label:"Dragon Lord", cond:(_,s) => Object.values(s).filter(x=>x==="completed").length>=25 },
  { id:"specter",     label:"Specter",     cond:(r,_) => Object.keys(r).length >= 20 },
  { id:"sovereign",   label:"Sovereign",   cond:(r,_) => Object.keys(r).length >= 500 },
  { id:"architect",   label:"Architect",   cond:(r,_) => Object.values(r).filter(x=>x.comment?.length>0).length>=20 },
  { id:"sentinel",    label:"Sentinel",    cond:(_,s) => Object.keys(s).length >= 20 },
  { id:"wraith",      label:"Wraith",      cond:(r,_) => Object.values(r).filter(x=>x.rating<=2).length>=3 },
  { id:"blademaster", label:"Blademaster", cond:(r,_) => Object.keys(r).length >= 40 },
  { id:"phoenix",     label:"Phoenix",     cond:(_,s) => Object.values(s).filter(x=>x==="completed").length>=5 },
  { id:"glacier",     label:"Glacier",     cond:(r,_) => Object.values(r).filter(x=>x.rating>=8).length>=20 },
  { id:"nebula",      label:"Nebula",      cond:(r,_) => Object.keys(r).length >= 60 },
  { id:"cosmos",      label:"Cosmos",      cond:(r,_) => Object.keys(r).length >= 80 },
  { id:"eclipse",     label:"Eclipse",     cond:(r,_) => Object.keys(r).length >= 120 },
];

const AvatarGallery = ({ avatarUrl, setAvatarUrl, userRatings, userStatus }) => {
  const [tab, setTab] = useState("free");
  const list = tab === "free" ? FREE_AVATARS : LOCKED_AVATARS;

  return (
    <div style={{ marginBottom:16 }}>
      {/* Preview */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
        <div style={{ width:64, height:64, borderRadius:16, overflow:"hidden", border:"2px solid rgba(255,107,53,.5)", background:"rgba(255,255,255,.05)", flexShrink:0 }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>👤</div>
          }
        </div>
        <div>
          <div style={{ color:"var(--c-text)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13 }}>Avatar actuel</div>
          <div style={{ color:"var(--c-text-3)", fontSize:11, fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>Clique sur un avatar pour le sélectionner</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:12, background:"rgba(255,255,255,.04)", borderRadius:10, padding:4 }}>
        {[["free","🎮 Gratuits (32)"],["locked","🔒 Débloquables (32)"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{ flex:1, padding:"7px 8px", borderRadius:8, border:tab===id?"1px solid rgba(255,107,53,.3)":"1px solid transparent", background:tab===id?"rgba(255,107,53,.1)":"transparent", color:tab===id?"#ffd166":"var(--c-text-3)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer", transition:"all .15s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, maxHeight:340, overflowY:"auto", paddingRight:4 }}>
        {list.map(av => {
          const url = AVATAR_SVGS[av.id];
          const unlocked = tab === "free" || av.cond(userRatings, userStatus);
          const selected = avatarUrl === url;
          return (
            <div key={av.id} title={unlocked ? av.label : `🔒 ${av.hint}`}
              onClick={() => unlocked && setAvatarUrl(url)}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:unlocked?"pointer":"not-allowed" }}>
              <div style={{ position:"relative", borderRadius:12, overflow:"hidden", border:selected?"2px solid #ff6b35":"2px solid rgba(255,255,255,.08)", background:"#1a1025", width:"100%", aspectRatio:"1", transition:"border-color .15s, transform .15s, box-shadow .15s", transform:selected?"scale(1.06)":"scale(1)", boxShadow:selected?"0 0 16px rgba(255,107,53,.4)":"none" }}>
                <img src={url} alt={av.label} style={{ width:"100%", height:"100%", display:"block", filter:unlocked?"none":"grayscale(1) brightness(.35)" }} loading="lazy" />
                {!unlocked && (
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, background:"rgba(0,0,0,.3)" }}>🔒</div>
                )}
                {selected && (
                  <div style={{ position:"absolute", bottom:4, right:4, width:10, height:10, borderRadius:"50%", background:"#ff6b35", boxShadow:"0 0 8px #ff6b35" }} />
                )}
              </div>
              <span style={{ fontSize:10, color:selected?"#ffd166":"rgba(255,255,255,.35)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, textAlign:"center", letterSpacing:.3, transition:"color .15s" }}>
                {av.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── USERNAME EDIT ────────────────────────────────────────── */
/* ── SETTINGS MODAL ───────────────────────────────────────── */
const SettingsModal = ({ user, profileUsername, setProfileUsername, profileAvatar, setProfileAvatar, onClose, onDeleteAccount, userRatings, userStatus, t }) => {
  const [section, setSection]       = useState("profile");
  const [username, setUsername]     = useState(profileUsername);
  const [bio, setBio]               = useState("");
  const [avatarUrl, setAvatarUrl]   = useState(profileAvatar || "");
  const [isPublic, setIsPublic]     = useState(true);
  const [newEmail, setNewEmail]     = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [phone, setPhone]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState(null); // { type: "ok"|"err", text }
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    setUsername(profileUsername);
    // Load extra profile data
    supabase.from("profiles").select("bio,avatar_url,is_public,phone").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setBio(data.bio || "");
          setAvatarUrl(data.avatar_url || "");
          setIsPublic(data.is_public !== false);
          setPhone(data.phone || "");
        }
      });
  }, [user.id, profileUsername]);

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };

  const saveProfile = async () => {
    setSaving(true);
    const uname = username.trim();
    if (!uname) { flash("err", t("settings_err_username")); setSaving(false); return; }
    await supabase.from("profiles").upsert({ id: user.id, username: uname, bio: bio.trim(), avatar_url: avatarUrl, is_public: isPublic, phone: phone.trim() });
    await supabase.auth.updateUser({ data: { username: uname } });
    setProfileUsername(uname);
    setProfileAvatar(avatarUrl);
    flash("ok", t("settings_saved"));
    setSaving(false);
  };

  const saveEmail = async () => {
    if (!newEmail) { flash("err", t("fillFields")); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { flash("err", t("invalidEmail")); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) flash("err", error.message);
    else flash("ok", t("settings_email_sent"));
    setSaving(false);
  };

  const savePassword = async () => {
    if (!newPw || !confirmPw) { flash("err", t("fillFields")); return; }
    if (newPw.length < 6) { flash("err", t("pwShort")); return; }
    if (newPw !== confirmPw) { flash("err", t("settings_err_pw_match")); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) flash("err", error.message);
    else { flash("ok", t("settings_pw_saved")); setNewPw(""); setConfirmPw(""); }
    setSaving(false);
  };

  const savePrivacy = async () => {
    setSaving(true);
    await supabase.from("profiles").upsert({ id: user.id, is_public: isPublic });
    flash("ok", t("settings_saved"));
    setSaving(false);
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== "SUPPRIMER") { flash("err", t("settings_err_delete_confirm")); return; }
    setSaving(true);
    // Delete user data then call onDeleteAccount
    await supabase.from("game_ratings").delete().eq("user_id", user.id);
    await supabase.from("game_status").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    onDeleteAccount();
    onClose();
  };

  const SECTIONS = [
    { id:"profile", icon:"👤", label:t("settings_tab_profile") },
    { id:"account", icon:"🔐", label:t("settings_tab_account") },
    { id:"privacy", icon:"🔒", label:t("settings_tab_privacy") },
    { id:"danger",  icon:"⚠️", label:t("settings_tab_danger") },
  ];

  const inputStyle = { width:"100%", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, color:"#fff", padding:"10px 14px", fontSize:14, fontFamily:"'Space Grotesk',sans-serif", outline:"none", boxSizing:"border-box", transition:"border-color .15s" };
  const labelStyle = { fontSize:11, color:"rgba(255,255,255,.35)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6, display:"block" };
  const fieldWrap  = { marginBottom:16 };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,.85)", backdropFilter:"blur(20px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, animation:"fadeIn .2s" }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:600, maxHeight:"90vh", borderRadius:22, background:"var(--c-modal)", border:"1px solid var(--c-border)", overflow:"hidden", animation:"scaleIn .25s cubic-bezier(.34,1.3,.64,1)", boxShadow:"0 60px 120px rgba(0,0,0,.7)", display:"flex", flexDirection:"column" }}>

        {/* Top bar */}
        <div style={{ height:3, background:"linear-gradient(90deg,#ff6b35,#ffd166,#a78bfa)", flexShrink:0 }} />

        {/* Header */}
        <div style={{ padding:"20px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:"var(--c-text)", margin:0 }}>{t("settings_title")}</h2>
          <button onClick={onClose} style={{ background:"var(--c-el)", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--c-text-3)", cursor:"pointer", fontSize:16 }}>✕</button>
        </div>

        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
          {/* Sidebar */}
          <div style={{ width:160, flexShrink:0, padding:"16px 12px", borderRight:"1px solid var(--c-border)", display:"flex", flexDirection:"column", gap:4 }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={()=>setSection(s.id)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, background:section===s.id?"rgba(255,107,53,.12)":"transparent", border:section===s.id?"1px solid rgba(255,107,53,.25)":"1px solid transparent", color:section===s.id?"#ffd166":"var(--c-text-3)", fontSize:13, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, cursor:"pointer", textAlign:"left", transition:"all .15s", width:"100%" }}>
                <span>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex:1, padding:"20px 24px", overflowY:"auto" }}>

            {/* Flash message */}
            {msg && (
              <div style={{ marginBottom:16, padding:"10px 14px", borderRadius:10, fontSize:13, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, background:msg.type==="ok"?"rgba(74,222,128,.08)":"rgba(255,77,77,.08)", border:`1px solid ${msg.type==="ok"?"rgba(74,222,128,.2)":"rgba(255,77,77,.2)"}`, color:msg.type==="ok"?"#4ade80":"#ff6b6b" }}>
                {msg.type==="ok" ? "✓ " : "✕ "}{msg.text}
              </div>
            )}

            {/* ── PROFILE ── */}
            {section === "profile" && (
              <div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>{t("settings_username")}</label>
                  <input style={inputStyle} value={username} onChange={e=>setUsername(e.target.value)}
                    onFocus={e=>e.target.style.borderColor="rgba(255,107,53,.5)"}
                    onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>{t("settings_bio")}</label>
                  <textarea style={{ ...inputStyle, minHeight:80, resize:"vertical" }} value={bio} onChange={e=>setBio(e.target.value)}
                    placeholder={t("settings_bio_placeholder")}
                    onFocus={e=>e.target.style.borderColor="rgba(255,107,53,.5)"}
                    onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>{t("settings_avatar")}</label>
                  <AvatarGallery avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} userRatings={userRatings} userStatus={userStatus} />
                </div>
                <button onClick={saveProfile} disabled={saving} className="btn" style={{ width:"100%", justifyContent:"center", display:"flex", alignItems:"center", gap:8 }}>
                  {saving && <div className="spin" style={{ width:14, height:14, borderWidth:2 }} />}
                  {saving ? "…" : t("settings_save")}
                </button>
              </div>
            )}

            {/* ── ACCOUNT ── */}
            {section === "account" && (
              <div>
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.25)", fontFamily:"'Space Grotesk',sans-serif", marginBottom:16, padding:"10px 14px", background:"rgba(255,255,255,.03)", borderRadius:10, border:"1px solid rgba(255,255,255,.06)" }}>
                    {t("settings_current_email")} <span style={{ color:"#ffd166", fontWeight:700 }}>{user.email}</span>
                  </div>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>{t("settings_new_email")}</label>
                    <input style={inputStyle} type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="nouvelle@email.com"
                      onFocus={e=>e.target.style.borderColor="rgba(255,107,53,.5)"}
                      onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"} />
                  </div>
                  <button onClick={saveEmail} disabled={saving} className="btn" style={{ width:"100%", justifyContent:"center", display:"flex", alignItems:"center", gap:8 }}>
                    {saving && <div className="spin" style={{ width:14, height:14, borderWidth:2 }} />}
                    {saving ? "…" : t("settings_change_email")}
                  </button>
                </div>

                <div style={{ height:1, background:"var(--c-border)", margin:"20px 0" }} />

                <div>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>{t("settings_new_pw")}</label>
                    <input style={inputStyle} type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="••••••••"
                      onFocus={e=>e.target.style.borderColor="rgba(255,107,53,.5)"}
                      onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"} />
                  </div>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>{t("settings_confirm_pw")}</label>
                    <input style={inputStyle} type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="••••••••"
                      onFocus={e=>e.target.style.borderColor="rgba(255,107,53,.5)"}
                      onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"} />
                  </div>
                  <button onClick={savePassword} disabled={saving} className="btn" style={{ width:"100%", justifyContent:"center", display:"flex", alignItems:"center", gap:8 }}>
                    {saving && <div className="spin" style={{ width:14, height:14, borderWidth:2 }} />}
                    {saving ? "…" : t("settings_change_pw")}
                  </button>
                </div>

                <div style={{ height:1, background:"var(--c-border)", margin:"20px 0" }} />

                <div style={fieldWrap}>
                  <label style={labelStyle}>{t("settings_phone")}</label>
                  <input style={inputStyle} type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+33 6 12 34 56 78"
                    onFocus={e=>e.target.style.borderColor="rgba(255,107,53,.5)"}
                    onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"} />
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.2)", marginTop:6, fontFamily:"'Space Grotesk',sans-serif" }}>{t("settings_phone_hint")}</div>
                </div>
                <button onClick={saveProfile} disabled={saving} className="btn" style={{ width:"100%", justifyContent:"center", display:"flex", alignItems:"center", gap:8 }}>
                  {saving && <div className="spin" style={{ width:14, height:14, borderWidth:2 }} />}
                  {saving ? "…" : t("settings_save")}
                </button>
              </div>
            )}

            {/* ── PRIVACY ── */}
            {section === "privacy" && (
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px", background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:12, marginBottom:16 }}>
                  <div>
                    <div style={{ color:"var(--c-text)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:14, marginBottom:3 }}>{t("settings_public_profile")}</div>
                    <div style={{ color:"var(--c-text-3)", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{t("settings_public_desc")}</div>
                  </div>
                  <button onClick={()=>setIsPublic(p=>!p)}
                    style={{ width:44, height:24, borderRadius:99, border:"none", cursor:"pointer", background:isPublic?"#ff6b35":"rgba(255,255,255,.1)", transition:"background .2s", position:"relative", flexShrink:0 }}>
                    <div style={{ position:"absolute", top:3, left:isPublic?22:3, width:18, height:18, borderRadius:99, background:"white", transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,.3)" }} />
                  </button>
                </div>
                <button onClick={savePrivacy} disabled={saving} className="btn" style={{ width:"100%", justifyContent:"center", display:"flex", alignItems:"center", gap:8 }}>
                  {saving && <div className="spin" style={{ width:14, height:14, borderWidth:2 }} />}
                  {saving ? "…" : t("settings_save")}
                </button>
              </div>
            )}

            {/* ── DANGER ZONE ── */}
            {section === "danger" && (
              <div>
                <div style={{ padding:"16px 18px", background:"rgba(255,77,77,.04)", border:"1px solid rgba(255,77,77,.15)", borderRadius:12, marginBottom:20 }}>
                  <div style={{ color:"#ff6b6b", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, marginBottom:6 }}>{t("settings_delete_title")}</div>
                  <div style={{ color:"rgba(255,255,255,.4)", fontSize:13, fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}>{t("settings_delete_desc")}</div>
                </div>
                <div style={fieldWrap}>
                  <label style={{ ...labelStyle, color:"rgba(255,100,100,.5)" }}>{t("settings_delete_confirm_label")}</label>
                  <input style={{ ...inputStyle, borderColor:"rgba(255,77,77,.2)" }} value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} placeholder='SUPPRIMER'
                    onFocus={e=>e.target.style.borderColor="rgba(255,77,77,.5)"}
                    onBlur={e=>e.target.style.borderColor="rgba(255,77,77,.2)"} />
                </div>
                <button onClick={deleteAccount} disabled={saving || deleteConfirm !== "SUPPRIMER"}
                  style={{ width:"100%", padding:"12px", borderRadius:10, background:deleteConfirm==="SUPPRIMER"?"rgba(255,77,77,.15)":"rgba(255,255,255,.03)", border:`1px solid ${deleteConfirm==="SUPPRIMER"?"rgba(255,77,77,.4)":"rgba(255,255,255,.06)"}`, color:deleteConfirm==="SUPPRIMER"?"#ff6b6b":"rgba(255,255,255,.2)", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14, cursor:deleteConfirm==="SUPPRIMER"?"pointer":"not-allowed", transition:"all .2s" }}>
                  {saving ? "…" : t("settings_delete_btn")}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

const UsernameEdit = ({ user, profileUsername, setProfileUsername, t }) => {
  const [uEdit, setUEdit] = useState(profileUsername);
  const [uSaved, setUSaved] = useState(false);
  useEffect(() => { setUEdit(profileUsername); }, [profileUsername]);
  const saveUsername = async () => {
    if (!uEdit.trim()) return;
    await supabase.from("profiles").upsert({ id: user.id, username: uEdit.trim() });
    await supabase.auth.updateUser({ data: { username: uEdit.trim() } });
    setProfileUsername(uEdit.trim());
    setUSaved(true);
    setTimeout(() => setUSaved(false), 2000);
  };
  return (
    <div style={{ marginBottom:28, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", borderRadius:14, padding:"16px 18px" }}>
      <div style={{ fontSize:10, color:"rgba(255,255,255,.3)", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:2.5, textTransform:"uppercase", marginBottom:10 }}>{t("pseudoLabel")}</div>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <input value={uEdit} onChange={e=>setUEdit(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveUsername()}
          placeholder={t("pseudoPlaceholder")}
          style={{ flex:1, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, color:"#fff", padding:"9px 14px", fontSize:14, fontFamily:"'Space Grotesk',sans-serif", outline:"none", transition:"all .2s" }}
          onFocus={e=>{e.target.style.borderColor="rgba(255,107,53,.45)";e.target.style.boxShadow="0 0 0 3px rgba(255,107,53,.09)";}}
          onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.1)";e.target.style.boxShadow="none";}}
        />
        <button onClick={saveUsername} style={{ background:"rgba(255,107,53,.12)", border:"1px solid rgba(255,107,53,.28)", borderRadius:10, color:"#ff6b35", cursor:"pointer", fontSize:13, padding:"9px 18px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, whiteSpace:"nowrap", transition:"all .18s" }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,107,53,.22)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,107,53,.12)";}}>
          {uSaved ? "✓" : t("editBtn")}
        </button>
      </div>
      {uSaved && <div style={{ color:"#ffd166", fontSize:12, marginTop:8, fontFamily:"'Space Grotesk',sans-serif" }}>{t("pseudoSaved")}</div>}
    </div>
  );
};

/* ── LEGAL MODAL ──────────────────────────────────────────── */
const LEGAL_CONTENT = {
  tos: {
    title: "Terms of Service",
    body: `Last updated: April 2026

1. ACCEPTANCE
By accessing JoystickLog you agree to these terms. If you do not agree, do not use the service.

2. SERVICE
JoystickLog is a free platform allowing users to rate, review and track video games. We reserve the right to modify or discontinue the service at any time.

3. USER ACCOUNTS
You are responsible for maintaining the confidentiality of your account. You must not create accounts via automated means or share misleading information.

4. USER CONTENT
You retain ownership of content you submit (reviews, ratings). By submitting content you grant JoystickLog a non-exclusive, royalty-free licence to display it. You must not post content that is illegal, abusive or infringing third-party rights.

5. GAME DATA
Game information (titles, covers, descriptions) is provided by IGDB (Internet Game Database) under their terms. JoystickLog is not responsible for inaccuracies in third-party data.

6. INTELLECTUAL PROPERTY
The JoystickLog name, logo and interface are the property of their respective owners. Unauthorized reproduction is prohibited.

7. LIMITATION OF LIABILITY
JoystickLog is provided "as is" without warranties. We shall not be liable for any indirect or consequential damages arising from use of the service.

8. GOVERNING LAW
These terms are governed by the laws of France. Any dispute shall be subject to the jurisdiction of French courts.

Contact: contact@joystick-log.com`,
  },
  privacy: {
    title: "Privacy Policy",
    body: `Last updated: April 2026

1. DATA COLLECTED
- Account data: email address, username (required for registration)
- Usage data: game ratings, reviews, wishlist and status entries you create
- Technical data: browser type, approximate timezone (for language detection)
We do not collect payment data. We do not sell your personal data.

2. HOW WE USE YOUR DATA
- Provide and improve the service
- Display your public profile and ratings to other users
- Send transactional emails (password reset, account confirmation)

3. DATA STORAGE
Your data is stored securely via Supabase (EU region). We apply industry-standard security measures.

4. THIRD-PARTY SERVICES
- IGDB / Twitch API: game data (no personal data shared)
- Google Translate API: synopsis translation (text only, no account data)
- Supabase: database and authentication

5. YOUR RIGHTS (GDPR)
You have the right to: access, rectify, delete your data, and object to processing. To exercise these rights contact us at: contact@joystick-log.com

6. COOKIES
We use only technically necessary cookies for session management. No advertising or tracking cookies.

7. CONTACT
Data controller: JoystickLog — contact@joystick-log.com`,
  },
  legal: {
    title: "Legal Notices",
    body: `PUBLISHER
JoystickLog
Contact: contact@joystick-log.com

HOSTING
Vercel Inc. — 340 Pine Street, Suite 701, San Francisco, CA 94104, USA
Supabase Inc. (database) — EU region servers

INTELLECTUAL PROPERTY
The JoystickLog platform, its design and original content are protected by copyright. Game data is provided by IGDB (Twitch Interactive, Inc.) under their API terms of service.

DISCLAIMER
JoystickLog makes no warranty as to the accuracy or completeness of game information sourced from IGDB. Users are responsible for the content they submit.

CONTACT
For any enquiry: contact@joystick-log.com`,
  },
};

const LegalModal = ({ type, onClose }) => {
  const content = LEGAL_CONTENT[type];
  if (!content) return null;
  return (
    <div className="legal-modal-overlay" onClick={onClose}>
      <div className="legal-modal" onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:"#fff" }}>{content.title}</div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:8, color:"rgba(255,255,255,.5)", cursor:"pointer", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>✕</button>
        </div>
        <pre style={{ whiteSpace:"pre-wrap", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, color:"rgba(255,255,255,.45)", lineHeight:1.85, margin:0 }}>{content.body}</pre>
      </div>
    </div>
  );
};

/* ── PUBLIC PROFILE ───────────────────────────────────────── */
const PublicProfile = ({ username, onClose, onGameClick, t }) => {
  const [ratings, setRatings] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    supabase.from('ratings').select('*').eq('user_display', username)
      .order('updated_at', { ascending: false }).limit(100)
      .then(({ data: rData }) => {
        setRatings(rData || []);
        const uid = rData?.[0]?.user_id;
        if (uid) {
          supabase.from('game_status').select('*').eq('user_id', uid)
            .then(({ data: sData }) => { setStatuses(sData || []); setLoading(false); });
        } else { setLoading(false); }
      }).catch(() => setLoading(false));
  }, [username]);

  const initials = username ? username.slice(0,2).toUpperCase() : "??";
  const avgRating = ratings.length ? (ratings.reduce((s,r)=>s+r.rating,0)/ratings.length).toFixed(1) : "—";
  const completed = statuses.filter(s=>s.status==="completed").length;
  const playing   = statuses.filter(s=>s.status==="playing").length;
  const reviews   = ratings.filter(r=>r.comment?.length > 0);

  const BADGE_COLOR = ["#ff6b35","#ffd166","#a78bfa","#34d399","#60a5fa","#f472b6","#fb923c","#4ade80"];
  const col = BADGE_COLOR[username ? username.charCodeAt(0) % BADGE_COLOR.length : 0];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.88)", backdropFilter:"blur(18px)", zIndex:9000, overflowY:"auto" }}
      onClick={onClose}>
      <div style={{ maxWidth:780, margin:"0 auto", padding:"40px 20px 80px" }} onClick={e=>e.stopPropagation()}>

        {/* Close */}
        <button onClick={onClose} style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, color:"rgba(255,255,255,.5)", cursor:"pointer", padding:"8px 16px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:12, marginBottom:32, display:"flex", alignItems:"center", gap:6 }}>
          ← {t("home")}
        </button>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:24, marginBottom:36 }}>
          <div style={{ width:72, height:72, borderRadius:20, background:`linear-gradient(135deg,${col},${col}88)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:26, color:"#fff", flexShrink:0, boxShadow:`0 0 32px ${col}44` }}>{initials}</div>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, color:"#fff", letterSpacing:"-.5px" }}>{username}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.28)", fontFamily:"'Space Grotesk',sans-serif", marginTop:4 }}>{t("player")}</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:36 }}>
          {[
            { n: ratings.length, l: t("gamesRated") },
            { n: avgRating,      l: t("avgRating") },
            { n: completed,      l: t("s_completed") },
            { n: playing,        l: t("s_playing") },
          ].map(s => (
            <div key={s.l} style={{ background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, padding:"16px 18px", textAlign:"center" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:col, lineHeight:1, marginBottom:4 }}>{loading ? "…" : s.n}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.25)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Recent games grid */}
        {ratings.length > 0 && (
          <div style={{ marginBottom:36 }}>
            <div style={{ fontSize:10, color:"rgba(255,107,53,.6)", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:3, textTransform:"uppercase", marginBottom:14 }}>{t("myRatings")}</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {ratings.slice(0,18).map(r => (
                <div key={r.game_id} onClick={()=>{ if(r.game_cover) onGameClick({ id:r.game_id, title:r.game_title, cover:r.game_cover, platform:null, year:"—", genre:null, rating:null, reviews:0, tags:[], summary:"", allPlatforms:[], videoId:null }); }}
                  style={{ width:52, height:72, borderRadius:8, overflow:"hidden", background:"rgba(255,255,255,.05)", cursor:r.game_cover?"pointer":"default", position:"relative", flexShrink:0, border:"1px solid rgba(255,255,255,.07)" }}>
                  {r.game_cover && <img src={r.game_cover} alt={r.game_title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
                  <div style={{ position:"absolute", bottom:2, right:2, background:`${rc(r.rating)}cc`, borderRadius:4, padding:"1px 5px", fontSize:9, fontFamily:"'Syne',sans-serif", fontWeight:800, color:"#fff" }}>{r.rating}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div>
            <div style={{ fontSize:10, color:"rgba(255,107,53,.6)", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:3, textTransform:"uppercase", marginBottom:14 }}>{t("communitySection")}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {reviews.slice(0,8).map(r => (
                <div key={r.game_id} style={{ background:"rgba(255,255,255,.022)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, padding:"14px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                    {r.game_cover && <img src={r.game_cover} alt="" style={{ width:32, height:42, borderRadius:6, objectFit:"cover" }} />}
                    <div>
                      <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, color:"rgba(255,255,255,.8)" }}>{r.game_title}</div>
                      <span style={{ background:`${rc(r.rating)}18`, border:`1px solid ${rc(r.rating)}40`, borderRadius:5, padding:"1px 8px", fontSize:11, color:rc(r.rating), fontFamily:"'Syne',sans-serif", fontWeight:800 }}>{r.rating}/10</span>
                    </div>
                  </div>
                  <p style={{ color:"rgba(255,255,255,.42)", fontSize:13, lineHeight:1.7, fontFamily:"'DM Sans',sans-serif", margin:0 }}>"{r.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && ratings.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,.2)", fontFamily:"'Syne',sans-serif", fontSize:16 }}>Aucune note publiée</div>
        )}
      </div>
    </div>
  );
};

/* ── ACTIVITY ITEM ────────────────────────────────────────── */
const ActivityItem = ({ item, onClick, onUserClick }) => {
  const col = rc(item.rating);
  const game = { id: item.game_id, title: item.game_title, cover: item.game_cover, platform:null, year:"—", genre:null, rating:null, reviews:0, tags:[], summary:"", videoId:null };
  return (
    <div onClick={()=>onClick(game)}
      onMouseDown={ev=>{ if(ev.button===1){ ev.preventDefault(); window.open(`${window.location.origin}?game=${item.game_id}`,'_blank'); } }}
      style={{ display:"flex", gap:12, alignItems:"center", padding:"12px 14px", borderRadius:12, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.04)", cursor:"pointer", transition:"all .18s" }}
      onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,107,53,.04)";e.currentTarget.style.borderColor="rgba(255,107,53,.12)";}}
      onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.02)";e.currentTarget.style.borderColor="rgba(255,255,255,.04)";}}>
      <div style={{ width:36, height:48, borderRadius:7, overflow:"hidden", flexShrink:0, background:"rgba(255,255,255,.06)" }}>
        {item.game_cover && <img src={item.game_cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
          <span onClick={e=>{e.stopPropagation();if(item.user_display)onUserClick(item.user_display);}} style={{ fontWeight:700, fontSize:12, color:"#ff6b35", fontFamily:"'Space Grotesk',sans-serif", cursor:item.user_display?"pointer":"default", textDecoration:"none" }}
            onMouseEnter={e=>{if(item.user_display)e.currentTarget.style.textDecoration="underline";}}
            onMouseLeave={e=>{e.currentTarget.style.textDecoration="none";}}>
            {item.user_display || "Joueur"}
          </span>
          <span style={{ fontSize:11, color:"rgba(255,255,255,.2)", fontFamily:"'DM Sans',sans-serif" }}>{timeAgo(item.updated_at)}</span>
        </div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,.65)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.game_title}</div>
        {item.comment && <div style={{ fontSize:11, color:"rgba(255,255,255,.25)", fontStyle:"italic", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>"{item.comment}"</div>}
      </div>
      <div style={{ flexShrink:0, background:`${col}18`, border:`1px solid ${col}44`, borderRadius:8, padding:"4px 10px", textAlign:"center" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, color:col, lineHeight:1 }}>{item.rating}</div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════ */
export default function JoystickLog() {
  const [lang, setLang] = useState("fr");
  useEffect(() => { setLang(detectLang()); }, []);

  // Register service worker for PWA
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  const t = key => (TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.fr[key] ?? key);

  const [tab, setTab]           = useState("home");
  const [selected, setSelected] = useState(null);
  const [user, setUser]         = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [userRatings, setUserRatings]     = useState({});
  const [userStatus, setUserStatus]       = useState({});
  const [ratedGamesList, setRatedGamesList] = useState([]);

  const [topGames, setTopGames]         = useState([]);
  const [loadingTop, setLoadingTop]     = useState(true);
  const [searchQ, setSearchQ]           = useState("");
  const [suggestions, setSuggestions]   = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggLoading, setSuggLoading]   = useState(false);
  const suggRef = useRef(null);
  const [platFilter, setPlatFilter]     = useState("Tous");
  const [exploreGames, setExploreGames] = useState([]);
  const [loadingEx, setLoadingEx]       = useState(true);
  const [loadingMoreEx, setLoadingMoreEx] = useState(false);
  const [exploreOffset, setExploreOffset] = useState(0);
  const [hasMoreEx, setHasMoreEx]         = useState(true);
  const sentinelRef = useRef(null);
  const platScrollRef = useRef(null);
  const scrollPlat = dir => platScrollRef.current?.scrollBy({ left: dir * 220, behavior:"smooth" });
  // Refs for IntersectionObserver callbacks (avoid recreating observer on every state change)
  const hasMoreExRef     = useRef(true);
  const loadingExRef     = useRef(true);
  const loadingMoreExRef = useRef(false);
  const exploreOffsetRef = useRef(0);
  const searchQRef       = useRef("");
  const platFilterRef    = useRef("Tous");
  const [activeTags, setActiveTags]         = useState([]);
  const [discoGames, setDiscoGames]         = useState([]);
  const [loadingDisco, setLoadingDisco]     = useState(false);
  const [loadingMoreDisco, setLoadingMoreDisco] = useState(false);
  const [discoOffset, setDiscoOffset]       = useState(0);
  const [hasMoreDisco, setHasMoreDisco]     = useState(true);
  const discoSentinelRef = useRef(null);
  // Refs for discover observer
  const hasMoreDiscoRef     = useRef(true);
  const loadingDiscoRef     = useRef(false);
  const loadingMoreDiscoRef = useRef(false);
  const discoOffsetRef      = useRef(0);
  const activeTagsRef       = useRef([]);
  const [wishlistGames, setWishlistGames] = useState([]);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileAvatar, setProfileAvatar]     = useState("");
  const [trendingGames, setTrendingGames] = useState([]);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [gemGames, setGemGames]           = useState([]);
  const [communityStats, setCommunityStats] = useState(null);
  const [activityFeed, setActivityFeed]     = useState([]);
  const [popularGames, setPopularGames]     = useState([]);
  const [userLists, setUserLists]           = useState([]);
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName]       = useState("");
  const [showResetPw, setShowResetPw]       = useState(false);
  const [showSettings, setShowSettings]     = useState(false);
  const [legalModal, setLegalModal]         = useState(null);
  const [publicProfile, setPublicProfile]   = useState(null);
  const [notifications, setNotifications]   = useState([]);
  const [showNotifs, setShowNotifs]         = useState(false);
  const [topReviews, setTopReviews]         = useState([]);
  const [theme, setTheme]                   = useState("dark");
  const notifRef = useRef(null);

  /* ── Theme tokens ─── */
  const th = theme === "light" ? {
    bg:"#f4f0e8", bgNav:"rgba(247,244,238,.96)", bgModal:"#ffffff",
    bgInput:"rgba(0,0,0,.045)", bgEl:"rgba(0,0,0,.032)",
    text:"#1c1917", textHigh:"rgba(28,25,23,.95)", textMid:"rgba(28,25,23,.6)",
    textLow:"rgba(28,25,23,.38)", textFaint:"rgba(28,25,23,.24)",
    border:"rgba(0,0,0,.09)", borderS:"rgba(0,0,0,.06)",
  } : {
    bg:"#09080e", bgNav:"rgba(6,5,5,.9)", bgModal:"#131020",
    bgInput:"rgba(255,255,255,.03)", bgEl:"rgba(255,255,255,.018)",
    text:"#ddd8d2", textHigh:"#ffffff", textMid:"rgba(255,255,255,.55)",
    textLow:"rgba(255,255,255,.32)", textFaint:"rgba(255,255,255,.18)",
    border:"rgba(255,255,255,.065)", borderS:"rgba(255,255,255,.048)",
  };

  /* ── Theme persistence ── */
  useEffect(() => {
    const saved = localStorage.getItem("jl-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);
  useEffect(() => { localStorage.setItem("jl-theme", theme); }, [theme]);

  /* ── URL state: restore tab + game on load, sync on change ── */
  const openUserProfile = (uname) => {
    setPublicProfile(uname);
    const params = new URLSearchParams(window.location.search);
    params.set('user', uname);
    window.history.pushState({}, '', `?${params.toString()}`);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['home','explore','discover','profile'].includes(tabParam)) setTab(tabParam);
    const gameId = params.get('game');
    if (gameId) {
      fetch(`/api/games?id=${gameId}`).then(r=>r.json()).then(data => {
        if (data?.id) setSelected(formatGame(data));
      }).catch(()=>{});
    }
    const userParam = params.get('user');
    if (userParam) setPublicProfile(userParam);
    const onPop = () => {
      const p = new URLSearchParams(window.location.search);
      const t = p.get('tab'); if (t) setTab(t);
      if (!p.get('game')) setSelected(null);
      setPublicProfile(p.get('user') || null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const tabMounted = useRef(false);
  useEffect(() => {
    if (!tabMounted.current) { tabMounted.current = true; return; }
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    window.history.replaceState({}, '', `?${params.toString()}`);
  }, [tab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (selected) {
      params.set('game', selected.id);
      window.history.pushState({}, '', `?${params.toString()}`);
    } else {
      params.delete('game');
      window.history.replaceState({}, '', `?${params.toString()}`);
    }
  }, [selected]);

  /* Auth */
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => { if (!error && data.session?.user) setUser(data.session.user); }).catch(() => {});
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setUser(s?.user || null);
      if (event === "PASSWORD_RECOVERY") setShowResetPw(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  /* Load username from profiles */
  useEffect(() => {
    if (!user) { setProfileUsername(""); setProfileAvatar(""); return; }
    const fromMeta = user.user_metadata?.username;
    supabase.from("profiles").select("username,avatar_url").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.username) setProfileUsername(data.username);
        else if (fromMeta) setProfileUsername(fromMeta);
        if (data?.avatar_url) setProfileAvatar(data.avatar_url);
      })
      .catch(e => console.error('loadProfile:', e));
  }, [user]);

  /* Load ratings & status */
  useEffect(() => {
    if (!user) { setUserRatings({}); setUserStatus({}); setWishlistGames([]); setRatedGamesList([]); return; }
    supabase.from("ratings").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) {
        const r = {};
        const games = [];
        data.forEach(d => {
          r[d.game_id] = { rating:d.rating, comment:d.comment };
          if (d.game_title) games.push({ id:d.game_id, title:d.game_title, cover:d.game_cover||null, platform:null, year:"—", genre:null, rating:null, reviews:0, tags:[], summary:"", videoId:null });
        });
        setUserRatings(r);
        if (games.length > 0) setRatedGamesList(games);
      }
    }).catch(e => console.error('loadRatings:', e));
    supabase.from("game_status").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) {
        const s={};
        data.forEach(d => s[d.game_id]=d.status);
        setUserStatus(s);
        setWishlistGames(data.filter(d => d.status==="wishlist").map(d => ({
          id:d.game_id, title:d.game_title, cover:d.game_cover,
          platform:d.game_platform, year:d.game_year, genre:null, rating:null, reviews:0, tags:[], summary:"",
        })));
      }
    }).catch(e => console.error('loadStatus:', e));
  }, [user]);

  /* Home extra sections: trending, upcoming, gems, top + community stats */
  useEffect(() => {
    fetch('/api/games/home').then(r=>r.json()).then(data => {
      if (data.trending) setTrendingGames((data.trending||[]).map(formatGame).filter(g=>g.cover));
      if (data.upcoming) setUpcomingGames((data.upcoming||[]).map(formatGame).filter(g=>g.cover));
      if (data.gems)     setGemGames((data.gems||[]).map(formatGame).filter(g=>g.cover));
      if (data.top) {
        const top = (data.top||[]).map(formatGame).filter(g=>g.cover && g.rating);
        setTopGames(top);
      }
      setLoadingTop(false);
    }).catch(()=>setLoadingTop(false));
    supabase.rpc('get_community_stats')
      .then(({ data }) => {
        if (data) setCommunityStats({ ratings: data.ratings ?? 0, tracked: data.tracked ?? 0 });
        else setCommunityStats({ ratings: 0, tracked: 0 });
      })
      .catch(() => setCommunityStats({ ratings: 0, tracked: 0 }));
  }, []);

  /* Activity feed + popular on platform */
  useEffect(() => {
    supabase.from("ratings")
      .select("user_id, game_id, rating, comment, user_display, game_title, game_cover, updated_at")
      .order("updated_at", { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setActivityFeed(data.filter(d => d.game_title)); })
      .catch(() => {});
    supabase.from("ratings")
      .select("game_id, game_title, game_cover, rating")
      .not("game_title", "is", null)
      .limit(300)
      .then(({ data }) => {
        if (!data) return;
        const map = {};
        data.forEach(d => {
          if (!map[d.game_id]) map[d.game_id] = { id: d.game_id, title: d.game_title, cover: d.game_cover, ratings: [], count: 0 };
          map[d.game_id].ratings.push(d.rating);
          map[d.game_id].count++;
        });
        const popular = Object.values(map)
          .filter(g => g.count >= 1 && g.cover)
          .sort((a, b) => b.count - a.count)
          .slice(0, 15)
          .map(g => ({ ...g, avgRating: Math.round(g.ratings.reduce((a,r)=>a+r,0)/g.ratings.length), platform:null, year:"—", genre:null, tags:[], summary:"", videoId:null }));
        setPopularGames(popular);
      }).catch(() => {});
  }, []);

  /* Notifications */
  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    supabase.from('notifications').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setNotifications(data); })
      .catch(e => console.error('loadNotifications:', e));
    const channel = supabase.channel('notifs').on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
      payload => setNotifications(p => [payload.new, ...p])
    ).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  /* Close notif dropdown on outside click */
  useEffect(() => {
    const handler = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markNotifsRead = async () => {
    if (!user) return;
    setNotifications(p => p.map(n => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  };

  /* Top reviews */
  useEffect(() => {
    supabase.rpc('get_top_reviews').then(({ data }) => { if (data) setTopReviews(data); }).catch(() => {});
  }, []);

  /* User lists */
  useEffect(() => {
    if (!user) { setUserLists([]); return; }
    supabase.from("user_lists").select("id, name, created_at").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setUserLists(data); }).catch(() => {});
  }, [user]);

  const createList = async () => {
    if (!newListName.trim() || !user) return;
    const { data } = await supabase.from("user_lists").insert({ user_id: user.id, name: newListName.trim() }).select().single();
    if (data) { setUserLists(p => [data, ...p]); setNewListName(""); setShowCreateList(false); }
  };

  /* Search suggestions */
  useEffect(() => {
    if (searchQ.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    setSuggLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/games?q=${encodeURIComponent(searchQ)}&offset=0`, { signal: ctrl.signal })
        .then(r => r.json())
        .then(data => {
          const items = (Array.isArray(data) ? data : [])
            .slice(0, 8)
            .map(g => ({ id: g.id, title: g.name, cover: formatCover(g.cover?.url), year: formatYear(g.first_release_date), genre: g.genres?.[0]?.name || "" }));
          setSuggestions(items);
          setShowSuggestions(items.length > 0);
          setSuggLoading(false);
        }).catch(e => { if (e.name !== 'AbortError') setSuggLoading(false); });
    }, 220);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [searchQ]);

  /* Close suggestions on outside click */
  useEffect(() => {
    const handler = e => { if (suggRef.current && !suggRef.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Explore */
  const fetchExplore = useCallback(async (q, plat, offset = 0) => {
    if (offset === 0) { setLoadingEx(true); setExploreGames([]); setHasMoreEx(true); }
    else setLoadingMoreEx(true);
    try {
      const platId = plat && plat !== "Tous" ? PLATFORM_IDS[plat] : null;
      const platParam = platId ? `&platform=${platId}` : "";
      const url = q.length >= 2
        ? `/api/games?q=${encodeURIComponent(q)}&offset=${offset}${platParam}`
        : `/api/games?offset=${offset}${platParam}`;
      const data = await fetch(url).then(r=>r.json());
      const games = (Array.isArray(data) ? data : []).map(formatGame).filter(g=>g.cover);
      if (offset === 0) setExploreGames(games);
      else setExploreGames(prev => { const ids = new Set(prev.map(g=>String(g.id))); return [...prev, ...games.filter(g=>!ids.has(String(g.id)))]; });
      setHasMoreEx(games.length === 20);
    } catch(e) { console.error('fetchExplore:', e); setHasMoreEx(false); }
    setLoadingEx(false);
    setLoadingMoreEx(false);
  }, []);

  // Keep refs in sync with state so observers don't need them as deps
  useEffect(() => { hasMoreExRef.current = hasMoreEx; }, [hasMoreEx]);
  useEffect(() => { loadingExRef.current = loadingEx; }, [loadingEx]);
  useEffect(() => { loadingMoreExRef.current = loadingMoreEx; }, [loadingMoreEx]);
  useEffect(() => { exploreOffsetRef.current = exploreOffset; }, [exploreOffset]);
  useEffect(() => { searchQRef.current = searchQ; }, [searchQ]);
  useEffect(() => { platFilterRef.current = platFilter; }, [platFilter]);

  useEffect(() => {
    if (tab!=="explore") return;
    setExploreOffset(0);
    const t = setTimeout(()=>fetchExplore(searchQ, platFilter, 0), searchQ.length>=2?500:0);
    return ()=>clearTimeout(t);
  }, [searchQ, platFilter, tab]);

  useEffect(() => { if (tab==="explore"&&exploreGames.length===0) fetchExplore("", platFilter, 0); }, [tab]);

  /* Infinite scroll sentinel — re-attaches when tab or initial load changes so
     IntersectionObserver fires again if sentinel was already in view after load */
  useEffect(() => {
    if (tab !== "explore" || !sentinelRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreExRef.current && !loadingExRef.current && !loadingMoreExRef.current) {
        loadingMoreExRef.current = true; // prevent double-fire before state update
        const nextOffset = exploreOffsetRef.current + 20;
        exploreOffsetRef.current = nextOffset;
        setExploreOffset(nextOffset);
        fetchExplore(searchQRef.current, platFilterRef.current, nextOffset);
      }
    }, { threshold: 0.1 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [tab, loadingEx]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Discover */
  const fetchDisco = useCallback(async (tags, offset = 0) => {
    if (tags.length === 0) { setDiscoGames([]); return; }
    if (offset === 0) { setLoadingDisco(true); setDiscoGames([]); setHasMoreDisco(true); }
    else setLoadingMoreDisco(true);
    try {
      const data = await fetch(`/api/games/discover?tags=${encodeURIComponent(tags.join(','))}&offset=${offset}`).then(r=>r.json());
      const games = (Array.isArray(data) ? data : []).map(formatGame).filter(g => g.cover);
      if (offset === 0) setDiscoGames(games);
      else setDiscoGames(prev => { const ids = new Set(prev.map(g=>g.id)); return [...prev, ...games.filter(g=>!ids.has(g.id))]; });
      setHasMoreDisco(games.length >= 20);
    } catch(e) { console.error('fetchDisco:', e); setHasMoreDisco(false); }
    setLoadingDisco(false); setLoadingMoreDisco(false);
  }, []);

  // Keep discover refs in sync
  useEffect(() => { hasMoreDiscoRef.current = hasMoreDisco; }, [hasMoreDisco]);
  useEffect(() => { loadingDiscoRef.current = loadingDisco; }, [loadingDisco]);
  useEffect(() => { loadingMoreDiscoRef.current = loadingMoreDisco; }, [loadingMoreDisco]);
  useEffect(() => { discoOffsetRef.current = discoOffset; }, [discoOffset]);
  useEffect(() => { activeTagsRef.current = activeTags; }, [activeTags]);

  useEffect(() => { setDiscoOffset(0); fetchDisco(activeTags, 0); }, [activeTags]);

  /* Discover infinite scroll sentinel — re-attaches when tab or initial load changes */
  useEffect(() => {
    if (tab !== "discover" || !discoSentinelRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreDiscoRef.current && !loadingDiscoRef.current && !loadingMoreDiscoRef.current && activeTagsRef.current.length > 0) {
        loadingMoreDiscoRef.current = true; // prevent double-fire before state update
        const next = discoOffsetRef.current + 20;
        discoOffsetRef.current = next;
        setDiscoOffset(next);
        fetchDisco(activeTagsRef.current, next);
      }
    }, { threshold: 0.1 });
    obs.observe(discoSentinelRef.current);
    return () => obs.disconnect();
  }, [tab, loadingDisco]); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = async () => { await supabase.auth.signOut(); setUser(null); setUserRatings({}); setUserStatus({}); setWishlistGames([]); };

  const allRatedGames = useMemo(() => {
    if (ratedGamesList.length > 0) return ratedGamesList;
    const seen = new Set();
    return [...topGames, ...exploreGames].filter(g => {
      if (!userRatings[g.id] || seen.has(g.id)) return false;
      seen.add(g.id); return true;
    });
  }, [ratedGamesList, topGames, exploreGames, userRatings]);

  const bgCovers = useMemo(() =>
    [...topGames, ...trendingGames, ...gemGames].filter(g=>g.cover).map(g=>g.cover).slice(0,10),
    [topGames, trendingGames, gemGames]);

  const jacketCovers = useMemo(() =>
    [...topGames, ...trendingGames, ...gemGames, ...exploreGames].filter(g=>g.cover).map(g=>g.cover).slice(0,12),
    [topGames, trendingGames, gemGames, exploreGames]);

  return (
    <div data-theme={theme} suppressHydrationWarning style={{ minHeight:"100vh", background:th.bg, color:th.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <style>{CSS}</style>

      {/* Game cover ambient background (color blobs) */}
      <CoverBackground covers={bgCovers} />
      {/* Jacket wall — visible covers floating in background */}
      <JacketWall covers={jacketCovers} />

      {/* Ambient gradient mesh */}
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 90% 55% at 50% 0%,rgba(255,107,53,.26) 0%,transparent 65%)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 65% 65% at 94% 90%,rgba(220,80,20,.22) 0%,transparent 65%)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 60% 70% at 3% 80%,rgba(167,139,250,.20) 0%,transparent 65%)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 70% 45% at 50% 108%,rgba(255,209,102,.15) 0%,transparent 60%)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 50% 45% at 10% 10%,rgba(110,80,230,.16) 0%,transparent 65%)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 55% 50% at 90% 8%,rgba(255,107,53,.14) 0%,transparent 60%)", pointerEvents:"none" }} />
      {/* Subtle grid overlay */}
      <div style={{ position:"fixed", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px)", backgroundSize:"88px 88px", pointerEvents:"none" }} />
      {/* Noise grain */}
      <div style={{ position:"fixed", inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", opacity:.03, pointerEvents:"none" }} />
      {/* Top accent line */}
      <div style={{ position:"fixed", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent 10%,rgba(255,107,53,.4) 50%,transparent 90%)", pointerEvents:"none", zIndex:200 }} />

      {/* ── NAV ── */}
      <nav className="top-nav" style={{ position:"sticky", top:0, zIndex:100, height:68, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", background:th.bgNav, backdropFilter:"blur(32px) saturate(180%)", borderBottom:`1px solid ${th.borderS}` }}>
        {/* Animated bottom border */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent 0%,rgba(255,107,53,.22) 30%,rgba(255,209,102,.3) 50%,rgba(255,107,53,.22) 70%,transparent 100%)", pointerEvents:"none" }} />

        {/* Logo */}
        <div onClick={()=>setTab("home")} style={{ display:"flex", alignItems:"center", gap:11, cursor:"pointer" }}>
          <div style={{ width:38, height:38, borderRadius:11, background:"linear-gradient(135deg,#ff6b35 0%,#b83a00 100%)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 28px rgba(255,107,53,.5), 0 0 0 1px rgba(255,255,255,.15) inset", flexShrink:0 }}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <ellipse cx="16" cy="24.5" rx="8.5" ry="3" fill="rgba(255,255,255,.88)"/>
              <rect x="14.2" y="12" width="3.6" height="12.5" rx="1.8" fill="white"/>
              <circle cx="16" cy="10" r="4.8" fill="white"/>
              <circle cx="14.2" cy="8.4" r="1.4" fill="rgba(255,255,255,.45)"/>
              <circle cx="9.5" cy="24.8" r="1.6" fill="#b83a00"/>
              <circle cx="22.5" cy="24.8" r="1.6" fill="#b83a00"/>
            </svg>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:0, lineHeight:1 }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, letterSpacing:2, color:"rgba(255,255,255,.92)", textTransform:"uppercase" }}>
              joystick<span style={{ background:"linear-gradient(90deg,#ff6b35,#ffd166)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>log</span>
            </span>
            <span style={{ fontSize:9, color:"rgba(255,255,255,.22)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, letterSpacing:1.8, textTransform:"uppercase" }}>game journal</span>
          </div>
        </div>

        {/* Center nav */}
        <div className="nav-center" style={{ gap:0, borderBottom:"1px solid rgba(255,255,255,.07)", paddingBottom:2 }}>
          {[["home",t("home")],["explore",t("explore")],["discover",t("discover")],["profile",t("profile")]].map(([id,label]) => (
            <button key={id} className={`nav-btn ${tab===id?"active":""}`} onClick={()=>setTab(id)}>{label}</button>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {/* 🌙/☀️ Theme toggle */}
          <button onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Mode jour" : "Mode nuit"}
            style={{ width:36, height:36, borderRadius:10, background:th.bgEl, border:`1px solid ${th.borderS}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .18s", color:th.textMid, flexShrink:0 }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(255,107,53,.35)"; e.currentTarget.style.color="#ff6b35"; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=th.borderS; e.currentTarget.style.color=th.textMid; }}>
            {theme === "dark"
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
          {user ? (
            <>
              {/* 🔔 Notifications bell */}
              <div ref={notifRef} style={{ position:"relative" }}>
                <button onClick={()=>{ setShowNotifs(v=>!v); if(!showNotifs) markNotifsRead(); }}
                  style={{ position:"relative", width:36, height:36, borderRadius:10, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .18s", color:"rgba(255,255,255,.5)" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,107,53,.35)";e.currentTarget.style.color="#ff6b35";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.08)";e.currentTarget.style.color="rgba(255,255,255,.5)";}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  {notifications.filter(n=>!n.read).length > 0 && (
                    <span style={{ position:"absolute", top:6, right:6, width:8, height:8, borderRadius:"50%", background:"#ff6b35", border:"2px solid #09080e" }} />
                  )}
                </button>
                {showNotifs && (
                  <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:300, background:th.bgModal, border:`1px solid ${th.border}`, borderRadius:16, zIndex:300, boxShadow:"0 24px 60px rgba(0,0,0,.55)", overflow:"hidden" }}>
                    <div style={{ padding:"14px 16px 10px", borderBottom:`1px solid ${th.borderS}`, fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14, color:th.textHigh }}>Notifications</div>
                    {notifications.length === 0 ? (
                      <div style={{ padding:"24px 16px", textAlign:"center", color:th.textLow, fontFamily:"'Space Grotesk',sans-serif", fontSize:13 }}>Aucune notification</div>
                    ) : (
                      <div style={{ maxHeight:340, overflowY:"auto" }}>
                        {notifications.map(n => (
                          <div key={n.id} onClick={()=>{ if(n.game_id) setSelected({ id:n.game_id, title:n.game_title||"", cover:n.game_cover||null, platform:null, year:"—", genre:null, rating:null, reviews:0, tags:[], summary:"", allPlatforms:[], videoId:null }); setShowNotifs(false); }}
                            style={{ display:"flex", gap:10, alignItems:"center", padding:"11px 16px", cursor:n.game_id?"pointer":"default", background:n.read?"transparent":"rgba(255,107,53,.04)", borderBottom:"1px solid rgba(255,255,255,.04)", transition:"background .15s" }}
                            onMouseEnter={e=>{if(n.game_id)e.currentTarget.style.background="rgba(255,107,53,.07)";}}
                            onMouseLeave={e=>{e.currentTarget.style.background=n.read?"transparent":"rgba(255,107,53,.04)";}}>
                            {n.game_cover
                              ? <img src={n.game_cover} alt="" style={{ width:30, height:40, borderRadius:5, objectFit:"cover", flexShrink:0 }} />
                              : <div style={{ width:30, height:40, borderRadius:5, background:"rgba(255,255,255,.06)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>❤️</div>}
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12, color:th.textMid, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, lineHeight:1.4 }}>
                                <span style={{ color:"#ff6b35" }}>{n.from_user || "Quelqu'un"}</span> a liké ta critique
                              </div>
                              {n.game_title && <div style={{ fontSize:11, color:th.textLow, fontFamily:"'DM Sans',sans-serif", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.game_title}</div>}
                              <div style={{ fontSize:10, color:th.textFaint, fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{timeAgo(n.created_at)}</div>
                            </div>
                            {!n.read && <div style={{ width:6, height:6, borderRadius:"50%", background:"#ff6b35", flexShrink:0 }} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div onClick={()=>setTab("profile")} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:"pointer", alignSelf:"center" }}
                onMouseEnter={e=>e.currentTarget.querySelector('.nav-av').style.boxShadow="0 0 28px rgba(255,107,53,.55)"}
                onMouseLeave={e=>e.currentTarget.querySelector('.nav-av').style.boxShadow="0 0 18px rgba(255,107,53,.3)"}>
                <div className="nav-av" style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#ff6b35,#ffd166)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 18px rgba(255,107,53,.3)", transition:"box-shadow .2s", overflow:"hidden" }}>
                  {profileAvatar
                    ? <img src={profileAvatar} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#140800" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="4"/><line x1="8" y1="9" x2="8" y2="15"/><line x1="5" y1="12" x2="11" y2="12"/><circle cx="16" cy="10" r="1" fill="#140800" stroke="none"/><circle cx="19" cy="12" r="1" fill="#140800" stroke="none"/><circle cx="16" cy="14" r="1" fill="#140800" stroke="none"/><circle cx="13" cy="12" r="1" fill="#140800" stroke="none"/></svg>
                  }
                </div>
                <span style={{ fontSize:8, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:"rgba(255,107,53,.8)", letterSpacing:.5, textTransform:"uppercase", lineHeight:1 }}>Profil</span>
              </div>
              <button onClick={()=>setShowSettings(true)} className="hide-m" title={t("settings_title")}
                style={{ background:"none", border:"1px solid rgba(255,255,255,.08)", borderRadius:9, color:"rgba(255,255,255,.3)", cursor:"pointer", fontSize:15, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,107,53,.35)";e.currentTarget.style.color="#ff6b35";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.08)";e.currentTarget.style.color="rgba(255,255,255,.3)";}}>
                ⚙️
              </button>
            </>
          ) : (
            <button className="btn" onClick={()=>setShowAuth(true)} style={{ padding:"8px 20px", fontSize:13 }}>{t("loginBtn")}</button>
          )}
        </div>
      </nav>

      {/* ══ HOME HERO — full bleed ══ */}
      {tab==="home" && (
        <div style={{ position:"relative", minHeight:"92vh", display:"flex", overflow:"hidden" }}>
          {/* Blurred background from #1 game cover */}
          {!loadingTop && topGames[0]?.cover && (
            <div style={{ position:"absolute", inset:0, backgroundImage:`url(${topGames[0].cover})`, backgroundSize:"cover", backgroundPosition:"center", filter:"brightness(.28) saturate(1.8) blur(24px)", transform:"scale(1.1)", zIndex:0 }} />
          )}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(120deg,rgba(9,8,14,.88) 0%,rgba(9,8,14,.62) 45%,rgba(9,8,14,.08) 100%)", zIndex:1 }} />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(9,8,14,1) 0%,rgba(9,8,14,.18) 42%,transparent 100%)", zIndex:1 }} />

          {/* Left: text content */}
          <div className="hero-txt" style={{ position:"relative", zIndex:2, flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"80px 6% 100px", maxWidth:680 }}>
            <div className="fu" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,107,53,.08)", border:"1px solid rgba(255,107,53,.22)", borderRadius:99, padding:"6px 16px", marginBottom:30, width:"fit-content" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#ff6b35", animation:"pulse 2s infinite" }} />
              <span style={{ fontSize:11, color:"rgba(255,107,53,.85)", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:1.5, textTransform:"uppercase" }}>{t("badge")}</span>
            </div>

            <h1 className="fu2 hero-h1" style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(52px,6.8vw,96px)", lineHeight:.87, letterSpacing:"-3.5px", marginBottom:32 }}>
              <span className="grad-text">{t("heroRate")}</span><span style={{ color:"rgba(255,107,53,.5)" }}>.</span><br/>
              <span style={{ color:"rgba(255,255,255,.9)" }}>{t("heroCritic")}</span><span style={{ color:"rgba(255,255,255,.1)" }}>.</span><br/>
              <span style={{ color:"rgba(255,255,255,.42)" }}>{t("heroShare")}</span><span style={{ color:"rgba(255,255,255,.06)" }}>.</span>
            </h1>

            <p style={{ fontSize:15, color:th.textMid, maxWidth:460, lineHeight:1.75, fontFamily:"'DM Sans',sans-serif", marginBottom:18, fontStyle:"italic", borderLeft:"2px solid rgba(255,107,53,.35)", paddingLeft:14 }}>
              {t("heroTagline")}
            </p>

            <p className="fu3" style={{ fontSize:16, color:th.textLow, maxWidth:420, lineHeight:1.9, fontFamily:"'DM Sans',sans-serif", marginBottom:40 }}>
              {t("heroDesc")}
            </p>

            <div className="fu4 hero-btns" style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
              {!user && <button className="btn" onClick={()=>setShowAuth(true)} style={{ padding:"14px 34px", fontSize:15 }}>{t("startFree")}</button>}
              <button onClick={()=>setTab("explore")} style={{ background:"none", border:`1px solid ${th.borderS}`, borderRadius:11, color:th.textLow, cursor:"pointer", fontSize:14, padding:"13px 22px", fontFamily:"'Syne',sans-serif", fontWeight:600, transition:"all .2s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=th.border;e.currentTarget.style.color=th.textMid;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=th.borderS;e.currentTarget.style.color=th.textLow;}}>
                {t("exploreGames")}
              </button>
            </div>

            <div className="hero-stats" style={{ display:"flex", gap:10, marginTop:52, flexWrap:"wrap" }}>
              {[
                {n:"∞", l:t("igdbGames"), hot:true},
                {n:"100%", l:t("free"), hot:true},
                {n: communityStats === null ? "…" : communityStats.ratings.toLocaleString(), l:t("communityRatings"), hot:false},
                {n: communityStats === null ? "…" : communityStats.tracked.toLocaleString(), l:t("communityTracked"), hot:false},
                {n: user ? Object.keys(userRatings).length : "—", l:t("myRatings"), hot:false},
                {n: user ? Object.keys(userStatus).length : "—", l:t("myList"), hot:false},
              ].map((s,i)=>(
                <div key={i} className="stat-mini">
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:26, color: s.hot ? "#ff6b35" : th.textMid, lineHeight:1, marginBottom:5, textShadow: s.hot ? "0 0 28px rgba(255,107,53,.5)" : "none" }}>{s.n}</div>
                  <div style={{ fontSize:10, color:th.textFaint, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:.8, fontWeight:600, textTransform:"uppercase" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: 3D cover grid */}
          {!loadingTop && topGames.length>=6 && (
            <div className="hide-m fu" style={{ position:"relative", zIndex:2, flex:"0 0 52%", display:"flex", alignItems:"center", justifyContent:"flex-end", padding:"60px 4% 80px 0", maskImage:"linear-gradient(to right,transparent 0%,rgba(0,0,0,.5) 14%,black 38%)", WebkitMaskImage:"linear-gradient(to right,transparent 0%,rgba(0,0,0,.5) 14%,black 38%)" }}>
              <div style={{ display:"flex", gap:10, transform:"perspective(1600px) rotateY(-10deg) rotateX(4deg)", transformOrigin:"right center" }}>
                {[0,1,2].map(col => (
                  <div key={col} style={{ display:"flex", flexDirection:"column", gap:10, marginTop: col===0 ? 60 : col===1 ? 20 : 0 }}>
                    {[0,1,2].map(row => {
                      const idx = col * 3 + row;
                      const game = topGames[idx % topGames.length];
                      if (!game?.cover) return null;
                      const isHero = idx === 0;
                      return (
                        <div key={row} onClick={()=>setSelected(game)}
                          style={{ width: isHero ? 168 : 148, borderRadius:14, overflow:"hidden", cursor:"pointer",
                            boxShadow: isHero ? "0 28px 64px rgba(0,0,0,.85), 0 0 40px rgba(255,107,53,.18)" : "0 14px 38px rgba(0,0,0,.7)",
                            border: isHero ? "1px solid rgba(255,107,53,.35)" : "1px solid rgba(255,255,255,.07)",
                            transition:"transform .3s cubic-bezier(.34,1.4,.64,1), box-shadow .3s", flexShrink:0 }}
                          onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-8px) scale(1.04)"; e.currentTarget.style.boxShadow="0 32px 72px rgba(0,0,0,.9), 0 0 30px rgba(255,107,53,.22)"; }}
                          onMouseLeave={e=>{ e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow= isHero ? "0 28px 64px rgba(0,0,0,.85), 0 0 40px rgba(255,107,53,.18)" : "0 14px 38px rgba(0,0,0,.7)"; }}>
                          <div style={{ position:"relative", paddingBottom:"140%" }}>
                            <img src={game.cover} alt={game.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,.72) 0%,transparent 52%)" }} />
                            {isHero && (
                              <>
                                <div style={{ position:"absolute", top:9, left:9 }}>
                                  <span style={{ background:"linear-gradient(135deg,#ff6b35,#ffd166)", color:"#030401", borderRadius:6, padding:"3px 10px", fontSize:9, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif", boxShadow:"0 2px 12px rgba(255,107,53,.5)" }}>#1</span>
                                </div>
                                <div style={{ position:"absolute", top:7, right:7 }}><Ring value={game.rating} size={38} /></div>
                              </>
                            )}
                            {!isHero && idx < 6 && (
                              <div style={{ position:"absolute", top:7, left:7 }}>
                                <span style={{ background:"rgba(0,0,0,.55)", backdropFilter:"blur(6px)", border:"1px solid rgba(255,255,255,.1)", color:"rgba(255,209,102,.8)", borderRadius:5, padding:"2px 8px", fontSize:8, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:.8 }}>#{idx+1}</span>
                              </div>
                            )}
                            <div style={{ position:"absolute", bottom:9, left:9, right:9 }}>
                              <div style={{ fontSize: isHero ? 13 : 10, color:"#fff", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.2, textShadow:"0 1px 8px rgba(0,0,0,.9)" }}>{(game.title||"").length>16?(game.title||"").slice(0,16)+"…":(game.title||"")}</div>
                              {isHero && <div style={{ fontSize:9, color:"rgba(255,255,255,.35)", fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{game.year} · {game.genre}</div>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scroll hint */}
          <div className="bounce" style={{ position:"absolute", bottom:24, left:"50%", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", gap:7, pointerEvents:"none" }}>
            <div style={{ width:28, height:44, border:"1.5px solid rgba(255,255,255,.12)", borderRadius:14, display:"flex", justifyContent:"center", padding:"6px 0" }}>
              <div style={{ width:3, height:10, background:"linear-gradient(to bottom,#ff6b35,#ffd166)", borderRadius:99 }} />
            </div>
            <span style={{ fontSize:9, color:"rgba(255,255,255,.15)", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:2.5, textTransform:"uppercase" }}>{t("scrollHint")}</span>
          </div>
        </div>
      )}

      {/* ── Console ticker strip — double row infinite ── */}
      {tab==="home" && (
        <div style={{ borderTop:"1px solid rgba(255,255,255,.05)", borderBottom:"1px solid rgba(255,255,255,.05)", padding:"10px 0", background:"rgba(255,255,255,.01)", overflow:"hidden" }}>
          {(() => {
            const row1 = ["◆ PlayStation 5","· Xbox Series X","◆ Xbox Series S","· Nintendo Switch","◆ Nintendo Switch OLED","· PC","◆ Steam Deck","· PlayStation 4","◆ PlayStation 4 Pro","· Xbox One","◆ Xbox One X","· Xbox One S","◆ PlayStation 3","· Xbox 360","◆ Wii","· Wii U","◆ GameCube","· Nintendo 64","◆ Super Nintendo","· NES","◆ Game Boy Advance","· GBA SP","◆ Nintendo DS","· Nintendo 3DS","◆ New 3DS XL","· PSP","◆ PS Vita","· PlayStation 2","◆ PlayStation","· Dreamcast"];
            const row2 = ["◆ Sega Mega Drive","· Sega Saturn","◆ Sega Master System","· Sega Game Gear","◆ Atari 2600","· Atari 7800","◆ Atari Jaguar","· Neo Geo","◆ Neo Geo Pocket","· Amiga","◆ Commodore 64","· MSX","◆ TurboGrafx-16","· Lynx","◆ Virtual Boy","· Game Boy Color","◆ Game Boy","· Famicom Disk","◆ PC Engine","· ColecoVision","◆ Intellivision","· Vectrex","◆ Odyssey","· Arcade","◆ Xbox","· Nintendo DS Lite","◆ iPhone","· Android","◆ Stadia","· Luna"];
            const track1 = [...row1, ...row1];
            const track2 = [...row2, ...row2];
            return <>
              <div className="marquee-wrap" style={{ marginBottom:7 }}>
                <div className="marquee-track">
                  {track1.map((g,i)=>(
                    <span key={i} style={{ fontSize:10, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:2.4, textTransform:"uppercase", whiteSpace:"nowrap", color:g.startsWith("◆")?"rgba(255,107,53,.32)":"rgba(255,255,255,.08)" }}>{g}</span>
                  ))}
                </div>
              </div>
              <div className="marquee-wrap">
                <div className="marquee-track-r">
                  {track2.map((g,i)=>(
                    <span key={i} style={{ fontSize:10, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:2.4, textTransform:"uppercase", whiteSpace:"nowrap", color:g.startsWith("◆")?"rgba(255,209,102,.22)":"rgba(255,255,255,.07)" }}>{g}</span>
                  ))}
                </div>
              </div>
            </>;
          })()}
        </div>
      )}

      <div className="main-container" style={{ maxWidth:1180, margin:"0 auto", padding:"0 22px 80px", position:"relative", zIndex:1 }}>

        {/* ══ HOME GRID ══ */}
        {tab==="home" && (
          <div style={{ paddingTop:56 }}>
            <div className="fu" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <div className="sect-h">
                <div>
                  <div style={{ fontSize:10, color:"rgba(255,107,53,.55)", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:3, textTransform:"uppercase", marginBottom:4 }}>{t("topRated")}</div>
                  <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:"#fff", letterSpacing:-.5, lineHeight:1 }}>{t("topGames")}</h2>
                </div>
              </div>
              <button onClick={()=>setTab("explore")} style={{ background:"rgba(255,107,53,.07)", border:"1px solid rgba(255,107,53,.2)", borderRadius:99, color:"rgba(255,107,53,.85)", cursor:"pointer", fontSize:12, padding:"7px 18px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, transition:"all .18s", letterSpacing:.2 }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,107,53,.14)";e.currentTarget.style.color="#ff6b35";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,107,53,.07)";e.currentTarget.style.color="rgba(255,107,53,.85)";}}>
                {t("exploreAll")}
              </button>
            </div>
            {loadingTop ? (
              <div className="top-games-grid" style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:11 }}>
                <div className="skel" style={{ height:290, borderRadius:18 }} />
                <Skel /><Skel />
              </div>
            ) : topGames.length>0 ? (
              <div className="top-games-grid" style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:11 }}>
                {topGames.slice(0,3).map((g,i)=> i===0 ? <FeaturedCard key={g.id} game={g} onClick={setSelected}/> : <GameCard key={g.id} game={g} onClick={setSelected} rank={i+1} userRating={userRatings[g.id]?.rating}/>)}
              </div>
            ) : <div style={{ textAlign:"center", padding:"50px 0", color:"rgba(255,255,255,.2)", fontFamily:"'Syne',sans-serif" }}>{t("loadError")}</div>}

            {topGames.length>3 && (
              <div className="fu2" style={{ marginTop:11 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(152px,1fr))", gap:11 }}>
                  {topGames.slice(3,9).map((g,i)=><GameCard key={g.id} game={g} onClick={setSelected} rank={i+4} userRating={userRatings[g.id]?.rating}/>)}
                </div>
              </div>
            )}

            {/* ── TRENDING ── */}
            {trendingGames.length > 0 && (
              <div style={{ marginTop:72 }}>
                <div className="sect-divider" style={{ marginTop:0, marginBottom:40 }} />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
                  <div className="sect-h">
                    <div>
                      <div style={{ fontSize:10, color:"rgba(255,107,53,.6)", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:3.5, textTransform:"uppercase", marginBottom:5 }}>{t("trendingTag")}</div>
                      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color:th.textHigh, letterSpacing:-.6, lineHeight:1 }}>{t("trendingTitle")}</h2>
                    </div>
                  </div>
                </div>
                <HScrollSection games={trendingGames} onClick={setSelected} accent="#ff6b35" />
              </div>
            )}

            {/* ── UPCOMING ── */}
            {upcomingGames.length > 0 && (
              <div style={{ marginTop:64 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
                  <div className="sect-h" style={{ "--bar-color":"#a78bfa" }}>
                    <div>
                      <div style={{ fontSize:10, color:"rgba(167,139,250,.65)", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:3.5, textTransform:"uppercase", marginBottom:5 }}>{t("upcomingTag")}</div>
                      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color:th.textHigh, letterSpacing:-.6, lineHeight:1 }}>{t("upcomingTitle")}</h2>
                    </div>
                  </div>
                </div>
                <HScrollSection games={upcomingGames} onClick={setSelected} accent="#a78bfa" showDate />
              </div>
            )}

            {/* ── HIDDEN GEMS ── */}
            {gemGames.length > 0 && (
              <div style={{ marginTop:64 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
                  <div className="sect-h">
                    <div>
                      <div style={{ fontSize:10, color:"rgba(255,209,102,.65)", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:3.5, textTransform:"uppercase", marginBottom:5 }}>{t("gemsTag")}</div>
                      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color:th.textHigh, letterSpacing:-.6, lineHeight:1 }}>{t("gemsTitle")}</h2>
                    </div>
                  </div>
                </div>
                <HScrollSection games={gemGames} onClick={setSelected} accent="#ffd166" />
              </div>
            )}

            {/* ── POPULAR ON JOYSTICKLOG ── */}
            {popularGames.length > 0 && (
              <div style={{ marginTop:72 }}>
                <div className="sect-divider" style={{ marginTop:0, marginBottom:40 }} />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
                  <div className="sect-h">
                    <div>
                      <div style={{ fontSize:10, color:"rgba(255,209,102,.65)", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:3.5, textTransform:"uppercase", marginBottom:5 }}>{t("popularTag")}</div>
                      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color:th.textHigh, letterSpacing:-.6, lineHeight:1 }}>{t("popularTitle")}</h2>
                    </div>
                  </div>
                </div>
                <HScrollSection games={popularGames} onClick={g=>setSelected(g)} accent="#ffd166" />
              </div>
            )}

            {/* ── ACTIVITY FEED ── */}
            {activityFeed.length > 0 && (
              <div style={{ marginTop:72 }}>
                <div className="sect-divider" style={{ marginTop:0, marginBottom:40 }} />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
                  <div className="sect-h">
                    <div>
                      <div style={{ fontSize:10, color:"rgba(255,107,53,.6)", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:3.5, textTransform:"uppercase", marginBottom:5 }}>{t("activityTag")}</div>
                      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color:th.textHigh, letterSpacing:-.6, lineHeight:1 }}>{t("activityTitle")}</h2>
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {activityFeed.slice(0, 10).map((item, i) => (
                    <ActivityItem key={`${item.user_id}-${item.game_id}-${i}`} item={item} onClick={g=>setSelected(g)} onUserClick={openUserProfile} />
                  ))}
                </div>
              </div>
            )}

            {/* ── TOP REVIEWS ── */}
            {topReviews.length > 0 && (
              <div style={{ marginTop:72 }}>
                <div className="sect-divider" style={{ marginTop:0, marginBottom:40 }} />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
                  <div className="sect-h">
                    <div>
                      <div style={{ fontSize:10, color:"rgba(239,68,68,.65)", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:3.5, textTransform:"uppercase", marginBottom:5 }}>Communauté</div>
                      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color:th.textHigh, letterSpacing:-.6, lineHeight:1 }}>Top critiques ❤️</h2>
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {topReviews.map((rv, i) => (
                    <div key={rv.reviewer_id + rv.game_id} style={{ display:"flex", gap:16, padding:"18px 20px", borderRadius:18, border:"1px solid rgba(255,255,255,.048)", background:"rgba(255,255,255,.016)", transition:"all .22s", alignItems:"flex-start" }}>
                      {/* Rank */}
                      <div style={{ flexShrink:0, width:28, textAlign:"center", paddingTop:4 }}>
                        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:15, color: i === 0 ? "#ffd166" : i === 1 ? "rgba(255,255,255,.45)" : i === 2 ? "#cd7f32" : "rgba(255,255,255,.2)" }}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </span>
                      </div>
                      {/* Cover */}
                      <div style={{ flexShrink:0, width:44, height:58, borderRadius:8, overflow:"hidden", background:"rgba(255,255,255,.06)" }}>
                        {rv.game_cover && <img src={rv.game_cover.replace("t_thumb","t_cover_small")} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
                      </div>
                      {/* Content */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                          <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, color:"rgba(255,255,255,.75)", cursor:"pointer" }}
                            onClick={() => openUserProfile(rv.reviewer_username)}>
                            {rv.reviewer_username || "Joueur"}
                          </span>
                          <span style={{ color:"rgba(255,255,255,.18)", fontSize:11 }}>sur</span>
                          <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, color:"rgba(255,255,255,.55)" }}>
                            {rv.game_title}
                          </span>
                          {rv.rating && (
                            <span style={{ background:"#ff6b35", borderRadius:7, padding:"2px 9px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:12, color:"#fff" }}>{rv.rating}/10</span>
                          )}
                        </div>
                        {rv.comment && (
                          <p style={{ margin:0, fontSize:13, color:"rgba(255,255,255,.42)", lineHeight:1.55, fontFamily:"'DM Sans',sans-serif", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                            {rv.comment}
                          </p>
                        )}
                      </div>
                      {/* Like count (read-only) */}
                      <div style={{ flexShrink:0, background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", borderRadius:20, padding:"5px 13px", fontSize:13, display:"flex", alignItems:"center", gap:5, color:"rgba(239,68,68,.7)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700 }}>
                        <span style={{ fontSize:15 }}>❤️</span>
                        <span>{rv.like_count || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ EXPLORE ══ */}
        {tab==="explore" && (
          <div className="fu" style={{ paddingTop:42 }}>
            {/* Header */}
            <div style={{ marginBottom:32, paddingBottom:28, borderBottom:"1px solid rgba(255,255,255,.05)" }}>
              <div className="explore-hdr" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:20, marginBottom:20 }}>
                <div className="sect-h">
                  <div>
                    <div style={{ fontSize:10, color:"rgba(255,107,53,.55)", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:3, textTransform:"uppercase", marginBottom:4 }}>{t("igdbTag")}</div>
                    <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:30, color:th.textHigh, letterSpacing:"-1px", lineHeight:1 }}>{t("exploreTitle")}</h2>
                  </div>
                </div>
                {/* Search bar + suggestions */}
                <div ref={suggRef} className="explore-search" style={{ position:"relative", flexShrink:0 }}>
                  <input value={searchQ}
                    onChange={e=>{ setSearchQ(e.target.value); setShowSuggestions(true); }}
                    onFocus={e=>{ e.target.style.borderColor="rgba(255,107,53,.48)"; e.target.style.background="rgba(255,255,255,.06)"; e.target.style.boxShadow="0 0 0 3px rgba(255,107,53,.09)"; setShowSuggestions(true); }}
                    onBlur={e=>{ e.target.style.borderColor="rgba(255,255,255,.09)"; e.target.style.background="rgba(255,255,255,.04)"; e.target.style.boxShadow="none"; }}
                    onKeyDown={e=>{ if(e.key==="Escape"){ setShowSuggestions(false); e.target.blur(); } }}
                    placeholder={t("searchPlaceholder")}
                    style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.09)", borderRadius:14, color:"rgba(255,255,255,.88)", padding:"12px 46px 12px 46px", fontSize:14, width:320, outline:"none", transition:"all .22s" }}
                  />
                  <span style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,.22)", fontSize:17 }}>⌕</span>
                  {(loadingEx || suggLoading)
                    ? <div className="spin" style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)" }} />
                    : searchQ.length === 0 && <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"rgba(255,255,255,.14)", fontFamily:"'Space Grotesk',sans-serif" }}>⌘K</span>
                  }
                  {/* Suggestions dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:th.bgModal, border:`1px solid ${th.border}`, borderRadius:14, overflow:"hidden", zIndex:200, boxShadow:"0 24px 60px rgba(0,0,0,.45)" }}>
                      {/* Popular when no query */}
                      {suggestions.map((s, i) => (
                        <div key={s.id}
                          onMouseDown={e=>{ e.preventDefault(); setSearchQ(s.title); setShowSuggestions(false); setSelected(null); }}
                          style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 14px", cursor:"pointer", borderBottom: i < suggestions.length-1 ? "1px solid rgba(255,255,255,.04)" : "none", transition:"background .15s" }}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,107,53,.08)"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <div style={{ width:28, height:38, borderRadius:5, overflow:"hidden", background:"rgba(255,255,255,.06)", flexShrink:0 }}>
                            {s.cover && <img src={s.cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, color:"rgba(255,255,255,.82)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.title}</div>
                            <div style={{ fontSize:11, color:"rgba(255,255,255,.24)", fontFamily:"'DM Sans',sans-serif" }}>{s.genre}{s.genre && s.year ? " · " : ""}{s.year !== "—" ? s.year : ""}</div>
                          </div>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </div>
                      ))}
                      {/* Popular suggestions quand query vide */}
                      <div style={{ padding:"8px 14px", borderTop:"1px solid rgba(255,255,255,.04)", display:"flex", gap:6, flexWrap:"wrap" }}>
                        {POPULAR_QUERIES.slice(0,5).map(q => (
                          <button key={q} onMouseDown={e=>{ e.preventDefault(); setSearchQ(q); setShowSuggestions(false); }}
                            style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:99, padding:"3px 10px", fontSize:11, color:"rgba(255,255,255,.35)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, cursor:"pointer", transition:"all .15s" }}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,107,53,.3)";e.currentTarget.style.color="#ff6b35";}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.07)";e.currentTarget.style.color="rgba(255,255,255,.35)";}}>
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Popular shown on focus with empty query */}
                  {showSuggestions && suggestions.length === 0 && searchQ.length === 0 && (
                    <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:th.bgModal, border:`1px solid ${th.border}`, borderRadius:14, padding:"10px 14px", zIndex:200, boxShadow:"0 24px 60px rgba(0,0,0,.45)" }}>
                      <div style={{ fontSize:10, color:th.textFaint, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Populaire</div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {POPULAR_QUERIES.map(q => (
                          <button key={q} onMouseDown={e=>{ e.preventDefault(); setSearchQ(q); setShowSuggestions(false); }}
                            style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:99, padding:"4px 12px", fontSize:12, color:"rgba(255,255,255,.4)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, cursor:"pointer", transition:"all .15s" }}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,107,53,.3)";e.currentTarget.style.color="#ff6b35";}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.07)";e.currentTarget.style.color="rgba(255,255,255,.4)";}}>
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Platform chips — scrollable bar with arrows */}
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <button onClick={()=>scrollPlat(-1)} style={{ flexShrink:0, width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", color:"rgba(255,255,255,.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, lineHeight:1, transition:"all .2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,107,53,.12)";e.currentTarget.style.borderColor="rgba(255,107,53,.3)";e.currentTarget.style.color="#ff6b35";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.04)";e.currentTarget.style.borderColor="rgba(255,255,255,.08)";e.currentTarget.style.color="rgba(255,255,255,.4)";}}>‹</button>
                <div ref={platScrollRef} style={{ display:"flex", gap:7, overflowX:"auto", scrollbarWidth:"none", msOverflowStyle:"none", flex:1, maskImage:"linear-gradient(to right,transparent 0%,black 6%,black 94%,transparent 100%)", WebkitMaskImage:"linear-gradient(to right,transparent 0%,black 6%,black 94%,transparent 100%)" }}>
                  {PLATFORMS_FILTER.map(p=><button key={p} className={`chip ${platFilter===p?"on":""}`} style={{ flexShrink:0 }} onClick={()=>setPlatFilter(p)}>{p}</button>)}
                </div>
                <button onClick={()=>scrollPlat(1)} style={{ flexShrink:0, width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", color:"rgba(255,255,255,.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, lineHeight:1, transition:"all .2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,107,53,.12)";e.currentTarget.style.borderColor="rgba(255,107,53,.3)";e.currentTarget.style.color="#ff6b35";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.04)";e.currentTarget.style.borderColor="rgba(255,255,255,.08)";e.currentTarget.style.color="rgba(255,255,255,.4)";}}>›</button>
              </div>
            </div>

            {loadingEx ? (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12 }}>
                {Array.from({length:12}).map((_,i)=><Skel key={i}/>)}
              </div>
            ) : exploreGames.length===0 ? (
              <div style={{ textAlign:"center", padding:"70px 0", color:"rgba(255,255,255,.2)", fontFamily:"'Syne',sans-serif" }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🔍</div>
                {t("noResults").replace("{q}", searchQ)}
              </div>
            ) : (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12 }}>
                  {exploreGames.map(g=><GameCard key={g.id} game={g} onClick={setSelected} userRating={userRatings[g.id]?.rating}/>)}
                </div>
                <div ref={sentinelRef} style={{ height:60, display:"flex", alignItems:"center", justifyContent:"center", marginTop:8 }}>
                  {loadingMoreEx && <div className="spin" />}
                  {!hasMoreEx && exploreGames.length>0 && <span style={{ color:"rgba(255,255,255,.15)", fontSize:12, fontFamily:"'Syne',sans-serif" }}>{t("endResults")}</span>}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ DISCOVER ══ */}
        {tab==="discover" && (
          <div className="fu" style={{ paddingTop:42 }}>
            <div style={{ paddingBottom:28, borderBottom:"1px solid rgba(255,255,255,.04)", marginBottom:38 }}>
              <div className="section-label">{t("discoverTag")}</div>
              <h2 className="section-title" style={{ marginBottom:10 }}>{t("discoverTitle")}</h2>
              <p style={{ color:"rgba(255,255,255,.24)", fontSize:14, fontFamily:"'DM Sans',sans-serif", lineHeight:1.7 }}>{t("discoverDesc")}</p>
            </div>

            <div style={{ marginBottom:38 }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.18)", fontFamily:"'Syne',sans-serif", fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", marginBottom:13 }}>{t("yourTastes")}</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {ALL_TAGS.map(t=>{
                  const on=activeTags.includes(t);
                  return <button key={t} className={`tag ${on?"on":""}`} onClick={()=>setActiveTags(p=>on?p.filter(x=>x!==t):[...p,t])}>#{t}</button>;
                })}
              </div>
            </div>

            {activeTags.length>0 && (
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.18)", fontFamily:"'Syne',sans-serif", fontWeight:700, letterSpacing:2.5, textTransform:"uppercase" }}>
                    {loadingDisco?t("searching"):`${discoGames.length} jeux`}
                  </div>
                  {loadingDisco && <div className="spin"/>}
                </div>
                {!loadingDisco && discoGames.length>0 ? (
                  <>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12 }}>
                      {discoGames.map(g=><GameCard key={g.id} game={g} onClick={setSelected} userRating={userRatings[g.id]?.rating}/>)}
                    </div>
                    <div ref={discoSentinelRef} style={{ height:60, display:"flex", alignItems:"center", justifyContent:"center", marginTop:8 }}>
                      {loadingMoreDisco && <div className="spin"/>}
                      {!hasMoreDisco && <span style={{ color:"rgba(255,255,255,.15)", fontSize:12, fontFamily:"'Syne',sans-serif" }}>{t("endResults")}</span>}
                    </div>
                  </>
                ) : !loadingDisco ? (
                  <div style={{ color:"rgba(255,255,255,.25)", fontSize:14, borderLeft:"2px solid rgba(255,107,53,.3)", paddingLeft:16 }}>{t("noDiscoResults")}</div>
                ) : null}
              </div>
            )}
            {activeTags.length===0 && (
              <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,.14)" }}>
                <div style={{ width:64, height:64, borderRadius:16, background:"rgba(255,107,53,.05)", border:"1px solid rgba(255,107,53,.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:26 }}>◎</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:600 }}>{t("pickTastes")}</div>
              </div>
            )}
          </div>
        )}

        {/* ══ PROFILE ══ */}
        {tab==="profile" && (
          <div className="fu" style={{ paddingTop:42 }}>
            {!user ? (
              <div style={{ textAlign:"center", padding:"100px 0" }}>
                <div style={{ width:80, height:80, borderRadius:20, background:"linear-gradient(135deg,rgba(255,107,53,.1),rgba(255,209,102,.05))", border:"1px solid rgba(255,107,53,.18)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", fontSize:36, boxShadow:"0 0 40px rgba(255,107,53,.08)" }}>🎮</div>
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, color:"#fff", marginBottom:10, letterSpacing:"-.5px" }}>{t("profileWaiting")}</h2>
                <p style={{ color:"rgba(255,255,255,.28)", marginBottom:28, fontSize:15, fontFamily:"'DM Sans',sans-serif", lineHeight:1.7 }}>{t("profileLoginDesc")}</p>
                <button className="btn" onClick={()=>setShowAuth(true)} style={{ padding:"13px 36px", fontSize:15 }}>{t("loginArrow")}</button>
              </div>
            ) : (
              <>
                {/* Profile banner */}
                <div className="profile-banner" style={{ marginBottom:28 }}>
                  <div style={{ position:"absolute", top:0, right:0, width:320, height:320, background:"radial-gradient(circle,rgba(255,107,53,.06) 0%,transparent 70%)", pointerEvents:"none" }} />
                  <div style={{ display:"flex", gap:22, alignItems:"center", flexWrap:"wrap", position:"relative", zIndex:1 }}>
                    {/* Avatar */}
                    <div onClick={()=>setShowSettings(true)} title="Changer l'avatar" style={{ width:72, height:72, borderRadius:18, background:"linear-gradient(135deg,#ff6b35,#ffd166)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 0 28px rgba(255,107,53,.35)", cursor:"pointer", overflow:"hidden", position:"relative" }}>
                      {profileAvatar
                        ? <img src={profileAvatar} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="#140800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="4"/><line x1="8" y1="9" x2="8" y2="15"/><line x1="5" y1="12" x2="11" y2="12"/><circle cx="16" cy="10" r="1.2" fill="#140800" stroke="none"/><circle cx="19" cy="12" r="1.2" fill="#140800" stroke="none"/><circle cx="16" cy="14" r="1.2" fill="#140800" stroke="none"/><circle cx="13" cy="12" r="1.2" fill="#140800" stroke="none"/></svg>
                      }
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, color:"rgba(255,107,53,.6)", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:3, textTransform:"uppercase", marginBottom:5 }}>{t("player")}</div>
                      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20, color:"#fff", marginBottom:2, letterSpacing:-.2 }}>{profileUsername || user.email?.split("@")[0]}</h2>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,.25)", fontFamily:"'Space Grotesk',sans-serif", marginBottom:18 }}>{user.email}</div>
                      {/* Stat cards in row */}
                      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                        {[
                          { v:Object.keys(userRatings).length, l:t("gamesRated"), icon:"⭐" },
                          { v:Object.keys(userStatus).length, l:t("inMyList"), icon:"📋" },
                          { v:wishlistGames.length, l:t("wantToPlay"), icon:"🔖" },
                          { v:Object.keys(userRatings).length>0?(Object.values(userRatings).reduce((a,b)=>a+b.rating,0)/Object.keys(userRatings).length).toFixed(1):"—", l:t("avgRating"), icon:"📊" },
                        ].map(s=>(
                          <div key={s.l} style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", borderRadius:12, padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
                            <span style={{ fontSize:16 }}>{s.icon}</span>
                            <div>
                              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20, color:"#ff6b35", lineHeight:1 }}>{s.v}</div>
                              <div style={{ color:"rgba(255,255,255,.25)", fontSize:10, fontFamily:"'Space Grotesk',sans-serif", marginTop:2, letterSpacing:.3 }}>{s.l}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Username edit */}
                <UsernameEdit user={user} profileUsername={profileUsername} setProfileUsername={setProfileUsername} t={t} />

                {/* Rating distribution */}
                {Object.keys(userRatings).length > 0 && (
                  <div style={{ marginBottom:28, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", borderRadius:14, padding:"18px 20px" }}>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,.3)", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:2.5, textTransform:"uppercase", marginBottom:14 }}>{t("statsDistribution")}</div>
                    <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:72 }}>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => {
                        const count = Object.values(userRatings).filter(r=>r.rating===n).length;
                        const maxC = Math.max(1, ...[1,2,3,4,5,6,7,8,9,10].map(x=>Object.values(userRatings).filter(r=>r.rating===x).length));
                        const pct = (count/maxC)*100;
                        const col = rc(n);
                        return (
                          <div key={n} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                            <div style={{ width:"100%", height:50, display:"flex", alignItems:"flex-end" }}>
                              <div style={{ width:"100%", height:`${Math.max(6,pct)}%`, background:col, borderRadius:"3px 3px 0 0", opacity:count>0?0.85:0.12, transition:"height .4s ease" }} />
                            </div>
                            <div style={{ fontSize:9, color:col, fontWeight:700, fontFamily:"'Syne',sans-serif", opacity:count>0?1:.3 }}>{n}</div>
                            {count>0 && <div style={{ fontSize:8, color:"rgba(255,255,255,.3)", fontFamily:"'Space Grotesk',sans-serif" }}>{count}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Status breakdown */}
                {Object.keys(userStatus).length > 0 && (
                  <div style={{ marginBottom:28, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", borderRadius:14, padding:"18px 20px" }}>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,.3)", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:2.5, textTransform:"uppercase", marginBottom:14 }}>{t("statsStatus")}</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                        const count = Object.values(userStatus).filter(s=>s===key).length;
                        const total = Object.keys(userStatus).length;
                        const pct = total > 0 ? Math.round((count/total)*100) : 0;
                        return (
                          <div key={key} style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <span style={{ fontSize:14, width:20, flexShrink:0 }}>{cfg.icon}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                                <span style={{ fontSize:11, color:"rgba(255,255,255,.5)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>{cfg.label}</span>
                                <span style={{ fontSize:11, color:cfg.color, fontFamily:"'Syne',sans-serif", fontWeight:700 }}>{count}</span>
                              </div>
                              <div style={{ height:5, background:"rgba(255,255,255,.06)", borderRadius:99, overflow:"hidden" }}>
                                <div style={{ width:`${pct}%`, height:"100%", background:cfg.color, borderRadius:99, transition:"width .5s ease", boxShadow:`0 0 6px ${cfg.color}66` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Badges */}
                <div style={{ marginBottom:28, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", borderRadius:14, padding:"18px 20px" }}>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.3)", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:2.5, textTransform:"uppercase", marginBottom:14 }}>{t("badgesTag")}</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {BADGES_DEF.map(b => {
                      const earned = b.cond(userRatings, userStatus);
                      return (
                        <div key={b.id} title={b.label[lang]||b.label.fr}
                          style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 13px", borderRadius:12, background: earned ? "rgba(255,107,53,.08)" : "rgba(255,255,255,.02)", border:`1px solid ${earned ? "rgba(255,107,53,.28)" : "rgba(255,255,255,.05)"}`, opacity: earned ? 1 : 0.38, transition:"all .2s" }}>
                          <span style={{ fontSize:16, filter: earned ? "none" : "grayscale(1)" }}>{b.icon}</span>
                          <span style={{ fontSize:11, fontWeight:700, color: earned ? "#ffd166" : "rgba(255,255,255,.3)", fontFamily:"'Space Grotesk',sans-serif" }}>{b.label[lang]||b.label.fr}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* My Lists */}
                <div style={{ marginBottom:28 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                    <div className="sect-h">
                      <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:"rgba(255,255,255,.7)", letterSpacing:-.3 }}>{t("listsTitle")} <span style={{ color:"rgba(255,255,255,.2)", fontWeight:600 }}>· {userLists.length}</span></h3>
                    </div>
                    {!showCreateList && (
                      <button onClick={()=>setShowCreateList(true)} style={{ background:"rgba(255,107,53,.08)", border:"1px solid rgba(255,107,53,.22)", borderRadius:10, color:"rgba(255,107,53,.85)", cursor:"pointer", fontSize:12, padding:"7px 14px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700 }}>+ {t("createList")}</button>
                    )}
                  </div>
                  {showCreateList && (
                    <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                      <input value={newListName} onChange={e=>setNewListName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createList()} placeholder={t("listNamePlaceholder")} autoFocus
                        style={{ flex:1, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, color:"#fff", padding:"9px 14px", fontSize:14, fontFamily:"'Space Grotesk',sans-serif", outline:"none" }}
                        onFocus={e=>{e.target.style.borderColor="rgba(255,107,53,.45)";}}
                        onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.1)";}}
                      />
                      <button onClick={createList} style={{ background:"rgba(255,107,53,.12)", border:"1px solid rgba(255,107,53,.28)", borderRadius:10, color:"#ff6b35", cursor:"pointer", fontSize:14, padding:"9px 16px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700 }}>+</button>
                      <button onClick={()=>{setShowCreateList(false);setNewListName("");}} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, color:"rgba(255,255,255,.4)", cursor:"pointer", fontSize:14, padding:"9px 14px", fontFamily:"'Space Grotesk',sans-serif" }}>✕</button>
                    </div>
                  )}
                  {userLists.length === 0 ? (
                    <div style={{ color:"rgba(255,255,255,.2)", fontSize:13, fontFamily:"'DM Sans',sans-serif", textAlign:"center", padding:"20px 0", borderRadius:12, background:"rgba(255,255,255,.015)", border:"1px dashed rgba(255,255,255,.05)" }}>{t("noLists")}</div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {userLists.map(list => (
                        <div key={list.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:11, background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.055)" }}>
                          <span style={{ fontSize:16 }}>📋</span>
                          <span style={{ flex:1, fontSize:14, fontWeight:600, color:"rgba(255,255,255,.75)", fontFamily:"'Space Grotesk',sans-serif" }}>{list.name}</span>
                          <span style={{ fontSize:11, color:"rgba(255,255,255,.2)", fontFamily:"'DM Sans',sans-serif" }}>{new Date(list.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Wishlist */}
                {wishlistGames.length>0 && (
                  <div style={{ marginBottom:40 }}>
                    <div className="sect-h" style={{ marginBottom:18 }}>
                      <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:"rgba(255,255,255,.7)", letterSpacing:-.3 }}>
                        {t("wishlistSection")} <span style={{ color:"rgba(255,255,255,.2)", fontWeight:600 }}>· {wishlistGames.length}</span>
                      </h3>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:11 }}>
                      {wishlistGames.map(g=><GameCard key={g.id} game={g} onClick={setSelected} userRating={userRatings[g.id]?.rating}/>)}
                    </div>
                  </div>
                )}

                {/* Collection */}
                <div className="sect-h" style={{ marginBottom:18 }}>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:"rgba(255,255,255,.7)", letterSpacing:-.3 }}>
                    {t("collection")} <span style={{ color:"rgba(255,255,255,.2)", fontWeight:600 }}>· {Object.keys(userRatings).length}</span>
                  </h3>
                </div>

                {Object.keys(userRatings).length===0 ? (
                  <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,.15)", borderRadius:18, background:"rgba(255,255,255,.015)", border:"1px dashed rgba(255,255,255,.06)" }}>
                    <div style={{ fontSize:48, marginBottom:14 }}>🎮</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:6 }}>{t("noRated")}</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,.1)", marginBottom:20 }}>{t("startExplore")}</div>
                    <button onClick={()=>setTab("explore")} style={{ background:"rgba(255,107,53,.08)", border:"1px solid rgba(255,107,53,.25)", borderRadius:10, color:"#ff6b35", cursor:"pointer", fontSize:13, padding:"9px 22px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700 }}>{t("exploreArrow")}</button>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {allRatedGames.map(g=>{
                      const rv=userRatings[g.id];
                      const st=userStatus[g.id];
                      const col=rc(rv.rating);
                      return (
                        <div key={g.id} className="row" onClick={()=>setSelected(g)} style={{ padding:"14px 18px", display:"flex", gap:16, alignItems:"center" }}>
                          <div style={{ width:44, height:58, borderRadius:9, overflow:"hidden", flexShrink:0, border:"1px solid rgba(255,255,255,.07)", boxShadow:"0 4px 16px rgba(0,0,0,.4)" }}>
                            {g.cover ? <img src={g.cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.opacity=0}/> : <div style={{ width:"100%", height:"100%", background:"#1a1208", display:"flex", alignItems:"center", justifyContent:"center" }}>🎮</div>}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ color:"rgba(255,255,255,.85)", fontWeight:700, fontSize:14, fontFamily:"'Syne',sans-serif", marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.title}</div>
                            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                              <span style={{ color:"rgba(255,255,255,.22)", fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>{g.platform?.split("(")[0].trim()} · {g.year}</span>
                              {st && <span style={{ color:STATUS_CONFIG[st]?.color, fontSize:11, background:`${STATUS_CONFIG[st]?.color}15`, border:`1px solid ${STATUS_CONFIG[st]?.color}30`, borderRadius:5, padding:"1px 8px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>{STATUS_CONFIG[st]?.icon} {t(`s_${st}`)}</span>}
                            </div>
                            {rv.comment && <div style={{ color:"rgba(255,255,255,.22)", fontSize:12, marginTop:5, fontStyle:"italic", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>"{rv.comment.length>65?rv.comment.slice(0,65)+"…":rv.comment}"</div>}
                          </div>
                          {/* Rating pill */}
                          <div style={{ flexShrink:0, background:`${col}18`, border:`1px solid ${col}44`, borderRadius:10, padding:"6px 12px", textAlign:"center" }}>
                            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:col, lineHeight:1 }}>{rv.rating}</div>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,.2)", fontFamily:"'Space Grotesk',sans-serif", marginTop:2 }}>/10</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Game page */}
      {selected && (
        <GamePage
          game={selected}
          onClose={()=>setSelected(null)}
          onNavigate={g=>setSelected(formatGame(g))}
          user={user}
          userRatings={userRatings}
          setUserRatings={setUserRatings}
          userStatus={userStatus}
          setUserStatus={setUserStatus}
          onAuthRequired={()=>{ setSelected(null); setShowAuth(true); }}
          username={profileUsername}
          userLists={userLists}
          lang={lang}
          onUserClick={openUserProfile}
          t={t}
        />
      )}
      {/* ── FOOTER ── */}
      {!selected && (
        <footer className="site-footer main-container">
          <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:"rgba(255,255,255,.55)", letterSpacing:"-.3px" }}>JoystickLog</span>
              <span style={{ color:"rgba(255,255,255,.12)", fontSize:12 }}>·</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,.18)", fontFamily:"'Space Grotesk',sans-serif" }}>© {new Date().getFullYear()}</span>
            </div>
            <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              <button className="site-footer" onClick={()=>setLegalModal("tos")}>Terms of Service</button>
              <button className="site-footer" onClick={()=>setLegalModal("privacy")}>Privacy Policy</button>
              <button className="site-footer" onClick={()=>setLegalModal("legal")}>Legal Notices</button>
              <a className="site-footer" href="mailto:contact@joystick-log.com">contact@joystick-log.com</a>
            </div>
          </div>
        </footer>
      )}

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mob-nav-bar">
        <button className={`mob-nav-btn${tab==="home"?" active":""}`} onClick={()=>setTab("home")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>{t("home")}</span>
        </button>
        <button className={`mob-nav-btn${tab==="explore"?" active":""}`} onClick={()=>setTab("explore")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span>{t("explore")}</span>
        </button>
        <button className={`mob-nav-btn${tab==="discover"?" active":""}`} onClick={()=>setTab("discover")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          <span>{t("discover")}</span>
        </button>
        <button className={`mob-nav-btn${tab==="profile"?" active":""}`} onClick={()=>setTab("profile")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>{t("profile")}</span>
        </button>
      </nav>

      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onSuccess={u=>{ setUser(u); setShowAuth(false); }} t={t}/>}
      {showResetPw && <ResetPasswordModal onClose={()=>setShowResetPw(false)} t={t}/>}
      {legalModal && <LegalModal type={legalModal} onClose={()=>setLegalModal(null)}/>}
      {showSettings && user && <SettingsModal user={user} profileUsername={profileUsername} setProfileUsername={setProfileUsername} profileAvatar={profileAvatar} setProfileAvatar={setProfileAvatar} onClose={()=>setShowSettings(false)} onDeleteAccount={()=>{ setUser(null); setUserRatings({}); setUserStatus({}); setWishlistGames([]); }} userRatings={userRatings} userStatus={userStatus} t={t}/>}
      {publicProfile && (
        <PublicProfile
          username={publicProfile}
          onClose={()=>{ setPublicProfile(null); const p=new URLSearchParams(window.location.search); p.delete('user'); window.history.replaceState({},'',`?${p.toString()}`); }}
          onGameClick={g=>{ setPublicProfile(null); setSelected(g); }}
          t={t}
        />
      )}
    </div>
  );
}
