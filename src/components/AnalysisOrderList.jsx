const React = require('react');
const { DragDropContext, Droppable, Draggable } = require('react-beautiful-dnd');

/**
 * AnalysisOrderList Component
 * 
 * A draggable and reorderable list of analysis types that determines
 * the order of presentation in the final analysis.
 * 
 * @param {Array} items - The list of analysis items
 * @param {Function} onReorder - Callback when items are reordered
 * @param {Function} onToggleItem - Callback when an item is enabled/disabled
 * @param {string} selectedItemId - ID of the currently selected item
 * @param {Function} onSelectItem - Callback when an item is selected
 */
const AnalysisOrderList = ({ 
  items, 
  onReorder, 
  onToggleItem, 
  selectedItemId,
  onSelectItem
}) => {
  // Handler for when drag ends
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);
    
    onReorder(reorderedItems);
  };

  // Icon and color mapping for different analysis types
  const iconMap = {
    'nuggets': '💎',
    'lightbulbs': '💡',
    'global': '📊'
  };
  
  const bgColorMap = {
    'nuggets': 'bg-indigo-100 border-indigo-300',
    'lightbulbs': 'bg-amber-100 border-amber-300',
    'global': 'bg-emerald-100 border-emerald-300'
  };
  
  const selectedBgColorMap = {
    'nuggets': 'bg-indigo-200 border-indigo-400',
    'lightbulbs': 'bg-amber-200 border-amber-400',
    'global': 'bg-emerald-200 border-emerald-400'
  };
  
  const textColorMap = {
    'nuggets': 'text-indigo-800',
    'lightbulbs': 'text-amber-800',
    'global': 'text-emerald-800'
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Ordre des Analyses</h3>
      <p className="text-sm text-gray-600 mb-6">
        Glissez-déposez pour modifier l'ordre de présentation. 
        Cliquez sur un élément pour modifier sa configuration.
      </p>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="analysis-items">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
                        ${item.id === selectedItemId 
                          ? selectedBgColorMap[item.type] 
                          : snapshot.isDragging 
                            ? 'border-purple-300 bg-purple-50 shadow-lg' 
                            : bgColorMap[item.type]
                        }`}
                      onClick={() => onSelectItem(item.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            {...provided.dragHandleProps}
                            className="mr-3 p-1 rounded hover:bg-white/50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-500">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="text-xl mr-3">{iconMap[item.type]}</span>
                            <div>
                              <h4 className={`font-medium ${textColorMap[item.type]}`}>{item.title}</h4>
                              <p className="text-sm text-gray-600">
                                {item.type === 'nuggets' && 'Analyse des extractions de Nuggets'}
                                {item.type === 'lightbulbs' && 'Analyse des idées de Lightbulbs'}
                                {item.type === 'global' && 'Synthèse globale des deux agents'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <label className="inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={item.enabled}
                              onChange={() => onToggleItem(item.id)}
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

module.exports = AnalysisOrderList; 