"use client";

import React from 'react';
import EditListingForm from './EditListingForm';

interface EditFormProps {
  listing: {
    _id: string;
    title: string;
    description: string;
    quantity: string;
    location: string;
    images: Array<{ url: string; publicId: string }>;
    expiryDate: string | null;
    contact: string | null;
  };
}

export default function EditForm({ listing }: EditFormProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold border-b pb-3 mb-6">
        Edit Listing: <span className="font-medium">{listing.title}</span>
      </h1>
      <EditListingForm listing={listing} />
    </div>
  );
} 