# Dossier App (Temporaire)

Ce dossier contient actuellement seulement le fichier `globals.css` qui est importé par les pages dans le dossier `src/pages`. 

Nous conservons ce dossier pour l'instant pour éviter de refactoriser toutes les importations, mais l'application utilise exclusivement l'approche Pages Router de Next.js.

À terme, ce dossier devrait être refactorisé pour déplacer les styles dans un dossier plus approprié comme `src/styles`. 

# AI Journalist Features

## AI Nuggets

The AI Nuggets feature is a specialized AI Journalist designed to interview participants who have received the most votes during session discussions. This intelligent agent extracts valuable business insights from their stories and documents them in a structured, engaging format.

### Purpose

- **Capture Insights**: Extract business wisdom and actionable takeaways from participants' stories
- **Structured Documentation**: Transform conversational insights into structured, shareable knowledge  
- **Recognition**: Acknowledge participants whose stories resonated most with the group
- **Business Focus**: Maintain focus on extracting practical business learnings from personal stories

### Implementation

The AI Nuggets feature consists of several components:

1. **AI Prompt Template** (`src/lib/prompts.ts`): Defines the journalistic approach, including introduction, key question areas, and synthesis strategy

2. **Agent Integration** (`src/lib/prompts.ts`): Connects the prompt template with the OpenAI API through the `createAINuggetsAgent` function

3. **UI Component** (`src/components/AINuggetsAgent.tsx`): Provides the chat interface for participants to interact with the AI Journalist

4. **Configuration Options** (`src/components/AIInteractionConfig.jsx`): Allows session moderators to customize the AI Nuggets experience

### Usage Flow

1. During the session, participants vote for the most interesting business stories
2. Top-voted participants are directed to the AI Nuggets interface
3. The AI Journalist conducts a structured interview focusing on:
   - Origin story
   - Challenges and solutions
   - Market and customer insights
   - Business model evolution
   - Key learnings
   - Future vision
4. The AI synthesizes 3-5 key business takeaways from the conversation
5. These insights are collected for inclusion in the session summary

### Customization Options

Session moderators can customize:
- Program name
- Teacher/facilitator name
- Agent personality
- Specific rules or questions
- Whether to use the default API key or the user's own key

### Technical Notes

- The agent uses GPT-4 for sophisticated analysis of business insights
- Conversations are securely stored in the session data
- The prompt template is designed to focus on business value while maintaining a conversational tone
- API key usage respects user preferences (default vs. user's own key) 