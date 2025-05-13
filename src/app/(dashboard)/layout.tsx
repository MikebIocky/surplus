"use client"

// src/app/(dashboard)/layout.tsx - CORRECTED IMPORTS

import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SearchProvider } from "@/components/SearchProvider";
import { SearchBar } from "@/components/SearchBar";
import { SearchResults } from "@/components/SearchResults";
import { useSearch } from "@/components/SearchProvider";
import { geistSans, geistMono } from '@/lib/fonts';

function MainContent({ children }: { children: React.ReactNode }) {
  const { handleSearch, searchResults, handleCloseSearch } = useSearch();

  return (
    <main className="flex-1 p-6">
      <div className="flex items-center mb-6">
        <SidebarTrigger className="mr-4" />
        <div className="relative flex-1">
          <SearchBar 
            className="w-full" 
            placeholder="Search listings and users..." 
            onSearch={handleSearch}
          />
          <SearchResults
            users={searchResults.users}
            listings={searchResults.listings}
            onClose={handleCloseSearch}
          />
        </div>
      </div>
      {children}
    </main>
  );
}
  
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen flex ${geistSans.variable} ${geistMono.variable}`}>
      <SearchProvider>
        <SidebarProvider>
          <AppSidebar />
          <MainContent>
            {children}
          </MainContent>
        </SidebarProvider>
      </SearchProvider>
    </div>
  );
}