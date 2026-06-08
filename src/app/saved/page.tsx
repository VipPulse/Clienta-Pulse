'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Heart, X } from 'lucide-react';
import Link from 'next/link';

interface SavedArtistItem {
  id: string;
  name: string;
  genre: string;
  popularity: number;
  followers: number;
  image_url: string;
  saved_id: string;
  saved_at: string;
}

export default function SavedPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [artists, setArtists] = useState<SavedArtistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);

  if (!authLoading && !user) {
    router.push('/login');
    return null;
  }

  useEffect(() => {
    if (user) {
      loadSavedArtists();
    }
  }, [user]);

  const loadSavedArtists = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('saved_artists')
        .select(
          `
          id,
          created_at,
          artists (
            id,
            name,
            genre,
            popularity,
            followers,
            image_url
          )
        `
        )
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        ...item.artists,
        saved_id: item.id,
        saved_at: item.created_at,
      }));

      setArtists(formatted);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load saved artists');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (savedId: string) => {
    setRemoving(savedId);

    try {
      const { error } = await supabase
        .from('saved_artists')
        .delete()
        .eq('id', savedId);

      if (error) throw error;

      setArtists((prev) => prev.filter((a) => a.saved_id !== savedId));
      toast.success('Artist removed from saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove artist');
    } finally {
      setRemoving(null);
    }
  };

  const filteredArtists = artists.filter(
    (artist) =>
      artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (artist.genre && artist.genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Saved Artists</h1>
          <p className="text-text-secondary text-lg">
            Manage your collection of promising artists ({artists.length} total)
          </p>
        </motion.div>

        {/* Search */}
        {artists.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Input
              placeholder="Search by name or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </motion.div>
        )}

        {/* Artists Grid */}
        {filteredArtists.length > 0 ? (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {filteredArtists.map((artist, index) => (
              <motion.div
                key={artist.saved_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group hover:shadow-glow-purple transition-all h-full flex flex-col">
                  {/* Artist Image */}
                  {artist.image_url && (
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={artist.image_url}
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                    </div>
                  )}

                  <CardHeader className="flex-1">
                    <CardTitle className="line-clamp-2">{artist.name}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {artist.genre || 'Unknown Genre'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="glass p-3 rounded-lg text-center">
                        <p className="text-text-secondary text-xs mb-1">Popularity</p>
                        <p className="text-xl font-bold">{artist.popularity}</p>
                      </div>
                      <div className="glass p-3 rounded-lg text-center">
                        <p className="text-text-secondary text-xs mb-1">Followers</p>
                        <p className="text-lg font-bold">
                          {(artist.followers / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button asChild size="sm" className="flex-1" variant="outline">
                        <Link href={`/report/${artist.id}`}>View Report</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(artist.saved_id)}
                        disabled={removing === artist.saved_id}
                        className="gap-1"
                      >
                        <Heart size={16} fill="currentColor" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="max-w-md mx-auto">
              <div className="p-12 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 rounded-full bg-accent/10 mx-auto flex items-center justify-center">
                    <Heart className="text-accent" size={32} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">No Saved Artists</h3>
                <p className="text-text-secondary mb-6">
                  {searchQuery
                    ? 'No artists match your search'
                    : "You haven't saved any artists yet"}
                </p>
                {!searchQuery && (
                  <Button asChild>
                    <Link href="/discover">Start Discovering</Link>
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
