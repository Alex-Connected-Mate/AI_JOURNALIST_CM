'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import DotPattern from '@/components/DotPattern';
import { useStore } from '@/lib/store';

export default function HomePage() {
  const { user } = useStore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="flex flex-col min-h-screen relative bg-gradient-to-b from-blue-50 to-white">
      <DotPattern className="absolute inset-0 z-0 opacity-50" />
      
      <main className="flex-grow flex flex-col relative z-10">
        {/* Hero Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <motion.div 
                className="md:w-1/2 text-center md:text-left mb-10 md:mb-0"
                initial="hidden"
                animate={mounted ? "visible" : "hidden"}
                variants={fadeIn}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  AI Journalist Platform
                </h1>
                <p className="text-xl text-gray-700 mb-8 max-w-xl">
                  Transformez vos discussions en insights précieux grâce à notre plateforme d'analyse alimentée par l'IA.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                  {user ? (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link 
                        href="/dashboard" 
                        className="cm-button px-8 py-3 rounded-lg shadow-lg inline-block font-medium text-lg"
                      >
                        Accéder au Dashboard
                      </Link>
                    </motion.div>
                  ) : (
                    <>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link 
                          href="/auth/login" 
                          className="cm-button px-8 py-3 rounded-lg shadow-lg inline-block font-medium text-lg"
                        >
                          Se connecter
                        </Link>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link 
                          href="/join" 
                          className="cm-button-secondary px-8 py-3 rounded-lg shadow-md border-2 border-primary text-lg font-medium inline-flex items-center"
                        >
                          <span className="mr-2">Rejoindre une session</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </Link>
                      </motion.div>
                    </>
                  )}
                </div>
              </motion.div>
              
              <motion.div 
                className="md:w-1/2"
                initial="hidden"
                animate={mounted ? "visible" : "hidden"}
                variants={fadeIn}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="relative h-64 md:h-96 w-full">
                  <Image 
                    src="/images/ai-journalist-hero.webp" 
                    alt="AI Journalist Platform" 
                    fill
                    className="object-contain"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 bg-white bg-opacity-80">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-4">Fonctionnalités principales</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Notre plateforme combine technologies d'IA avancées et outils pédagogiques pour analyser vos discussions.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <motion.div 
                className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="bg-blue-500 text-white p-2 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Sessions interactives</h3>
                <p className="text-gray-700 mb-4">Créez et gérez des sessions d'analyse interactives pour vos groupes de discussion</p>
                <Link href="/sessions" className="text-blue-600 font-medium hover:underline inline-flex items-center">
                  <span>Explorer</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="bg-purple-500 text-white p-2 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Tableau de bord</h3>
                <p className="text-gray-700 mb-4">Visualisez vos statistiques et résultats d'analyse avec des graphiques interactifs</p>
                <Link href="/dashboard" className="text-purple-600 font-medium hover:underline inline-flex items-center">
                  <span>Explorer</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-green-50 to-teal-100 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="bg-green-500 text-white p-2 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Rejoindre une session</h3>
                <p className="text-gray-700 mb-4">Participez facilement à une session en tant qu'étudiant ou intervenant</p>
                <Link href="/join" className="text-green-600 font-medium hover:underline inline-flex items-center">
                  <span>Rejoindre</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-4">Comment ça marche</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Un processus simple en trois étapes pour transformer vos discussions en insights
              </p>
            </motion.div>
            
            <div className="flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-12">
              <motion.div 
                className="flex flex-col items-center text-center max-w-xs"
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Créez une session</h3>
                <p className="text-gray-600">Configurez rapidement une session avec les paramètres adaptés à votre contexte d'enseignement</p>
              </motion.div>
              
              <div className="hidden md:block">
                <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M59.0607 13.0607C59.6464 12.4749 59.6464 11.5251 59.0607 10.9393L49.5147 1.3934C48.9289 0.807611 47.9792 0.807611 47.3934 1.3934C46.8076 1.97919 46.8076 2.92893 47.3934 3.51472L55.8787 12L47.3934 20.4853C46.8076 21.0711 46.8076 22.0208 47.3934 22.6066C47.9792 23.1924 48.9289 23.1924 49.5147 22.6066L59.0607 13.0607ZM0 13.5H58V10.5H0V13.5Z" fill="#3B82F6"/>
                </svg>
              </div>
              
              <motion.div 
                className="flex flex-col items-center text-center max-w-xs"
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xl font-bold mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">Animez la discussion</h3>
                <p className="text-gray-600">Notre IA analyse en temps réel les échanges et identifie les insights importants</p>
              </motion.div>
              
              <div className="hidden md:block">
                <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M59.0607 13.0607C59.6464 12.4749 59.6464 11.5251 59.0607 10.9393L49.5147 1.3934C48.9289 0.807611 47.9792 0.807611 47.3934 1.3934C46.8076 1.97919 46.8076 2.92893 47.3934 3.51472L55.8787 12L47.3934 20.4853C46.8076 21.0711 46.8076 22.0208 47.3934 22.6066C47.9792 23.1924 48.9289 23.1924 49.5147 22.6066L59.0607 13.0607ZM0 13.5H58V10.5H0V13.5Z" fill="#8B5CF6"/>
                </svg>
              </div>
              
              <motion.div 
                className="flex flex-col items-center text-center max-w-xs"
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl font-bold mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">Exploitez les résultats</h3>
                <p className="text-gray-600">Explorez les visualisations et analyses pour tirer le maximum de valeur des discussions</p>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Info Box */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div 
              className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-xl border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-100 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold">Informations importantes</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium mb-3">Déploiement Vercel</h4>
                  <p className="text-gray-600 mb-4">
                    Cette application est déployée sur Vercel à l'adresse suivante :
                  </p>
                  <a 
                    href="https://ai-journalist-connectedmate.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-medium hover:underline inline-flex items-center group"
                  >
                    <span>ai-journalist-connectedmate.vercel.app</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H3a1 1 0 110-2h9.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-3">Notes de développement</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>En cas de problème : <code className="bg-gray-100 px-2 py-0.5 rounded text-blue-600">npm run dev:safe</code></span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Conflit Git : <code className="bg-gray-100 px-2 py-0.5 rounded text-blue-600">npm run fix-next-config</code></span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Diagnostics : <code className="bg-gray-100 px-2 py-0.5 rounded text-blue-600">/admin/diagnostics</code></span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-medium mb-3">Outils de dépannage</h4>
                <div className="flex flex-wrap gap-3">
                  <Link 
                    href="/debug" 
                    className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium inline-flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM6.293 6.707a1 1 0 011.414 0L9 8l1.293-1.293a1 1 0 111.414 1.414L10.414 9.5l1.293 1.293a1 1 0 01-1.414 1.414L9 10.914l-1.293 1.293a1 1 0 01-1.414-1.414L7.586 9.5 6.293 8.207a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Diagnostic</span>
                  </Link>
                  
                  <Link 
                    href="/force-dashboard" 
                    className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium inline-flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                    </svg>
                    <span>Dashboard d'urgence</span>
                  </Link>
                  
                  <a 
                    href="/emergency.html" 
                    className="px-4 py-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium inline-flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Page de récupération</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <footer className="py-8 bg-white shadow-inner relative z-10 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600">© {new Date().getFullYear()} ConnectedMate</p>
              <p className="text-gray-500 text-sm">Tous droits réservés</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                Conditions d'utilisation
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                Politique de confidentialité
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 