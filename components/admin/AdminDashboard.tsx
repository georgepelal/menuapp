import React, { useState, useEffect, useRef } from 'react';
import { AppState, MenuCategory, MenuItem, DietaryType, BusinessProfile, Language, ThemeTemplate, DIETARY_CONFIG, CustomerLead, ServiceRequest, CustomerFeedback } from '../../types';
import { generateMenuDescription, generateMenuImage, translateMenu, translateMenuItem, parseMenuFromImage, generateMarketingCopy } from '../../services/geminiService';
import { 
  Plus, Trash2, Edit2, Sparkles, Settings, 
  QrCode, Utensils, ImageIcon, X, Check, Menu, Upload, Globe, Languages as LanguagesIcon, LogOut,
  Eye, EyeOff, FileText, ChevronDown, Camera, Smartphone, Palette, Store, Megaphone, Zap,
  BarChart3, TrendingUp, Award, PieChart, Bell, Gift, MessageSquare, ClipboardList, Download, Timer, Star, User, Info, AlertTriangle
} from '../ui/Icons';
import { ToastContainer, ToastMessage, ToastType } from '../ui/Toast';

interface AdminDashboardProps {
  data: AppState;
  onUpdate: (newData: AppState) => void;
  onPreview: () => void;
  onLogout: () => void;
}

const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
];

const THEMES: {id: ThemeTemplate, name: string, desc: string, bg: string}[] = [
  { id: 'modern', name: 'Modern', desc: 'Clean cards with photos', bg: 'bg-gray-100' },
  { id: 'classic', name: 'Classic', desc: 'Elegant serif typography', bg: 'bg-[#fdfbf7]' },
  { id: 'minimal', name: 'Minimal', desc: 'Stark black & white', bg: 'bg-white border-2 border-gray-100' },
  { id: 'dark', name: 'Dark Mode', desc: 'Sleek dark theme', bg: 'bg-slate-900 text-white' },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ data, onUpdate, onPreview, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'settings' | 'design' | 'marketing' | 'insights' | 'crm' | 'operations' | 'account'>('menu');
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLang, setModalLang] = useState<string>(data.profile.primaryLanguage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<{email: string, name: string} | null>(null);
  
  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const session = localStorage.getItem('gourmet_qr_session');
    if (session) {
      setCurrentUser(JSON.parse(session));
    }
  }, []);
  
  // Bulk Upload State
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [csvData, setCsvData] = useState<{ headers: string[], rows: string[][] } | null>(null);
  const [columnMapping, setColumnMapping] = useState({ name: '', description: '', price: '', category: '' });
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Scan Menu State
  const [isScanMenuOpen, setIsScanMenuOpen] = useState(false);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);
  
  // AI State
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [aiPromptIngredients, setAiPromptIngredients] = useState('');
  
  // Marketing State
  const [promoInput, setPromoInput] = useState('');
  const [isGeneratingPromo, setIsGeneratingPromo] = useState(false);

  // Local state for categories to avoid full re-renders on simple inputs
  const [categories, setCategories] = useState<MenuCategory[]>(data.categories);
  const [items, setItems] = useState<MenuItem[]>(data.items);

  useEffect(() => {
    setCategories(data.categories);
    setItems(data.items);
  }, [data]);

  const updateProfile = (field: keyof BusinessProfile, value: any) => {
    onUpdate({
      ...data,
      profile: { ...data.profile, [field]: value }
    });
    addToast('success', 'Settings updated successfully');
  };

  // --- Menu Management ---

  const addCategory = () => {
    const newCat: MenuCategory = { id: Date.now().toString(), name: 'New Category', order: categories.length };
    const newCats = [...categories, newCat];
    setCategories(newCats);
    onUpdate({ ...data, categories: newCats });
    addToast('success', 'Category added');
  };

  const updateCategory = (id: string, name: string) => {
    const newCats = categories.map(c => c.id === id ? { ...c, name } : c);
    setCategories(newCats);
    onUpdate({ ...data, categories: newCats });
  };

  const deleteCategory = (id: string) => {
    if (confirm("Delete this category?")) {
      const newCats = categories.filter(c => c.id !== id);
      const newItems = items.filter(i => i.categoryId !== id);
      setCategories(newCats);
      setItems(newItems);
      onUpdate({ ...data, categories: newCats, items: newItems });
      addToast('info', 'Category deleted');
    }
  };

  const openItemModal = (categoryId: string, item?: MenuItem) => {
    setModalLang(data.profile.primaryLanguage);
    if (item) setEditingItem({ ...item });
    else setEditingItem({ id: Date.now().toString(), categoryId, name: '', description: '', price: 0, dietary: [], isAvailable: true, translations: {} });
    setAiPromptIngredients('');
    setIsModalOpen(true);
  };

  const saveItem = () => {
    if (!editingItem || !editingItem.name || !editingItem.categoryId) return;
    const newItem = editingItem as MenuItem;
    const existingIndex = items.findIndex(i => i.id === newItem.id);
    let newItems;
    if (existingIndex >= 0) {
      newItems = [...items];
      newItems[existingIndex] = newItem;
    } else {
      newItems = [...items, newItem];
    }
    setItems(newItems);
    onUpdate({ ...data, items: newItems });
    setIsModalOpen(false);
    setEditingItem(null);
    addToast('success', 'Item saved successfully');
  };

  const deleteItem = (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    onUpdate({ ...data, items: newItems });
    addToast('info', 'Item deleted');
  };

  const toggleAvailability = (item: MenuItem) => {
      const updatedItem = { ...item, isAvailable: !item.isAvailable };
      const newItems = items.map(i => i.id === item.id ? updatedItem : i);
      setItems(newItems);
      onUpdate({ ...data, items: newItems });
  };

  const handleModalFieldChange = (field: 'name' | 'description', value: string) => {
    if (!editingItem) return;
    if (modalLang === data.profile.primaryLanguage) {
      setEditingItem({ ...editingItem, [field]: value });
    } else {
      const currentTranslations = editingItem.translations || {};
      const langTrans = currentTranslations[modalLang] || { name: '', description: '' };
      setEditingItem({
        ...editingItem,
        translations: { ...currentTranslations, [modalLang]: { ...langTrans, [field]: value } }
      });
    }
  };

  const toggleDietary = (type: DietaryType) => {
    if (!editingItem) return;
    const current = editingItem.dietary || [];
    const newDietary = current.includes(type) 
      ? current.filter(t => t !== type)
      : [...current, type];
    setEditingItem({ ...editingItem, dietary: newDietary });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingItem) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingItem({ ...editingItem, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- AI Features ---

  const handleGenerateDescription = async () => {
    if (!editingItem || !editingItem.name) return;
    setIsGeneratingText(true);
    try {
      const desc = await generateMenuDescription(editingItem.name, aiPromptIngredients, 'fancy', modalLang === 'el' ? 'Greek' : 'English');
      handleModalFieldChange('description', desc);
      addToast('success', 'Description generated!');
    } catch (e) {
      addToast('error', 'Failed to generate description');
    }
    setIsGeneratingText(false);
  };

  const handleGenerateImage = async () => {
    if (!editingItem || !editingItem.name) return;
    setIsGeneratingImage(true);
    try {
      const img = await generateMenuImage(editingItem.name, editingItem.description || '');
      if (img) {
        setEditingItem({ ...editingItem, image: img });
        addToast('success', 'Image generated!');
      } else {
        addToast('error', 'Could not generate image');
      }
    } catch (e) {
      addToast('error', 'Failed to generate image');
    }
    setIsGeneratingImage(false);
  };

  const handleTranslateMenu = async (targetLang: string) => {
    if (confirm(`Translate entire menu to ${targetLang}? This may take a moment.`)) {
      setIsTranslating(true);
      try {
        const result = await translateMenu(categories, items, targetLang);
        
        // Merge translations
        const newItems = items.map(item => {
          const trans = result.items[item.id];
          if (trans) {
            return {
              ...item,
              translations: {
                ...item.translations,
                [targetLang]: { name: trans.name, description: trans.description }
              }
            };
          }
          return item;
        });

        setItems(newItems);
        onUpdate({ ...data, items: newItems });
        addToast('success', 'Translation complete!');
      } catch (e) {
        addToast('error', 'Translation failed');
      }
      setIsTranslating(false);
    }
  };

  const handleScanMenu = async () => {
    if (!scanImage) return;
    setIsScanning(true);
    const extracted = await parseMenuFromImage(scanImage);
    
    if (extracted.length > 0) {
      let newCats = [...categories];
      let newItems = [...items];
      
      extracted.forEach(cat => {
        const catId = Date.now().toString() + Math.random().toString().slice(2, 5);
        newCats.push({ id: catId, name: cat.categoryName, order: newCats.length });
        
        cat.items.forEach(item => {
          newItems.push({
            id: Date.now().toString() + Math.random().toString().slice(2, 5),
            categoryId: catId,
            name: item.name,
            description: item.description || '',
            price: item.price,
            dietary: (item.dietary || []) as DietaryType[],
            isAvailable: true,
            translations: {}
          });
        });
      });

      setCategories(newCats);
      setItems(newItems);
      onUpdate({ ...data, categories: newCats, items: newItems });
      setIsScanMenuOpen(false);
      setScanImage(null);
      addToast('success', `Imported ${extracted.length} categories!`);
    } else {
      addToast('error', "Could not extract menu. Try a clearer image.");
    }
    setIsScanning(false);
  };

  const handleScanImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setScanImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // --- Marketing ---

  const handleMarketingCopy = async () => {
    if (!promoInput) return;
    setIsGeneratingPromo(true);
    const copy = await generateMarketingCopy(promoInput, data.profile.primaryLanguage === 'el' ? 'Greek' : 'English');
    updateProfile('promotion', { 
      isActive: true, 
      title: copy.title, 
      description: copy.description, 
      type: 'special' 
    });
    setIsGeneratingPromo(false);
    addToast('success', 'Marketing banner created!');
  };

  // --- Operations & CRM ---

  const handleCompleteRequest = (reqId: string) => {
    const updatedRequests = data.serviceRequests?.map(r => 
      r.id === reqId ? { ...r, status: 'completed' as const } : r
    );
    onUpdate({ ...data, serviceRequests: updatedRequests });
    addToast('success', 'Request marked as completed');
  };

  const exportLeadsToCSV = () => {
    const leads = data.leads || [];
    if (leads.length === 0) return alert("No leads to export");
    
    const headers = "Name,Email,Date,Source\n";
    const rows = leads.map(l => 
      `"${l.name || ''}","${l.email}","${new Date(l.date).toLocaleDateString()}","${l.source}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${data.profile.name}.csv`;
    a.click();
  };

  // --- Renderers ---

  const renderContent = () => {
    switch (activeTab) {
      case 'menu':
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-slate-800">Menu Manager</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsScanMenuOpen(true)}
                  className="flex items-center gap-2 bg-purple-600 text-white border border-purple-700 px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <Camera size={18} /> Scan Photo
                </button>
                <button 
                  onClick={addCategory}
                  className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <Plus size={18} /> Category
                </button>
              </div>
            </div>

            <div className="space-y-8">
              {categories.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Utensils size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Start Your Menu</h3>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto">Create your first category manually or scan a photo of your physical menu to get started instantly.</p>
                  <div className="flex justify-center gap-3">
                    <button 
                      onClick={addCategory}
                      className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium"
                    >
                      Create Category
                    </button>
                    <button 
                      onClick={() => setIsScanMenuOpen(true)}
                      className="bg-purple-50 text-purple-600 border border-purple-200 px-6 py-2 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                    >
                      Scan Menu
                    </button>
                  </div>
                </div>
              ) : (
                categories.map((category) => (
                <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b border-gray-100 flex justify-between items-center">
                    <input 
                      className="bg-transparent font-bold text-lg text-slate-800 focus:outline-none focus:border-b-2 border-orange-500"
                      value={category.name}
                      onChange={(e) => updateCategory(category.id, e.target.value)}
                    />
                    <button 
                      onClick={() => deleteCategory(category.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {items.filter(item => item.categoryId === category.id).map(item => (
                      <div key={item.id} className={`flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-shadow group ${!item.isAvailable ? 'opacity-60 bg-gray-50' : ''}`}>
                          <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 relative">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className={`w-full h-full object-cover ${!item.isAvailable ? 'grayscale' : ''}`} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ImageIcon size={20} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <h4 className={`font-semibold ${!item.isAvailable ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{item.name}</h4>
                              <span className={`font-medium ${!item.isAvailable ? 'text-slate-400' : 'text-orange-600'}`}>{data.profile.currency}{item.price}</span>
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-1">{item.description}</p>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleAvailability(item); }}
                              className={`p-2 rounded-full ${item.isAvailable ? 'text-green-600 hover:bg-green-50' : 'text-slate-500 bg-slate-200 hover:bg-slate-300'}`}
                            >
                              {item.isAvailable ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                            <button 
                              onClick={() => openItemModal(category.id, item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => deleteItem(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                      </div>
                    ))}

                    <button 
                      onClick={() => openItemModal(category.id)}
                      className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-slate-400 font-medium hover:border-orange-200 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Add Item to {category.name}
                    </button>
                  </div>
                </div>
              )))}
            </div>
          </div>
        );

      case 'operations':
        const requests = data.serviceRequests || [];
        const pendingRequests = requests.filter(r => r.status === 'pending');
        const completedRequests = requests.filter(r => r.status === 'completed');
        return (
          <div className="max-w-4xl mx-auto space-y-6">
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                     <Bell size={24} className="text-orange-500" /> Live Service Requests
                   </h2>
                   <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm font-medium text-slate-600">Smart Waiter</span>
                      <div className="relative">
                         <input 
                           type="checkbox" 
                           className="sr-only peer"
                           checked={data.profile.enableSmartWaiter}
                           onChange={(e) => updateProfile('enableSmartWaiter', e.target.checked)}
                         />
                         <div className="w-10 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors"></div>
                         <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${data.profile.enableSmartWaiter ? 'translate-x-4' : ''}`}></div>
                      </div>
                   </label>
                </div>

                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12 bg-green-50 rounded-xl border border-green-100">
                     <Check size={48} className="mx-auto text-green-500 mb-2" />
                     <h3 className="text-lg font-bold text-green-800">All Caught Up!</h3>
                     <p className="text-green-600">No active requests from customers.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingRequests.map(req => (
                      <div key={req.id} className="bg-white border-l-4 border-orange-500 shadow-sm p-4 rounded-r-lg flex justify-between items-center animate-pulse">
                         <div>
                            <span className="text-xs font-bold uppercase text-orange-500 tracking-wider">Table {req.table || 'Unknown'}</span>
                            <h4 className="text-xl font-bold text-slate-800 capitalize">{req.type}</h4>
                            <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                               <Timer size={12} /> {Math.floor((Date.now() - req.timestamp) / 1000 / 60)} mins ago
                            </span>
                         </div>
                         <button 
                           onClick={() => handleCompleteRequest(req.id)}
                           className="bg-slate-100 hover:bg-green-100 hover:text-green-700 p-3 rounded-full transition-colors"
                         >
                           <Check size={24} />
                         </button>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        );

      case 'crm':
        const leads = data.leads || [];
        return (
          <div className="max-w-4xl mx-auto space-y-6">
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                   <div>
                      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Gift size={24} className="text-purple-500" /> Customer Leads (CRM)
                      </h2>
                      <p className="text-slate-500 text-sm">Manage captured emails and loyal customers.</p>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={exportLeadsToCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium text-sm">
                         <Download size={16} /> CSV Export
                      </button>
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-gray-200">
                         <span className="text-xs font-bold text-slate-600">Pop-up Active</span>
                         <div className="relative">
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              checked={data.profile.enableLeadCapture}
                              onChange={(e) => updateProfile('enableLeadCapture', e.target.checked)}
                            />
                            <div className="w-8 h-4 bg-gray-300 rounded-full peer-checked:bg-purple-500 transition-colors"></div>
                            <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${data.profile.enableLeadCapture ? 'translate-x-4' : ''}`}></div>
                         </div>
                      </label>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                   <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                      <p className="text-sm text-purple-800 font-medium">Total Leads</p>
                      <h3 className="text-3xl font-bold text-purple-900">{leads.length}</h3>
                   </div>
                   <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <p className="text-sm text-blue-800 font-medium">This Week</p>
                      <h3 className="text-3xl font-bold text-blue-900">{leads.filter(l => Date.now() - l.date < 7*24*60*60*1000).length}</h3>
                   </div>
                   <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <p className="text-sm text-green-800 font-medium">Conversion Rate</p>
                      <h3 className="text-3xl font-bold text-green-900">
                         {data.stats.totalViews > 0 ? Math.round((leads.length / data.stats.totalViews) * 100) : 0}%
                      </h3>
                   </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-slate-500 font-medium">
                         <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Source</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {leads.slice(0, 10).map(lead => (
                            <tr key={lead.id} className="hover:bg-gray-50">
                               <td className="px-4 py-3 text-slate-900 font-medium">{lead.name}</td>
                               <td className="px-4 py-3 text-slate-600">{lead.email}</td>
                               <td className="px-4 py-3 text-slate-500">{new Date(lead.date).toLocaleDateString()}</td>
                               <td className="px-4 py-3 text-xs uppercase text-slate-400">{lead.source}</td>
                            </tr>
                         ))}
                         {leads.length === 0 && (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No leads captured yet.</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        );

      case 'insights':
        const feedback = data.feedback || [];
        const avgRating = feedback.length > 0 
           ? (feedback.reduce((acc, curr) => acc + curr.rating, 0) / feedback.length).toFixed(1) 
           : '0.0';

        return (
          <div className="max-w-4xl mx-auto space-y-6">
             <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                   <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <BarChart3 size={20} className="text-blue-500"/> Performance
                   </h2>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="bg-blue-50 p-4 rounded-xl">
                        <span className="text-blue-600 text-sm font-bold">Views</span>
                        <h3 className="text-2xl font-bold text-slate-800">{data.stats.totalViews}</h3>
                     </div>
                     <div className="bg-orange-50 p-4 rounded-xl">
                        <span className="text-orange-600 text-sm font-bold">Interactions</span>
                        <h3 className="text-2xl font-bold text-slate-800">
                           {Object.values(data.stats.itemClicks).reduce((a: number, b: number) => a + b, 0)}
                        </h3>
                     </div>
                   </div>
                </div>

                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                   <div className="flex justify-between items-start mb-6">
                      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare size={20} className="text-yellow-500"/> Feedback
                      </h2>
                      <div className="text-right">
                         <h3 className="text-3xl font-bold text-slate-800">{avgRating}<span className="text-lg text-slate-400">/5</span></h3>
                         <p className="text-xs text-slate-400">{feedback.length} reviews</p>
                      </div>
                   </div>
                   
                   <div className="space-y-3">
                      {feedback.slice(0, 3).map(f => (
                         <div key={f.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                            <div className="flex gap-1 mb-1">
                               {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={12} className={i < f.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                               ))}
                            </div>
                            <p className="text-slate-600 italic">"{f.comment}"</p>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
             
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-slate-800 mb-4">Reputation Management</h3>
                <div className="flex items-center gap-4">
                   <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Google Maps Review Link</label>
                      <input 
                        placeholder="https://g.page/r/..."
                        value={data.profile.googleReviewUrl || ''}
                        onChange={(e) => updateProfile('googleReviewUrl', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <p className="text-xs text-slate-500 mt-1">If a customer rates 5 stars, we'll redirect them here to leave a public review.</p>
                   </div>
                   <label className="flex items-center gap-2 cursor-pointer mt-5">
                       <span className="text-sm font-bold text-slate-600">Active</span>
                       <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={data.profile.enableFeedback}
                            onChange={(e) => updateProfile('enableFeedback', e.target.checked)}
                          />
                          <div className="w-10 h-6 bg-gray-300 rounded-full peer-checked:bg-yellow-500 transition-colors"></div>
                          <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${data.profile.enableFeedback ? 'translate-x-4' : ''}`}></div>
                       </div>
                   </label>
                </div>
             </div>
          </div>
        );

      case 'settings':
        return (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Business Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                <input 
                  value={data.profile.name} 
                  onChange={(e) => updateProfile('name', e.target.value)} 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  value={data.profile.description} 
                  onChange={(e) => updateProfile('description', e.target.value)} 
                  className="w-full p-2 border border-gray-300 rounded-lg h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Currency Symbol</label>
                  <input 
                    value={data.profile.currency} 
                    onChange={(e) => updateProfile('currency', e.target.value)} 
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Primary Language</label>
                  <select 
                    value={data.profile.primaryLanguage} 
                    onChange={(e) => updateProfile('primaryLanguage', e.target.value)} 
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    {AVAILABLE_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <h3 className="font-bold text-slate-800 mb-3">Supported Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_LANGUAGES.map(lang => {
                    const isSelected = data.profile.languages.some(l => l.code === lang.code);
                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          const newLangs = isSelected 
                            ? data.profile.languages.filter(l => l.code !== lang.code)
                            : [...data.profile.languages, lang];
                          updateProfile('languages', newLangs);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${isSelected ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-gray-200'}`}
                      >
                        {lang.flag} {lang.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'design':
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Menu Design</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {THEMES.map(theme => (
                <div 
                  key={theme.id}
                  onClick={() => updateProfile('themeTemplate', theme.id)}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${data.profile.themeTemplate === theme.id ? 'border-orange-500 ring-4 ring-orange-500/10' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`h-32 rounded-lg mb-4 ${theme.bg} shadow-inner flex items-center justify-center`}>
                     <div className="text-center opacity-50">
                        <div className="w-16 h-2 bg-current rounded mb-2 mx-auto"></div>
                        <div className="w-10 h-2 bg-current rounded mx-auto"></div>
                     </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-800">{theme.name}</h3>
                      <p className="text-sm text-slate-500">{theme.desc}</p>
                    </div>
                    {data.profile.themeTemplate === theme.id && <Check className="text-orange-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'marketing':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
               <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                 <Megaphone className="text-pink-500" /> Marketing Banner
               </h2>
               <p className="text-slate-500 mb-6">Create a promotional banner that appears at the top of your menu.</p>
               
               <div className="space-y-4">
                  <div className="flex gap-2">
                    <input 
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="e.g. Happy Hour 5-7pm, Valentine's Special"
                      className="flex-1 p-2 border border-gray-300 rounded-lg"
                    />
                    <button 
                      onClick={handleMarketingCopy}
                      disabled={isGeneratingPromo}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isGeneratingPromo ? <Sparkles className="animate-spin" /> : <Sparkles />}
                    </button>
                  </div>

                  {data.profile.promotion && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                       <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold uppercase text-slate-400">Preview</span>
                          <button onClick={() => updateProfile('promotion', null)} className="text-red-500 text-xs hover:underline">Remove</button>
                       </div>
                       <h3 className="font-bold text-lg text-slate-800">{data.profile.promotion.title}</h3>
                       <p className="text-slate-600">{data.profile.promotion.description}</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
               <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <User className="text-blue-500" size={24} /> Account Profile
               </h2>
               
               <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                       <User size={40} />
                    </div>
                    <div>
                       <h3 className="font-bold text-lg text-slate-800">{currentUser?.name || 'User'}</h3>
                       <p className="text-slate-500">{currentUser?.email}</p>
                       <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Pro Plan Active</span>
                    </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                     <input 
                       value={currentUser?.email || ''} 
                       disabled
                       className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 text-slate-500"
                     />
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                     <h3 className="font-bold text-slate-800 mb-4">Security</h3>
                     <button className="text-blue-600 font-medium text-sm hover:underline">Change Password</button>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
               <h3 className="font-bold text-red-600 mb-2">Danger Zone</h3>
               <p className="text-sm text-slate-500 mb-4">Permanently delete your account and all data.</p>
               <button 
                 onClick={() => {
                   if(confirm('Are you sure? This cannot be undone.')) {
                     // In a real app, this would call an API
                     alert('Please contact support to delete your account.');
                   }
                 }}
                 className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
               >
                 Delete Account
               </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Store className="text-orange-500" size={24} />
          <h1 className="text-lg font-bold">GourmetQR</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white p-6 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:flex items-center gap-2 mb-8">
          <Store className="text-orange-500" size={24} />
          <h1 className="text-xl font-bold">GourmetQR</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button onClick={() => { setActiveTab('menu'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'menu' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Utensils size={18} /> Menu Manager
          </button>
          <button onClick={() => { setActiveTab('operations'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'operations' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Bell size={18} /> Operations
          </button>
          <button onClick={() => { setActiveTab('crm'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'crm' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Gift size={18} /> CRM & Leads
          </button>
           <button onClick={() => { setActiveTab('insights'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'insights' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <BarChart3 size={18} /> Insights
          </button>
          <button onClick={() => { setActiveTab('design'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'design' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Palette size={18} /> Design
          </button>
          <button onClick={() => { setActiveTab('marketing'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'marketing' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Megaphone size={18} /> Marketing
          </button>
          <button onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'settings' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Settings size={18} /> Settings
          </button>
          <button onClick={() => { setActiveTab('account'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'account' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <User size={18} /> Account
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-700 space-y-3">
           <button 
             onClick={onPreview}
             className="w-full bg-white text-slate-900 px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-gray-100 transition-colors"
           >
             <QrCode size={18} /> Preview & QR
           </button>
           <button onClick={onLogout} className="w-full text-slate-400 hover:text-white px-4 py-2 rounded-lg flex items-center gap-3 transition-colors text-sm">
             <LogOut size={16} /> Sign Out
           </button>
        </div>
      </aside>
      
      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8">
        {renderContent()}
      </main>

      {/* Item Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="text-xl font-bold text-slate-800">Edit Item</h3>
               <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
             </div>
             
             <div className="p-6 overflow-y-auto">
                <div className="flex gap-4 mb-6">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden group">
                    {editingItem.image ? (
                      <img src={editingItem.image} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-gray-400" size={32} />
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => fileInputRef.current?.click()} className="text-white text-xs font-bold flex flex-col items-center">
                          <Upload size={20} /> Change
                       </button>
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>
                  <div className="flex-1 space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                        <input 
                           value={editingItem.name} 
                           onChange={(e) => handleModalFieldChange('name', e.target.value)} 
                           className="w-full p-2 border border-gray-300 rounded" 
                           placeholder="Item Name"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price</label>
                        <input 
                           type="number"
                           value={editingItem.price} 
                           onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })} 
                           className="w-full p-2 border border-gray-300 rounded" 
                           placeholder="0.00"
                        />
                     </div>
                  </div>
                </div>

                <div className="mb-6">
                   <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase">Description</label>
                      <button 
                        onClick={handleGenerateDescription}
                        disabled={isGeneratingText || !editingItem.name}
                        className="text-xs text-purple-600 font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
                      >
                        <Sparkles size={12} /> {isGeneratingText ? 'Writing...' : 'Auto-Write'}
                      </button>
                   </div>
                   <textarea 
                      value={editingItem.description} 
                      onChange={(e) => handleModalFieldChange('description', e.target.value)} 
                      className="w-full p-2 border border-gray-300 rounded h-24 text-sm" 
                      placeholder="Describe the dish..."
                   />
                   <div className="flex gap-2 mt-2">
                      <input 
                        value={aiPromptIngredients}
                        onChange={(e) => setAiPromptIngredients(e.target.value)}
                        placeholder="Ingredients for AI (e.g. fresh basil, mozzarella)"
                        className="flex-1 p-2 border border-gray-200 rounded text-xs"
                      />
                      <button 
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || !editingItem.name}
                        className="bg-purple-50 text-purple-600 px-3 py-1 rounded text-xs font-bold border border-purple-100 hover:bg-purple-100 disabled:opacity-50"
                      >
                        {isGeneratingImage ? 'Generating...' : 'Generate Photo'}
                      </button>
                   </div>
                </div>

                <div className="mb-6">
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dietary</label>
                   <div className="flex flex-wrap gap-2">
                      {Object.values(DietaryType).map(type => (
                         <button
                           key={type}
                           onClick={() => toggleDietary(type)}
                           className={`px-3 py-1 rounded-full text-xs font-bold border ${
                             editingItem.dietary?.includes(type) 
                             ? 'bg-green-100 text-green-700 border-green-200' 
                             : 'bg-white text-slate-500 border-gray-200'
                           }`}
                         >
                           {DIETARY_CONFIG[type].icon} {DIETARY_CONFIG[type].label}
                         </button>
                      ))}
                   </div>
                </div>

                {/* Translation Section */}
                <div className="border-t border-gray-100 pt-4">
                   <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2"><Globe size={16} /> Translations</h4>
                      <select 
                        value={modalLang}
                        onChange={(e) => setModalLang(e.target.value)}
                        className="text-sm border border-gray-200 rounded p-1"
                      >
                        <option value={data.profile.primaryLanguage}>Primary ({data.profile.primaryLanguage})</option>
                        {data.profile.languages.filter(l => l.code !== data.profile.primaryLanguage).map(l => (
                           <option key={l.code} value={l.code}>{l.name}</option>
                        ))}
                      </select>
                   </div>
                   {modalLang !== data.profile.primaryLanguage && (
                      <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4">
                         Editing translation for <strong>{AVAILABLE_LANGUAGES.find(l => l.code === modalLang)?.name}</strong>.
                      </div>
                   )}
                </div>
             </div>

             <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded text-slate-600 font-medium hover:bg-gray-200">Cancel</button>
                <button onClick={saveItem} className="px-6 py-2 rounded bg-slate-900 text-white font-bold hover:bg-slate-800">Save Item</button>
             </div>
           </div>
        </div>
      )}

      {/* Scan Menu Modal */}
      {isScanMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Scan Menu from Photo</h3>
              <p className="text-slate-500 text-sm mb-6">Upload a clear photo of a menu page. Our AI will extract items, prices, and descriptions automatically.</p>
              
              <div 
                onClick={() => scanInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-orange-400 transition-colors mb-4"
              >
                 {scanImage ? (
                   <img src={scanImage} className="h-full w-full object-contain" />
                 ) : (
                   <>
                     <Camera size={32} className="text-slate-400 mb-2" />
                     <span className="text-slate-500 font-medium">Click to Upload Photo</span>
                   </>
                 )}
                 <input ref={scanInputRef} type="file" className="hidden" accept="image/*" onChange={handleScanImageUpload} />
              </div>

              <button 
                onClick={handleScanMenu}
                disabled={!scanImage || isScanning}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isScanning ? <Sparkles className="animate-spin" /> : <Sparkles />}
                {isScanning ? 'Analyzing...' : 'Extract Menu'}
              </button>
              <button onClick={() => setIsScanMenuOpen(false)} className="w-full mt-2 py-2 text-slate-500 font-medium">Cancel</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
