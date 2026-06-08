'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SearchFilters } from '@/components/discover/search-filters';
import { ArtistTable } from '@/components/discover/artist-table';
import { Card } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { searchArtists, formatArtistData } from '@/lib/spotify';
import { Artist } from '@/types';
import { useRouter } from 'next/navigation';

export default function Discover() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedArtistIds, setSavedArtistIds] = useState<Set<string>>(new Set());

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push('/login');
    return null;
  }

  const handleSearch = async (filters: any) => {
    if (!filters.artist_name?.trim()) {
      toast.error('Please enter an artist name');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // Search Spotify
      const spotifyArtists = await searchArtists(filters.artist_name, 20);

      // Filter by genre if provided
      let filtered = spotifyArtists;
      if (filters.genre) {
        filtered = spotifyArtists.filter((artist) =>
          artist.genres.some((g) =>
            g.toLowerCase().includes(filters.genre.toLowerCase())
          )
        );
      }

      // Check if artists exist in database
      const dbArtists = await Promise.all(
        filtered.map(async (spotifyArtist) => {
          let dbArtist = await supabase
            .from('artists')
            .select('*')
            .eq('spotify_id', spotifyArtist.id)
            .single();

          if (dbArtist.error) {
            // Create new artist in database
            const formatted = formatArtistData(spotifyArtist);
            const { data: newArtist } = await supabase
              .from('artists')
              .insert([formatted])
              .select()
              .single();

            return newArtist;
          }

          return dbArtist.data;
        })
      );

      const validArtists = dbArtists.filter(Boolean) as Artist[];
      setArtists(validArtists);

      // Load saved status for these artists
      if (validArtists.length > 0) {
        const { data: savedData } = await supabase
          .from('saved_artists')
          .select('artist_id')
          .eq('user_id', user?.id)
          .in(
            'artist_id',
            validArtists.map((a) => a.id)
          );

        const savedIds = new Set((savedData || []).map((s: any) => s.artist_id));
        setSavedArtistIds(savedIds);
      }

      if (validArtists.length === 0) {
        toast.error('No artists found matching your search');
      } else {
        toast.success(`Found ${validArtists.length} artists`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to search artists');
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArtist = async (artistId: string) => {
    if (!user) {
      toast.error('Please sign in to save artists');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.from('saved_artists').insert([
        {
          user_id: user.id,
          artist_id: artistId,
        },
      ]);

      if (error) {
        if (error.code === '23505') {
          toast.error('Artist already saved');
        } else {
          throw error;
        }
      } else {
        setSavedArtistIds((prev) => new Set([...prev, artistId]));
        toast.success('Artist saved successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save artist');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Discover Artists</h1>
          <p className="text-text-secondary text-lg">
            Search and analyze emerging artists with AI-powered insights.
          </p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SearchFilters onSearch={handleSearch} isLoading={loading} />
        </motion.div>

        {/* Results Section */}
        {searched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {loading ? (
              <Card className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader />
                  <p className="text-text-secondary mt-4">Searching artists...</p>
                </div>
              </Card>
            ) : (
              <ArtistTable
                artists={artists}
                onSave={handleSaveArtist}
                isSaving={isSaving}
              />
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!searched && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="max-w-md mx-auto">
              <div className="p-12 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 rounded-full bg-accent/10 mx-auto flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Start Discovering</h3>
                <p className="text-text-secondary mb-6">
                  Search for an artist name above to get started discovering emerging talent.
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
