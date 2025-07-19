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
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.'
    },
    {
      id: 'post-2',
      title: 'L\'intelligence artificielle au quotidien',
      content: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.'
    },
    {
      id: 'post-3',
      title: 'Le futur du travail à distance',
      content: 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.'
    }
  ];

  const currentPostData = mockPosts.find(p => p.id === currentPost);

  return (
    <ReadingSessionWrapper
      postId={currentPost || undefined}
      isPostPage={!!currentPost}
      totalPostsAvailable={mockPosts.length}
    >
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Démo - Système de Suivi de Lecture
            </h1>
            <p className="text-gray-600 mt-2">
              Testez les fonctionnalités Dynamic Island et Live Activities
            </p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {!currentPost ? (
            // Liste des posts
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">Statistiques du jour</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalToday}</div>
                    <div className="text-sm text-gray-600">Total posts</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.readToday}</div>
                    <div className="text-sm text-gray-600">Posts lus</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{stats.remaining}</div>
                    <div className="text-sm text-gray-600">Restants</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.progress}%</div>
                    <div className="text-sm text-gray-600">Progression</div>
                  </div>
                </div>
                {stats.remaining > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stats.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">Paramètres rapides</h2>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span>Dynamic Island</span>
                    <input
                      type="checkbox"
                      checked={settings.enableDynamicIsland}
                      onChange={(e) => updateSettings({ enableDynamicIsland: e.target.checked })}
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>Live Activity</span>
                    <input
                      type="checkbox"
                      checked={settings.enableLiveActivity}
                      onChange={(e) => updateSettings({ enableLiveActivity: e.target.checked })}
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>Notifications</span>
                    <input
                      type="checkbox"
                      checked={settings.enableReadingNotifications}
                      onChange={(e) => updateSettings({ enableReadingNotifications: e.target.checked })}
                      className="rounded"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Posts disponibles</h2>
                {mockPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setCurrentPost(post.id)}
                  >
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2">
                      {post.content.substring(0, 150)}...
                    </p>
                    <div className="mt-4 flex items-center text-sm text-blue-600">
                      <span>Lire l'article</span>
                      <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Vue de lecture d'un post
            <div className="space-y-6">
              <button
                onClick={() => setCurrentPost(null)}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Retour à la liste
              </button>

              <article className="bg-white rounded-lg shadow-sm border p-8">
                <header className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {currentPostData?.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>📖 Lecture en cours...</span>
                    <span>•</span>
                    <span>~3 min de lecture</span>
                  </div>
                </header>

                <div className="prose prose-lg max-w-none">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {currentPostData?.content}
                  </p>
                  
                  <p className="text-lg text-gray-700 leading-relaxed mt-6">
                    Ceci est une démonstration du système de suivi de lecture. Pendant que vous lisez cet article, 
                    le système suit automatiquement votre progression et affiche des notifications visuelles.
                  </p>

                  <p className="text-lg text-gray-700 leading-relaxed mt-6">
                    Vous devriez voir apparaître le Dynamic Island en haut de l'écran et la Live Activity en bas à droite. 
                    Ces éléments vous indiquent que vous êtes en train de lire et combien de posts il vous reste.
                  </p>
                  
                  <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Fonctionnalités actives :</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>✅ Suivi automatique du temps de lecture</li>
                      <li>✅ Dynamic Island (notification en haut)</li>
                      <li>✅ Live Activity (widget en bas à droite)</li>
                      <li>✅ Notifications de début/fin de lecture</li>
                      <li>✅ Comptage des posts lus dans la journée</li>
                    </ul>
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