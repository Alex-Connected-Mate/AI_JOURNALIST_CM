# Design System Documentation

Ce document décrit le système de design utilisé dans le projet **Interactive Sessions Platform**. Il sert de référence pour le développement UI, assurant une cohérence visuelle et une expérience utilisateur harmonieuse.

## 1. Philosophie & "Terrain" Visuel

Le design repose sur une métaphore de **profondeur et de superposition (Layering)**. L'interface n'est pas plate ; elle est construite en niveaux (levels) qui guident l'attention de l'utilisateur.

-   **Fond (Terrain)** : Un motif de points (dot pattern) subtil sur un fond clair, créant une texture technique mais légère.
-   **Structure** : Utilisation de cartes type "Bento" et de blocs flottants avec des effets de verre (glassmorphism).

## 2. Typographie

Deux familles de polices sont utilisées pour créer une hiérarchie claire :

### Titres & Branding
-   **Font** : `Bricolage Grotesque`
-   **Usage** : `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, et éléments de marque (`.brand-title`).
-   **Caractéristique** : Apporte une personnalité moderne et légèrement technique.

### Corps de texte
-   **Font** : `Inter` (via `sans-serif` system fallback)
-   **Usage** : Texte courant, paragraphes, labels, boutons.
-   **Caractéristique** : Lisibilité maximale, neutre.

## 3. Couleurs

La palette est sobre, axée sur le contenu, avec des accents fonctionnels.

### Palette Principale
-   **Background** : `#F9FAFB` (Gris très clair)
-   **Surface (Cartes/Blocs)** : `#FFFFFF` (Blanc) ou `#F6F7F9` (Gris structurel)
-   **Texte Principal** : `text-gray-900` (Noir/Gris foncé)
-   **Texte Secondaire** : `text-gray-500` (Gris moyen)

### Accents & États
-   **Primary (Actions)** : `#343A46` (Gris anthracite foncé) avec dégradé subtil.
-   **Danger** : `red-600` (`#DC2626`)
-   **Focus Ring** : `gray-400`

### Variables CSS Clés
```css
:root {
  --background-start-rgb: 246, 247, 249;
  --background-end-rgb: 255, 255, 255;
  --background-dots: #BBBEC3; /* Couleur des points de fond */
}
```

## 4. Système de Profondeur (The Levels)

Le design définit explicitement trois niveaux de blocs pour structurer l'information.

### Niveau 1 (`.first-level-block`)
Le conteneur principal ou les cartes de base.
-   **Background** : Blanc
-   **Border Radius** : `13px`
-   **Shadow** : Légère (`0px 1px 3px rgba(0,0,0,0.15)`)

### Niveau 2 (`.second-level-block`)
Utilisé pour des sections imbriquées ou des zones de regroupement.
-   **Background** : `#F6F7F9`
-   **Border Radius** : `9.391px`
-   **Border** : `2.512px solid white` (Crée un effet de "cut-out" ou d'incrustation)
-   **Shadow** : Très douce (`rgba(35, 39, 46, 0.08)`)

### Niveau 3 (`.third-level-block`)
Éléments flottants au-dessus du niveau 2.
-   **Background** : Blanc
-   **Border Radius** : `13px`
-   **Shadow** : Similaire au niveau 1.

## 5. Composants UI

### Boutons (`.cm-button`)
Les boutons principaux ont un style très spécifique, presque physique.
-   **Background** : `#343A46` avec un dégradé linéaire subtil (0% transparent -> 24% noir).
-   **Border Radius** : `6.818px`
-   **Shadow** : Ombre portée + Ombre interne (`inset`) pour donner du volume.
-   **Hover** : Scale 1.02 (léger agrandissement).

### Boutons Secondaires (`.cm-button-secondary`)
-   **Background** : Blanc
-   **Border** : `1px solid gray-200`
-   **Text** : `gray-700`
-   **Radius** : `9.391px`

### Inputs (`.cm-input`)
-   **Background** : Blanc
-   **Border** : `gray-200`
-   **Radius** : `9.391px`
-   **Focus** : Ring `gray-400`.

### Cartes Bento (`.bento-card`)
Utilisées pour les dashboards et grilles de contenu.
-   **Background** : `bg-white/80` (Semi-transparent)
-   **Blur** : `backdrop-blur-sm`
-   **Border** : `gray-100`
-   **Radius** : `2xl` (environ 16px/24px)

## 6. Layout & Navigation

### Header Flottant (`.floating-header`)
-   Position : `sticky top-0`
-   Apparence : Blanc, ombre portée légère.
-   Z-Index : 50

### Navigation Latérale Flottante (`.floating-navbar`)
Pour les layouts type dashboard.
-   Position : Fixe, avec marges (`1.5rem`).
-   Style : Verre dépoli (Glassmorphism), bordures arrondies.

## 7. Effets & Animations

-   **Background Pattern** :
    ```css
    background-image: radial-gradient(var(--background-dots) 1.2px, transparent 1.2px);
    background-size: 24px 24px;
    ```
-   **Hover Lift** : `.hover-lift` déplace l'élément de 2px vers le haut.
-   **Typing Indicator** : Animation de 3 points rebondissants (`#8b5cf6` - violet) pour l'IA.
-   **Fade In** : Animation d'apparition progressive pour le contenu chargé dynamiquement.

---

*Note pour le développeur : Ce système est implémenté via Tailwind CSS (`@layer components`) dans `src/app/globals.css`. Les classes utilitaires personnalisées comme `.first-level-block` doivent être utilisées pour maintenir la cohérence structurelle.*


