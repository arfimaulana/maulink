import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LogOut, Plus, Search, Image as ImageIcon, Copy, Edit2, Trash2, Link as LinkIcon, Settings, LayoutDashboard, Check, X, User, Scissors, ExternalLink, Activity, ChevronLeft, ChevronRight, SlidersHorizontal, ArrowUpDown, Filter, AtSign, Phone, Palette, Layout, Smartphone, Monitor } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { Dialog, Transition } from '@headlessui/react';
import clsx from 'clsx';

const compressImage = (file, maxWidth = 1200) => {
  return new Promise((resolve, reject) => {
    if (!file.type.match(/image.*/)) return resolve(file); // Don't compress non-images
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = maxWidth;
        let width = img.width;
        let height = img.height;

        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Canvas fallback failed'));
          const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
            type: 'image/webp',
            lastModified: Date.now()
          });
          resolve(newFile);
        }, 'image/webp', 0.82);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function Dashboard() {
  const { profile, links, updateProfile, addLink, updateLink, deleteLinkItem } = useData();
  const { logout, currentUser, updateUserEmail, updateUserPassword } = useAuth();

  const countryCodes = [
    { label: '🇮🇩 +62', value: '+62' },
    { label: '🇺🇸 +1', value: '+1' },
    { label: '🇸🇬 +65', value: '+65' },
    { label: '🇲🇾 +60', value: '+60' },
    { label: '🇦🇺 +61', value: '+61' },
    { label: '🇬🇧 +44', value: '+44' },
    { label: '🇯🇵 +81', value: '+81' },
  ];

  const [activeTab, setActiveTab] = useState('links');
  const [previewMode, setPreviewMode] = useState('mobile');

  // Profile State
  const [profileForm, setProfileForm] = useState({
    name: '', subLabel: '', avatarUrl: '', username: '', phoneNumber: '', countryCode: '+62',
    coverUrl: '', layout: 'none',
    socials: { instagram: '', facebook: '', x: '', linkedin: '' }
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Generic Toast State
  const [toast, setToast] = useState({ show: false, message: '' });
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Credentials State
  const [credentialsForm, setCredentialsForm] = useState({
    email: currentUser?.email || '',
    password: '',
    confirmPassword: ''
  });
  const [savingCredentials, setSavingCredentials] = useState(false);

  useEffect(() => {
    if (currentUser?.email) {
      setCredentialsForm(prev => ({ ...prev, email: currentUser.email }));
    }
  }, [currentUser]);

  const handleCredentialsSave = async () => {
    if (credentialsForm.password && credentialsForm.password !== credentialsForm.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setSavingCredentials(true);
    try {
      if (credentialsForm.email !== currentUser.email) {
        await updateUserEmail(credentialsForm.email);
        await updateProfile({ email: credentialsForm.email });
      }
      if (credentialsForm.password) {
        await updateUserPassword(credentialsForm.password);
      }
      showToast('Credentials updated!');
      setCredentialsForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (e) {
      console.error(e);
      if (e.code === 'auth/requires-recent-login') {
        alert('For security, please log out and log back in to change your credentials.');
      } else {
        alert('Failed to update credentials. Check console for details.');
      }
    } finally {
      setSavingCredentials(false);
    }
  };

  // Links State
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [linkSearch, setLinkSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [linkToDelete, setLinkToDelete] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [linkForm, setLinkForm] = useState({
    title: '', url: '', price: '', currency: 'USD', category: '', isVisible: true, thumbnailUrl: '', shortCode: ''
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [savingLink, setSavingLink] = useState(false);

  // Pagination & Sort State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortOption, setSortOption] = useState('newest'); 
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        subLabel: profile.subLabel || '',
        avatarUrl: profile.avatarUrl || '',
        coverUrl: profile.coverUrl || '',
        layout: profile.layout || 'none',
        username: profile.username || '',
        phoneNumber: profile.phoneNumber || '',
        countryCode: profile.countryCode || '+62',
        socials: profile.socials || { instagram: '', facebook: '', x: '', linkedin: '' },
        socialsOrder: profile.socialsOrder || null
      });
    }
  }, [profile]);

  const iframeRef = useRef(null);

  const syncPreview = () => {
    if (iframeRef.current?.contentWindow) {
      const currentCoverUrl = coverFile ? URL.createObjectURL(coverFile) : profileForm.coverUrl;
      iframeRef.current.contentWindow.postMessage({
        type: 'PREVIEW_UPDATE',
        payload: {
          layout: profileForm.layout,
          coverUrl: currentCoverUrl
        }
      }, '*');
    }
  };

  useEffect(() => {
    syncPreview();
  }, [profileForm.layout, profileForm.coverUrl, coverFile]);

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      let finalAvatarUrl = profileForm.avatarUrl;
      if (avatarFile) {
        showToast('Compressing avatar...');
        const compressedAvatar = await compressImage(avatarFile, 400); // Avatars only need 400px
        const fileRef = ref(storage, `avatars/${currentUser.uid}/${compressedAvatar.name}`);
        await uploadBytes(fileRef, compressedAvatar);
        finalAvatarUrl = await getDownloadURL(fileRef);
      }
      
      let finalCoverUrl = profileForm.coverUrl;
      if (coverFile) {
        showToast('Compressing cover...');
        const compressedCover = await compressImage(coverFile, 1200); // Covers max 1200px
        const fileRef = ref(storage, `covers/${currentUser.uid}/${compressedCover.name}`);
        await uploadBytes(fileRef, compressedCover);
        finalCoverUrl = await getDownloadURL(fileRef);
      }
      
      await updateProfile({ ...profileForm, avatarUrl: finalAvatarUrl, coverUrl: finalCoverUrl, email: currentUser.email });
      setAvatarFile(null);
      setCoverFile(null);
      showToast('Profile saved!');
    } catch (e) {
      console.error(e);
      alert('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const openLinkModal = (link = null) => {
    if (link) {
      setEditingLink(link);
      setLinkForm({
        title: link.title || '',
        url: link.url || '',
        price: link.price || '',
        currency: link.currency || 'USD',
        category: link.category || '',
        isVisible: link.isVisible ?? true,
        thumbnailUrl: link.thumbnailUrl || '',
        shortCode: link.shortCode || ''
      });
    } else {
      setEditingLink(null);
      setLinkForm({
        title: '', url: '', price: '', currency: 'USD', category: '', isVisible: true, thumbnailUrl: '', shortCode: ''
      });
    }
    setThumbnailFile(null);
    setIsModalOpen(true);
  };

  const handleLinkSave = async () => {
    setSavingLink(true);
    try {
      let finalThumbnailUrl = linkForm.thumbnailUrl;
      if (thumbnailFile) {
        const fileRef = ref(storage, `thumbnails/${currentUser.uid}/${Date.now()}_${thumbnailFile.name}`);
        await uploadBytes(fileRef, thumbnailFile);
        finalThumbnailUrl = await getDownloadURL(fileRef);
      }

      const payload = { ...linkForm, thumbnailUrl: finalThumbnailUrl };

      if (editingLink) {
        await updateLink(editingLink.id, payload);
        showToast('Link updated!');
      } else {
        await addLink(payload);
        showToast('Link created!');
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to save link');
    } finally {
      setSavingLink(false);
    }
  };

  const categoryOptions = [...new Set(links.map(l => l.category).filter(Boolean))].map(c => ({ label: c, value: c }));

  const executeDeleteCategory = async (categoryToDel) => {
    setSavingLink(true);
    try {
      const linksToUpdate = links.filter(l => l.category === categoryToDel);
      await Promise.all(linksToUpdate.map(link => updateLink(link.id, { category: '' })));
      setLinkForm(prev => ({ ...prev, category: '' }));
      showToast('Category deleted successfully!');
    } catch (err) {
      alert('Failed to delete category');
      console.error(err);
    } finally {
      setSavingLink(false);
    }
  };

  // Dynamic Filtering, Sorting, and Pagination
  const processedLinks = links.filter(l => {
    const matchesSearch = l.title?.toLowerCase().includes(linkSearch.toLowerCase());
    const matchesCategory = filterCategory === 'all' || l.category === filterCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortOption) {
      case 'newest': return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      case 'oldest': return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      case 'title_asc': return (a.title || '').localeCompare(b.title || '');
      case 'title_desc': return (b.title || '').localeCompare(a.title || '');
      case 'clicks_desc': return (b.clicks || 0) - (a.clicks || 0);
      default: return 0;
    }
  });

  const totalPages = Math.ceil(processedLinks.length / itemsPerPage);
  
  // Reset page safely if filters out-bound the active page
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [processedLinks.length, currentPage, totalPages]);

  const paginatedLinks = processedLinks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const AVAILABLE_SOCIALS = ['instagram', 'facebook', 'x', 'linkedin', 'tiktok', 'youtube', 'github', 'twitch', 'discord', 'telegram', 'whatsapp'];
  const defaultSocialsOrder = Object.keys(profileForm.socials || {}).filter(k => profileForm.socials[k] !== undefined && profileForm.socials[k] !== null);
  const activeSocials = (profileForm.socialsOrder || defaultSocialsOrder).filter(k => profileForm.socials[k] !== undefined && profileForm.socials[k] !== null);
  const unselectedSocials = AVAILABLE_SOCIALS.filter(s => !activeSocials.includes(s));

  const GripVerticalIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1.5"></circle><circle cx="9" cy="5" r="1.5"></circle><circle cx="9" cy="19" r="1.5"></circle><circle cx="15" cy="12" r="1.5"></circle><circle cx="15" cy="5" r="1.5"></circle><circle cx="15" cy="19" r="1.5"></circle></svg>);

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

  const getSocialIcon = (net, className="w-4 h-4 shrink-0 text-slate-400") => {
    switch(net.toLowerCase()) {
      case 'instagram': return <InstagramIcon className={className} />;
      case 'facebook': return <FacebookIcon className={className} />;
      case 'x': return <TwitterIcon className={className} />;
      case 'linkedin': return <LinkedinIcon className={className} />;
      case 'youtube': return <YoutubeIcon className={className} />;
      case 'tiktok': return <TiktokIcon className={className} />;
      case 'twitch': return <TwitchIcon className={className} />;
      case 'github': return <GithubIcon className={className} />;
      case 'discord': return <DiscordIcon className={className} />;
      case 'telegram': return <TelegramIcon className={className} />;
      case 'whatsapp': return <WhatsappIcon className={className} />;
      default: return <LinkIcon className={className} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <img src="/maulink-logo.svg" alt="Maulink Logo" className="h-8" />
        </div>
        <div className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('links')}
            className={clsx("w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors", activeTab === 'links' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-gray-50")}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab('shortener')}
            className={clsx("w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors", activeTab === 'shortener' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-gray-50")}
          >
            <Scissors className="w-5 h-5" /> Shortener
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={clsx("w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors", activeTab === 'appearance' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-gray-50")}
          >
            <Palette className="w-5 h-5" /> Appearance
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={clsx("w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors", activeTab === 'settings' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-gray-50")}
          >
            <Settings className="w-5 h-5" /> Settings
          </button>
        </div>
        <div className="p-4 border-t border-gray-100">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-red-600 transition-colors text-sm font-medium">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 max-h-screen overflow-y-auto">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Mobile Tabs */}
          <div className="flex md:hidden gap-2 lg:col-span-12 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveTab('links')}
              className={clsx("flex-1 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium", activeTab === 'links' ? "bg-white shadow border border-gray-100" : "text-slate-500")}
            >Links</button>

            <button
              onClick={() => setActiveTab('shortener')}
              className={clsx("flex-1 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium", activeTab === 'shortener' ? "bg-white shadow border border-gray-100" : "text-slate-500")}
            >Shorts</button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={clsx("flex-1 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium", activeTab === 'appearance' ? "bg-white shadow border border-gray-100" : "text-slate-500")}
            >Appearance</button>

            <button
              onClick={() => setActiveTab('settings')}
              className={clsx("flex-1 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium", activeTab === 'settings' ? "bg-white shadow border border-gray-100" : "text-slate-500")}
            >Settings</button>
            <button onClick={logout} className="p-2 text-slate-500 shrink-0"><LogOut className="w-5 h-5" /></button>
          </div>

          {/* Profile Section (Left Column) */}
          <div className={clsx("lg:col-span-4", activeTab === 'links' ? "block" : "hidden")}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Profile Settings</h2>

              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-slate-100 mb-4 overflow-hidden border border-gray-200 relative group cursor-pointer">
                  {avatarFile ? (
                    <img src={URL.createObjectURL(avatarFile)} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : profileForm.avatarUrl ? (
                    <img src={profileForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium">Upload</span>
                  </div>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => e.target.files?.[0] && setAvatarFile(e.target.files[0])} />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Name</label>
                  <input type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Sub Label (Optional)</label>
                  <input type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={profileForm.subLabel} onChange={e => setProfileForm({ ...profileForm, subLabel: e.target.value })} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      placeholder="username"
                      value={profileForm.username || ''} onChange={e => setProfileForm({ ...profileForm, username: e.target.value.toLowerCase().replace(/\s/g, '') })} />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-xs font-medium text-slate-800 mb-3 uppercase tracking-wider">Socials</label>
                  {activeSocials.map((net, index) => (
                    <div 
                      key={net} 
                      className="flex items-center gap-2 mb-3"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', index.toString());
                        e.currentTarget.style.opacity = '0.5';
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                        const toIndex = index;
                        if (fromIndex === toIndex || isNaN(fromIndex)) return;
                        
                        const newOrder = [...activeSocials];
                        const [movedItem] = newOrder.splice(fromIndex, 1);
                        newOrder.splice(toIndex, 0, movedItem);
                        
                        setProfileForm({
                          ...profileForm,
                          socialsOrder: newOrder
                        });
                      }}
                    >
                      <div className="flex flex-1 border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 bg-gray-50 transition-shadow">
                        <div className="flex items-center px-1.5 cursor-grab active:cursor-grabbing border-r border-gray-100 hover:bg-gray-200 transition-colors bg-white">
                          <GripVerticalIcon className="w-4 h-4 text-slate-300" />
                        </div>
                        <span className="bg-gray-50 px-3 py-2 text-slate-400 border-r border-gray-200 flex items-center justify-center min-w-[50px]">
                          {getSocialIcon(net, "w-5 h-5")}
                        </span>
                        <input type="text" className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white font-medium"
                          placeholder={`https://www.${net}.com/username`}
                          value={profileForm.socials[net] || ''}
                          onChange={e => setProfileForm({
                            ...profileForm,
                            socials: { ...profileForm.socials, [net]: e.target.value }
                          })}
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const newSocials = { ...profileForm.socials };
                          newSocials[net] = null;
                          const newOrder = activeSocials.filter(k => k !== net);
                          setProfileForm({ ...profileForm, socials: newSocials, socialsOrder: newOrder });
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                        title="Remove social link"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}

                  {unselectedSocials.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <Select
                        options={unselectedSocials.map(s => ({ label: s, value: s }))}
                        value={null}
                        placeholder="+ Add social link"
                        onChange={v => {
                          if (v) {
                            const newOrder = [...activeSocials];
                            if (!newOrder.includes(v.value)) newOrder.push(v.value);
                            setProfileForm({
                              ...profileForm,
                              socials: { ...(profileForm.socials || {}), [v.value]: '' },
                              socialsOrder: newOrder
                            });
                          }
                        }}
                        formatOptionLabel={({ label }) => (
                          <div className="flex items-center gap-3">
                            {getSocialIcon(label, "w-4 h-4 text-slate-500")}
                            <span className="lowercase font-medium text-slate-700">{label}</span>
                          </div>
                        )}
                        className="react-select-container text-sm"
                        classNamePrefix="react-select"
                        isSearchable={false}
                        menuPlacement="auto"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-2">
                  <button className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-slate-600 rounded-lg text-sm font-medium transition-colors"
                    onClick={() => {
                      setProfileForm(profile ? { ...profile } : { name: '', subLabel: '', avatarUrl: '', socials: {} });
                      setAvatarFile(null);
                    }}>
                    Discard
                  </button>
                  <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    onClick={handleProfileSave} disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Links Section (Right Column) */}
          <div className={clsx("lg:col-span-8", activeTab === 'links' ? "block" : "hidden")}>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-6 flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex-1 w-full flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-blue-500">
                <div className="px-3 py-2 bg-gray-50 text-slate-500 text-xs font-semibold border-r border-gray-200 shrink-0">
                  My Link
                </div>
                <div className="flex-1 px-3 py-2 text-sm font-medium text-slate-800 flex items-center justify-between bg-white relative overflow-hidden">
                  <span className="truncate pr-4">arfimaulana.com/</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`arfimaulana.com/`);
                      showToast('Profile link copied!');
                    }}
                    className="text-slate-400 hover:text-slate-600 shrink-0 bg-white"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <a 
                href="/" 
                target="_blank" 
                rel="noreferrer" 
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors shrink-0 shadow-sm"
              >
                <ExternalLink className="w-4 h-4" /> Go to link
              </a>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
              <div className="flex items-center justify-between mb-6 gap-4">
                <h2 className="text-lg font-bold text-slate-800">Your Links</h2>
                <button onClick={() => openLinkModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shrink-0">
                  <Plus className="w-4 h-4" /> Add Link
                </button>
              </div>

              <div className="flex flex-col xl:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search existing links..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={linkSearch}
                    onChange={e => { setLinkSearch(e.target.value); setCurrentPage(1); }}
                  />
                </div>
                
                <div className="flex items-center gap-2 shrink-0 w-full xl:w-auto">
                  <div className="flex-1 sm:w-[160px] z-20">
                    <Select
                      options={[{ label: 'All Categories', value: 'all' }, ...categoryOptions]}
                      value={{ 
                        label: filterCategory === 'all' ? 'All Categories' : filterCategory, 
                        value: filterCategory 
                      }}
                      onChange={v => { setFilterCategory(v ? v.value : 'all'); setCurrentPage(1); }}
                      menuPortalTarget={document.body}
                      className="react-select-container text-sm"
                      classNamePrefix="react-select"
                      isSearchable={false}
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '8px',
                          borderColor: state.isFocused ? '#2563eb' : '#e2e8f0',
                          boxShadow: 'none',
                          '&:hover': { borderColor: '#2563eb' },
                          minHeight: '38px',
                          height: '38px'
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#eff6ff' : 'white',
                          color: state.isSelected ? 'white' : '#475569',
                          fontWeight: state.isSelected ? '600' : '500',
                          cursor: 'pointer',
                          '&:active': { backgroundColor: state.isSelected ? '#2563eb' : '#dbeafe' }
                        }),
                        singleValue: (base) => ({ ...base, color: '#475569', fontWeight: '500' }),
                        menuPortal: base => ({ ...base, zIndex: 9999 })
                      }}
                      formatOptionLabel={({ label }) => (
                        <div className="flex items-center gap-2">
                          <Filter className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{label}</span>
                        </div>
                      )}
                    />
                  </div>
                  
                  <div className="flex-1 sm:w-[160px] z-20">
                    <Select
                      options={[
                        { label: 'Newest First', value: 'newest' },
                        { label: 'Oldest First', value: 'oldest' },
                        { label: 'Title (A-Z)', value: 'title_asc' },
                        { label: 'Title (Z-A)', value: 'title_desc' },
                        { label: 'Most Clicks', value: 'clicks_desc' }
                      ]}
                      value={{ 
                        label: {
                          newest: 'Newest First',
                          oldest: 'Oldest First',
                          title_asc: 'Title (A-Z)',
                          title_desc: 'Title (Z-A)',
                          clicks_desc: 'Most Clicks'
                        }[sortOption], 
                        value: sortOption 
                      }}
                      onChange={v => { setSortOption(v ? v.value : 'newest'); setCurrentPage(1); }}
                      menuPortalTarget={document.body}
                      className="react-select-container text-sm"
                      classNamePrefix="react-select"
                      isSearchable={false}
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '8px',
                          borderColor: state.isFocused ? '#2563eb' : '#e2e8f0',
                          boxShadow: 'none',
                          '&:hover': { borderColor: '#2563eb' },
                          minHeight: '38px',
                          height: '38px'
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#eff6ff' : 'white',
                          color: state.isSelected ? 'white' : '#475569',
                          fontWeight: state.isSelected ? '600' : '500',
                          cursor: 'pointer',
                          '&:active': { backgroundColor: state.isSelected ? '#2563eb' : '#dbeafe' }
                        }),
                        singleValue: (base) => ({ ...base, color: '#475569', fontWeight: '500' }),
                        menuPortal: base => ({ ...base, zIndex: 9999 })
                      }}
                      formatOptionLabel={({ label }) => (
                        <div className="flex items-center gap-2">
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{label}</span>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {paginatedLinks.map(link => (
                  <div key={link.id} className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all flex items-center gap-4 bg-white relative group">
                    <div className="w-16 h-16 bg-slate-50 rounded-lg shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center">
                      {link.thumbnailUrl ? (
                        <img src={link.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : <ImageIcon className="w-6 h-6 text-slate-300" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800 truncate">{link.title}</h3>
                        {!link.isVisible && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded-md">Hidden</span>}
                      </div>
                      <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mb-1 truncate">
                        <LinkIcon className="w-3 h-3" /> {link.url}
                      </a>
                      {link.price && <div className="text-xs font-semibold text-slate-500">{link.currency} {Number(link.price).toLocaleString()}</div>}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {/* Toggle */}
                      <button
                        onClick={async () => {
                          await updateLink(link.id, { isVisible: !link.isVisible });
                          showToast(`Link ${!link.isVisible ? 'published' : 'hidden'}!`);
                        }}
                        className={clsx("w-11 h-6 rounded-full flex p-0.5 transition-colors duration-300 focus:outline-none", link.isVisible ? "bg-emerald-500" : "bg-slate-200")}
                      >
                        <div className={clsx("w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm transition-transform duration-300", link.isVisible ? "translate-x-5" : "translate-x-0")}>
                          {link.isVisible ? (
                            <div className="w-0.5 h-2.5 bg-emerald-500 rounded-full" />
                          ) : (
                            <div className="w-2 h-2 border-2 border-slate-300 rounded-full" />
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="relative">
                          <button
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors"
                            onClick={() => {
                              navigator.clipboard.writeText(link.url);
                              setCopiedLinkId(link.id);
                              setTimeout(() => setCopiedLinkId(null), 2000);
                            }}
                            title="Copy URL"
                          >
                            {copiedLinkId === link.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                          {copiedLinkId === link.id && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-xs font-semibold rounded shadow-lg whitespace-nowrap z-10 pointer-events-none animate-in fade-in zoom-in duration-200">
                              Copied!
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 pointer-events-none"></div>
                            </div>
                          )}
                        </div>
                        <button className="p-1.5 text-slate-400 hover:text-yellow-600 rounded" onClick={() => openLinkModal(link)} title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-1.5 text-slate-400 hover:text-red-600 rounded" onClick={() => setLinkToDelete(link)} title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {processedLinks.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No links found matching your filters.
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {processedLinks.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 shrink-0">
                    <span>Show:</span>
                    <select 
                      className="bg-transparent focus:outline-none font-semibold text-slate-700"
                      value={itemsPerPage}
                      onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-slate-600 px-3">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-1.5 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shortener Section (Right Column Alternative) */}
          <div className={clsx("lg:col-span-12", activeTab === 'shortener' ? "block" : "hidden")}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-lg font-bold text-slate-800">Short Links Manager</h2>
                <button onClick={() => openLinkModal()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition">
                  <Plus className="w-4 h-4" /> Create Short Link
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedLinks.map(link => (
                  <div key={link.id} className="min-w-0 p-4 sm:p-5 border border-gray-100 rounded-xl hover:border-blue-100 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all bg-white relative group flex flex-col justify-between sm:h-48">
                    <div className="min-w-0">
                      <div className="flex justify-between items-center mb-2 gap-2 min-w-0">
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-md min-w-0 flex-1">
                          <Scissors className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[10px] sm:text-xs font-bold font-mono tracking-wide truncate mt-0.5">arfimaulana.com/l/{link.shortCode}</span>
                        </div>
                        <button
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          onClick={() => {
                            navigator.clipboard.writeText(`arfimaulana.com/l/${link.shortCode}`);
                            setCopiedLinkId(link.id);
                            setTimeout(() => setCopiedLinkId(null), 2000);
                          }}
                          title="Copy Short URL"
                        >
                          {copiedLinkId === link.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <h3 className="font-semibold text-slate-800 text-sm line-clamp-1 mt-3 mb-1 pr-10" title={link.title}>{link.title}</h3>
                      <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-blue-500 pr-2 block">
                        <span className="line-clamp-2 break-all">
                          <ExternalLink className="w-3 h-3 inline-block mr-1 mb-0.5 shrink-0" />{link.url}
                        </span>
                      </a>
                    </div>
                    
                    <div className="flex justify-between items-end border-t border-gray-50 pt-3 mt-3">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Activity className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-bold">{link.clicks || 0}</span>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-widest pl-0.5">Clicks</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-1.5 text-slate-400 hover:text-yellow-600 bg-gray-50 hover:bg-yellow-50 rounded" onClick={() => openLinkModal(link)}><Edit2 className="w-4 h-4" /></button>
                         <button className="p-1.5 text-slate-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded" onClick={() => setLinkToDelete(link)}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {processedLinks.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No short links available matching your filters.
                  </div>
                )}
              </div>

              {/* Pagination Controls for Shortener */}
              {processedLinks.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 shrink-0">
                    <span>Show:</span>
                    <select 
                      className="bg-transparent focus:outline-none font-semibold text-slate-700"
                      value={itemsPerPage}
                      onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-slate-600 px-3">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-1.5 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Appearance Section */}
          <div className={clsx("lg:col-span-12", activeTab === 'appearance' ? "block" : "hidden")}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-6">Page Style</h2>
                  
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-slate-700">Cover Header</label>
                      {(profileForm.coverUrl || coverFile) && (
                        <button 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            setCoverFile(null); 
                            setProfileForm({ ...profileForm, coverUrl: '' }); 
                          }}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline"
                        >
                          Remove Cover
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Recommended size: 1200 x 400px (3:1 ratio)</p>
                    <div className="w-full aspect-[21/9] rounded-xl bg-slate-50 border-2 border-dashed border-gray-200 overflow-hidden relative group cursor-pointer flex items-center justify-center">
                      {coverFile ? (
                        <img src={URL.createObjectURL(coverFile)} alt="Cover Preview" className="w-full h-full object-cover" />
                      ) : profileForm.coverUrl ? (
                        <img src={profileForm.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-slate-400">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <span className="text-sm font-medium">Upload Cover</span>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-lg">Change Image</span>
                      </div>
                      
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => {
                        if (e.target.files?.[0]) setCoverFile(e.target.files[0]);
                      }} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Layout Pattern</label>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Default Pattern */}
                      <button
                        onClick={() => setProfileForm({ ...profileForm, layout: 'none' })}
                        className={clsx(
                          "rounded-2xl border-2 flex flex-col items-center p-3 transition-all",
                          profileForm.layout === 'none' ? "border-blue-500 shadow-md" : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="w-full aspect-[4/5] bg-gray-50 rounded-xl border border-gray-100 shadow-sm flex flex-col p-4">
                           <div className="w-12 h-12 rounded-full bg-slate-200 mx-auto mt-4" />
                           <div className="h-3 w-20 bg-slate-200 rounded mx-auto mt-4" />
                           <div className="h-8 w-full bg-slate-100 rounded mt-6" />
                           <div className="h-8 w-full bg-slate-100 rounded mt-2" />
                        </div>
                        <span className={clsx("text-sm font-semibold mt-3", profileForm.layout === 'none' ? "text-blue-600" : "text-slate-600")}>Default</span>
                      </button>

                      {/* Classic Pattern */}
                      <button
                        onClick={() => setProfileForm({ ...profileForm, layout: 'classic' })}
                        className={clsx(
                          "rounded-2xl border-2 flex flex-col items-center p-3 transition-all",
                          profileForm.layout === 'classic' ? "border-emerald-500 shadow-md" : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="w-full aspect-[4/5] bg-gray-50 rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden px-4 pb-4 relative">
                           <div className="absolute top-0 left-0 right-0 h-24 bg-slate-400 flex items-center justify-center">
                             <ImageIcon className="w-6 h-6 text-white/50" />
                           </div>
                           <div className="w-12 h-12 rounded-full bg-slate-200 mx-auto mt-28 border-2 border-white" />
                           <div className="h-3 w-20 bg-slate-200 rounded mx-auto mt-3" />
                           <div className="h-8 w-full bg-slate-100 rounded mt-4" />
                        </div>
                        <span className={clsx("text-sm font-semibold mt-3", profileForm.layout === 'classic' ? "text-emerald-600" : "text-slate-600")}>Classic</span>
                      </button>

                      {/* Modern Pattern */}
                      <button
                        onClick={() => setProfileForm({ ...profileForm, layout: 'modern' })}
                        className={clsx(
                          "rounded-2xl border-2 flex flex-col items-center p-3 transition-all",
                          profileForm.layout === 'modern' ? "border-emerald-500 shadow-md" : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="w-full aspect-[4/5] bg-gray-50 rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden px-4 pb-4 relative">
                           <div className="absolute top-0 left-0 right-0 h-24 bg-slate-400 flex items-center justify-center">
                             <ImageIcon className="w-6 h-6 text-white/50" />
                           </div>
                           <div className="w-12 h-12 rounded-full bg-slate-200 mx-auto mt-[4.5rem] border-4 border-white shadow-sm relative z-10" />
                           <div className="h-3 w-20 bg-slate-200 rounded mx-auto mt-3" />
                           <div className="h-8 w-full bg-slate-100 rounded mt-4" />
                        </div>
                        <span className={clsx("text-sm font-semibold mt-3", profileForm.layout === 'modern' ? "text-emerald-600" : "text-slate-600")}>Modern</span>
                      </button>

                      {/* Clean Pattern */}
                      <button
                        onClick={() => setProfileForm({ ...profileForm, layout: 'clean' })}
                        className={clsx(
                          "rounded-2xl border-2 flex flex-col items-center p-3 transition-all",
                          profileForm.layout === 'clean' ? "border-emerald-500 shadow-md" : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="w-full aspect-[4/5] bg-gray-50 rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden px-4 pb-4 relative">
                           <div className="absolute top-0 left-0 right-0 h-24 bg-slate-400 flex items-center justify-center">
                             <ImageIcon className="w-6 h-6 text-white/50" />
                           </div>
                           <div className="h-3 w-20 bg-slate-200 rounded mx-auto mt-28" />
                           <div className="h-8 w-full bg-slate-100 rounded mt-4" />
                           <div className="h-8 w-full bg-slate-100 rounded mt-2" />
                        </div>
                        <span className={clsx("text-sm font-semibold mt-3", profileForm.layout === 'clean' ? "text-emerald-600" : "text-slate-600")}>Clean</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
                    <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      onClick={handleProfileSave} disabled={savingProfile}>
                      {savingProfile ? 'Saving...' : 'Save Appearance'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Box */}
              <div className="bg-slate-100 rounded-3xl p-6 hidden lg:block sticky top-8">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="font-bold text-slate-700">Live Preview</h3>
                  <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                     <button 
                       onClick={() => setPreviewMode('mobile')}
                       className={clsx("p-1.5 rounded transition-colors", previewMode === 'mobile' ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-600")}
                     >
                       <Smartphone className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => setPreviewMode('desktop')}
                       className={clsx("p-1.5 rounded transition-colors", previewMode === 'desktop' ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-600")}
                     >
                       <Monitor className="w-4 h-4" />
                     </button>
                  </div>
                </div>

                <div className={clsx(
                  "mx-auto bg-white border-8 border-slate-800 shadow-xl overflow-hidden relative flex flex-col transition-all duration-300",
                  previewMode === 'mobile' ? "w-[320px] h-[650px] rounded-[3rem]" : "w-full h-[650px] rounded-xl"
                )}>
                  {/* Fake Notch only for Mobile */}
                  {previewMode === 'mobile' && (
                    <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl z-50 w-32 mx-auto" />
                  )}
                  
                  {/* Iframe for mobile preview - we use the public page url with a query param to preview */}
                  <iframe 
                    ref={iframeRef}
                    onLoad={syncPreview}
                    src={currentUser ? `/${currentUser.uid}?preview=true` : ''} 
                    className="w-full h-full bg-gray-50 border-none"
                    title="Live Preview"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Settings Section (Full Width) */}
          <div className={clsx("lg:col-span-12", activeTab === 'settings' ? "block" : "hidden")}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl mx-auto">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Account Credentials</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Login Email</label>
                  <input type="email" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={credentialsForm.email} onChange={e => setCredentialsForm({ ...credentialsForm, email: e.target.value })} />
                </div>
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">New Password</label>
                    <input type="password" placeholder="Leave blank to keep current password" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={credentialsForm.password} onChange={e => setCredentialsForm({ ...credentialsForm, password: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Confirm New Password</label>
                    <input type="password" placeholder="Leave blank to keep current password" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={credentialsForm.confirmPassword} onChange={e => setCredentialsForm({ ...credentialsForm, confirmPassword: e.target.value })} />
                  </div>
                </div>
                <div className="pt-4 flex gap-2">
                  <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    onClick={handleCredentialsSave} disabled={savingCredentials}>
                    {savingCredentials ? 'Saving...' : 'Update Credentials'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl mx-auto mt-6">
              <h2 className="text-lg font-bold text-slate-800 mb-6 font-geist">Personal Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Username</label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        placeholder="yourname"
                        value={profileForm.username || ''} onChange={e => setProfileForm({ ...profileForm, username: e.target.value.toLowerCase().replace(/\s/g, '') })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Phone Number</label>
                    <div className="flex gap-2">
                       <div className="w-[110px] shrink-0">
                        <Select
                          options={countryCodes}
                          value={countryCodes.find(c => c.value === (profileForm.countryCode || '+62'))}
                          onChange={v => setProfileForm({ ...profileForm, countryCode: v ? v.value : '+62' })}
                          isSearchable={false}
                          styles={{
                            control: (base, state) => ({
                              ...base,
                              borderRadius: '8px',
                              borderColor: state.isFocused ? '#2563eb' : '#e2e8f0',
                              boxShadow: 'none',
                              backgroundColor: '#f8fafc',
                              '&:hover': { borderColor: '#2563eb' },
                              minHeight: '38px',
                              height: '38px'
                            }),
                            option: (base, state) => ({
                              ...base,
                              fontSize: '13px',
                              backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#eff6ff' : 'white',
                              color: state.isSelected ? 'white' : '#475569',
                              cursor: 'pointer'
                            })
                          }}
                        />
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="tel" className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium h-[38px]"
                          placeholder="812..."
                          value={profileForm.phoneNumber || ''} onChange={e => setProfileForm({ ...profileForm, phoneNumber: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex gap-2">
                  <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    onClick={handleProfileSave} disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Toast Notification */}
      <Transition
        show={toast.show}
        enter="transition-all duration-300 ease-out"
        enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:translate-x-full"
        enterTo="opacity-100 translate-y-0 sm:translate-x-0"
        leave="transition-all duration-200 ease-in"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:translate-x-full"
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[60] pointer-events-auto"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center p-2 pr-4 min-w-[280px] gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
          </div>
          <p className="font-bold text-slate-800 flex-1">{toast.message}</p>
          <button
            onClick={() => setToast(prev => ({ ...prev, show: false }))}
            className="w-7 h-7 border border-gray-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-gray-50 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </Transition>

      {/* Add/Edit Link Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <Dialog.Title className="font-bold text-slate-800 text-lg">
                {editingLink ? 'Edit Link' : 'Add New Link'}
              </Dialog.Title>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Thumbnail Image</label>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 shrink-0 relative flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200 mt-1">
                    {thumbnailFile ? (
                      <img src={URL.createObjectURL(thumbnailFile)} alt="" className="w-full h-full object-cover absolute inset-0" />
                    ) : linkForm.thumbnailUrl ? (
                      <img src={linkForm.thumbnailUrl} alt="" className="w-full h-full object-cover absolute inset-0" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <input type="url" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="Paste image URL..." 
                      value={!thumbnailFile ? linkForm.thumbnailUrl : ''}
                      onChange={e => {
                        setLinkForm({ ...linkForm, thumbnailUrl: e.target.value });
                        if (e.target.value) setThumbnailFile(null);
                      }}
                    />
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-gray-200"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OR</span>
                      <div className="h-px flex-1 bg-gray-200"></div>
                    </div>
                    <input type="file" className="text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" accept="image/*" onChange={e => {
                      if (e.target.files?.[0]) {
                        setThumbnailFile(e.target.files[0]);
                        setLinkForm({ ...linkForm, thumbnailUrl: '' });
                      }
                    }} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={linkForm.title} onChange={e => setLinkForm({ ...linkForm, title: e.target.value })} placeholder="e.g. My Awesome Guide" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destination URL</label>
                <input type="url" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={linkForm.url} onChange={e => setLinkForm({ ...linkForm, url: e.target.value })} placeholder="https://" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                  Custom Alias
                  <span className="text-xs text-slate-400 font-normal">Optional</span>
                </label>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-gray-50">
                  <span className="px-3 py-2 text-xs text-slate-500 border-r border-gray-200 min-w[120px] font-mono">
                    arfimaulana.com/l/
                  </span>
                  <input type="text" className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white font-mono"
                    value={linkForm.shortCode || ''} onChange={e => setLinkForm({ ...linkForm, shortCode: e.target.value })} placeholder="e.g. summer-sale" />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                  <Select
                    options={[
                      { label: 'USD', value: 'USD' },
                      { label: 'IDR', value: 'IDR' },
                      { label: 'EUR', value: 'EUR' }
                    ]}
                    value={{ label: linkForm.currency, value: linkForm.currency }}
                    onChange={v => setLinkForm({ ...linkForm, currency: v ? v.value : 'USD' })}
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                    menuPosition="fixed"
                    menuPortalTarget={document.body}
                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                    isSearchable={false}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={linkForm.price} onChange={e => setLinkForm({ ...linkForm, price: e.target.value })} placeholder="0.00" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Category</label>
                  {linkForm.category && categoryOptions.find(c => c.value === linkForm.category) && (
                    <button 
                      onClick={(e) => { e.preventDefault(); setCategoryToDelete(linkForm.category); }}
                      disabled={savingLink}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline"
                    >
                      Delete "{linkForm.category}"
                    </button>
                  )}
                </div>
                <CreatableSelect
                  isClearable
                  options={categoryOptions}
                  value={linkForm.category ? { label: linkForm.category, value: linkForm.category } : null}
                  onChange={v => setLinkForm({ ...linkForm, category: v ? v.value : '' })}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  menuPosition="fixed"
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-gray-100 rounded-lg" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50" onClick={handleLinkSave} disabled={savingLink}>
                {savingLink ? 'Saving...' : 'Save Link'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!linkToDelete} onClose={() => setLinkToDelete(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-4">
              Delete Link
            </Dialog.Title>
            <p className="text-sm text-slate-600 mb-8 leading-relaxed">
              You are about to delete the '{linkToDelete?.title || 'selected'}' link. <br />
              Do you wish to continue?
            </p>
            <div className="flex gap-4">
              <button
                className="flex-1 py-3 text-sm font-semibold text-slate-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                onClick={() => setLinkToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 text-sm font-semibold text-white bg-[#dc2626] rounded-full hover:bg-[#b91c1c] transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                onClick={async () => {
                  if (linkToDelete) {
                    await deleteLinkItem(linkToDelete.id);
                    showToast('Link deleted!');
                  }
                  setLinkToDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      
      {/* Delete Category Confirmation Modal */}
      <Dialog open={!!categoryToDelete} onClose={() => setCategoryToDelete(null)} className="relative z-[60]">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-4">
              Delete Category
            </Dialog.Title>
            <p className="text-sm text-slate-600 mb-8 leading-relaxed">
              Are you sure you want to delete the '{categoryToDelete}' category? <br />
              This will safely remove the category label from every link that uses it.
            </p>
            <div className="flex gap-4">
              <button
                className="flex-1 py-3 text-sm font-semibold text-slate-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                onClick={() => setCategoryToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 text-sm font-semibold text-white bg-[#dc2626] rounded-full hover:bg-[#b91c1c] transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                onClick={async () => {
                  if (categoryToDelete) {
                    await executeDeleteCategory(categoryToDelete);
                  }
                  setCategoryToDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
