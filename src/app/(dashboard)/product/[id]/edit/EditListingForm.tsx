// src/app/product/[id]/edit/EditListingForm.tsx
"use client";

import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ImageFile {
  file: File;
  preview: string;
}

interface ExistingImage {
  url: string;
  publicId: string;
}

interface EditListingFormProps {
  listing: {
    _id: string;
    title: string;
    description: string;
    quantity: string;
    location: string;
    images: ExistingImage[];
    expiryDate: string | null;
    contact: string | null;
  };
}

export default function EditListingForm({ listing }: EditListingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading: isAuthLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [quantity, setQuantity] = useState(listing.quantity);
  const [location, setLocation] = useState(listing.location);
  const [expiryDate, setExpiryDate] = useState(listing.expiryDate || '');
  const [contact, setContact] = useState(listing.contact || '');
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(listing.images);
  const [newImages, setNewImages] = useState<ImageFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = isAuthLoading || isSubmitting || isDeleting;

  // Handle image selection
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = event.target.files;
    if (!files?.length) return;

    const totalImages = existingImages.length + newImages.length;
    if (totalImages + files.length > 4) {
      toast({
        title: "Error",
        description: "Maximum 4 images allowed",
        variant: "destructive"
      });
      return;
    }

    const newImageFiles: ImageFile[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      if (file.size > maxSize) {
        toast({
          title: "Error",
          description: `Image ${file.name} is too large (Max 10MB)`,
          variant: "destructive"
        });
        continue;
      }

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: `Invalid file type for ${file.name} (JPG, PNG, WEBP only)`,
          variant: "destructive"
        });
        continue;
      }

      newImageFiles.push({
        file,
        preview: URL.createObjectURL(file)
      });
    }

    setNewImages(prev => [...prev, ...newImageFiles]);
  };

  // Remove existing image
  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // Remove new image
  const removeNewImage = (index: number) => {
    setNewImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      newImages.forEach(image => URL.revokeObjectURL(image.preview));
    };
  }, [newImages]);

  // Upload image to Cloudinary
  const uploadImage = async (file: File): Promise<{ secure_url: string; public_id: string } | null> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      toast({
        title: "Error",
        description: "Image upload is not configured",
        variant: "destructive"
      });
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Upload failed');
      
      return {
        secure_url: data.secure_url,
        public_id: data.public_id
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Upload new images
      const uploadPromises = newImages.map(image => uploadImage(image.file));
      const uploadResults = await Promise.all(uploadPromises);

      // Check if any uploads failed
      if (uploadResults.some(result => !result)) {
        throw new Error('One or more images failed to upload');
      }

      // Combine existing and new images
      const allImages = [
        ...existingImages,
        ...uploadResults.map(result => ({
          url: result!.secure_url,
          publicId: result!.public_id
        }))
      ];

      // Update listing
      const response = await fetch(`/api/listings/${listing._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          quantity: quantity.trim(),
          location: location.trim(),
          images: allImages,
          expiryDate: expiryDate || null,
          contact: contact.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update listing');
      }

      toast({
        title: "Success",
        description: "Listing updated successfully",
      });

      router.push(`/product/${listing._id}?status=updated`);
    } catch (error) {
      console.error('Submit error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/listings/${listing._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete listing');
      }

      toast({
        title: "Success",
        description: "Listing deleted successfully",
      });

      router.push('/listings?status=deleted');
    } catch (error) {
      console.error('Delete error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete listing');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
      {/* Left Column: Image Upload */}
      <Card className={isLoading ? "opacity-70 pointer-events-none" : ""}>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Product Images *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Existing Images */}
            {existingImages.map((image, index) => (
              <div key={`existing-${index}`} className="relative aspect-square group">
                <Image
                  src={image.url}
                  alt={`Existing image ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {/* New Images */}
            {newImages.map((image, index) => (
              <div key={`new-${index}`} className="relative aspect-square group">
                <Image
                  src={image.preview}
                  alt={`New image ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {/* Add Image Button */}
            {existingImages.length + newImages.length < 4 && (
              <Label
                htmlFor="images"
                className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-accent transition-colors"
              >
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 mb-2" />
                  <span className="text-sm">Add Image</span>
                </div>
                <Input
                  id="images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  disabled={isLoading}
                />
              </Label>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Upload up to 4 images (JPG, PNG, WEBP up to 10MB each)
          </p>
        </CardContent>
      </Card>

      {/* Right Column: Form Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Listing Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Product Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Fresh Organic Basil"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Condition, quantity details, reason for surplus..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              disabled={isLoading}
            />
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantity / Weight *</Label>
            <Input
              id="quantity"
              placeholder="e.g., 1 bunch, 500g, 3 jars"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Expiry Date */}
          <div className="space-y-1.5">
            <Label htmlFor="expiryDate">Best Before / Expiry Date (Optional)</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="location">Pickup Location *</Label>
            <Input
              id="location"
              placeholder="General area, e.g., Downtown Exampleville"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Contact */}
          <div className="space-y-1.5">
            <Label htmlFor="contact">Contact Info (Optional)</Label>
            <Input
              id="contact"
              placeholder="If needed for pickup arrangements"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Only provide if you're comfortable sharing it publicly.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/30">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="flex-grow break-words">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-auto text-destructive hover:text-destructive/80 text-lg leading-none flex-shrink-0"
                aria-label="Close error"
              >
                &apos;
              </button>
            </div>
          )}

          {/* Submit and Delete Buttons */}
          <div className="col-span-2 flex flex-col gap-4">
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting
                ? 'Updating Listing...'
                : 'Update Listing'}
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="lg"
              className="w-full"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? 'Deleting...' : 'Delete Listing'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}