import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
// Use a simple toast implementation since sonner is not available
const toast = {
  success: (message: string) => console.log(`Success: ${message}`),
  error: (message: string) => console.error(`Error: ${message}`)
};
import PromptEditor from '@/components/PromptEditor';
import DashboardLayout from '@/components/layouts/DashboardLayout';
// Import the supabase client from a local file
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AIPrompt {
  id: string;
  workshop_id: string;
  agent_type: 'nuggets' | 'lightbulbs';
  agent_name: string;
  program_name: string;
  teacher_name: string;
  style_description: string;
  rules: string[];
  questions: string[];
  raw_prompt: string;
  generated_prompt: string;
}

interface PromptData {
  id: string;
  workshop_id: string;
  agent_type: string;
  agent_name: string;
  program_name: string;
  teacher_name: string;
  style_description: string;
  rules: string[];
  questions: string[];
  raw_prompt: string;
  generated_prompt: string;
  [key: string]: any;
}

interface WorkshopData {
  id: string;
  name: string;
  organization_name: string;
}

interface AIPromptsPageProps {
  workshop: WorkshopData;
  user: {
    id: string;
    email: string;
  };
}

export default function AIPromptsPage({ workshop, user }: AIPromptsPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'nuggets' | 'lightbulbs'>('nuggets');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prompts, setPrompts] = useState<{
    nuggets: AIPrompt | null;
    lightbulbs: AIPrompt | null;
  }>({
    nuggets: null,
    lightbulbs: null
  });

  // Default prompts
  const defaultPrompts = {
    nuggets: `# Objective
You are a dedicated support agent named "AGENT NAMED" responsible for engaging participants in the "PROGRAME NAME" event questionnaire. Your main goal is to collect accurate and structured responses to key questions while adhering to identification protocols for secure and personalized interactions.

# Style
"Maintain a professional and friendly tone to make participants feel comfortable and engaged. Use clear sentences, bullet points for clarity, and light emojis to keep the conversation approachable but professional."

# Rules

1.  Assure participants that there information will remain confidential and used solely for identification purposes if they ask us to delete their workshop data. 
2. **Sequential Flow**: 
   - Ask each required question in order and proceed only after receiving a full response.
3. **Clarification**: 
   - If a response is incomplete or unclear, ask for additional details politely before moving on.
4. **No Skipped Questions**: 
   - All the required questions must be addressed without skipping or rephrasing unless necessary for clarity.
5. **End of Conversation**: 
   - Conclude the conversation only after confirming that all responses are complete.

# Interaction Example

### Step 1: Welcome
- Start the conversation: 
  "Hi! Welcome to "PROGRAME NAMED". Participants told ole that your had a great story ! Im your AI Journalist for today. So tell me what's your famous story !  😊"

### Step 2: Required Questions (this question are template)
1. **Problem and Opportunity**:  
   "What is the main problem or opportunity your business is addressing?"
   
2. **Unique Solution**:  
   "How does your solution stand out from others in the market?"
   
3. **Target Audience**:  
   "Who are your primary customers or users, and what do they value most?"
   
4. **Impact and Results**:  
   "What measurable impact have you achieved so far, or what are you aiming for?"
   
5. **Scalability and Vision**:  
   "How do you plan to scale this solution, and what is your long-term vision?"

### Step 3: Closing the Discussion
- End on a positive and engaging note:  
  "Ok, now let's refocus back on "TEATCHER NAME", and we'll take a look at everyone's input together! Thanks so much for your time and your responses. If there's anything else you'd like to share, feel free to reach out. Have an amazing day! 🚀"`,
    
    lightbulbs: `You are a dedicated support agent named "AGENT NAME" responsible for conducting the "PRGRAMENAME" "Final Light Bulb Questionnaire." Your objective is to guide each participant through every mandatory question, ensuring responses are complete, detailed, and reflect the transition from inspiration to action within the "Nexus" framework. Use cross-referencing to link responses to previously identified nuggets where relevant, and maintain focus on actionable plans and future impact.

Style:

Your tone should be professional, supportive, and attentive. Structure the conversation to promote clarity and ease, utilizing bullet points, well-organized steps, and supportive language. Add emojis as needed to make the interaction engaging and welcoming.

Rules:
1. **Sequential Questioning**: 
   - Follow the designated order for each question, only proceeding after receiving a complete response.
2. **Cross-Referencing**: 
   - Ensure each response ties back to the "nugget" that inspired the participant, prompting elaboration if connections aren't clear.
3. **Clarification**: 
   - Seek detailed clarifications when responses lack depth or completeness.
4. **Completion Requirement**: 
   - Every question must be fully answered to conclude the questionnaire. Confirm all necessary details are captured for each response.

Steps:

Step 1: Inspiration Nugget Reference
	•	Required Question: "Which nugget specifically inspired you? Could you briefly describe it?"
	•	Objective: "Capture what resonated with the participant, highlighting the motivational trigger."

Step 2: Light Bulb Moment
	•	Required Question: "What about this nugget inspired you to think, 'We could try this here'?"
	•	Objective: "Capture what resonated with the participant, highlighting the motivational trigger."

Step 3: Question 3
	•	Required Question: "What did this nugget inspire you to do? Please specify the project, team, or context where you think this idea could work."
	•	Objective: "Capture what resonated with the participant, highlighting the motivational trigger."

Step 4: Question 4
	•	Required Question: "What concrete steps will you take to bring this idea to life in your own context?"
	•	Objective: "Capture what resonated with the participant, highlighting the motivational trigger."

Step 5: Question 5
	•	Required Question: "By when do you plan to test or implement this idea?"
	•	Objective: "Capture what resonated with the participant, highlighting the motivational trigger."

Step 6: Question 6
	•	Required Question: "How will you test this idea to see if it gains traction? What will success look like?"
	•	Objective: "Capture what resonated with the participant, highlighting the motivational trigger."

Step 7: Question 7
	•	Required Question: "What potential challenges do you anticipate in implementing this idea, and how could you overcome them?"
	•	Objective: "Capture what resonated with the participant, highlighting the motivational trigger."

Step 8: Question 8
	•	Required Question: "If this idea works, what could the long-term impact be for your team or business unit?"
	•	Objective: "Capture what resonated with the participant, highlighting the motivational trigger."

Closing the Discussion:

After confirming all responses are complete, the agent should conclude with a personalized and lighthearted closing message.

Rules for the Closing Message:
	1.	"Mention Annecy and the specific context (e.g., being at the Palace de Menthon, the weather, etc.)."
	2.	Include a reference to the discussion to tie it back to the participant's contributions or insights.
	3.	"Add a touch of humor to make the participant smile (e.g., a joke about the rain, the lake, or the setting)."
	4.	"Keep the tone friendly, warm, and reflective of the engaging interaction."`
  };

  // Fetch prompts on component mount
  useEffect(() => {
    async function fetchPrompts() {
      try {
        setLoading(true);
        const { data: promptsData, error } = await supabase
          .from('agent_prompts')
          .select('*')
          .eq('workshop_id', workshop.id);

        if (error) {
          throw error;
        }

        const formattedPrompts = {
          nuggets: null as AIPrompt | null,
          lightbulbs: null as AIPrompt | null
        };

        if (promptsData && promptsData.length > 0) {
          promptsData.forEach((prompt: PromptData) => {
            if (prompt.agent_type === 'nuggets' || prompt.agent_type === 'lightbulbs') {
              const agentType = prompt.agent_type as 'nuggets' | 'lightbulbs';
              formattedPrompts[agentType] = {
                id: prompt.id,
                workshop_id: prompt.workshop_id,
                agent_type: agentType,
                agent_name: prompt.agent_name,
                program_name: prompt.program_name,
                teacher_name: prompt.teacher_name,
                style_description: prompt.style_description,
                rules: prompt.rules || [],
                questions: prompt.questions || [],
                raw_prompt: prompt.raw_prompt || '',
                generated_prompt: prompt.generated_prompt
              };
            }
          });
        }

        setPrompts(formattedPrompts);
      } catch (error) {
        console.error('Error fetching prompts:', error);
        toast.error('Failed to load prompts');
      } finally {
        setLoading(false);
      }
    }

    if (workshop.id) {
      fetchPrompts();
    }
  }, [workshop.id]);

  // Save prompt
  const savePrompt = async (type: 'nuggets' | 'lightbulbs', rawPrompt: string, parsedData: Record<string, any>) => {
    try {
      setSaving(true);

      const promptData = {
        workshop_id: workshop.id,
        agent_type: type,
        agent_name: parsedData.agentName || (type === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'),
        program_name: parsedData.programName || workshop.name,
        teacher_name: parsedData.teacherName || '',
        organization_name: workshop.organization_name,
        style_description: parsedData.style || '',
        rules: parsedData.rules || [],
        questions: parsedData.questions || [],
        custom_context: '',
        raw_prompt: rawPrompt,
        generated_prompt: rawPrompt,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      };

      let result: PromptData;
      
      if (prompts[type]?.id) {
        // Update existing prompt
        const { data, error } = await supabase
          .from('agent_prompts')
          .update(promptData)
          .eq('id', prompts[type]?.id)
          .select('*')
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new prompt
        const { data, error } = await supabase
          .from('agent_prompts')
          .insert(promptData)
          .select('*')
          .single();

        if (error) throw error;
        result = data;
      }

      // Update local state
      setPrompts(prev => ({
        ...prev,
        [type]: {
          id: result.id,
          workshop_id: result.workshop_id,
          agent_type: type,
          agent_name: result.agent_name,
          program_name: result.program_name,
          teacher_name: result.teacher_name,
          style_description: result.style_description,
          rules: result.rules || [],
          questions: result.questions || [],
          raw_prompt: result.raw_prompt || '',
          generated_prompt: result.generated_prompt
        }
      }));

      toast.success(`${type === 'nuggets' ? 'Nuggets' : 'Lightbulbs'} prompt saved successfully`);
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">AI Prompts Configuration</h1>
        <p className="text-gray-600 mb-8">
          Configure the prompts for AI agents in the workshop "{workshop.name}".
        </p>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'nuggets' | 'lightbulbs')}>
          <TabsList className="mb-6">
            <TabsTrigger value="nuggets">AI Nuggets</TabsTrigger>
            <TabsTrigger value="lightbulbs">AI Lightbulbs</TabsTrigger>
          </TabsList>

          <TabsContent value="nuggets">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <PromptEditor
                initialPrompt={prompts.nuggets?.raw_prompt || defaultPrompts.nuggets}
                agentType="nuggets"
                onSave={(prompt, parsedData) => savePrompt('nuggets', prompt, parsedData)}
                workshopId={workshop.id}
              />
            )}
          </TabsContent>

          <TabsContent value="lightbulbs">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <PromptEditor
                initialPrompt={prompts.lightbulbs?.raw_prompt || defaultPrompts.lightbulbs}
                agentType="lightbulbs"
                onSave={(prompt, parsedData) => savePrompt('lightbulbs', prompt, parsedData)}
                workshopId={workshop.id}
              />
            )}
          </TabsContent>
        </Tabs>

        {saving && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p>Saving prompt...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createServerSupabaseClient(context);
  
  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Get workshop ID from URL
  const { id } = context.params as { id: string };
  
  // Fetch workshop data
  const { data: workshop, error } = await supabase
    .from('workshops')
    .select('id, name, organization_name')
    .eq('id', id)
    .single();

  if (error || !workshop) {
    return {
      notFound: true,
    };
  }

  // Check if user has access to this workshop
  const { data: participant } = await supabase
    .from('workshop_participants')
    .select('role')
    .eq('workshop_id', id)
    .eq('user_id', session.user.id)
    .single();

  if (!participant || !['admin', 'teacher'].includes(participant.role)) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {
      workshop,
      user: {
        id: session.user.id,
        email: session.user.email,
      },
    },
  };
}; 