import React from 'react';
import { Calendar, Users, Layers, Award, FileCheck, Shield, ExternalLink, ArrowRight } from 'lucide-react';
import { playClickSound } from '../utils/sound';

export const PlatformFeaturesSection: React.FC = () => {
  const features = [
    {
      title: 'Event Management',
      desc: 'Centralized operations, real-time schedule builders, and multi-track logistics for large collegiate festivals.',
      icon: Calendar,
      category: 'Operations',
    },
    {
      title: 'Smart Registration',
      desc: 'Integrated ticketing, QR-code entry check-in, and automated attendee communications.',
      icon: Users,
      category: 'Intake',
    },
    {
      title: 'Activity Management',
      desc: 'Native engines for hackathon submissions, Model UN caucus committees, and debate brackets.',
      icon: Layers,
      category: 'Engines',
    },
    {
      title: 'Team Coordination',
      desc: 'Collaborative roster building, member invitations, and automated role-based access permissions.',
      icon: Shield,
      category: 'Teams',
    },
    {
      title: 'Jury & Evaluation',
      desc: 'Confidential scoring portals with standardized rubrics for guest judges and adjudicators.',
      icon: Award,
      category: 'Judging',
    },
    {
      title: 'Digital Certificates',
      desc: 'One-click automated generation, tamper-proof verification, and instant participant distribution.',
      icon: FileCheck,
      category: 'Credentials',
    },
  ];

  return (
    <section id="platform" className="py-20 sm:py-28 bg-transparent border-t border-[#A5B2A0]/20 text-left relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E281C]/5 text-[#9A8449] text-xs font-mono uppercase tracking-widest font-bold mb-3 border border-[#A5B2A0]/30">
            <span>🏛️ The Enterprise Event Cloud</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#1E281C] tracking-tight leading-tight">
            Why EnthiosHub?
          </h2>
          <p className="mt-3 text-sm sm:text-lg text-[#1E281C]/75 font-normal leading-relaxed font-sans">
            Beyond the technology simulation, EnthiosHub powers collegiate competitions, multi-track summits, and nationwide hackathons with a robust software infrastructure.
          </p>
        </div>

        {/* 6 Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-white/80 backdrop-blur-md rounded-3xl border border-[#A5B2A0]/30 p-6 sm:p-8 flex flex-col justify-between hover:border-[#CBB57B] hover:shadow-xl transition-all duration-300 text-left group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9A8449] bg-white border border-[#A5B2A0]/30 px-2.5 py-1 rounded-full">
                      {feat.category}
                    </span>
                    <div className="p-3 rounded-2xl bg-white text-[#1E281C] group-hover:bg-[#1E281C] group-hover:text-[#CBB57B] transition-colors shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="font-serif text-2xl font-bold text-[#1E281C] group-hover:text-[#9A8449] transition-colors">
                    {feat.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-[#1E281C]/75 leading-relaxed font-sans">
                    {feat.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-xs font-mono text-[#1E281C]/60">
                  <span className="font-medium">Enterprise Grade</span>
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    ✓ Verified Platform
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Callout Bar */}
        <div className="mt-12 p-8 sm:p-10 rounded-3xl bg-[#1E281C] text-[#F8F6F0] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-left max-w-2xl">
            <h4 className="font-serif text-2xl font-bold text-white">
              Ready to organize your next university event?
            </h4>
            <p className="text-xs sm:text-sm text-[#A5B2A0]">
              Discover how EnthiosHub unifies registration intake, rubric judging, and attendee credentials.
            </p>
          </div>

          <a
            href="https://enthioshub.com"
            onClick={() => playClickSound()}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#CBB57B] text-[#121911] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#E5D7B3] transition-all shadow-md shrink-0 cursor-pointer"
          >
            <span>Explore EnthiosHub Platform</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

      </div>
    </section>
  );
};
