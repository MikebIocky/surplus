// src/components/ProductDetail.tsx
"use client"; // Mark as Client Component if using hooks or event handlers

import React, { useState } from 'react'; // Import React if using hooks
import Image from 'next/image'; // Use Next/Image for optimization
import { Card, CardContent } from "@/components/ui/card"; // Only CardContent needed if removing headers/footers
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard"; // Component for recommended items
import { MessageSquare, StarIcon, Star, Loader2, Edit } from 'lucide-react'; // Import icons
import { Badge } from "@/components/ui/badge"; // Import Badge component
import { cn } from '@/lib/utils'; // Import cn if needed for conditional styling
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import router
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Define the expected props for the ProductDetail component
export interface ProductDetailProps {
  id: string;
  title: string;
  user: { // User who posted the item
    id: string; // Include user ID if needed for linking
    name: string;
    avatar?: string;
    rating?: number; // Make rating optional to handle missing data
  };
  status?: "Available" | "Picking Up" | "Unavailable"; // Make status optional or provide default
  image?: string;
  description: string;
  details: {
    quantity?: string; // Make details optional
    expiryDate?: string | Date;
    location?: string;
    contact?: string;
  };
  // Ensure recommended items match the props expected by ProductCard
  recommended: Array<{
    id: string;
    title: string;
    image?: string;
    user: { id: string; name: string; avatar?: string };
    description: string; // Add description to match ProductCardProps
  }>;
  // Prop to know if current user is the owner
  isOwner: boolean; // Passed from the Server Component page
}

export function ProductDetail({
  id,
  title,
  user,
  status = "Unavailable", // Provide default status if optional
  image,
  description,
  details,
  recommended,
  isOwner, // Destructure the new prop
}: ProductDetailProps) {
  const router = useRouter(); // Initialize router
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<'rate' | 'get' | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);

  // Helper function for status badge styling
  const getStatusClasses = (currentStatus: ProductDetailProps['status']) => {
    switch (currentStatus) {
      case "Available":
        return "bg-green-100 text-green-800 border-green-200"; // Example Tailwind classes
      case "Picking Up":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Unavailable":
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"; // Default/Unavailable style
    }
  };

  // Text to display for status
  const statusText = status === 'Picking Up' ? 'Reserved' : status;

  // Add handlers for the new actions
  const handleChat = () => {
    router.push(`/chat/${user.id}`);
  };

  const handleGetItem = async () => {
    if (isLoading) return;
    setIsLoading('get');
    try {
      const response = await fetch(`/api/listings/${id}/claim`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to claim item');
      }

      const data = await response.json();
      
      toast({
        title: "Request sent!",
        description: "Your claim request has been sent. Please wait for the owner's response.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to claim item",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleRate = async () => {
    if (isLoading) return;
    setIsLoading('rate');
    try {
      const response = await fetch(`/api/users/${user.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating: selectedRating }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to rate user');
      }

      toast({
        title: "Success!",
        description: "Thank you for rating this user.",
      });
      
      setIsRatingDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to rate user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto"> {/* Use max-width and mx-auto for centering */}
      {/* Main Product Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Image & User */}
        <div className="space-y-6">
          {/* Image Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-0 relative aspect-square"> {/* Aspect ratio (adjust as needed) */}
              {/* Status Badge */}
              <Badge
                  variant="outline" // Use outline variant for border
                  className={cn(
                      "absolute top-4 left-4 z-10 px-3 py-1 text-sm font-medium",
                      getStatusClasses(status) // Apply dynamic background/text/border
                  )}
              >
                  {statusText}
              </Badge>
              {/* Image */}
              {image ? (
                <Image
                  src={image}
                  alt={title || "Product image"}
                  fill
                  className="object-contain bg-muted"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px" // Example sizes
                  priority // Load main image faster
                />
              ) : (
                 <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">No Image Available</span>
                 </div>
              )}
            </CardContent>
          </Card>

          {/* User Info Below Image */}
          <Card>
            <div className="flex items-center gap-3 justify-center w-full max-w-md">
              <Link href={`/profile/${user.id}`} className='flex items-center gap-3 group'>
                <Avatar className="h-10 w-10 border group-hover:ring-2 group-hover:ring-primary/50 transition-shadow">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-sm bg-muted">
                    {user.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="font-medium group-hover:text-primary transition-colors">{user.name}</span>
                  {(user.rating ?? 0) > 0 && (
                    <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-xs font-medium mt-0.5">
                      <StarIcon className="w-3 h-3 fill-current" /> {user.rating?.toFixed(1)}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </Card>

          {/* Rating Dialog */}
          <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" disabled={isLoading === 'rate'}>
                {isLoading === 'rate' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Star className="w-4 h-4 mr-2" />
                )}
                Rate User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rate {user.name}</DialogTitle>
                <DialogDescription>
                  Select a rating from 1 to 5 stars
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <RadioGroup value={selectedRating.toString()} onValueChange={(value: string) => setSelectedRating(Number(value))}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                      <Label htmlFor={`rating-${rating}`} className="flex items-center gap-1">
                        {rating} {rating === 1 ? 'Star' : 'Stars'}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleRate} disabled={isLoading === 'rate'}>
                  {isLoading === 'rate' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Submit Rating
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Right Column: Details & Actions */}
        <div className="w-full">
          <Card className="border rounded-lg shadow-sm">
            <CardContent className="p-5 md:p-6 space-y-3">
              {/* Use Definition List (dl, dt, dd) for semantics */}
              <dl className="space-y-3 divide-y divide-dashed divide-border">
                 {/* Title (now part of the details card) */}
                 <div className="pt-1"> {/* Add padding top to first item */}
                    <dt className="text-sm font-medium text-muted-foreground">Product name</dt>
                    <dd className="text-lg font-semibold text-foreground mt-0.5">{title}</dd>
                 </div>
                 {/* Quantity */}
                 {details.quantity && (
                     <div className="pt-3">
                        <dt className="text-sm font-medium text-muted-foreground">Quantity/weight</dt>
                        <dd className="text-foreground mt-0.5">{details.quantity}</dd>
                     </div>
                 )}
                 {/* Expiry Date */}
                 {details.expiryDate && (
                     <div className="pt-3">
                        <dt className="text-sm font-medium text-muted-foreground">Expiry date</dt>
                        {/* Ensure date is formatted consistently */}
                        <dd className="text-foreground mt-0.5">{typeof details.expiryDate === 'string' ? details.expiryDate : details.expiryDate?.toLocaleDateString()}</dd>
                     </div>
                 )}
                 {/* Description */}
                 { description && (
                    <div className="pt-3">
                        <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                        <dd className="text-foreground mt-0.5 whitespace-pre-wrap">{description}</dd> {/* Allow wrapping */}
                    </div>
                 )}
                 {/* Location */}
                 {details.location && (
                     <div className="pt-3">
                        <dt className="text-sm font-medium text-muted-foreground">Pickup Address</dt>
                        <dd className="text-foreground mt-0.5">{details.location}</dd>
                     </div>
                 )}
                 {/* Contact */}
                 {details.contact && (
                     <div className="pt-3">
                        <dt className="text-sm font-medium text-muted-foreground">Contact Info</dt>
                        <dd className="text-foreground mt-0.5">{details.contact}</dd>
                     </div>
                 )}
              </dl>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {/* Conditionally render buttons only if NOT the owner */}
          {!isOwner && (
              <div className="flex justify-end gap-3 mt-4">
                {/* Get Item Button - Only show if item is available */}
                {status === 'Available' && (
                  <Button
                    onClick={handleGetItem}
                    className="rounded-full px-6 md:px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    disabled={isLoading !== null}
                  >
                    {isLoading === 'get' ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : null}
                    Get Item
                  </Button>
                )}
              </div>
          )}
          {/* Indicate if item is unavailable or reserved */}
          {!isOwner && status !== 'Available' && (
            <div className="mt-4 text-center">
              <Badge variant="secondary" className="text-sm">
                {status === 'Picking Up' ? 'Item is being picked up' : 'Item is unavailable'}
              </Badge>
            </div>
          )}

          {/* Message Button */}
          {isOwner ? (
            <div className="flex justify-end gap-2 mb-4">
              <Link href={`/product/${id}/edit`} passHref legacyBehavior>
                <Button variant="outline" size="sm" asChild>
                  <a><Edit className="mr-2 h-4 w-4" /> Edit Listing</a>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex justify-end gap-2 mb-4">
              <Link href={`/messages/${[user.id, id].sort().join('_')}`} passHref legacyBehavior>
                <Button variant="outline" size="sm" asChild>
                  <a><MessageSquare className="mr-2 h-4 w-4" /> Message</a>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Section */}
      {recommended && recommended.length > 0 && (
         <div className="pt-8"> {/* Added more padding top */}
             <hr className="mb-6"/> {/* Separator */}
            <h2 className="text-xl md:text-2xl font-bold mb-4">More from {user.name}</h2> {/* Title using user name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {recommended.map((item) => (
                    <ProductCard
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        user={item.user}
                        image={item.image}
                        description={item.description}
                        createdAt={new Date()}
                    />
                ))}
            </div>
        </div>
      )}
    </div>
  );
}