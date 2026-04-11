import React from 'react';
import { Plus, MessageSquare, Trash2, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}

export function Sidebar({ chats, currentChatId, onSelectChat, onNewChat, onDeleteChat }: SidebarProps) {
  return (
    <div className="w-64 bg-zinc-950 text-zinc-200 flex flex-col h-full border-r border-zinc-800">
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={18} />
          New Analysis
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Recent Debugging Sessions
        </div>
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={cn(
              "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all",
              currentChatId === chat.id ? "bg-zinc-800 text-white" : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            )}
            onClick={() => onSelectChat(chat.id)}
          >
            <MessageSquare size={16} className="shrink-0" />
            <span className="truncate text-sm flex-1">{chat.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-zinc-800 mt-auto">
        <div className="flex items-center gap-3 px-2 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Terminal size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">Python Expert</p>
            <p className="text-[10px] text-zinc-500 truncate">v2.1.0-stable</p>
          </div>
        </div>
      </div>
    </div>
  );
}
