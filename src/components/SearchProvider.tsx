'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface SearchContextType {
    isSearching: boolean;
    searchResults: {
        users: any[];
        listings: any[];
    };
    handleSearch: (query: string) => Promise<void>;
    handleCloseSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function useSearch() {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
}

interface SearchProviderProps {
    children: React.ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<{
        users: any[];
        listings: any[];
    }>({ users: [], listings: [] });

    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults({ users: [], listings: [] });
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
                credentials: 'include',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            if (!response.ok) throw new Error('Search failed');
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults({ users: [], listings: [] });
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleCloseSearch = useCallback(() => {
        setSearchResults({ users: [], listings: [] });
        setIsSearching(false);
    }, []);

    const contextValue = useMemo(() => ({
        isSearching,
        searchResults,
        handleSearch,
        handleCloseSearch
    }), [isSearching, searchResults, handleSearch, handleCloseSearch]);

    return (
        <SearchContext.Provider value={contextValue}>
            {children}
        </SearchContext.Provider>
    );
} 