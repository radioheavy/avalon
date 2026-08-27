'use client';

import { usePromptStore } from '@/lib/store/promptStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft,
  Download,
  Upload,
  Settings,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface HeaderProps {
  showBackButton?: boolean;
}

export function Header({ showBackButton = false }: HeaderProps) {
  const { getCurrentPrompt, updatePrompt } = usePromptStore();
  const prompt = getCurrentPrompt();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(prompt?.name || '');

  const handleSaveName = () => {
    if (prompt && name.trim()) {
      updatePrompt(prompt.id, { name: name.trim() });
    }
    setIsEditing(false);
  };

  const handleExport = () => {
    if (!prompt) return;
    const data = JSON.stringify(prompt.content, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prompt.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
        )}

        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {isEditing && prompt ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              className="h-8 w-48"
              autoFocus
            />
          ) : (
            <h1
              className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors"
              onClick={() => {
                if (prompt) {
                  setName(prompt.name);
                  setIsEditing(true);
                }
              }}
            >
              {prompt?.name || 'Avalon'}
            </h1>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {prompt && (
          <>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </>
        )}
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
