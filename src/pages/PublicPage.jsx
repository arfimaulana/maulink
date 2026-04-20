import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Search, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';

const InstagramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const TwitterIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

const LinkedinIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

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

  const availableCategories = ['All', ...new Set(links.map(l => l.category).filter(Boolean))];

  const filteredLinks = links.filter(link => {
    if (!link.isVisible) return false;
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
          {profile.socials && (
            <div className="flex gap-4 mt-6">
              {profile.socials.instagram && (
                <a href={getSocialUrl('instagram', profile.socials.instagram)} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <InstagramIcon className="w-5 h-5" />
                </a>
              )}
              {profile.socials.facebook && (
                <a href={getSocialUrl('facebook', profile.socials.facebook)} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <FacebookIcon className="w-5 h-5" />
                </a>
              )}
              {profile.socials.x && (
                <a href={getSocialUrl('x', profile.socials.x)} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <TwitterIcon className="w-5 h-5" />
                </a>
              )}
              {profile.socials.linkedin && (
                <a href={getSocialUrl('linkedin', profile.socials.linkedin)} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <LinkedinIcon className="w-5 h-5" />
                </a>
              )}
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
