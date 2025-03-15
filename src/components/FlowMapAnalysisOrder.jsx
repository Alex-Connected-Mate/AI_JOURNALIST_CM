import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ChevronUp, ChevronDown, File, Lightbulb, Diamond, BarChart3 } from 'lucide-react';

/**
 * FlowMapAnalysisOrder Component
 * 
 * Displays the analysis blocks in the flow map and allows users to reorder them
 * by drag and drop or using the up/down arrows.
 * 
 * @param {Array} items - The list of analysis items
 * @param {Function} onReorder - Callback when items are reordered
 * @param {Function} onToggleItem - Callback when an item is enabled/disabled
 */
const FlowMapAnalysisOrder = ({
  items = [],
  onReorder,
  onToggleItem
}) => {
  // Handle drag end event
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);
    
    onReorder(reorderedItems);
  };

  // Move item up in the list
  const moveItemUp = (index) => {
    if (index === 0) return;
    
    const newItems = Array.from(items);
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    
    onReorder(newItems);
  };

  // Move item down in the list
  const moveItemDown = (index) => {
    if (index === items.length - 1) return;
    
    const newItems = Array.from(items);
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    
    onReorder(newItems);
  };

  // Get icon based on item type
  const getItemIcon = (type) => {
    switch (type) {
      case 'nuggets':
        return <Diamond size={16} className="text-indigo-500" />;
      case 'lightbulbs':
        return <Lightbulb size={16} className="text-amber-500" />;
      case 'global':
        return <BarChart3 size={16} className="text-emerald-500" />;
      default:
        return <File size={16} className="text-gray-500" />;
    }
  };

  // Get background color based on item type
  const getItemBackground = (type, isDragging, isEnabled) => {
    if (!isEnabled) return 'bg-gray-100 border-gray-300 opacity-60';
    if (isDragging) return 'bg-purple-50 border-purple-300 shadow-md';
    
    switch (type) {
      case 'nuggets':
        return 'bg-indigo-50 border-indigo-200';
      case 'lightbulbs':
        return 'bg-amber-50 border-amber-200';
      case 'global':
        return 'bg-emerald-50 border-emerald-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Ordre des Analyses</h3>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="flow-map-analysis-items">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center justify-between rounded-lg border p-2 ${getItemBackground(item.type, snapshot.isDragging, item.enabled)}`}
                    >
                      <div className="flex items-center gap-2" {...provided.dragHandleProps}>
                        {getItemIcon(item.type)}
                        <span className={`text-sm font-medium ${!item.enabled ? 'text-gray-400' : ''}`}>
                          {index + 1}. {item.title}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <button
                          onClick={() => onToggleItem(item.id)}
                          className={`w-8 h-5 rounded-full relative mx-1 transition-colors ${item.enabled ? 'bg-purple-500' : 'bg-gray-300'}`}
                        >
                          <span 
                            className={`absolute top-0.5 ${item.enabled ? 'right-0.5' : 'left-0.5'} bg-white w-4 h-4 rounded-full transition-all`}
                          />
                        </button>
                        
                        <div className="flex flex-col">
                          <button
                            onClick={() => moveItemUp(index)}
                            disabled={index === 0}
                            className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            onClick={() => moveItemDown(index)}
                            disabled={index === items.length - 1}
                            className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                          >
                            <ChevronDown size={16} />
                          </button>
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

export default FlowMapAnalysisOrder; 