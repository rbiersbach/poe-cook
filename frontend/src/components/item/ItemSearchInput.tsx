import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { NinjaItem } from '../../api/generated/models/NinjaItem';
import { DefaultService } from '../../api/generated/services/DefaultService';
import { useLeague } from '../../context/LeagueContext';
import { Loader } from '../ui/Loader';
import ItemIcon from './ItemIcon';
import { PriceDisplay } from './PriceDisplay';

interface ItemSearchInputProps {
    onSelect: (item: NinjaItem) => void;
    placeholder?: string;
    disabled?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
}

export const ItemSearchInput: React.FC<ItemSearchInputProps> = ({
    onSelect,
    placeholder = 'Search by item name…',
    disabled = false,
    onFocus,
    onBlur,
}) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<NinjaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { league } = useLeague();

    const fetchSuggestions = useCallback((search: string) => {
        if (!search.trim() || !league) {
            setSuggestions([]);
            setOpen(false);
            return;
        }
        setLoading(true);
        DefaultService.getApiLeagueNinjaItems(league.id, search, 'name', undefined, 8)
            .then(res => {
                setSuggestions(res.items ?? []);
                setOpen(true);
            })
            .catch(() => setSuggestions([]))
            .finally(() => setLoading(false));
    }, [league]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(query), 250);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, fetchSuggestions]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (item: NinjaItem) => {
        onSelect(item);
        setQuery('');
        setSuggestions([]);
        setOpen(false);
        setActiveIdx(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && activeIdx >= 0) {
            e.preventDefault();
            handleSelect(suggestions[activeIdx]);
        } else if (e.key === 'Escape') {
            setOpen(false);
            setActiveIdx(-1);
        }
    };

    return (
        <div ref={containerRef} className="relative w-full" data-testid="item-search-input">
            <div className="relative flex items-center">
                <input
                    type="text"
                    className="input w-full pr-8"
                    placeholder={placeholder}
                    value={query}
                    onChange={e => { setQuery(e.target.value); setActiveIdx(-1); }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (suggestions.length > 0) setOpen(true); onFocus?.(); }}
                    onBlur={onBlur}
                    disabled={disabled}
                    autoComplete="off"
                    data-testid="item-search-field"
                />
                {loading && (
                    <span className="absolute right-2 pointer-events-none" data-testid="item-search-loader">
                        <Loader size={16} />
                    </span>
                )}
            </div>
            {open && suggestions.length > 0 && (
                <ul
                    className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-gray-850 border border-primary rounded shadow-lg max-h-72 overflow-y-auto"
                    data-testid="item-search-dropdown"
                >
                    {suggestions.map((item, idx) => (
                        <li
                            key={item.id}
                            className={`search-item${activeIdx === idx ? ' search-item-active' : ''}`}
                            onMouseDown={() => handleSelect(item)}
                            data-testid={`item-suggestion-${item.id}`}
                        >
                            <ItemIcon src={item.icon} alt={item.name} className="w-7 h-7 shrink-0" />
                            <span className="flex-1 truncate text-sm text-primary">{item.name}</span>
                            <span className="text-muted text-xs shrink-0">{item.category}</span>
                            <PriceDisplay amount={item.price} currency="chaos" className="text-xs font-semibold shrink-0 inline-flex items-center gap-1" />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
