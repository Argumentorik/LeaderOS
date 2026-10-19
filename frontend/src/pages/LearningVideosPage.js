/**
 * LearningVideosPage · eigene Top-Level-Route für Lern-Videos.
 *
 * Mert (Iter 92.21): Lern-Videos brauchen einen eigenen Sidebar-Tab,
 * nicht versteckt im My-Path Tab-Untermenü. Page-Wrapper für das
 * bestehende `LearningVideosTab` Component, das die volle Library
 * rendert (6 Starter / 4 Master Program).
 */
import { Sparkles, PlayCircle } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import LearningVideosTab from '../components/mypath/LearningVideosTab';
import { useLanguage } from '../contexts/LanguageContext';

export default function LearningVideosPage() {
  const { lang } = useLanguage();
  const de = lang === 'de';
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl" data-testid="learning-videos-page">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <PlayCircle size={14} className="text-[#BFFF00]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {de ? 'LERN-VIDEOS' : 'LEARNING VIDEOS'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            {de ? (
              <>Wlads <span className="text-[#BFFF00]">Leadership</span> Library</>
            ) : (
              <>Wlad's <span className="text-[#BFFF00]">Leadership</span> Library</>
            )}
          </h1>
          <p className="text-base text-muted-foreground mt-2 max-w-2xl flex items-center gap-2">
            <Sparkles size={14} className="text-[#BFFF00] shrink-0" />
            {de
              ? '6 Grundlagen-Kurse + 4 Master-Programme · Vimeo HD · Direkt streamen.'
              : '6 fundamentals courses + 4 master programs · Vimeo HD · Stream directly.'}
          </p>
        </div>

        <LearningVideosTab />
      </div>
    </DashboardLayout>
  );
}
