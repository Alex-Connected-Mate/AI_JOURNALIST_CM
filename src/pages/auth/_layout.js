const React = require('react');
const Image = require('next/image');
const Link = require('next/link');

module.exports = function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 fade-in">
      {/* Motif de points en arrière-plan déjà appliqué via CSS global */}
      
      {/* Logo en haut à gauche */}
      <Link href="/" className="absolute top-8 left-8 z-10 flex items-center gap-3 hover-lift">
        <Image
          src="/logo.png"
          alt="Interactive Sessions Platform"
          width={40}
          height={40}
          className="h-10 w-auto"
        />
        <span className="font-bricolage text-lg font-semibold text-gray-800 hidden sm:inline-block">
          Interactive Sessions
        </span>
      </Link>

      {/* Le contenu des pages d'authentification sera injecté ici */}
      {children}
      
      {/* Powered by */}
      <div className="absolute bottom-6 right-6 z-10">
        <div className="powered-by">
          <span>Powered by</span>
          <span className="font-bricolage font-semibold">Connected Mate</span>
        </div>
      </div>
    </div>
  );
} 