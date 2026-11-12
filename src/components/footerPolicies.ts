type Language = 'FR' | 'EN';
export type PolicyId = 'legal' | 'cgv' | 'cgu' | 'privacy' | 'cookies';
type Section = { title: string; text: string };
type Policy = { label: string; title: string; sections: Section[] };

export const policyOrder: PolicyId[] = ['legal', 'cgv', 'cgu', 'privacy', 'cookies'];

export const footerPolicies: Record<Language, Record<PolicyId, Policy>> = {
  FR: {
    legal: {
      label: 'Mentions légales', title: 'Mentions légales',
      sections: [
        { title: 'Éditeur et direction', text: 'StevenBmj est une boutique de vêtements, chaussures, montres et accessoires pour hommes, femmes et enfants, basée à Cotonou, au Bénin. PDG et directeur de la publication : AMORIN Steven A . S.' },
        { title: 'Nous contacter', text: 'E-mail : stevenbmj202@gmail.com. Téléphones : +229 01 55 46 81 38 / +229 01 44 15 80 44. Utilisez également le formulaire de contact du site pour toute question concernant la boutique ou une commande.' },
        { title: 'Hébergement et services techniques', text: 'Le site est hébergé sur Vercel. Les services de base de données et d’authentification utilisent Supabase. Les services tiers accessibles depuis le site appliquent leurs propres conditions et politiques de confidentialité.' },
        { title: 'Contenus et propriété intellectuelle', text: 'Les contenus et éléments de marque de StevenBmj ne peuvent être réutilisés sans autorisation, sauf exceptions prévues par la loi. Les marques de tiers restent la propriété de leurs titulaires.' },
      ],
    },
    cgv: {
      label: 'CGV', title: 'Conditions générales de vente',
      sections: [
        { title: 'Produits et disponibilité', text: 'Les caractéristiques, variantes et prix des articles figurent dans le catalogue. La disponibilité doit être confirmée pour la commande. Pour une demande particulière ou une personnalisation, contactez StevenBmj avant de vous engager.' },
        { title: 'Commande et facture', text: 'Vérifiez les articles, quantités, coordonnées et informations de livraison avant de valider votre demande. Le site permet de générer une facture PDF et de transmettre les détails de commande par WhatsApp. Une facture générée ne constitue pas, à elle seule, une preuve de paiement ou d’expédition.' },
        { title: 'Prix, paiement et livraison', text: 'La devise et les montants sont indiqués dans votre récapitulatif. Les conversions affichées sont indicatives. Faites confirmer par StevenBmj le montant final, les moyens de paiement, les frais, les délais et les conditions de livraison avant tout règlement. Aucun paiement ne doit être envoyé à un interlocuteur non vérifié.' },
        { title: 'Modification, retour et réclamation', text: 'Pour modifier une demande, utilisez le retour au panier avant sa confirmation, ou contactez la boutique avec la référence de commande. Pour un article endommagé, non conforme ou une demande de retour, signalez le problème au support. Les conditions applicables vous sont précisées selon le produit et la situation, sans limiter vos droits légaux.' },
      ],
    },
    cgu: {
      label: 'CGU', title: 'Conditions générales d’utilisation',
      sections: [
        { title: 'Utilisation des services', text: 'Le site permet de consulter le catalogue, préparer un panier, demander une commande et contacter StevenBmj. Les informations saisies doivent être exactes et les fonctionnalités utilisées dans le respect des droits des autres personnes.' },
        { title: 'Compte et accès', text: 'Utilisez une adresse e-mail qui vous appartient et gardez votre mot de passe et vos codes de validation confidentiels. Ne communiquez jamais ces codes au conseiller IA. Signalez au support tout accès suspect à votre compte.' },
        { title: 'Conseiller et liens externes', text: 'Le conseiller IA aide à explorer le catalogue et préparer vos demandes. Ses réponses peuvent comporter des erreurs : vérifiez les prix, la disponibilité et les conditions auprès de la boutique avant de payer. Les liens Google, WhatsApp et réseaux sociaux ouvrent des services tiers.' },
        { title: 'Sécurité et disponibilité', text: 'Les tentatives d’accès non autorisé, la fraude, les contenus illicites et l’utilisation abusive des services sont interdits. Des restrictions peuvent être appliquées pour protéger la plateforme. La disponibilité continue du site ne peut être garantie, notamment lors d’une maintenance ou d’un incident.' },
      ],
    },
    privacy: {
      label: 'Politique de confidentialité', title: 'Politique de confidentialité',
      sections: [
        { title: 'Informations traitées', text: 'Selon les services utilisés, le site traite vos coordonnées, les informations de compte, le panier, les commandes, vos messages et des données techniques de sécurité. Si vous choisissez la connexion Google, les informations de profil nécessaires à cette connexion peuvent être utilisées.' },
        { title: 'Finalités et prestataires', text: 'Ces informations servent à gérer les comptes, répondre aux demandes, traiter les commandes et protéger le service. Les prestataires techniques nécessaires peuvent traiter certaines données pour l’hébergement, l’authentification, les e-mails ou l’assistance IA. Évitez de transmettre des données sensibles dans le chat. Un envoi via WhatsApp relève aussi des règles de ce service.' },
        { title: 'Conservation et sécurité', text: 'Les données doivent être conservées selon les besoins du service et les obligations applicables. Pour connaître les durées concernant votre dossier, contactez StevenBmj. Des contrôles d’accès protègent les services privés ; aucune plateforme ne peut promettre une sécurité absolue.' },
        { title: 'Vos demandes et la newsletter', text: 'Vous pouvez écrire à stevenbmj202@gmail.com pour demander l’accès, la rectification ou l’effacement de vos données, selon les conditions applicables. Une vérification de votre identité peut être nécessaire. Pour ne plus recevoir les actualités de la boutique, demandez votre désinscription à cette même adresse. Vous pouvez également contacter l’Autorité de Protection des Données Personnelles du Bénin (APDP).' },
      ],
    },
    cookies: {
      label: 'Politique de cookies', title: 'Politique de cookies',
      sections: [
        { title: 'Cookies de session', text: 'Des cookies de session servent à maintenir et vérifier votre connexion. Ils ne sont pas accessibles au JavaScript du navigateur. Bloquer ces cookies peut empêcher la connexion et l’accès aux services réservés à votre compte.' },
        { title: 'Stockage dans le navigateur', text: 'Le navigateur conserve également certains éléments utiles au service, notamment votre langue, votre devise, votre panier et vos favoris. Une facture ou un brouillon de commande peut être conservé localement pour reprendre votre parcours. Effacer les données du site peut supprimer ces éléments et vous déconnecter, sans supprimer votre compte sur le serveur.' },
        { title: 'Services tiers', text: 'Les fonctionnalités Google, les cartes intégrées, les ressources externes et les liens vers les réseaux sociaux peuvent transmettre des informations techniques à leurs prestataires. Consultez les réglages de votre navigateur et les politiques de ces services pour gérer leurs cookies et autorisations.' },
        { title: 'Gérer les données du site', text: 'Vous pouvez consulter ou supprimer les cookies et le stockage de StevenBmj dans les paramètres de confidentialité de votre navigateur. Ne supprimez pas un panier ou une facture locale dont vous avez encore besoin sans en conserver une copie.' },
      ],
    },
  },
  EN: {
    legal: {
      label: 'Legal Notice', title: 'Legal Notice',
      sections: [
        { title: 'Publisher and management', text: 'StevenBmj is a clothing, footwear, watch and accessories shop for men, women and children, based in Cotonou, Benin. CEO and publication director: AMORIN Steven A . S.' },
        { title: 'Contact us', text: 'Email: stevenbmj202@gmail.com. Telephone: +229 01 55 46 81 38 / +229 01 44 15 80 44. You can also use the website contact form for questions about the shop or an order.' },
        { title: 'Hosting and technical services', text: 'The website is hosted on Vercel. Database and authentication services use Supabase. Third-party services linked from this website apply their own terms and privacy policies.' },
        { title: 'Content and intellectual property', text: 'StevenBmj content and brand elements may not be reused without permission, except where permitted by law. Third-party trademarks remain the property of their respective owners.' },
      ],
    },
    cgv: {
      label: 'Terms of Sale', title: 'Terms of Sale',
      sections: [
        { title: 'Products and availability', text: 'Product features, variants and prices appear in the catalogue. Availability must be confirmed for your order. Contact StevenBmj before committing to any special request or personalisation.' },
        { title: 'Orders and invoices', text: 'Check your items, quantities, contact details and delivery information before confirming a request. The website can generate a PDF invoice and share order details via WhatsApp. Generating an invoice is not, by itself, proof of payment or dispatch.' },
        { title: 'Prices, payment and delivery', text: 'Your summary shows the currency and amounts. Displayed currency conversions are indicative. Confirm the final amount, payment methods, charges, delivery times and delivery terms with StevenBmj before paying. Do not send payment to an unverified contact.' },
        { title: 'Changes, returns and complaints', text: 'Return to your cart before confirmation to change a request, or contact the shop with your order reference. Report damaged or incorrect items and return requests to support. Applicable conditions are explained according to the product and situation, without limiting your statutory rights.' },
      ],
    },
    cgu: {
      label: 'Terms of Use', title: 'Terms of Use',
      sections: [
        { title: 'Using the services', text: 'The website lets you browse the catalogue, prepare a cart, request an order and contact StevenBmj. Provide accurate information and respect the rights of other people when using these services.' },
        { title: 'Accounts and access', text: 'Use an email address you own and keep your password and verification codes confidential. Never share these codes with the AI adviser. Report any suspicious account access to support.' },
        { title: 'Adviser and external links', text: 'The AI adviser helps you explore the catalogue and prepare requests. Its answers may contain mistakes: verify prices, availability and terms with the shop before paying. Google, WhatsApp and social media links open third-party services.' },
        { title: 'Security and availability', text: 'Unauthorised access attempts, fraud, unlawful content and abuse of the services are prohibited. Access may be restricted to protect the platform. Continuous availability cannot be guaranteed, including during maintenance or an incident.' },
      ],
    },
    privacy: {
      label: 'Privacy Policy', title: 'Privacy Policy',
      sections: [
        { title: 'Information processed', text: 'Depending on the services you use, the website processes contact details, account information, your cart, orders, messages and technical security data. If you choose Google sign-in, profile information needed for that sign-in may be used.' },
        { title: 'Purposes and service providers', text: 'This information supports account management, responses to enquiries, order processing and service security. Necessary technical providers may process some data for hosting, authentication, email or AI assistance. Avoid sharing sensitive information in the chat. Sending information via WhatsApp is also subject to that service’s rules.' },
        { title: 'Retention and security', text: 'Data must be retained according to service needs and applicable obligations. Contact StevenBmj to ask about the retention periods for your records. Access controls protect private services; no platform can promise absolute security.' },
        { title: 'Your requests and the newsletter', text: 'Email stevenbmj202@gmail.com to request access, correction or deletion of your data, subject to applicable conditions. Identity verification may be required. To stop receiving shop updates, request removal at the same address. You can also contact Benin’s Personal Data Protection Authority (APDP).' },
      ],
    },
    cookies: {
      label: 'Cookie Policy', title: 'Cookie Policy',
      sections: [
        { title: 'Session cookies', text: 'Session cookies maintain and verify your sign-in. They are not accessible to browser JavaScript. Blocking these cookies may prevent sign-in and access to services reserved for your account.' },
        { title: 'Browser storage', text: 'Your browser also stores information useful to the service, including your language, currency, cart and favourites. An invoice or order draft may be saved locally so you can resume your journey. Clearing website data may remove these items and sign you out, without deleting your server account.' },
        { title: 'Third-party services', text: 'Google features, embedded maps, external resources and social media links may share technical information with their providers. Use your browser settings and consult these services’ policies to manage their cookies and permissions.' },
        { title: 'Managing website data', text: 'You can inspect or clear StevenBmj cookies and storage in your browser’s privacy settings. Keep a copy of any locally stored invoice or cart you still need before clearing website data.' },
      ],
    },
  },
};
