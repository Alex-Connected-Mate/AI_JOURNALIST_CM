/**
 * Prompt Parser Utility
 * 
 * This utility provides functions to parse and generate prompts for AI agents.
 * It extracts structured data from raw prompts and can generate formatted prompts
 * based on structured data.
 */

/**
 * Parse a raw prompt into structured data
 * 
 * @param {string} rawPrompt - The raw prompt text to parse
 * @returns {Object} Structured data extracted from the prompt
 */
function parsePrompt(rawPrompt) {
  if (!rawPrompt) {
    return {
      agentName: '',
      programName: '',
      teacherName: '',
      style: '',
      rules: [],
      questions: []
    };
  }

  // Extract agent name
  const agentNameMatch = rawPrompt.match(/You are ([^,.]+)/);
  const agentName = agentNameMatch ? agentNameMatch[1].trim() : '';

  // Extract program name
  const programNameMatch = rawPrompt.match(/for the ([^,.]+) program/i) || 
                          rawPrompt.match(/in the ([^,.]+) program/i) ||
                          rawPrompt.match(/during the ([^,.]+) workshop/i);
  const programName = programNameMatch ? programNameMatch[1].trim() : '';

  // Extract teacher name
  const teacherNameMatch = rawPrompt.match(/led by ([^,.]+)/i) || 
                          rawPrompt.match(/facilitated by ([^,.]+)/i) ||
                          rawPrompt.match(/instructor is ([^,.]+)/i);
  const teacherName = teacherNameMatch ? teacherNameMatch[1].trim() : '';

  // Extract style description
  const styleMatch = rawPrompt.match(/# Communication Style\s*\n([\s\S]*?)(?=\n#|$)/);
  const style = styleMatch ? styleMatch[1].trim() : '';

  // Extract rules
  const rulesMatch = rawPrompt.match(/# Rules\s*\n([\s\S]*?)(?=\n#|$)/);
  let rules = [];
  if (rulesMatch) {
    const rulesText = rulesMatch[1];
    // Match numbered rules (e.g., "1. Rule text")
    const ruleRegex = /\d+\.\s*([^\n]+)/g;
    let match;
    while ((match = ruleRegex.exec(rulesText)) !== null) {
      rules.push(match[1].trim());
    }
  }

  // Extract questions
  const questionsMatch = rawPrompt.match(/# Questions\s*\n([\s\S]*?)(?=\n#|$)/);
  let questions = [];
  if (questionsMatch) {
    const questionsText = questionsMatch[1];
    
    // For AI Nuggets format (numbered questions with titles)
    const nuggetQuestionRegex = /\d+\.\s*\*\*([^*]+)\*\*:\s*\n\s*"([^"]+)"/g;
    let match;
    while ((match = nuggetQuestionRegex.exec(questionsText)) !== null) {
      questions.push(`${match[1].trim()}: ${match[2].trim()}`);
    }
    
    // If no nugget questions found, try lightbulbs format
    if (questions.length === 0) {
      const lightbulbQuestionRegex = /##\s*([^\n]+)\n-\s*\*\*Required Question\*\*:\s*"([^"]+)"/g;
      while ((match = lightbulbQuestionRegex.exec(questionsText)) !== null) {
        questions.push(`${match[1].trim()}: ${match[2].trim()}`);
      }
    }
    
    // If still no questions found, try simple format
    if (questions.length === 0) {
      const simpleQuestionRegex = /"([^"]+)"/g;
      while ((match = simpleQuestionRegex.exec(questionsText)) !== null) {
        questions.push(match[1].trim());
      }
    }
  }

  return {
    agentName,
    programName,
    teacherName,
    style,
    rules,
    questions
  };
}

/**
 * Generate a formatted prompt from structured data
 * 
 * @param {Object} data - Structured data for the prompt
 * @param {'nuggets'|'lightbulbs'} agentType - The type of agent
 * @returns {string} Formatted prompt text
 */
function generatePrompt(data, agentType = 'nuggets') {
  const {
    agentName = 'AI Assistant',
    programName = 'Connected Mate',
    teacherName = 'the instructor',
    style = '',
    rules = [],
    questions = []
  } = data;

  let prompt = `# Role\n\nYou are ${agentName}, an AI assistant for the ${programName} program led by ${teacherName}.\n\n`;
  
  // Add communication style
  prompt += `# Communication Style\n\n${style || 'Be professional, friendly, and helpful.'}\n\n`;
  
  // Add rules
  prompt += `# Rules\n\n`;
  rules.forEach((rule, index) => {
    prompt += `${index + 1}. ${rule}\n`;
  });
  prompt += '\n';
  
  // Add questions based on agent type
  prompt += `# Questions\n\n`;
  
  if (agentType === 'lightbulbs') {
    questions.forEach((question, index) => {
      const parts = question.split(':');
      const title = parts[0] ? parts[0].trim() : `Question ${index + 1}`;
      const text = parts[1] ? parts[1].trim() : question;
      
      prompt += `## ${title}\n- **Required Question**: "${text}"\n- **Objective**: Help the participant reflect on their learning\n\n`;
    });
  } else {
    // Default to nuggets format
    questions.forEach((question, index) => {
      const parts = question.split(':');
      const title = parts[0] ? parts[0].trim() : `Question ${index + 1}`;
      const text = parts[1] ? parts[1].trim() : question;
      
      prompt += `${index + 1}. **${title}**:  \n   "${text}"\n   \n`;
    });
  }
  
  return prompt;
}

/**
 * Get default prompt for a specific agent type
 * 
 * @param {'nuggets'|'lightbulbs'} agentType - The type of agent
 * @returns {string} Default prompt for the specified agent type
 */
function getDefaultPrompt(agentType) {
  if (agentType === 'lightbulbs') {
    return `# Role

You are AI Lightbulbs, an AI assistant for the Connected Mate program led by the instructor.

# Communication Style

Be professional, friendly, and helpful. Use clear language and be encouraging. Your goal is to help participants reflect on their learning and generate insights.

# Rules

1. Always be respectful and supportive of participants
2. Focus on helping participants reflect on their learning
3. Ask follow-up questions to deepen reflection
4. Provide encouragement and positive reinforcement
5. Summarize key insights at the end of the conversation

# Questions

## Reflection on Learning
- **Required Question**: "What was the most important thing you learned today?"
- **Objective**: Help the participant reflect on their key takeaways

## Application of Learning
- **Required Question**: "How might you apply what you learned in your work or life?"
- **Objective**: Help the participant think about practical applications

## Challenges and Obstacles
- **Required Question**: "What challenges do you anticipate in applying what you learned?"
- **Objective**: Help the participant identify potential obstacles and solutions`;
  }
  
  // Default to nuggets
  return `# Role

You are AI Nuggets, an AI assistant for the Connected Mate program led by the instructor.

# Communication Style

Be professional, friendly, and helpful. Use clear language and be concise. Your goal is to extract key insights and learning moments from participants.

# Rules

1. Always be respectful and supportive of participants
2. Focus on extracting specific, actionable insights
3. Ask clarifying questions when needed
4. Keep responses brief and focused
5. Summarize key nuggets at the end of the conversation

# Questions

1. **Key Insight**:  
   "What was your most important insight or 'aha moment' from today's session?"
   
2. **Practical Application**:  
   "How do you plan to apply this insight in your work?"
   
3. **Potential Impact**:  
   "What impact do you think this will have?"`;
} 

module.exports = { parsePrompt, generatePrompt, getDefaultPrompt };
