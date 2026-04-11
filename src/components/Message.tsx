import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function Message({ role, content }: MessageProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "py-8 flex gap-4 px-4 md:px-8",
        role === 'assistant' ? "bg-zinc-900/30" : "bg-transparent"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
        role === 'assistant' ? "bg-emerald-600 text-white" : "bg-zinc-700 text-zinc-300"
      )}>
        {role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        <div className="text-sm font-semibold text-zinc-400 uppercase tracking-tight">
          {role === 'assistant' ? 'AI Debugger' : 'You'}
        </div>
        <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                
                if (!inline && language) {
                  return (
                    <div className="relative group my-4 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                        <span className="text-xs font-mono text-zinc-500 uppercase">{language}</span>
                        <button
                          onClick={() => copyToClipboard(String(children))}
                          className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={atomDark}
                        language={language}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          padding: '1.5rem',
                          fontSize: '0.875rem',
                          background: 'transparent',
                        }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  );
                }
                return (
                  <code className={cn("bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-sm", className)} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
