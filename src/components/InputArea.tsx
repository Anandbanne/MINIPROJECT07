import React, { useRef } from 'react';
import { Send, Paperclip, Image as ImageIcon, Code, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface InputAreaProps {
  onSend: (message: string, file?: File, image?: File) => void;
  isLoading: boolean;
}

export function InputArea({ onSend, isLoading }: InputAreaProps) {
  const [input, setInput] = React.useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || isLoading) && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const file = e.target.files?.[0];
    if (file) {
      onSend(`[Uploaded ${type === 'image' ? 'screenshot' : 'Python file'}: ${file.name}]`, type === 'file' ? file : undefined, type === 'image' ? file : undefined);
      e.target.value = '';
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto relative group"
      >
        <div className="relative flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all shadow-2xl">
          <div className="flex items-center gap-1 pb-1 pl-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-zinc-800 rounded-lg transition-all"
              title="Upload Python File"
            >
              <Paperclip size={20} />
            </button>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-zinc-800 rounded-lg transition-all"
              title="Upload Error Screenshot"
            >
              <ImageIcon size={20} />
            </button>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Paste code or ask about a Python error..."
            rows={1}
            className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-200 placeholder-zinc-500 py-3 px-2 resize-none max-h-64 overflow-y-auto scrollbar-hide"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              "p-3 rounded-xl transition-all mb-1 mr-1",
              input.trim() && !isLoading
                ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            )}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileChange(e, 'file')}
          accept=".py"
          className="hidden"
        />
        <input
          type="file"
          ref={imageInputRef}
          onChange={(e) => handleFileChange(e, 'image')}
          accept="image/*"
          className="hidden"
        />

        <div className="mt-3 flex justify-center gap-4 text-[10px] text-zinc-600 font-medium uppercase tracking-widest">
          <span>AI-Powered Debugging</span>
          <span>•</span>
          <span>Python 3.x Expert</span>
          <span>•</span>
          <span>Real-time Analysis</span>
        </div>
      </form>
    </div>
  );
}
