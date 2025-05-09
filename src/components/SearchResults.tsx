import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface User {
    _id: string;
    name: string;
    avatar?: string;
}

interface Listing {
    _id: string;
    title: string;
    description: string;
    quantity: string;
    location: string;
    images: Array<{
        url: string;
        publicId: string;
    }>;
    status: string;
    user: {
        _id: string;
        name: string;
        avatar?: string;
    } | null;
}

interface SearchResultsProps {
    users: User[];
    listings: Listing[];
    onClose?: () => void;
}

// Memoized User Card component
const UserCard = memo(({ user, onClose }: { user: User; onClose?: () => void }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
    >
        <Link 
            href={`/profile/${user._id}`}
            onClick={onClose}
            className="block p-1"
        >
            <Card className="cursor-pointer hover:bg-muted/50 transition-all duration-200 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-primary/10">
                            {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-base truncate">{user.name}</p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    </motion.div>
));
UserCard.displayName = 'UserCard';

// Memoized Listing Card component
const ListingCard = memo(({ listing, onClose }: { listing: Listing; onClose?: () => void }) => {
    console.log('Listing images:', listing.images);
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
        >
            <Link 
                href={`/product/${listing._id}`}
                onClick={onClose}
                className="block p-1"
            >
                <Card className="cursor-pointer hover:bg-muted/50 transition-all duration-200 hover:shadow-md">
                    <CardContent className="p-0">
                        <div className="flex">
                            <div className="relative h-24 w-24 rounded-l overflow-hidden flex-shrink-0">
                                {listing.images && listing.images.length > 0 && listing.images[0]?.url
                                    ? (
                                        <Image
                                            src={listing.images[0].url}
                                            alt={listing.title}
                                            fill
                                            className="object-cover transition-transform duration-200 hover:scale-105"
                                            sizes="96px"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <span className="text-xs text-muted-foreground">No image</span>
                                        </div>
                                    )}
                            </div>
                            <div className="flex-1 p-4 min-w-0">
                                <h4 className="font-medium text-base truncate mb-2">{listing.title}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {listing.quantity && (
                                        <Badge variant="secondary" className="text-sm">
                                            {listing.quantity}
                                        </Badge>
                                    )}
                                    {listing.location && (
                                        <Badge variant="outline" className="text-sm">
                                            {listing.location}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </motion.div>
    );
});
ListingCard.displayName = 'ListingCard';

export const SearchResults = memo(function SearchResults({ users, listings, onClose }: SearchResultsProps) {
    if (users.length === 0 && listings.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 border rounded-xl shadow-lg max-h-[70vh] overflow-y-auto z-50 backdrop-blur-sm bg-background/95"
        >
            <AnimatePresence>
                {users.length > 0 && (
                    <motion.div
                        key="users-section"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4"
                    >
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Users</h3>
                        <div className="space-y-2">
                            {users.map((user) => (
                                <UserCard key={user._id} user={user} onClose={onClose} />
                            ))}
                        </div>
                    </motion.div>
                )}

                {listings.length > 0 && (
                    <motion.div
                        key="listings-section"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4 border-t"
                    >
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Listings</h3>
                        <div className="space-y-2">
                            {listings.map((listing) => (
                                <ListingCard key={listing._id} listing={listing} onClose={onClose} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}); 