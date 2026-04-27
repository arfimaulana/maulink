import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Search, ArrowUpRight, Link2, ArrowUpDown, LayoutGrid, List } from 'lucide-react';
import Select from 'react-select';
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
  const { profile: dbProfile, links, loading, setPublicUserId } = useData();
  const [previewOverrides, setPreviewOverrides] = useState({});
  const profile = dbProfile ? { ...dbProfile, ...previewOverrides } : null;

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === 'PREVIEW_UPDATE') {
        setPreviewOverrides(e.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('newest');
  const [viewLayout, setViewLayout] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    if (userId) {
      setPublicUserId(userId);
    } else {
      setPublicUserId(null); // Will fall back to currentUser if logged in, or show empty
    }
    return () => setPublicUserId(null); 
  }, [userId, setPublicUserId]);

  if (loading || (!profile && userId)) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12 animate-pulse">
        <div className="max-w-screen-md mx-auto flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-slate-200 mb-4" />
          <div className="h-6 w-48 bg-slate-200 rounded mb-2" />
          <div className="h-4 w-32 bg-slate-200 rounded mb-8" />
          
          <div className="w-full h-10 bg-slate-200 rounded-lg mb-8" />
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-[4/3] bg-white rounded-2xl border border-gray-100 p-4">
                <div className="w-full h-full bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-slate-500">User profile not found.</div>;
  }

  const visibleLinks = links.filter(link => link.isVisible);
  const availableCategories = ['All', ...new Set(visibleLinks.map(l => l.category).filter(Boolean))];

  const filteredLinks = visibleLinks
    .filter(link => {
      let matchesCategory = selectedCategory === 'All' || link.category === selectedCategory;
      let matchesSearch = !searchTerm || link.title?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortOption === 'newest') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      if (sortOption === 'oldest') return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      if (sortOption === 'price_low') return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
      if (sortOption === 'price_high') return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
      if (sortOption === 'az') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <div className={clsx("max-w-screen-md mx-auto", profile?.layout === 'none' || !profile?.layout ? "py-12 px-4 sm:px-8" : "py-0 pb-12")}>
        {/* Cover Header */}
        {profile?.layout !== 'none' && profile?.layout && profile?.coverUrl && (
           <div className={clsx(
             "w-full bg-transparent overflow-hidden sm:rounded-b-3xl",
             // on desktop maybe 300px, on mobile aspect ratio
             "aspect-[21/9] sm:h-64 sm:aspect-auto" 
           )}>
             <img src={profile.coverUrl} className="w-full h-full object-cover" alt="Cover" />
           </div>
        )}
        
        <div className="px-4 sm:px-8">
          {/* Profile Header */}
          <div className={clsx(
          "flex flex-col items-center mb-8",
          profile?.layout === 'modern' && profile?.coverUrl ? "-mt-12 relative z-10" : 
          profile?.layout !== 'none' && profile?.coverUrl ? "mt-8" : ""
        )}>
          {profile?.layout !== 'clean' && (
            profile.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt="Avatar" 
                className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-white shadow-sm bg-white" 
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-200 mb-4 border-4 border-white shadow-sm flex items-center justify-center bg-white">
                <span className="text-2xl text-slate-400 font-medium">{profile.name?.charAt(0) || '?'}</span>
              </div>
            )
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
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search products..."
                className="w-full pl-11 pr-4 py-2 rounded-lg border border-gray-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative w-full sm:w-[180px] z-20">
                <Select
                  options={[
                    { label: 'Newest First', value: 'newest' },
                    { label: 'Oldest First', value: 'oldest' },
                    { label: 'Lowest Price', value: 'price_low' },
                    { label: 'Highest Price', value: 'price_high' },
                    { label: 'A-Z', value: 'az' }
                  ]}
                  value={{ 
                    label: {
                      newest: 'Newest First',
                      oldest: 'Oldest First',
                      price_low: 'Lowest Price',
                      price_high: 'Highest Price',
                      az: 'A-Z'
                    }[sortOption], 
                    value: sortOption 
                  }}
                  onChange={v => setSortOption(v ? v.value : 'newest')}
                  className="react-select-container text-sm"
                  classNamePrefix="react-select"
                  isSearchable={false}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderRadius: '8px',
                      borderColor: state.isFocused ? '#2563eb' : '#e2e8f0',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: '#2563eb'
                      },
                      minHeight: '40px',
                      height: '40px'
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#eff6ff' : 'white',
                      color: state.isSelected ? 'white' : '#475569',
                      fontWeight: state.isSelected ? '600' : '500',
                      cursor: 'pointer',
                      '&:active': {
                        backgroundColor: state.isSelected ? '#2563eb' : '#dbeafe'
                      }
                    }),
                    valueContainer: (base) => ({
                      ...base,
                      padding: '0 8px'
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: '#475569',
                      fontWeight: '500'
                    })
                  }}
                  formatOptionLabel={({ label }) => (
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
                      <span className="font-medium truncate">{label}</span>
                    </div>
                  )}
                />
              </div>

              <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm shrink-0 h-[40px] items-center">
                <button 
                  onClick={() => setViewLayout('grid')}
                  className={clsx(
                    "p-1.5 rounded transition-all",
                    viewLayout === 'grid' ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewLayout('list')}
                  className={clsx(
                    "p-1.5 rounded transition-all",
                    viewLayout === 'list' ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
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
        <div className={clsx(
          "grid gap-4 transition-all duration-300",
          viewLayout === 'grid' ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1"
        )}>
          {filteredLinks.map(link => (
            <a 
              key={link.id} 
              href={link.url} 
              target="_blank" 
              rel="noreferrer"
              className={clsx(
                "group bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 relative flex",
                viewLayout === 'grid' ? "flex-col" : "flex-row items-center p-2"
              )}
            >
              {link.category && viewLayout === 'grid' && (
                <div className="absolute top-2 left-2 z-10 bg-white/95 backdrop-blur text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded text-slate-700 shadow-sm">
                  {link.category}
                </div>
              )}
              
              <div className={clsx(
                "relative shrink-0 overflow-hidden",
                viewLayout === 'grid' ? "w-full aspect-[4/3] bg-slate-50" : "w-16 h-16 sm:w-24 sm:h-24 rounded-xl"
              )}>
                {link.thumbnailUrl ? (
                  <img 
                    src={link.thumbnailUrl} 
                    alt={link.title} 
                    className="w-full h-full object-cover" 
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                    <ArrowUpRight className={clsx(viewLayout === 'grid' ? "w-6 h-6" : "w-4 h-4", "opacity-30")} />
                  </div>
                )}
              </div>

              <div className={clsx(
                "flex flex-col flex-1",
                viewLayout === 'grid' ? "p-4 justify-between" : "pl-3 pr-1 justify-center"
              )}>
                <div className="space-y-2.5">
                  {link.category && viewLayout === 'list' && (
                    <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      {link.category}
                    </span>
                  )}
                  <h3 className={clsx(
                    "font-bold text-slate-800 leading-tight pr-4",
                    viewLayout === 'grid' ? "text-sm sm:text-base line-clamp-2" : "text-sm sm:text-base line-clamp-1"
                  )}>
                    {link.title}
                  </h3>
                </div>

                <div className={clsx(
                  "flex items-end justify-between",
                  viewLayout === 'grid' ? "mt-3" : "mt-0.5"
                )}>
                  {link.price ? (
                    <span className="font-bold text-slate-700 text-[11px] sm:text-xs">
                      {link.currency || '$'} {Number(link.price).toLocaleString()}
                    </span>
                  ) : <div />}
                  
                  {viewLayout === 'grid' && (
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
              
              {viewLayout === 'list' && (
                <div className="pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </div>
              )}
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
  </div>
  );
}
