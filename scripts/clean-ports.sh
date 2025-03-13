#!/bin/bash
# clean-ports.sh - Utilitaire pour nettoyer les instances de Next.js qui bloquent des ports

echo "Recherche des processus Node.js qui utilisent les ports 3000-3010..."

# Rechercher les processus qui utilisent les ports entre 3000 et 3010
for port in {3000..3010}; do
    pid=$(lsof -t -i:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "Port $port utilisé par le processus $pid"
        process_info=$(ps -p $pid -o command= 2>/dev/null)
        echo "- Commande: $process_info"
        
        echo "Arrêt du processus $pid..."
        kill -15 $pid
        sleep 1
        
        # Vérifier si le processus est toujours en cours d'exécution
        if ps -p $pid > /dev/null 2>&1; then
            echo "Forcer l'arrêt du processus $pid..."
            kill -9 $pid
        else
            echo "Processus $pid arrêté avec succès."
        fi
    fi
done

echo "Vérification des processus Node zombies restants..."
zombie_pids=$(ps aux | grep node | grep -v grep | awk '{print $2}')

if [ ! -z "$zombie_pids" ]; then
    echo "Processus Node restants détectés:"
    ps aux | grep node | grep -v grep
    
    read -p "Voulez-vous arrêter tous ces processus? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for pid in $zombie_pids; do
            echo "Arrêt du processus $pid..."
            kill -9 $pid
        done
        echo "Tous les processus Node ont été arrêtés."
    fi
else
    echo "Aucun processus Node restant détecté."
fi

echo "Nettoyage terminé. Vous pouvez maintenant démarrer votre application." 