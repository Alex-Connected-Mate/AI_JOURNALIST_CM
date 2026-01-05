/**
 * Configuration pour désactiver le rendu statique dans l'application
 * Ce fichier est utilisé par Next.js pour configurer le comportement du routeur app
 */

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Ne pas pré-rendre ces pages
export const generateStaticParams = () => {
  return [];
}; 