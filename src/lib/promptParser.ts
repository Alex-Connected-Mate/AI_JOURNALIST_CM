/**
 * Utility functions for parsing and generating AI prompts
 */

/**
 * Extracts structured data from a raw prompt by finding text between quotes
 * @param rawPrompt The raw prompt text to parse
 * @returns Object containing extracted structured data
 */
export function parsePrompt(rawPrompt: string) {
  const extractedData: Record<string, string | string[]> = {
    agentName: '',
    programName: '',
    teacherName: '',
    rules: [],
    questions: []
  };

  // Extract agent name
  const agentNameMatch = rawPrompt.match(/You are (?:a dedicated support agent named )?"([^"]+)"/i);
  if (agentNameMatch && agentNameMatch[1]) {
    extractedData.agentName = agentNameMatch[1];
  }

  // Extract program name
  const programNameMatch = rawPrompt.match(/(?:for|in) the "([^"]+)" (?:event|questionnaire)/i);
  if (programNameMatch && programNameMatch[1]) {
    extractedData.programName = programNameMatch[1];
  }

  // Extract teacher name
  const teacherNameMatch = rawPrompt.match(/(?:back to|back on) "([^"]+)"/i);
  if (teacherNameMatch && teacherNameMatch[1]) {
    extractedData.teacherName = teacherNameMatch[1];
  }

  // Extract style
  const styleMatch = rawPrompt.match(/# Style\s+["']([^"']+)["']/i);
  if (styleMatch && styleMatch[1]) {
    extractedData.style = styleMatch[1];
  }

  // Extract rules
  const rulesSection = rawPrompt.match(/# Rules\s+([\s\S]*?)(?=\s*#|$)/i);
  if (rulesSection && rulesSection[1]) {
    const rules: string[] = [];
    const ruleRegex = /\d+\.\s+\*\*([^:*]+)\*\*:\s+([^*]+)/g;
    let ruleMatch;
    while ((ruleMatch = ruleRegex.exec(rulesSection[1])) !== null) {
      if (ruleMatch[1] && ruleMatch[2]) {
        rules.push(`${ruleMatch[1]}: ${ruleMatch[2].trim()}`);
      }
    }
    extractedData.rules = rules;
  }

  // Extract questions
  const questionsSection = rawPrompt.match(/(?:Required Questions|Step \d+:)[^\n]*\s+([\s\S]*?)(?=\s*(?:Step \d+:|#|$))/i);
  if (questionsSection && questionsSection[1]) {
    const questions: string[] = [];
    const questionRegex = /(?:\d+\.\s+\*\*([^*]+)\*\*:\s+)?"([^"]+)"/g;
    let questionMatch;
    while ((questionMatch = questionRegex.exec(questionsSection[1])) !== null) {
      if (questionMatch[2]) {
        questions.push(questionMatch[2].trim());
      }
    }
    extractedData.questions = questions;
  }

  return extractedData;
}

/**
 * Generates a raw prompt from structured data
 * @param data Structured data to generate prompt from
 * @param template The template type to use (nuggets or lightbulbs)
 * @returns Generated raw prompt
 */
export function generatePrompt(data: Record<string, any>, template: 'nuggets' | 'lightbulbs'): string {
  if (template === 'nuggets') {
    return generateNuggetsPrompt(data);
  } else {
    return generateLightbulbsPrompt(data);
  }
}

/**
 * Generates a Nuggets prompt from structured data
 */
function generateNuggetsPrompt(data: Record<string, any>): string {
  const {
    agentName = 'AGENT NAMED',
    programName = 'PROGRAME NAME',
    teacherName = 'TEATCHER NAME',
    style = 'Maintain a professional and friendly tone to make participants feel comfortable and engaged. Use clear sentences, bullet points for clarity, and light emojis to keep the conversation approachable but professional.',
    rules = [],
    questions = []
  } = data;

  // Format rules
  const formattedRules = rules.length > 0 
    ? rules.map((rule: string, index: number) => {
        const [title, description] = rule.split(':').map(s => s.trim());
        return `${index + 1}. **${title}**: \n   - ${description}`;
      }).join('\n')
    : '';

  // Format questions
  const formattedQuestions = questions.length > 0
    ? questions.map((q: string, index: number) => `${index + 1}. **Question ${index + 1}**:  \n   "${q}"`).join('\n   \n')
    : '';

  return `# Objective
You are a dedicated support agent named "${agentName}" responsible for engaging participants in the "${programName}" event questionnaire. Your main goal is to collect accurate and structured responses to key questions while adhering to identification protocols for secure and personalized interactions.

# Style
"${style}"

# Rules

1.  Assure participants that there information will remain confidential and used solely for identification purposes if they ask us to delete their workshop data. 
${formattedRules}

# Interaction Example

### Step 1: Welcome
- Start the conversation: 
  "Hi! Welcome to "${programName}". Participants told ole that your had a great story ! Im your AI Journalist for today. So tell me what's your famous story !  😊"

### Step 2: Required Questions (this question are template)
${formattedQuestions}

### Step 3: Closing the Discussion
- End on a positive and engaging note:  
  "Ok, now let's refocus back on "${teacherName}", and we'll take a look at everyone's input together! Thanks so much for your time and your responses. If there's anything else you'd like to share, feel free to reach out. Have an amazing day! 🚀"`;
}

/**
 * Generates a Lightbulbs prompt from structured data
 */
function generateLightbulbsPrompt(data: Record<string, any>): string {
  const {
    agentName = 'AGENT NAME',
    programName = 'PRGRAMENAME',
    teacherName = 'TEATCHER NAME',
    style = 'Your tone should be professional, supportive, and attentive. Structure the conversation to promote clarity and ease, utilizing bullet points, well-organized steps, and supportive language. Add emojis as needed to make the interaction engaging and welcoming.',
    rules = [],
    questions = []
  } = data;

  // Format rules
  const formattedRules = rules.length > 0 
    ? rules.map((rule: string, index: number) => {
        const [title, description] = rule.split(':').map(s => s.trim());
        return `${index + 1}. **${title}**: \n   - ${description}`;
      }).join('\n')
    : '';

  // Format questions with steps
  const formattedQuestions = questions.length > 0
    ? questions.map((q: string, index: number) => 
        `Step ${index + 1}: ${index === 0 ? 'Inspiration Nugget Reference' : index === 1 ? 'Light Bulb Moment' : `Question ${index + 1}`}
\t•\tRequired Question: "${q}"
\t•\tObjective: "Capture what resonated with the participant, highlighting the motivational trigger."
`).join('\n\n')
    : '';

  return `You are a dedicated support agent named "${agentName}" responsible for conducting the "${programName}" "Final Light Bulb Questionnaire." Your objective is to guide each participant through every mandatory question, ensuring responses are complete, detailed, and reflect the transition from inspiration to action within the "Nexus" framework. Use cross-referencing to link responses to previously identified nuggets where relevant, and maintain focus on actionable plans and future impact.

Style:

${style}

Rules:
${formattedRules}

Steps:

${formattedQuestions}

Closing the Discussion:

After confirming all responses are complete, the agent should conclude with a personalized and lighthearted closing message.

Rules for the Closing Message:
\t1.\t"Mention Annecy and the specific context (e.g., being at the Palace de Menthon, the weather, etc.)."
\t2.\tInclude a reference to the discussion to tie it back to the participant's contributions or insights.
\t3.\t"Add a touch of humor to make the participant smile (e.g., a joke about the rain, the lake, or the setting)."
\t4.\t"Keep the tone friendly, warm, and reflective of the engaging interaction."`;
} 