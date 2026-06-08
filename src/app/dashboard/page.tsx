'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader } from '@/components/ui/loader';
import { BarChart3, Heart, FileText, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Activity {
  id: string;
  type: 'report' | 'save' | 'search';
  artist: string;
  timestamp: Date;
}

interface DashboardStats {
  artists_analyzed: number;
  saved_artists: number;
  reports_generated: number;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [stats, setStats] = useState<DashboardStats>({
    artists_analyzed: 0,
    saved_artists: 0,
    reports_generated: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [savedArtists, setSavedArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch saved artists
      const { data: saved, error: savedError } = await supabase
        .from('saved_artists')
        .select(
          `
          id,
          created_at,
          artist_id,
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

      if (savedError) throw savedError;

      const formattedSavedArtists = (saved || []).map((item: any) => ({
        ...item.artists,
        saved_id: item.id,
        saved_at: item.created_at,
      }));

      setSavedArtists(formattedSavedArtists);

      // Fetch reports
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select(
          `
          id,
          created_at,
          artist_id,
          artists (
            name,
            genre
          )
        `
        )
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Calculate stats
      const uniqueArtists = new Set(
        (reports || []).map((r: any) => r.artist_id)
      );

      setStats({
        artists_analyzed: uniqueArtists.size,
        saved_artists: formattedSavedArtists.length,
        reports_generated: (reports || []).length,
      });

      // Format activities
      const formattedActivities: Activity[] = (reports || [])
        .slice(0, 10)
        .map((report: any, index: number) => ({
          id: report.id,
          type: 'report',
          artist: report.artists.name,
          timestamp: new Date(report.created_at),
        }));

      setActivities(formattedActivities);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSavedArtist = async (savedId: string) => {
    try {
      const { error } = await supabase
        .from('saved_artists')
        .delete()
        .eq('id', savedId);

      if (error) throw error;

      setSavedArtists((prev) => prev.filter((a) => a.saved_id !== savedId));
      setStats((prev) => ({
        ...prev,
        saved_artists: prev.saved_artists - 1,
      }));

      toast.success('Artist removed from saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove artist');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const filteredSavedArtists = savedArtists.filter(
    (artist) =>
      artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (artist.genre && artist.genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Welcome back, {user?.user_metadata?.name || 'Scout'}</h1>
          <p className="text-text-secondary text-lg">
            Here's what you've discovered and analyzed recently.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <StatsCard
            icon={BarChart3}
            label="Artists Analyzed"
            value={stats.artists_analyzed}
            delay={0}
          />
          <StatsCard
            icon={Heart}
            label="Saved Artists"
            value={stats.saved_artists}
            delay={0.1}
          />
          <StatsCard
            icon={FileText}
            label="Reports Generated"
            value={stats.reports_generated}
            delay={0.2}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ActivityFeed activities={activities} />
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Get started with your next discovery</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Button asChild size="lg" className="gap-2">
                      <Link href="/discover">
                        <Search size={18} />
                        Discover Artists
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary" className="gap-2">
                      <Link href="/saved">
                        <Heart size={18} />
                        View Saved
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Saved Artists Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Your Saved Artists</CardTitle>
                <CardDescription>
                  {savedArtists.length} artist{savedArtists.length !== 1 ? 's' : ''} saved
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedArtists.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="mx-auto mb-3 text-text-secondary" size={24} />
                    <p className="text-text-secondary mb-4">No saved artists yet</p>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/discover">Start discovering</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {savedArtists.slice(0, 5).map((artist) => (
                      <motion.div
                        key={artist.id}
                        className="glass p-3 rounded-lg flex items-center justify-between group hover:bg-white hover:bg-opacity-10 transition"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/report/${artist.id}`}
                            className="font-medium text-accent hover:text-accent-hover transition block truncate"
                          >
                            {artist.name}
                          </Link>
                          <p className="text-text-secondary text-xs truncate">
                            {artist.genre || 'Unknown'}
                          </p>
                        </div>
                        <span className="ml-2 px-2 py-1 rounded bg-accent/10 text-accent text-xs font-medium">
                          {artist.popularity}
                        </span>
                      </motion.div>
                    ))}
                    {savedArtists.length > 5 && (
                      <Button asChild variant="ghost" size="sm" className="w-full gap-2">
                        <Link href="/saved">
                          View all
                          <ArrowRight size={16} />
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips & Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Pro Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-sm mb-1">Use Search Filters</p>
                  <p className="text-text-secondary text-xs">
                    Filter by genre, followers, and popularity to find exactly what you need.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Save Artists</p>
                  <p className="text-text-secondary text-xs">
                    Save promising artists to your collection for later review.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Generate Reports</p>
                  <p className="text-text-secondary text-xs">
                    Get AI-powered insights and outreach templates for each artist.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
