import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Message } from './components/Message';
import { InputArea } from './components/InputArea';
import { SYSTEM_INSTRUCTION } from './lib/gemini';
import { GoogleGenAI } from '@google/genai';
import { Terminal, BrainCircuit, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

interface MessageData {
  role: 'user' | 'assistant';
  content: string;
}

export default function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (currentChatId) {
      fetchMessages(currentChatId);
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    const res = await fetch('/api/chats');
    const data = await res.json();
    setChats(data);
  };

  const fetchMessages = async (id: string) => {
    const res = await fetch(`/api/chats/${id}`);
    const data = await res.json();
    setMessages(data);
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
  };

  const handleDeleteChat = async (id: string) => {
    await fetch(`/api/chats/${id}`, { method: 'DELETE' });
    if (currentChatId === id) {
      setCurrentChatId(null);
      setMessages([]);
    }
    fetchChats();
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSend = async (text: string, file?: File, image?: File) => {
    let chatId = currentChatId;
    let isNewChat = !chatId;

    if (isNewChat) {
      chatId = Date.now().toString();
      const title = text.slice(0, 30) || (file ? `File: ${file.name}` : `Image: ${image?.name}`);
      await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chatId, title }),
      });
      setCurrentChatId(chatId);
      fetchChats();
    }

    const userMessage: MessageData = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, ...userMessage }),
    });

    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API_KEY_MISSING');
      }

      const genAI = new GoogleGenAI({ apiKey });
      
      let parts: any[] = [{ text: text }];

      if (file) {
        const fileContent = await file.text();
        parts.push({ text: `\n\n--- FILE CONTENT (${file.name}) ---\n${fileContent}` });
      }

      if (image) {
        const base64 = await fileToBase64(image);
        parts.push({
          inlineData: {
            mimeType: image.type,
            data: base64,
          },
        });
      }

      const result = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      const assistantMessage: MessageData = {
        role: 'assistant',
        content: result.text || 'I encountered an error analyzing your request.',
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, ...assistantMessage }),
      });
    } catch (error: any) {
      console.error('Gemini Error:', error);
      let errorMessageContent = 'Sorry, I encountered an error while processing your request. Please try again later.';
      
      if (error.message === 'API_KEY_MISSING') {
        errorMessageContent = 'API Key Missing: Please add your GEMINI_API_KEY to the Secrets panel in AI Studio (or .env file if running locally).';
      } else if (error.message?.includes('API key not valid')) {
        errorMessageContent = 'Invalid API Key: The provided Gemini API key is not valid. Please check your settings.';
      }

      const errorMessage: MessageData = {
        role: 'assistant',
        content: errorMessageContent,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/10 rounded-lg">
              <BrainCircuit className="text-emerald-500" size={20} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">Python Debugger Pro</h1>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Advanced AI Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-semibold text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              DeepSeek-Coder Engine
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="max-w-4xl mx-auto min-h-full flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative"
                >
                  <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
                  <div className="relative w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center shadow-2xl">
                    <Terminal size={48} className="text-emerald-500" />
                  </div>
                </motion.div>
                
                <div className="space-y-3 max-w-md">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border mb-4 ${process.env.GEMINI_API_KEY ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'}`}>
                    {process.env.GEMINI_API_KEY ? 'â— API KEY DETECTED' : 'â—‹ API KEY MISSING'}
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                    How can I help you debug today?
                  </h2>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Paste your Python code, upload a script, or share a screenshot of an error message. I'll help you understand and fix it.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  {[
                    { 
                      icon: <Terminal size={16} />, 
                      text: "Fix this code:", 
                      code: "def greet(name)\n  print('Hello ' + name",
                      sub: "Syntax & Parenthesis Error" 
                    },
                    { 
                      icon: <ChevronRight size={16} />, 
                      text: "Why does this fail?", 
                      code: "my_list = [1, 2]\nprint(my_list[5])",
                      sub: "IndexError Analysis" 
                    },
                    { 
                      icon: <Sparkles size={16} />, 
                      text: "Explain Indentation", 
                      code: "for i in range(5):\nprint(i)",
                      sub: "Whitespace Error" 
                    },
                    { 
                      icon: <BrainCircuit size={16} />, 
                      text: "Refactor this:", 
                      code: "x = []\nfor i in range(10):\n    x.append(i*2)",
                      sub: "Pythonic Best Practices" 
                    }
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(item.text + "\n\n```python\n" + item.code + "\n```")}
                      className="flex items-start gap-4 p-4 bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 rounded-2xl transition-all text-left group"
                    >
                      <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400 group-hover:text-emerald-500 transition-colors">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-200">{item.text}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">{item.sub}</div>
                        <div className="mt-2 p-2 bg-zinc-950 rounded border border-zinc-800/50 font-mono text-[10px] text-zinc-400 truncate">
                          {item.code.split('\n')[0]}...
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pb-32">
                {messages.map((msg, i) => (
                  <Message key={i} role={msg.role} content={msg.content} />
                ))}
                {isLoading && (
                  <div className="py-8 flex gap-4 px-4 md:px-8 bg-zinc-900/30">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <BrainCircuit size={18} className="animate-pulse" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="text-sm font-semibold text-zinc-400 uppercase tracking-tight">AI Debugger</div>
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-emerald-500/50 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-emerald-500/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-emerald-500/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <InputArea onSend={handleSend} isLoading={isLoading} />
      </main>
    </div>
  );
}
