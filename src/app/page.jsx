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
    <div className="flex flex-col min-h-screen relative bg-white dot-pattern">
      <DotPattern className="absolute inset-0 z-0 opacity-70" />
      
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px)`,
          backgroundSize: `24px 24px`,
          backgroundPosition: '0 0',
          opacity: 0.6,
        }}
        aria-hidden="true"
      />
      
      <main className="flex-grow flex flex-col relative z-10 pt-8">
        {/* Header with Logo */}
        <div className="container mx-auto px-4 mb-8">
          <div className="flex justify-center md:justify-start">
            <div className="w-48 h-12 relative">
              <Image 
                src="/images/logo.png" 
                alt="AI Journalist Platform Logo" 
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
        
        {/* Hero Section - Bento Style */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Main Hero Card */}
            <motion.div 
              className="md:col-span-8 bg-white p-8 rounded-3xl shadow-lg border border-gray-100 relative overflow-hidden"
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              variants={fadeIn}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute right-0 bottom-0 w-1/3 h-1/3 bg-blue-50 rounded-tl-3xl -mr-8 -mb-8 z-0"></div>
              <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  AI-Powered <span className="text-blue-600">Insights</span> for Interactive Sessions
                </h1>
                <p className="text-xl text-gray-700 mb-8 max-w-2xl">
                  Let your participants discuss with AI to explore ideas and collect valuable data on your programs and students.
                </p>
                
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  {user ? (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link 
                        href="/dashboard" 
                        className="cm-button px-8 py-4 rounded-lg shadow-lg inline-block font-medium text-lg"
                      >
                        Access Dashboard
                      </Link>
                    </motion.div>
                  ) : (
                    <>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link 
                          href="/auth/login" 
                          className="cm-button px-8 py-4 rounded-lg shadow-lg inline-block font-medium text-lg"
                        >
                          Sign In
                        </Link>
                      </motion.div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
            
            {/* Join Session Card - Highlighted */}
            <motion.div 
              className="md:col-span-4 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-lg text-white relative overflow-hidden"
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              variants={fadeIn}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-blue-400 opacity-20 rounded-full -mr-10 -mb-10"></div>
              <div className="absolute left-0 top-0 w-20 h-20 bg-indigo-300 opacity-20 rounded-full -ml-10 -mt-10"></div>
              
              <h2 className="text-2xl font-bold mb-4">Join a Session</h2>
              <p className="mb-6 text-blue-100">
                No account needed. Connect instantly to any interactive discussion session.
              </p>
              
              <div className="mb-6">
                <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm mb-4">
                  <input 
                    type="text" 
                    placeholder="Enter session code" 
                    className="w-full bg-transparent border-b border-white/40 pb-2 text-white placeholder-white/60 focus:outline-none focus:border-white"
                  />
                </div>
                
                <div className="text-center text-sm mb-2 text-blue-100">or</div>
                
                <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm flex items-center justify-center">
                  <div className="mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <span>Scan QR Code</span>
                </div>
              </div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-2">
                <Link 
                  href="/join" 
                  className="block w-full bg-white text-blue-600 font-medium py-3 rounded-lg text-center shadow-md"
                >
                  Join Now
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
        
        {/* Value Proposition - Bento Grid */}
        <section className="container mx-auto px-4 py-12">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Upgrade Your Teaching Experience</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transform traditional discussion sessions into AI-powered data collection and insight generation.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <motion.div 
              className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-blue-100 text-blue-600 p-3 rounded-xl w-14 h-14 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Facilitated Discussions</h3>
              <p className="text-gray-600">
                Let your participants interact with AI agents that help them express ideas more clearly and challenge their thinking.
              </p>
            </motion.div>
            
            {/* Card 2 */}
            <motion.div 
              className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-purple-100 text-purple-600 p-3 rounded-xl w-14 h-14 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Comprehensive Analytics</h3>
              <p className="text-gray-600">
                Collect valuable data about participant engagement, idea quality, and discussion patterns with real-time dashboards.
              </p>
            </motion.div>
            
            {/* Card 3 */}
            <motion.div 
              className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-green-100 text-green-600 p-3 rounded-xl w-14 h-14 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Customizable Experience</h3>
              <p className="text-gray-600">
                Create tailored sessions with specific AI behaviors, discussion topics, and interaction parameters.
              </p>
            </motion.div>
          </div>
        </section>
        
        {/* How It Works - Bento Layout */}
        <section className="container mx-auto px-4 py-12">
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Step 1 */}
            <motion.div 
              className="md:col-span-4 bg-white p-6 rounded-2xl shadow-md border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold mr-4">1</div>
                <h3 className="text-xl font-semibold">Create a Session</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Design your discussion session with custom parameters, AI behaviors, and participation rules.
              </p>
              <Link href="/sessions/new" className="text-blue-600 font-medium inline-flex items-center hover:underline">
                <span>Learn more</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div 
              className="md:col-span-4 bg-white p-6 rounded-2xl shadow-md border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xl font-bold mr-4">2</div>
                <h3 className="text-xl font-semibold">Invite Participants</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Share a session code or QR code with your students or participants for immediate access.
              </p>
              <Link href="/sessions" className="text-purple-600 font-medium inline-flex items-center hover:underline">
                <span>Learn more</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </motion.div>
            
            {/* Step 3 */}
            <motion.div 
              className="md:col-span-4 bg-white p-6 rounded-2xl shadow-md border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl font-bold mr-4">3</div>
                <h3 className="text-xl font-semibold">Analyze Results</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Review comprehensive analytics and AI-generated insights from participant discussions.
              </p>
              <Link href="/dashboard" className="text-green-600 font-medium inline-flex items-center hover:underline">
                <span>Learn more</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </motion.div>
          </div>
        </section>
        
        {/* Testimonial / Featured Quote */}
        <section className="container mx-auto px-4 py-12">
          <motion.div 
            className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/4 mb-6 md:mb-0 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="md:w-3/4 md:pl-8">
                <blockquote className="text-xl italic text-gray-600 mb-4">
                  "This platform has transformed how my students engage with complex topics. The AI-facilitated discussions allow everyone to participate and explore ideas in ways traditional methods simply cannot match."
                </blockquote>
                <div className="font-semibold">Dr. Sarah Johnson</div>
                <div className="text-sm text-gray-500">Professor of Business Innovation, INSEAD</div>
              </div>
            </div>
          </motion.div>
        </section>
        
        {/* Partner Logos */}
        <section className="container mx-auto px-4 py-12">
          <motion.div 
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-2">Trusted By Leading Institutions</h2>
          </motion.div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <motion.div 
              className="w-32 h-16 relative grayscale hover:grayscale-0 transition-all duration-300"
              initial={{ opacity: 0 }}
              animate={mounted ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Image 
                src="/images/partners/insead.png" 
                alt="INSEAD" 
                fill
                className="object-contain"
              />
            </motion.div>
            
            <motion.div 
              className="w-32 h-16 relative grayscale hover:grayscale-0 transition-all duration-300"
              initial={{ opacity: 0 }}
              animate={mounted ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Image 
                src="/images/partners/cedep.png" 
                alt="CEDEP" 
                fill
                className="object-contain"
              />
            </motion.div>
            
            <motion.div 
              className="w-32 h-16 relative grayscale hover:grayscale-0 transition-all duration-300"
              initial={{ opacity: 0 }}
              animate={mounted ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Image 
                src="/images/partners/harvard.png" 
                alt="Harvard" 
                fill
                className="object-contain"
              />
            </motion.div>
            
            <motion.div 
              className="w-32 h-16 relative grayscale hover:grayscale-0 transition-all duration-300"
              initial={{ opacity: 0 }}
              animate={mounted ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Image 
                src="/images/partners/mit.png" 
                alt="MIT" 
                fill
                className="object-contain"
              />
            </motion.div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="container mx-auto px-4 py-12 mb-8">
          <motion.div 
            className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 md:p-12 rounded-3xl shadow-xl text-white relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mb-32"></div>
            <div className="absolute left-0 top-0 w-64 h-64 bg-blue-400 opacity-10 rounded-full -ml-32 -mt-32"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Teaching?</h2>
              <p className="text-xl text-blue-100 mb-8">
                Join thousands of professors who are enhancing student engagement and collecting valuable insights through AI-facilitated discussions.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href="/auth/signup" 
                    className="block px-8 py-4 bg-white text-blue-600 font-medium rounded-lg shadow-lg"
                  >
                    Get Started Free
                  </Link>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href="/demo" 
                    className="block px-8 py-4 bg-blue-500 bg-opacity-30 text-white font-medium rounded-lg shadow-lg border border-white/30 backdrop-blur-sm"
                  >
                    Request Demo
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
      
      <footer className="py-8 bg-white relative z-10 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="w-32 h-10 relative mb-4">
                <Image 
                  src="/images/logo.png" 
                  alt="AI Journalist Platform Logo" 
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-gray-600">© {new Date().getFullYear()} ConnectedMate</p>
              <p className="text-gray-500 text-sm">All rights reserved</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold mb-4">Platform</h4>
                <ul className="space-y-2">
                  <li><Link href="/features" className="text-gray-600 hover:text-blue-600">Features</Link></li>
                  <li><Link href="/pricing" className="text-gray-600 hover:text-blue-600">Pricing</Link></li>
                  <li><Link href="/faq" className="text-gray-600 hover:text-blue-600">FAQ</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><Link href="/about" className="text-gray-600 hover:text-blue-600">About Us</Link></li>
                  <li><Link href="/contact" className="text-gray-600 hover:text-blue-600">Contact</Link></li>
                  <li><Link href="/careers" className="text-gray-600 hover:text-blue-600">Careers</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><Link href="/terms" className="text-gray-600 hover:text-blue-600">Terms of Service</Link></li>
                  <li><Link href="/privacy" className="text-gray-600 hover:text-blue-600">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 