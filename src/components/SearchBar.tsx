// src/components/SearchBar.tsx
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCallback, useState, useMemo } from "react";
import debounce from "lodash/debounce";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

// Define the props interface to include className
interface SearchBarProps {
  className?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ className, onSearch, placeholder = "Search..." }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Memoize the debounced search function
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      onSearch?.(query);
    }, 300),
    [onSearch]
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={searchQuery}
        onChange={handleSearch}
        placeholder={placeholder}
        className="pl-10 rounded-full border border-input bg-background h-9"
      />
    </div>
  );
}