// Minimal OpenAI Chat Completions client used by the learning-notes AI draft generator and the
// assistant chatbot. No SDK dependency — just a plain fetch call, since Node 18+ has global fetch.
export class AiNotConfiguredError extends Error {
    constructor() {
        super('La IA no está configurada en este servidor (falta OPENAI_API_KEY).');
    }
}

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export async function generateChatReply(messages: ChatMessage[]): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new AiNotConfiguredError();

    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages, temperature: 0.4 }),
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`La IA no pudo responder (${response.status}). ${detail.slice(0, 200)}`);
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('La IA no devolvió una respuesta.');
    return content;
}
