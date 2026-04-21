import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Search, ArrowUpRight, Link2 } from 'lucide-react';
import clsx from 'clsx';

const InstagramIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>);
const FacebookIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>);
const TwitterIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>);
const LinkedinIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>);
const YoutubeIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>);
const GithubIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>);
const TiktokIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v3a3 3 0 0 1-3-3v11a7 7 0 1 1-7-7v3"></path></svg>);
const TwitchIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7"></path></svg>);
const DiscordIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1.5"></circle><circle cx="15" cy="12" r="1.5"></circle><path d="M7.5 7.5c3.5-1 5.5-1 9 0M7 16.5c-2.9-2-2.9-7-2.9-7C5.9 7.6 7.5 7 7.5 7m9.5 9.5c2.9-2 2.9-7 2.9-7C18.1 7.6 16.5 7 16.5 7"></path></svg>);
const TelegramIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>);
const WhatsappIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>);

const getSocialUrl = (network, value) => {
  if (!value) return '#';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `https://${network}.com/${value.replace(/^@/, '').replace(/^\//, '')}`;
};

export default function PublicPage() {
  const { userId } = useParams();
  const { profile, links, loading, setPublicUserId } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    if (userId) {
      setPublicUserId(userId);
    } else {
      setPublicUserId(null); // Will fall back to currentUser if logged in, or show empty
    }
    return () => setPublicUserId(null); 
  }, [userId, setPublicUserId]);

  if (loading || (!profile && userId)) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-slate-500">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-slate-500">User profile not found.</div>;
  }

  const visibleLinks = links.filter(link => link.isVisible);
  const availableCategories = ['All', ...new Set(visibleLinks.map(l => l.category).filter(Boolean))];

  const filteredLinks = visibleLinks.filter(link => {
    let matchesCategory = selectedCategory === 'All' || link.category === selectedCategory;
    let matchesSearch = !searchTerm || link.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <div className="max-w-screen-md mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-white shadow-sm" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-slate-200 mb-4 border-4 border-white shadow-sm flex items-center justify-center">
              <span className="text-2xl text-slate-400 font-medium">{profile.name?.charAt(0) || '?'}</span>
            </div>
          )}
          <h1 className="text-xl font-bold">{profile.name || 'Your Name'}</h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mt-1">
            {profile.subLabel || 'Content Creator'}
          </p>

          {/* Socials */}
          {profile.socials && Object.keys(profile.socials).filter(k => profile.socials[k]).length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              {(profile.socialsOrder || Object.keys(profile.socials)).map(net => {
                const value = profile.socials[net];
                if (!value) return null;
                const SOCIAL_ICONS = {
                  instagram: InstagramIcon,
                  facebook: FacebookIcon,
                  x: TwitterIcon,
                  linkedin: LinkedinIcon,
                  youtube: YoutubeIcon,
                  tiktok: TiktokIcon,
                  twitch: TwitchIcon,
                  github: GithubIcon,
                  discord: DiscordIcon,
                  telegram: TelegramIcon,
                  whatsapp: WhatsappIcon,
                };
                const Icon = SOCIAL_ICONS[net.toLowerCase()] || Link2;
                return (
                  <a key={net} href={getSocialUrl(net, value)} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-600 hover:text-blue-600 hover:-translate-y-0.5 transition-all">
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Search & Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {availableCategories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={clsx(
                  "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                  selectedCategory === cat 
                    ? "bg-slate-800 text-white border-slate-800 shadow-sm" 
                    : "bg-white text-slate-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLinks.map(link => (
            <a 
              key={link.id} 
              href={link.url} 
              target="_blank" 
              rel="noreferrer"
              className="group flex flex-col sm:flex-row bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 relative"
            >
              {link.category && (
                <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur text-xs font-bold tracking-wide px-2 py-1 rounded-md text-slate-700 shadow-sm">
                  {link.category}
                </div>
              )}
              
              <div className="w-full h-[250px] sm:h-auto sm:w-32 sm:aspect-square bg-slate-50 relative shrink-0">
                {link.thumbnailUrl ? (
                  <img src={link.thumbnailUrl} alt={link.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                    <ArrowUpRight className="w-6 h-6 opacity-30" />
                  </div>
                )}
              </div>

              <div className="p-4 flex flex-col justify-between flex-1">
                <h3 className="font-bold text-slate-800 text-lg sm:font-semibold sm:text-base line-clamp-2 leading-tight pr-6">
                  {link.title}
                </h3>
                <div className="mt-4 flex items-end justify-between">
                  {link.price ? (
                    <span className="font-bold text-slate-700 text-sm">
                      {link.currency || '$'} {Number(link.price).toLocaleString()}
                    </span>
                  ) : <div></div>}
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </a>
          ))}
          {filteredLinks.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-2xl border border-gray-100 border-dashed">
              No products found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
