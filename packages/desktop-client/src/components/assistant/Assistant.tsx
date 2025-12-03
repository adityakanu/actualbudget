
import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { send } from 'loot-core/platform/client/fetch';
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Canvas } from './Canvas';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export function Assistant() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [canvasData, setCanvasData] = useState<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isConfigured, setIsConfigured] = useState(false);

    useEffect(() => {
        // Check if API key is configured on server
        send('ai/status').then((status: any) => {
            if (status && status.configured) {
                setIsConfigured(true);
            }
        });
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        if (!isConfigured) {
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: 'AI Assistant is not configured. Please set OPENROUTER_API_KEY in your .env file.' },
            ]);
            return;
        }

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = (await send('ai/chat', { message: userMessage })) as string;

            // Check if response contains canvas data
            // In a real implementation, we'd parse this more robustly or have a specific field
            let content = response;
            try {
                // Try to extract JSON if the LLM returned a code block with JSON
                // Regex matches ```json ... ``` or just ``` ... ``` or even just a raw JSON object at the end
                const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || response.match(/(\{[\s\S]*"type"[\s\S]*"data"[\s\S]*\})$/);

                if (jsonMatch) {
                    const possibleJson = jsonMatch[1] || jsonMatch[0];
                    // Clean up any potential markdown artifacts if we matched raw JSON
                    const cleanJson = possibleJson.trim();

                    const possibleData = JSON.parse(cleanJson);
                    if (possibleData.type && possibleData.data) {
                        setCanvasData(possibleData);
                        // Remove the JSON block from the displayed message
                        content = response.replace(jsonMatch[0], '').trim();
                    }
                }
            } catch (e) {
                console.warn('Failed to parse AI graph data:', e);
                // Ignore parsing errors, just show the text
            }

            setMessages(prev => [...prev, { role: 'assistant', content }]);
        } catch (error) {
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: `Error: ${error.message} ` },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const markdownStyles = `
        .markdown-content p { margin-bottom: 8px; }
        .markdown-content ul, .markdown-content ol { padding-left: 20px; margin-bottom: 8px; }
        .markdown-content li { margin-bottom: 4px; }
        .markdown-content code { 
            background-color: rgba(0,0,0,0.1); 
            padding: 2px 4px; 
            border-radius: 4px; 
            font-family: monospace;
        }
        .markdown-content pre { 
            background-color: rgba(0,0,0,0.1); 
            padding: 10px; 
            border-radius: 4px; 
            overflow-x: auto;
            margin-bottom: 8px;
        }
        .markdown-content pre code {
            background-color: transparent;
            padding: 0;
        }
        .markdown-content table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-bottom: 8px; 
            font-size: 0.9em;
        }
        .markdown-content th, .markdown-content td { 
            border: 1px solid ${theme.tableBorder}; 
            padding: 6px; 
            text-align: left; 
        }
        .markdown-content th { 
            background-color: ${theme.tableHeaderBackground}; 
            font-weight: 600; 
        }
    `;

    return (
        <View style={{ flex: 1, flexDirection: 'row', height: '100%' }}>
            <style>{markdownStyles}</style>
            {/* Chat Sidebar */}
            <View
                style={{
                    width: 350,
                    borderRight: '1px solid ' + theme.tableBorder,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <View
                    style={{
                        padding: 10,
                        borderBottom: '1px solid ' + theme.tableBorder,
                        backgroundColor: theme.tableHeaderBackground,
                    }}
                >
                    <Text style={{ fontWeight: 600 }}>AI Assistant</Text>
                    {isConfigured ? (
                        <Text style={{ fontSize: 12, color: theme.pageTextSubdued, marginTop: 5 }}>
                            Ready to help
                        </Text>
                    ) : (
                        <Text style={{ fontSize: 12, color: theme.errorText, marginTop: 5 }}>
                            Not Configured (Missing API Key)
                        </Text>
                    )}
                </View>

                <View
                    innerRef={scrollRef}
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: 10,
                        gap: 10,
                    }}
                >
                    {messages.map((msg, idx) => (
                        <View
                            key={idx}
                            style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                backgroundColor:
                                    msg.role === 'user' ? theme.buttonPrimaryBackground : theme.tableBackground,
                                color: msg.role === 'user' ? theme.buttonPrimaryText : theme.tableText,
                                padding: 8,
                                borderRadius: 8,
                                maxWidth: '85%',
                            }}
                        >
                            <div className="markdown-content">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </View>
                    ))}
                    {loading && (
                        <Text style={{ color: theme.pageTextSubdued, fontStyle: 'italic' }}>
                            Thinking...
                        </Text>
                    )}
                </View>

                <View style={{ padding: 10, borderTop: '1px solid ' + theme.tableBorder }}>
                    <View style={{ flexDirection: 'row', gap: 5 }}>
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask about your finances..."
                            style={{ flex: 1 }}
                        />
                        <Button onClick={handleSend} type="primary">
                            Send
                        </Button>
                    </View>
                </View>
            </View>

            {/* Main Canvas Area */}
            <View style={{ flex: 1, backgroundColor: theme.pageBackground }}>
                <Canvas data={canvasData} />
            </View>
        </View>
    );
}
