# Interactive Sessions Platform

Une plateforme interactive pour créer et gérer des sessions en direct, comme des cours, des ateliers ou des présentations.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.x-black)
![Supabase](https://img.shields.io/badge/Supabase-2.x-3FCF8E)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC)

## 📋 Fonctionnalités

- **Authentification**: Connexion et inscription avec Supabase Auth
- **Tableau de bord**: Vue d'ensemble des sessions actives et terminées
- **Création de session**: Interface intuitive avec prévisualisation en temps réel
- **Configuration de profil**: Trois modes (anonyme, semi-anonyme, non-anonyme)
- **Personnalisation**: Options de couleur, emoji, et paramètres visuels
- **Interface responsive**: Fonctionne sur tous les appareils
- **Internationalisation**: Support pour plusieurs langues (français, anglais, japonais)

## 🚀 Installation

1. Cloner le dépôt:
   ```bash
   git clone https://github.com/votre-nom/interactive-sessions.git
   cd interactive-sessions
   ```

2. Installer les dépendances:
   ```bash
   npm install
   ```

3. Créer un fichier `.env.local` à la racine du projet:
   ```
   NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_supabase
   ```

4. Lancer en mode développement:
   ```bash
   npm run dev
   ```

## 🌐 Internationalisation

Cette application prend en charge plusieurs langues:

- Français (par défaut)
- Anglais
- Japonais

L'interface détermine automatiquement la langue préférée de l'utilisateur en fonction de:
1. La préférence sauvegardée dans les cookies
2. La langue du navigateur
3. Par défaut, le français est utilisé

Les utilisateurs peuvent changer de langue à tout moment via le sélecteur de langue dans l'en-tête.

### Ajouter une nouvelle langue

Pour ajouter une nouvelle langue:

1. Créez un nouveau dossier dans `src/messages/` avec le code de la langue (ex: `de` pour l'allemand)
2. Copiez la structure de `src/messages/en/index.json` et traduisez les valeurs
3. Ajoutez le code de la langue dans la liste `supportedLocales` dans `src/components/LocaleProvider.jsx`

## 🛠️ Configuration de Supabase

Cette application nécessite une base de données Supabase pour fonctionner correctement. Voici comment la configurer:

1. Créez un compte sur [Supabase](https://supabase.com) et créez un nouveau projet
2. Dans l'éditeur SQL de Supabase, exécutez le script de base de données fourni dans le fichier `database_schema.sql`
3. Copiez l'URL et la clé anon de Supabase depuis les paramètres du projet
4. Collez ces valeurs dans votre fichier `.env.local`

## 📝 Structure de base de données

Le schéma de base de données comprend:

- **users**: Profils utilisateurs avec informations de base
- **sessions**: Configurations de sessions interactives
- **session_profiles**: Paramètres de profil pour chaque session
- **session_participants**: Participants aux sessions

D'autres tables sont prévues pour les fonctionnalités futures (votes, chat).

## 🧪 Fonctionnalités à venir

- Votes en direct pendant les sessions
- Chat IA avec "nuggets" et "ampoules" d'idées
- Synchronisation en temps réel via Supabase Realtime
- Exportation des résultats et statistiques

## 📱 Déploiement

L'application est optimisée pour un déploiement sur Vercel:

1. Connectez votre dépôt GitHub à Vercel
2. Configurez les variables d'environnement (URL et clé Supabase)
3. Déployez!

## 💻 Technologies utilisées

- [Next.js](https://nextjs.org/) - Framework React
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Zustand](https://github.com/pmndrs/zustand) - Gestion d'état
- [js-cookie](https://github.com/js-cookie/js-cookie) - Gestion des cookies pour les préférences de langue

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus d'informations.

## 👥 Contributeurs

- [Votre Nom](https://github.com/votre-nom) - Développeur principal 