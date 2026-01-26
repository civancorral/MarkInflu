'use client';

import { useState } from 'react';
import { Plus, Trash2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PortfolioSectionProps {
  portfolioUrls?: string[];
  editable?: boolean;
  onChange?: (urls: string[]) => void;
}

export function PortfolioSection({ portfolioUrls = [], editable = false, onChange }: PortfolioSectionProps) {
  const [urls, setUrls] = useState<string[]>(portfolioUrls || []);
  const [newUrl, setNewUrl] = useState('');

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const addUrl = () => {
    if (!newUrl) return;

    if (!isValidUrl(newUrl)) {
      alert('Por favor ingresa una URL válida');
      return;
    }

    const updatedUrls = [...urls, newUrl];
    setUrls(updatedUrls);
    setNewUrl('');
    if (onChange) onChange(updatedUrls);
  };

  const removeUrl = (index: number) => {
    const updatedUrls = urls.filter((_, i) => i !== index);
    setUrls(updatedUrls);
    if (onChange) onChange(updatedUrls);
  };

  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Portfolio</h3>
      </div>

      {editable ? (
        <div className="space-y-4">
          {/* Add URL Form */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="https://ejemplo.com/mi-trabajo"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addUrl()}
                icon={<LinkIcon className="w-4 h-4" />}
              />
            </div>
            <Button onClick={addUrl}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </div>

          {/* URL List */}
          <div className="space-y-2">
            {urls.map((url, index) => (
              <div key={index} className="bento-card p-3 border border-border flex items-center justify-between">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors flex-1"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span className="text-sm truncate">{getDomain(url)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUrl(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Read-only View */
        <div className="space-y-2">
          {urls.length === 0 ? (
            <div className="text-center py-8 bento-card">
              <LinkIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No has agregado links de portfolio aún</p>
            </div>
          ) : (
            urls.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="bento-card p-4 border border-border hover:border-brand-500/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-brand-500/10">
                    <LinkIcon className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground group-hover:text-brand-400 transition-colors">
                      {getDomain(url)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-md">
                      {url}
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-brand-400 transition-colors" />
              </a>
            ))
          )}
        </div>
      )}

      {urls.length > 0 && editable && (
        <p className="text-xs text-muted-foreground">
          {urls.length} link{urls.length !== 1 ? 's' : ''} de portfolio agregado{urls.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
