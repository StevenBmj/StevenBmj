# StevenBmj - Demandes d'evolution et audit initial

Date : 2026-11-11 (Europe/Paris).
Statut : demandes consignees ; audit local realise ; architecture a valider.
Ce document ne signifie pas que les fonctionnalites sont implementees.

## 1. Perimetre et preservation

- Dossier de reference : `C:\Users\HP\Downloads\stevenbmj (2)`.
- Depot autorise : `https://github.com/StevenBmj/StevenBmj.git`.
- Commit observe : `d424cd9` ; branche locale `main`.
- Ne pas utiliser un depot Shadow ni un autre projet Vercel.
- Projet Vercel attendu : `stevenbmj` ; ne pas modifier `jessdelicious`.
- Preserver les produits, commandes, comptes et contenus existants.
- Ne pas supprimer les clients : les anciennes demandes de suppression ne sont
  pas une autorisation de suppression pour cette nouvelle evolution.
- Les fichiers non suivis dans `.kilo/` sont preexistants et hors perimetre.
- Faire les nouvelles evolutions sur une branche et une previsualisation,
  avec sauvegarde/restauration verifiee avant toute migration distante.
- Aucun push, deploiement ou changement Supabase distant n'a ete fait dans
  cette phase d'audit.

## 2. Constats locaux prioritaires

### AUD-01 - Autorisation serveur manquante (critique)

`api/settings.ts`, `api/products.ts`, `api/auth/users.ts` et les ressources
admin de `api/shop.ts` n'imposent pas actuellement de session admin verifiee.
La protection de l'interface ne protege pas les endpoints.
`api/auth/users.ts` comporte notamment une suppression groupee des clients.
Ne jamais tester cette suppression sur la base reelle.

Test du 11 novembre, avec Supabase entierement simule et reseau reel interdit :

- Lecture anonyme des parametres : HTTP 200.
- Champ prive factice `adminResetCode` restitue par la lecture publique.
- Modification anonyme des parametres : HTTP 200.
- Ecriture anonyme d'un produit : HTTP 200.
- Route de suppression groupee anonyme : HTTP 200, liste simulee vide.

Le test prouve le comportement du code local, pas une exploitation en production.
Priorite : fermer ces acces avant de stocker des cles IA dans une interface admin.

### AUD-02 - Session et secrets

`api/auth/login.ts` authentifie le mot de passe mais ne transmet pas de session
verifiable aux prochaines requetes. Le frontend conserve un objet utilisateur
dans localStorage ; l'admin utilise aussi sessionStorage. Ce ne sont pas des
preuves d'autorisation. Les roles doivent etre attribues et controles au serveur,
jamais a partir d'une valeur choisie dans le navigateur ou d'un email seul.

Les parametres publics ne filtrent pas les champs prives. La politique Supabase
de lecture publique de `app_settings` expose egalement toute sa colonne JSON
aux roles autorises par les grants. `db_store.json`, suivi par Git, contient
un champ de mot de passe admin et un tableau utilisateurs. Ne pas y ajouter
de secret. Auditer aussi l'historique sans afficher les valeurs dans les logs.
Les identifiants prives deja partages doivent etre renouveles.

### AUD-03 - Donnees de demonstration

`analyticsRows()` dans `api/shop.ts` renvoie des ventes, benefices et visites
codes en dur. Des compteurs de sections admin sont aussi initialises a des
nombres fixes. Ils doivent etre remplaces par des donnees reelles et commencer
a zero quand aucun evenement ne justifie de badge.

### AUD-04 - Facture : deux mises en page distinctes

`src/components/CheckoutModal.tsx` rend l'apercu en HTML et reconstruit le PDF
avec des coordonnees jsPDF. Les zones certificat, totaux et montants sont placees
independamment, sans verification de leurs limites ; des colonnes client ont une
hauteur fixe et tronquent le texte. Les sauts de page estiment une hauteur fixe
au lieu de mesurer le contenu. La divergence est constatee dans le code ; une
comparaison visuelle sur des fichiers telecharges reste a effectuer.
La devise affichee depend du choix global courant, pas d'un instantane immuable
de la facture. Corriger le modele de document, pas seulement les marges.

### AUD-05 - Divergence local / production

`server.ts` et `api/` implementent separement des flux similaires. Le serveur
local utilise aussi une copie mutable de donnees synchronisee vers Supabase.
Les corrections doivent avoir les memes regles en local et sur Vercel.
Les prix et totaux transmis par le client a `api/shop.ts` ne sont pas une source
de confiance pour une commande, une facture ou la comptabilite.

### AUD-06 - IA, change, PWA et SEO actuels

- Le frontend n'envoie que le dernier message a l'API Gemini : la conversation
  n'est pas transmise, bien que le backend puisse recevoir un historique.
- Le conseiller n'a ni vocal, ni gestion de cles admin, ni outils de brouillon.
- EUR/USD est fixe dans `AppContext.tsx`, pas actualise depuis une source de taux.
- Un manifeste PWA existe ; aucun service worker, push ou suivi livreur n'a ete
  trouve dans les fichiers audites.
- Les vues changent essentiellement via un etat React, sans vraies URLs produit.
- Le sitemap statique utilise des fragments et le JSON-LD contient des references
  de domaine/adresse incoherentes. Les informations d'entreprise doivent etre
  confirmees, pas inventees pour le SEO.
- L'introduction bloque volontairement l'acces pendant plusieurs secondes.
- `npm run lint` termine sans erreur. Ce controle TypeScript ne valide ni les
  droits d'acces, ni le parcours navigateur, ni la securite de production.

## 3. Exigences a couvrir

### SEC - Securite, identite et confidentialite

- SEC-01 : session serveur reelle ; connexion/deconnexion/expiration/renouvellement
  coherents pour client, admin et livreur ; aucun role forgeable en localStorage.
- SEC-02 : droits verifies a chaque endpoint ; tests sans session, mauvais role,
  autre proprietaire et session expiree. RLS et grants explicites en defense
  supplementaire, y compris pour les fichiers et les canaux temps reel.
- SEC-03 : sortir mots de passe, codes de recuperation et cles des parametres
  publics, du bundle, des caches, des URLs et des journaux. Cofre de secrets
  chiffre, acces serveur uniquement ; cle maitresse geree hors de la base.
- SEC-04 : mot de passe gere par Auth ; unicite email normalise garantie en base,
  y compris sous requetes concurrentes et liaison Google ; pas de doublon.
- SEC-05 : inscriptions client et livreur avec email et WhatsApp international ;
  validation des noms sans chiffres, telephones sans lettres, mots de passe non
  tronques. Garder validation email, renvoi et expiration de cinq minutes.
- SEC-06 : recuperation avec codes a usage unique, stockage protege, expiration,
  limitation des tentatives et reponses ne revelant pas l'existence d'un compte.
- SEC-07 : aucun admin cree par inscription publique ; approbation admin des
  comptes livreurs avant affectation ; protection renforcee/MFA de l'admin.
- SEC-08 : validation structuree des entrees, limites de taille, quotas persistants,
  protections CSRF/XSS/SSRF/injections, headers et televersements verifies.
- SEC-09 : recalcul serveur des prix, promotions, livraison, devise et stock ;
  operations atomiques et idempotentes pour eviter doubles commandes/livraisons.
- SEC-10 : alertes sur evenements reels, type, gravite, date, requete et identite
  si connue ; IP issue des headers de confiance de l'hebergeur. Geolocalisation IP
  seulement approximative si disponible, jamais une adresse physique garantie.
- SEC-11 : journal de securite protege contre l'effacement par un visiteur,
  recherche et filtres ; archivage/purge reserve a un administrateur et trace.
- SEC-12 : sauvegardes, restauration testee, rotation des secrets, controle des
  dependances et tests d'intrusion autorises en preproduction. Aucune promesse
  d'invulnerabilite absolue ; bilan de securite et risques residuels documentes.

### AI - Conseiller client et cles fournisseurs

- AI-01 : fournisseur initial OpenRouter (clarification du nom OpenAuthor dans
  la demande). Supprimer l'utilisation automatique de l'ancienne cle Gemini.
  Ne pas detruire les autres integrations avant verification de leur dependance.
- AI-02 : section admin privee avec deux ensembles de cles independants : client
  et admin. Au moins cinq cles par ensemble, extensibles ; ajout, test, nom,
  activation, desactivation, remplacement et suppression ; affichage masque.
- AI-03 : repartition des requetes concurrentes, bascule en cas de panne,
  delais limites, temporisation apres erreur, limites de depense et suivi d'usage.
  Ne pas dupliquer chaque question vers toutes les cles ni contourner les quotas.
- AI-04 : selection separee du modele de conversation et du modele/voix TTS.
  Une cle seule n'active pas les fonctions qu'un modele ne prend pas en charge.
- AI-05 : frontend chat soigne, responsive et accessible ; streaming si compatible,
  historique limite, annulation/reessai et erreur claire ; pas de faux badge.
- AI-06 : client en texte seulement ; reponse ecrite avec lecture vocale facultative,
  pause/arret/relecture et preference muet ; aucun enregistrement microphone.
  Respecter les regles d'autoplay et les capacites de voix/langue disponibles.
- AI-07 : conseiller identifie comme IA, chaleureux et naturel, FR/EN, attentif au
  budget, aux tissus, tailles, styles, usages et preferences. Memoire de session ;
  memorisation durable seulement avec choix explicite et effacement possible.
- AI-08 : recommandations fondees sur catalogue/stock/prix reels ; reconnaitre
  l'absence d'un article et proposer des alternatives existantes, sans invention.
- AI-09 : connaitre les contenus publics accueil, catalogue, contact, a propos,
  services et FAQ ; aucune donnee admin/client d'autrui dans le contexte client.
- AI-10 : preparer un panier et un brouillon de livraison/coordonnees, avec
  confirmation du client avant modification. Le client saisit son code promo ;
  le serveur valide le code et le prix. Aucun paiement decide par le modele.
- AI-11 : preparer le formulaire contact avec les donnees donnees au conseiller ;
  bouton qui ouvre Contact pre-rempli ; envoi reel seulement apres validation
  du client sur le formulaire, jamais silencieusement.
- AI-12 : architecture extensible Gemini/OpenAI/Claude plus tard, sans presenter
  leurs connecteurs comme disponibles avant leur implementation et leurs tests.

### ADM - Assistant administrateur

- ADM-01 : conseiller reserve aux admins avec ses propres cles, contexte prive
  minimal et outils autorises ; aucun lien de confiance avec le conseiller public.
- ADM-02 : consulter rapports, ventes, commandes, et classement clients sur une
  periode ; aider aux taches de gestion, sans acces SQL/code arbitraire donne au LLM.
- ADM-03 : produire des brouillons de remerciement/invitation/cadeaux comme venant
  de StevenBmj ; montrer destinataires, texte et canaux avant confirmation.
- ADM-04 : envoi email reel et WhatsApp Business officiel apres validation et
  consentement ; file de traitement, dedoublonnage, etats soumis/livre/echoue,
  reprises et desinscription. Un lien wa.me n'est pas un envoi automatique.
- ADM-05 : criteres VIP bases sur achats reels de la periode, pas les points
  locaux ni des estimations. Journaliser les actions de l'agent et de l'admin.

### COM - Rapports et comptabilite de gestion

- COM-01 : rapports jour/semaine/mois/annee/annees anterieures et intervalle libre ;
  fuseau commercial explicite ; donnees historiques reelles, etat vide a zero.
- COM-02 : comparaison de deux periodes, montants, quantites, evolution,
  classement produits/clients et export PDF/CSV reproductible.
- COM-03 : distinguer commande, paiement confirme, encaissement, annulation,
  remboursement et livraison ; ne pas compter une facture impayee comme recette.
- COM-04 : prix de revient, achats/charges, frais de livraison/paiement et taxes
  parametrables pour calculer des marges justifiables ; aucune marge inventee.
- COM-05 : assistant explicatif et alertes de variation ; calculs par du code
  deterministe, pas par une reponse IA. Montants stockes en unites monetaires
  exactes et rapprochement des totaux entre ecrans et exports.
- COM-06 : bilan/resultat seulement si les ecritures, stocks, soldes initiaux et
  regles necessaires sont disponibles ; indiquer les donnees manquantes. Ce module
  ne constitue pas une certification comptable ou fiscale ni une dispense des
  obligations professionnelles applicables.

### FX - Devises

- FX-01 : source de change verifiable, actualisation serveur avec cache, date et
  taux utilises visibles ; dernier taux connu et avertissement en cas de panne.
- FX-02 : EUR/USD/XOF, arrondis coherents et modele de prix de reference explicite.
  Aucune navigation web ou estimation par le LLM pour fixer un prix.
- FX-03 : figer taux, devise, montants et regles au moment de la commande/facture,
  sans modifier les anciennes factures lors d'un changement de devise ou de taux.
- FX-04 : distinguer conversion indicative et taux reel facture par un prestataire
  de paiement. Une cle OpenRouter n'active pas un paiement en ligne.

### LIV - Livreurs et preuve de remise

- LIV-01 : compte livreur, profil, contact, zone de service et disponibilite ;
  approbation admin ; liste des livreurs disponibles et historique de courses.
- LIV-02 : admin verifie paiement/commande et affecte un livreur ; notification
  privee ; livreur accepte ou refuse avec motif ; affectation tracee et coherente.
- LIV-03 : parcours trace : a valider -> paiement confirme -> preparation ->
  affectee -> acceptee -> colis recupere -> en livraison -> remise signee ->
  cloturee. Conserver aussi refus, echec, absence, reaffectation et litige.
  Les noms exacts des etats restent une proposition a valider.
- LIV-04 : livreur ne voit que ses affectations et les coordonnees necessaires ;
  facture/bon de livraison lie a la commande, pas une nouvelle vente.
- LIV-05 : ecran de remise sur l'appareil du livreur : destinataire, liste exacte
  des articles/quantites, prenom saisi par le client, texte d'accuse de reception
  lisible, case d'accord et signature tactile/souris ; effacement et recommencement.
- LIV-06 : stocker la version du texte accepte, commande, signataire, signature,
  date serveur et livreur ; fichiers prives et acces limites ; aucune signature
  ecrasee apres cloture ; une signature dessinee ne prouve pas seule l'identite.
- LIV-07 : validation finale du livreur seulement apres preuve de remise complete ;
  notifications client et admin, acces admin a la preuve, etat actualise et audit.
- LIV-08 : confirmation/satisfaction du client dans son compte, note/suggestion
  optionnelles ; ne pas assimiler automatiquement signature a satisfaction 100 %.
  Prevoir contestation et produit endommage sans forcer une declaration fausse.
- LIV-09 : suivi client des etapes, nom du livreur affecte et date de livraison ;
  demandes concurrentes/reprises reseau ne doivent pas doubler la remise.

### NOT - Notifications et application installable

- NOT-01 : centre de notifications avec cloche pour client, admin et livreur ;
  destinataire explicite, lu/non lu, compteur reel, liens vers les bons objets.
- NOT-02 : aucune notification d'un autre compte, y compris apres deconnexion et
  connexion sur le meme appareil ; abonnements push rattaches au bon utilisateur.
- NOT-03 : notifications commande validee, affectation, acceptation, livraison,
  remise signee, confirmation/satisfaction et alertes admin pertinentes.
- NOT-04 : PWA installable, icones adaptees, manifeste et service worker ;
  bouton installation quand le navigateur le permet ; cache public seulement,
  jamais de secrets, API privees ou signatures dans un cache partage.
- NOT-05 : push serveur Web Push/VAPID avec autorisation demandee par action
  explicite ; notification hors onglet sur les plateformes compatibles ;
  badge application si API disponible et permission accordee.
- NOT-06 : expliquer les limites de chaque navigateur. Sur iPhone/iPad, le push
  web demande une application ajoutee a l'ecran d'accueil et une autorisation ;
  ne pas promettre des push non installes sur tous les appareils. Le centre
  interne fonctionne independamment ; le contenu sur ecran verrouille est minimal.
- NOT-07 : reprises, dedoublonnage, retrait des abonnements invalides, controles
  de lecture et livraison, sans confondre envoi push et lecture par le destinataire.

### DOC - Facture et commande

- DOC-01 : une seule source de donnees et de mise en page pour apercu et PDF ;
  modele imprime a dimensions stables, apercu responsive sans perte d'information.
- DOC-02 : logo, QR, reference, date, vendeur, destinataire, contact, adresse,
  lignes produits, variantes, quantites, prix, promotion, livraison, devise et
  total identiques ; conserver les textes complets, sans tronquer les coordonnees.
- DOC-03 : vraie pagination, entetes repetes et blocs indivisibles ; tester longs
  noms/adresses/notes, monnaies larges et paniers de plusieurs pages.
- DOC-04 : un seul bouton telechargement PDF puis ouverture WhatsApp, bouton
  retour/modification avant validation, panier et brouillon persistants au reload.
- DOC-05 : distinguer facture a regler et paiement confirme, reference stable,
  QR de verification a jeton opaque sans exposer les donnees personnelles.
- DOC-06 : archivage prive et droits client/admin/livreur appropries ; changement
  de taux/langue/coordonnees ne doit pas alterer une facture historique finalisee.

### UX - Boutique, catalogue, vitesse et SEO

- UX-01 : moderniser sans perdre la marque, images et contenus editables en admin ;
  catalogue hommes/femmes/enfants, categories/variantes extensibles pour montres,
  chaines, bijoux, vestes, chemises, pantalons, robes, tissus, chaussures,
  sandales/tapettes, t-shirts, debardeurs, sacs, casques et accessoires.
- UX-02 : produits/images/prix/stocks exacts ; nouvelles fiches sans donnees reelles
  restent des brouillons non publies, pas de fausses disponibilites.
- UX-03 : accueil et pages publiques reorganises ; controls clairs ; textes FR/EN
  complets, navigation clavier, cibles tactiles et contraste adaptes.
- UX-04 : mobile 320/360/375/390/412/430 px, paysage, tablette et desktop ; menu
  toujours accessible, aucun debordement, formulaires/modales/cartes utilisables.
- UX-05 : diminuer le chargement initial et les blocages : retirer le delai impose
  de l'intro, chargement differe des modules lourds, images optimisees/responsives,
  cache public adapte et reduction des animations si l'utilisateur le demande.
- UX-06 : footer : credit exact "Realise par StevenBmj" centre tout en bas ;
  conserver le proprietaire/PDG "AMORIN Steven A . S" et les liens sociaux admin.
  La version finale de l'interface utilisera les accents francais corrects.
- SEO-01 : vraies URLs publiques pour catalogue/categories/produits, liens
  explorables, metadonnees par page FR/EN, canonicals et sitemap corrects.
- SEO-02 : descriptions, nom StevenBmj, images partage, donnees structurees
  coherentes et basees sur les informations de la marque confirmees.
- SEO-03 : aucun compte, facture, signature ou panneau prive indexable ; le
  controle d'acces est obligatoire, robots/noindex ne constitue pas une protection.
- SEO-04 : controle du rendu pour robots et mobiles, Search Console si accessible ;
  ni classement ni indexation immediate ne peuvent etre garantis.

## 4. Dependances externes et limites a rendre explicites

- OpenRouter : cles a saisir uniquement dans la future interface admin protegee,
  compte credite, modele texte et modele/voix TTS compatibles ; plafonds de couts.
- Email : fournisseur transactionnel/configuration SMTP et domaine expediteur
  verifie ; suivi des rejets et delais sans promettre une remise instantanee.
- WhatsApp automatique : compte WhatsApp Business Platform, identifiants serveur,
  opt-in client et templates approuves si requis. Sans cela, lien pre-rempli
  manuel et statut explicite, pas de simulation d'envoi automatique.
- Paiement : le flux decrit est depot puis verification admin. Hypothese a valider ;
  aucun prestataire de paiement ne doit etre invente ou remplace par une API IA.
- Push : serveur d'envoi, VAPID, permissions et compatibilite appareil ; ni
  autorisation ni installation ne peuvent etre imposees sans action utilisateur.
- Comptabilite : monnaie de base, fuseau commercial, prix de revient, charges,
  donnees historiques et regles fiscales a preciser avant tout bilan officiel.
- Securite : inventaire des secrets exposes, rotation par les fournisseurs,
  stockage maitre hors base, sauvegarde et restauration. Ne pas reutiliser les
  anciens tokens de conversation comme s'ils etaient encore valides.

## 5. Recette a exiger avant publication

- Tests unitaires et integration des regles, avec echecs attendus avant correction.
- Matrice anonyme/client A/client B/livreur A/livreur B/admin ; aucun croisement
  de compte, commande, facture, signature, notification ou cle.
- Tests auth/Google/activation/expiration/renvoi/recuperation et rechargement.
- Comparaison visuelle apercu/PDF avec textes extremes et plusieurs pages.
- Deux navigateurs au minimum pour le parcours client -> admin -> livreur ->
  signature -> client, plus concurrence et perte reseau/reessai.
- Verifier notifications reelles et compteur lu/non lu ; push sur appareils
  compatibles ; aucune demande microphone.
- Tests IA : historique, budget, produit absent, stock nul, langue, echec/rotation
  fournisseur, cout limite, prompt injection et absence de fuite de secret.
- Tests actions IA : brouillon sans effet, confirmation obligatoire, refus des
  actions hors role ; aucune campagne de test envoyee a des clients reels.
- Rapports verifies sur jeux de donnees connus, annulations/remboursements inclus,
  monnaies coherentes et couts manquants affiches explicitement.
- Screenshots responsive, absence de debordement, erreurs console/reseau et
  mesures de performance avant/apres ; controles SEO sur pages publiques.
- Audit des dependances, bundle et fichiers suivis par Git sans secret ; avis
  de securite Supabase et sauvegarde/restauration avant migration distante.
- Verifier remote GitHub et projet Vercel avant chaque publication ; previsualiser,
  migrer de facon additive, publier et refaire les tests essentiels en production.
- Fournir commit, URL, migrations appliquees, tests executes et integrations qui
  attendent encore des identifiants ; ne pas annoncer un travail partiel comme fini.

## 6. Ordre recommande (proposition non encore validee)

1. Securite/auth serveur et isolation des donnees ; sauvegarde et base de tests.
2. Facture et commande fiables ; prix/devises/paiement et suppression des simulations.
3. Conseiller OpenRouter client, voix, coffre de cles et assistant admin.
4. Livreurs, preuve de livraison et notifications privees/PWA.
5. Rapports/comptabilite, messagerie automatisee et classement VIP.
6. Design global/catalogue, performances, SEO et recette complete avant publication.

Deux trajectoires restent possibles : evolution modulaire du socle actuel
(recommandee pour conserver l'existant), ou nouveau socle web sur une branche
isolee avec migration plus large. Le choix de trajectoire, puis la conception
detaillee, doivent etre valides avant l'implementation de cette refonte.

## 7. Ajout demande par le proprietaire : navigation arriere

- Enregistrer chaque page et fiche produit dans l'historique du navigateur.
- Retour et Suivant doivent parcourir les etapes sans rechargement ni deconnexion.
- Prevoir un retour visible sur mobile et ordinateur, avec repli interne pour une ouverture directe.
- Integrer panier et commande a l'historique ; conserver leurs donnees apres actualisation.
- L'URL doit restaurer la page courante. Les anciens flags locaux ne constituent jamais une preuve de connexion.
- Recette : navigation client, produit ouvert directement, actualisation, panier/commande, boutons navigateur et session conservee.

## 8. References techniques verifiees

- https://supabase.com/changelog.md
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/auth/server-side/advanced-guide
- https://openrouter.ai/docs/api_reference/limits
- https://openrouter.ai/docs/guides/overview/multimodal/tts
- https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers
- https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- https://whatsappbusiness.com/policy/
- https://data.ecb.europa.eu/key-figures/ecb-interest-rates-and-exchange-rates/exchange-rates
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
