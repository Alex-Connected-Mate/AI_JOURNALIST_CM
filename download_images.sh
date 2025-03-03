#!/bin/bash

# Création du dossier images s'il n'existe pas
mkdir -p public/images

# Téléchargement des images depuis des URLs génériques
# Ces URLs sont des exemples - vous voudrez peut-être utiliser vos propres images
curl -o public/images/university.jpg "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
curl -o public/images/classroom.jpg "https://images.unsplash.com/photo-1588072432904-843af37f03ed?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
curl -o public/images/lecture.jpg "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"

echo "Images téléchargées avec succès dans le dossier public/images!" 