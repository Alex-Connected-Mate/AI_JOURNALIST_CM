#!/bin/bash
# restart-app.sh - Script pour redémarrer proprement l'application

echo "Nettoyage des instances Node.js existantes..."

# Exécution du script de nettoyage des ports
bash ./scripts/clean-ports.sh

# Attente d'un moment pour s'assurer que tous les ports sont libérés
sleep 2

echo "Démarrage de l'application sur le port 3000..."

# Démarrage de l'application sur un port spécifique
cd "$(dirname "$0")/.." && PORT=3000 npm run dev 