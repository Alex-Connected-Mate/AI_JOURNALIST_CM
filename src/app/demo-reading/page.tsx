'use client';

import React, { useState } from 'react';
import ReadingSessionWrapper from '@/components/ReadingSessionWrapper';
import { useReadingTracker } from '@/hooks/useReadingTracker';

const DemoReadingPage = () => {
  const [currentPost, setCurrentPost] = useState<string | null>(null);
  const { stats, settings, updateSettings } = useReadingTracker();

  const mockPosts = [
    {
      id: 'post-1',
      title: 'Les nouvelles technologies en 2024',
      category: 'Innovation',
      readTime: '3 min',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      id: 'post-2',
      title: 'L\'intelligence artificielle au quotidien',
      category: 'IA & Société',
      readTime: '5 min',
      content: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.',
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'post-3',
      title: 'Le futur du travail à distance',
      category: 'Travail',
      readTime: '4 min',
      content: 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.',
      gradient: 'from-orange-500 to-red-600'
    }
  ];

  const currentPostData = mockPosts.find(p => p.id === currentPost);

  const ToggleSwitch = ({ label, checked, onChange, description }: any) => (
    <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/60 transition-all duration-300">
      <div className="flex-1">
        <p className="font-medium font-bricolage text-gray-900">{label}</p>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <label className="relative inline-block w-12 h-6">
        <input
          type="checkbox"
          className="opacity-0 w-0 h-0"
          checked={checked}
          onChange={onChange}
        />
        <span 
          className={`absolute cursor-pointer inset-0 rounded-full transition-all duration-300 ${
            checked 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg' 
              : 'bg-gray-300'
          }`}
        >
          <span 
            className={`absolute h-4 w-4 top-1 bg-white rounded-full transition-all duration-300 transform shadow-md ${
              checked ? 'translate-x-7' : 'translate-x-1'
            }`}
          ></span>
        </span>
      </label>
    </div>
  );

  return (
    <ReadingSessionWrapper
      postId={currentPost || undefined}
      isPostPage={!!currentPost}
      totalPostsAvailable={mockPosts.length}
    >
      <div className="min-h-screen dot-pattern">
        {/* Floating Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-bricolage text-gray-900">
                  🧪 Laboratoire de Lecture
                </h1>
                <p className="text-gray-600 mt-1">
                  Testez les fonctionnalités Dynamic Island et Live Activities
                </p>
              </div>
              {!currentPost && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {stats.readToday}/{stats.totalToday} posts
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats.progress}% complété
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold font-mono text-lg">
                      {stats.remaining}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          {!currentPost ? (
            // Dashboard View
            <div className="space-y-8">
              {/* Stats Hero Section */}
              <div className="first-level-block p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-emerald-50 opacity-60"></div>
                <div className="relative">
                  <h2 className="text-xl font-bold font-bricolage mb-6 text-gray-900">
                    📊 Tableau de bord quotidien
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 hover:scale-105 transition-transform duration-300">
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-mono">
                        {stats.totalToday}
                      </div>
                      <div className="text-sm font-medium text-gray-600 mt-1">Posts du jour</div>
                    </div>
                    <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 hover:scale-105 transition-transform duration-300">
                      <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-mono">
                        {stats.readToday}
                      </div>
                      <div className="text-sm font-medium text-gray-600 mt-1">Posts lus</div>
                    </div>
                    <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 hover:scale-105 transition-transform duration-300">
                      <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent font-mono">
                        {stats.remaining}
                      </div>
                      <div className="text-sm font-medium text-gray-600 mt-1">Restants</div>
                    </div>
                    <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 hover:scale-105 transition-transform duration-300">
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-mono">
                        {stats.progress}%
                      </div>
                      <div className="text-sm font-medium text-gray-600 mt-1">Progression</div>
                    </div>
                  </div>
                  {stats.remaining > 0 && (
                    <div className="mt-6">
                      <div className="w-full bg-gray-200/60 rounded-full h-3 overflow-hidden">
                        <div 
                          className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 transition-all duration-1000 ease-out relative"
                          style={{ width: `${stats.progress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Settings Panel */}
              <div className="first-level-block p-8">
                <h2 className="text-xl font-bold font-bricolage mb-6 text-gray-900">
                  ⚙️ Configuration en temps réel
                </h2>
                <div className="space-y-4">
                  <ToggleSwitch
                    label="🏝️ Dynamic Island"
                    description="Notification persistante en haut de l'écran avec animations iOS"
                    checked={settings.enableDynamicIsland}
                    onChange={(e: any) => updateSettings({ enableDynamicIsland: e.target.checked })}
                  />
                  <ToggleSwitch
                    label="📱 Live Activity"
                    description="Widget glassmorphism avec progression et statistiques détaillées"
                    checked={settings.enableLiveActivity}
                    onChange={(e: any) => updateSettings({ enableLiveActivity: e.target.checked })}
                  />
                  <ToggleSwitch
                    label="🔔 Notifications Push"
                    description="Alertes système pour début/fin de lecture et rappels"
                    checked={settings.enableReadingNotifications}
                    onChange={(e: any) => updateSettings({ enableReadingNotifications: e.target.checked })}
                  />
                  <ToggleSwitch
                    label="🔊 Sons immersifs"
                    description="Effets sonores harmoniques pour une expérience audio enrichie"
                    checked={settings.enableSounds}
                    onChange={(e: any) => updateSettings({ enableSounds: e.target.checked })}
                  />
                </div>
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">💡 Astuce :</span> Activez toutes les fonctionnalités pour une expérience complète !
                  </p>
                </div>
              </div>

              {/* Posts Grid */}
              <div>
                <h2 className="text-xl font-bold font-bricolage mb-6 text-gray-900">
                  📚 Articles de démonstration
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {mockPosts.map((post, index) => (
                    <div
                      key={post.id}
                      className="group first-level-block p-6 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden"
                      onClick={() => setCurrentPost(post.id)}
                    >
                      {/* Gradient Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
                      
                      <div className="relative">
                        {/* Category Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <span className={`inline-block px-3 py-1 text-xs font-medium bg-gradient-to-r ${post.gradient} text-white rounded-full`}>
                            {post.category}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">
                            {post.readTime}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold font-bricolage text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                          {post.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                          {post.content.substring(0, 120)}...
                        </p>
                        
                        <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                          <span>Commencer la lecture</span>
                          <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Reading View
            <div className="space-y-6">
              <button
                onClick={() => setCurrentPost(null)}
                className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-white/40 text-gray-700 hover:bg-white hover:text-blue-600 transition-all duration-300 font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Retour au laboratoire
              </button>

              <article className="first-level-block p-8 md:p-12 relative overflow-hidden">
                {/* Article gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${currentPostData?.gradient} opacity-5`}></div>
                
                <div className="relative">
                  <header className="mb-8">
                    <div className="flex items-center space-x-4 mb-4">
                      <span className={`inline-block px-4 py-1.5 text-sm font-medium bg-gradient-to-r ${currentPostData?.gradient} text-white rounded-full`}>
                        {currentPostData?.category}
                      </span>
                      <span className="text-sm text-gray-500 font-mono">
                        {currentPostData?.readTime} de lecture
                      </span>
                    </div>
                    
                    <h1 className="text-4xl font-bold font-bricolage text-gray-900 mb-6 leading-tight">
                      {currentPostData?.title}
                    </h1>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">Session de lecture active</span>
                      </div>
                      <span>•</span>
                      <span>Suivi automatique en cours</span>
                    </div>
                  </header>

                  <div className="prose prose-lg max-w-none">
                    <div className="text-lg text-gray-700 leading-relaxed space-y-6">
                      <p className="first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1">
                        {currentPostData?.content}
                      </p>
                      
                      <p>
                        Pendant cette démonstration, vous pouvez observer le comportement des composants Dynamic Island et Live Activity. 
                        Le système suit automatiquement votre progression et affiche des indicateurs visuels sophistiqués.
                      </p>

                      <div className="second-level-block p-6 my-8">
                        <h3 className="font-bold font-bricolage text-gray-900 mb-4 text-xl">
                          🎯 Fonctionnalités en action
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm">Dynamic Island (haut de l'écran)</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm">Live Activity (bas droite)</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-sm">Suivi temps réel</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span className="text-sm">Comptage automatique</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              <span className="text-sm">Notifications contextuelles</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm">Animations fluides</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p>
                        Cette implémentation utilise les meilleures pratiques de design iOS adaptées au web, 
                        avec des effets de glassmorphism, des animations subtiles et une attention particulière 
                        aux détails typographiques et visuels.
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          )}
        </main>
      </div>
    </ReadingSessionWrapper>
  );
};

export default DemoReadingPage;