'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { LeadScoreGauge } from '@/components/report/lead-score-gauge';
import { ReportSection } from '@/components/report/report-section';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Artist, ReportData } from '@/types';
import { Download, Share2, Heart, Copy } from 'lucide-react';
import Link from 'next/link';

interface ReportPageProps {
  params: {
    id: string;
  };
}

export default function ReportPage({ params }: ReportPageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!authLoading && !user) {
    router.push('/login');
    return null;
  }

  useEffect(() => {
    if (user) {
      loadReportData();
    }
  }, [user, params.id]);

  const loadReportData = async () => {
    try {
      setLoading(true);

      // Fetch artist
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', params.id)
        .single();

      if (artistError) throw artistError;
      setArtist(artistData);

      // Check if artist is saved
      const { data: savedData } = await supabase
        .from('saved_artists')
        .select('id')
        .eq('user_id', user?.id)
        .eq('artist_id', params.id)
        .single();

      setIsSaved(!!savedData);

      // Try to fetch existing report
      const { data: reportData } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user?.id)
        .eq('artist_id', params.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (reportData) {
        setReport(reportData.report_json);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!artist) return;

    setGenerating(true);

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist_id: artist.id,
          artist_name: artist.name,
          genre: artist.genre,
          followers: artist.followers,
          popularity: artist.popularity,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();
      setReport(data.report);
      toast.success('Report generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveArtist = async () => {
    if (!artist || !user) return;

    setSaving(true);

    try {
      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_artists')
          .delete()
          .eq('user_id', user.id)
          .eq('artist_id', artist.id);

        if (error) throw error;
        setIsSaved(false);
        toast.success('Artist removed from saved');
      } else {
        // Save artist
        const { error } = await supabase.from('saved_artists').insert([
          {
            user_id: user.id,
            artist_id: artist.id,
          },
        ]);

        if (error) {
          if (error.code === '23505') {
            toast.error('Artist already saved');
          } else {
            throw error;
          }
        } else {
          setIsSaved(true);
          toast.success('Artist saved successfully!');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save artist');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyOutreach = async () => {
    if (!report?.outreach_draft) return;

    try {
      await navigator.clipboard.writeText(report.outreach_draft);
      toast.success('Outreach draft copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-8">
          <p className="text-text-secondary mb-4">Artist not found</p>
          <Button asChild>
            <Link href="/discover">Back to Discover</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <Button variant="ghost" asChild>
            <Link href="/discover">← Back to Discover</Link>
          </Button>
        </motion.div>

        {/* Artist Header */}
        <motion.div
          className="mb-12 glass rounded-xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row gap-8">
            {/* Artist Image */}
            {artist.image_url && (
              <motion.div
                className="md:w-48 flex-shrink-0"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <img
                  src={artist.image_url}
                  alt={artist.name}
                  className="w-full aspect-square rounded-lg object-cover shadow-glow-purple"
                />
              </motion.div>
            )}

            {/* Artist Info */}
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{artist.name}</h1>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div>
                  <p className="text-text-secondary text-sm">Genre</p>
                  <p className="text-xl font-semibold">{artist.genre}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Followers</p>
                  <p className="text-xl font-semibold">
                    {(artist.followers / 1000).toFixed(0)}K
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Popularity</p>
                  <p className="text-xl font-semibold">{artist.popularity}/100</p>
                </div>
              </div>

              <div className="flex gap-4 flex-wrap">
                <Button
                  onClick={handleGenerateReport}
                  disabled={generating || !!report}
                >
                  {generating ? 'Generating...' : report ? 'Report Generated' : 'Generate Report'}
                </Button>
                <Button
                  variant={isSaved ? 'default' : 'outline'}
                  onClick={handleSaveArtist}
                  disabled={saving}
                  className="gap-2"
                >
                  <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
                  {isSaved ? 'Saved' : 'Save Artist'}
                </Button>
                <Button variant="outline" className="gap-2">
                  <Share2 size={18} />
                  Share
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Report Content */}
        {report ? (
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Lead Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Card className="flex flex-col items-center py-12">
                <LeadScoreGauge
                  score={report.lead_score}
                  category={report.lead_category}
                />
              </Card>
            </motion.div>

            {/* Executive Summary */}
            <ReportSection
              title="Executive Summary"
              content={report.executive_summary}
              delay={0.1}
            />

            <div className="grid md:grid-cols-2 gap-8">
              {/* Strengths */}
              <ReportSection
                title="Strengths"
                content={report.strengths}
                delay={0.2}
              />

              {/* Weaknesses */}
              <ReportSection
                title="Weaknesses"
                content={report.weaknesses}
                delay={0.3}
              />
            </div>

            {/* Growth Potential */}
            <ReportSection
              title="Growth Potential"
              content={report.growth_potential}
              delay={0.4}
            />

            <div className="grid md:grid-cols-2 gap-8">
              {/* Marketing Opportunities */}
              <ReportSection
                title="Marketing Opportunities"
                content={report.marketing_opportunities}
                delay={0.5}
              />

              {/* Risk Factors */}
              <ReportSection
                title="Risk Factors"
                content={report.risk_factors}
                delay={0.6}
              />
            </div>

            {/* Outreach Draft */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Personalized Outreach Draft</CardTitle>
                      <CardDescription>
                        Use this template to reach out to the artist
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyOutreach}
                      className="gap-2"
                    >
                      <Copy size={16} />
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="glass p-4 rounded-lg whitespace-pre-wrap text-text-secondary leading-relaxed">
                    {report.outreach_draft}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Generate Report</h3>
                <p className="text-text-secondary mb-6">
                  Click the button above to generate an AI-powered analysis for this artist.
                </p>
                <Button onClick={handleGenerateReport} disabled={generating}>
                  {generating ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
