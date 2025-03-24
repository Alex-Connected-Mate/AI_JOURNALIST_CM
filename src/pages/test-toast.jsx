
const React = require('react');
const { useState } = require('react');
const { useToast } = require('@/components/ui/use-toast');

/**
 * Page de test pour les notifications toast
 * Cette page permet de tester différents types de notifications toast
 * et de simuler le comportement de sauvegarde d'une session.
 */
module.exports = function ToastTestPage() {
  const [delay, setDelay] = useState(1000);
  const [success, setSuccess] = useState(true);
  const { toast } = useToast();

  const handleShowToast = () => {
    toast({
      title: success ? 'Succès' : 'Erreur',
      description: `Test de toast ${success ? 'réussi' : 'échoué'}`,
      variant: success ? 'default' : 'destructive',
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test des notifications Toast</h1>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block mb-2">Type de toast</label>
          <select
            value={success ? 'success' : 'error'}
            onChange={(e) => setSuccess(e.target.value === 'success')}
            className="p-2 border rounded"
          >
            <option value="success">Succès</option>
            <option value="error">Erreur</option>
          </select>
        </div>
        <div>
          <label className="block mb-2">Délai (ms)</label>
          <input
            type="number"
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            className="p-2 border rounded"
          />
        </div>
        <button
          onClick={handleShowToast}
          className="p-2 bg-blue-500 text-white rounded"
        >
          Afficher Toast
        </button>
      </div>
    </div>
  );
}
