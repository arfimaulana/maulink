import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LogOut, Plus, Search, Image as ImageIcon, Copy, Edit2, Trash2, Link as LinkIcon, Settings, LayoutDashboard, Check, X, User } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { Dialog, Transition } from '@headlessui/react';
import clsx from 'clsx';

export default function Dashboard() {
  const { profile, links, updateProfile, addLink, updateLink, deleteLinkItem } = useData();
  const { logout, currentUser, updateUserEmail, updateUserPassword } = useAuth();

  const [activeTab, setActiveTab] = useState('links');

  // Profile State
  const [profileForm, setProfileForm] = useState({
    name: '', subLabel: '', avatarUrl: '',
    socials: { instagram: '', facebook: '', x: '', linkedin: '' }
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showProfileToast, setShowProfileToast] = useState(false);

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
      }
      if (credentialsForm.password) {
        await updateUserPassword(credentialsForm.password);
      }
      alert('Credentials updated successfully!');
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
  const [linkForm, setLinkForm] = useState({
    title: '', url: '', price: '', currency: 'USD', category: '', isVisible: true, thumbnailUrl: ''
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [savingLink, setSavingLink] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        subLabel: profile.subLabel || '',
        avatarUrl: profile.avatarUrl || '',
        socials: profile.socials || { instagram: '', facebook: '', x: '', linkedin: '' }
      });
    }
  }, [profile]);

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      let finalAvatarUrl = profileForm.avatarUrl;
      if (avatarFile) {
        const fileRef = ref(storage, `avatars/${currentUser.uid}/${avatarFile.name}`);
        await uploadBytes(fileRef, avatarFile);
        finalAvatarUrl = await getDownloadURL(fileRef);
      }
      await updateProfile({ ...profileForm, avatarUrl: finalAvatarUrl });
      setAvatarFile(null);
      setShowProfileToast(true);
      setTimeout(() => setShowProfileToast(false), 3000);
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
        thumbnailUrl: link.thumbnailUrl || ''
      });
    } else {
      setEditingLink(null);
      setLinkForm({
        title: '', url: '', price: '', currency: 'USD', category: '', isVisible: true, thumbnailUrl: ''
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
      } else {
        await addLink(payload);
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('Failed to save link');
    } finally {
      setSavingLink(false);
    }
  };

  const categoryOptions = [...new Set(links.map(l => l.category).filter(Boolean))].map(c => ({ label: c, value: c }));

  const filteredLinks = links.filter(l => l.title?.toLowerCase().includes(linkSearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-blue-600 tracking-tight">Maulink.</h1>
        </div>
        <div className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('links')}
            className={clsx("w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors", activeTab === 'links' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-gray-50")}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
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
              onClick={() => setActiveTab('settings')}
              className={clsx("flex-1 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium", activeTab === 'settings' ? "bg-white shadow border border-gray-100" : "text-slate-500")}
            >Settings</button>
            <button onClick={logout} className="p-2 text-slate-500 shrink-0"><LogOut className="w-5 h-5" /></button>
          </div>

          {/* Profile Section (Left Column) */}
          <div className={clsx("lg:col-span-4", activeTab === 'settings' ? "hidden" : activeTab === 'profile' || window.innerWidth >= 1024 ? "block" : "hidden lg:block")}>
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

                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-xs font-medium text-slate-800 mb-3 uppercase tracking-wider">Socials</label>
                  {['instagram', 'facebook', 'x', 'linkedin'].map(net => (
                    <div key={net} className="flex flex-col mb-3">
                      <div className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                        <span className="bg-gray-50 px-3 py-2 text-xs text-slate-500 border-r border-gray-200 flex items-center min-w-[100px]">
                          {net}.com/
                        </span>
                        <input type="text" className="flex-1 px-3 py-2 text-sm focus:outline-none"
                          placeholder="username or link"
                          value={profileForm.socials[net]}
                          onChange={e => setProfileForm({
                            ...profileForm,
                            socials: { ...profileForm.socials, [net]: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  ))}
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
          <div className={clsx("lg:col-span-8", activeTab === 'settings' ? "hidden" : activeTab === 'links' || window.innerWidth >= 1024 ? "block" : "hidden lg:block")}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-lg font-bold text-slate-800">Your Links</h2>
                <button onClick={() => openLinkModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                  <Plus className="w-4 h-4" /> Add Link
                </button>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search existing links..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={linkSearch}
                  onChange={e => setLinkSearch(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                {filteredLinks.map(link => (
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
                      {link.price && <div className="text-xs font-semibold text-slate-500">{link.currency} {link.price}</div>}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {/* Toggle */}
                      <button
                        onClick={() => updateLink(link.id, { isVisible: !link.isVisible })}
                        className={clsx("w-10 h-5 rounded-full relative transition-colors", link.isVisible ? "bg-green-500" : "bg-gray-300")}
                      >
                        <div className={clsx("w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm", link.isVisible ? "left-6" : "left-0.5")} />
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
                {filteredLinks.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No links found. Create one!
                  </div>
                )}
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
          </div>

        </div>
      </div>

      {/* Toast Notification */}
      <Transition
        show={showProfileToast}
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
          <p className="font-bold text-slate-800 flex-1">Profile saved!</p>
          <button
            onClick={() => setShowProfileToast(false)}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
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
                onClick={() => {
                  if (linkToDelete) {
                    deleteLinkItem(linkToDelete.id);
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
    </div>
  );
}
