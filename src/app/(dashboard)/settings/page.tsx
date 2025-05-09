// src/app/settings/page.tsx
"use client"; // Required for state and event handlers

import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react"; // Loading spinner icon
import { useToast } from "@/components/ui/use-toast";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    description?: string;
    rating?: number;
}

// --- Mock Data & API Functions (Replace with actual logic) ---
// Represents fetching the current logged-in user's data
async function fetchCurrentUserProfile() {
    console.log("API CALL: Fetching current user profile...");
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    // !! Replace with your actual API call and authentication logic !!
    return {
        id: "currentUser123",
        name: "Mike B",
        email: "mike.b@example.com", // Usually non-editable or handled differently
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?&w=128&h=128&fit=facearea&q=80",
        description: "Passionate about reducing food waste! Sharing surplus goodies.",
    };
}

// Represents updating the user's profile
async function updateUserProfile(data: { name: string; description: string }): Promise<boolean> {
    console.log("API CALL: Updating user profile...", data);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    // !! Replace with your actual API call !!
    // Example: const response = await fetch('/api/user/profile', { method: 'PUT', body: JSON.stringify(data), ... })
    // return response.ok;
    return true; // Assume success for mock
}
// --- End Mock Data & API Functions ---

export default function SettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for editable fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // State for non-editable fields
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState<string | undefined>();
    const [rating, setRating] = useState<number | undefined>();

    // Component state
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Fetch initial profile data
    useEffect(() => {
        const loadProfile = async () => {
            setIsFetching(true);
            try {
                const response = await fetch('/api/user/profile');
                if (!response.ok) {
                    throw new Error('Failed to fetch profile');
                }
                const data: UserProfile = await response.json();
                setName(data.name);
                setEmail(data.email);
                setAvatar(data.avatar);
                setDescription(data.description || '');
                setRating(data.rating);
                setImagePreview(data.avatar || null);
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                toast({
                    title: "Error",
                    description: "Could not load profile data. Please try again later.",
                    variant: "destructive"
                });
            } finally {
                setIsFetching(false);
            }
        };
        loadProfile();
    }, [toast]);

    // Handle image selection
    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
                title: "Error",
                description: "Image too large (Max 5MB)",
                variant: "destructive"
            });
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast({
                title: "Error",
                description: "Invalid file type (JPG, PNG, WEBP only)",
                variant: "destructive"
            });
            return;
        }

        setImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
    };

    // Upload image to Cloudinary
    const uploadImage = async (file: File): Promise<string | null> => {
        setIsUploading(true);
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
            
            return data.secure_url;
        } catch (error) {
            console.error('Upload error:', error);
            toast({
                title: "Error",
                description: "Failed to upload image",
                variant: "destructive"
            });
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            let avatarUrl = avatar;
            
            // Upload new image if selected
            if (imageFile) {
                const uploadedUrl = await uploadImage(imageFile);
                if (!uploadedUrl) {
                    setIsLoading(false);
                    return;
                }
                avatarUrl = uploadedUrl;
            }

            // Update profile
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    description,
                    avatar: avatarUrl,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            toast({
                title: "Success",
                description: "Profile updated successfully",
            });

            // Refresh the page data
            router.refresh();
        } catch (error) {
            console.error('Update error:', error);
            toast({
                title: "Error",
                description: "Failed to update profile",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    if (isFetching) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-3xl mx-auto p-4">
            <h1 className="text-3xl font-bold">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        {/* Avatar Section */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <Avatar className="w-16 h-16 border">
                                    <AvatarImage src={imagePreview || avatar} alt={name} />
                                    <AvatarFallback className="text-xl">
                                        {name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <Label htmlFor="avatar" className="cursor-pointer">
                                        <div className="flex items-center space-x-2">
                                            <Upload className="w-4 h-4" />
                                            <span>Change Avatar</span>
                                        </div>
                                        <Input
                                            id="avatar"
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={handleImageChange}
                                            ref={fileInputRef}
                                            disabled={isLoading}
                                        />
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        JPG, PNG or WebP (MAX. 5MB)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Email (Display Only) */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                readOnly
                                disabled
                                className="bg-muted/50 cursor-not-allowed"
                            />
                            <p className="text-xs text-muted-foreground">
                                Email cannot be changed here.
                            </p>
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Bio / Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Tell us a little about yourself..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                disabled={isLoading}
                            />
                        </div>

                        {/* Rating Display */}
                        {rating !== undefined && (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <span>Current Rating:</span>
                                <span className="font-medium">{rating.toFixed(1)}</span>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="border-t pt-6">
                        <Button type="submit" disabled={isLoading || isUploading}>
                            {(isLoading || isUploading) && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {isUploading ? "Uploading Image..." : isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}