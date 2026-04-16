/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Edit2, 
  Trash2, 
  Folder, 
  FolderPlus,
  X,
  Check,
  LayoutGrid,
  RefreshCcw,
  Download,
  FileJson,
  Search,
  ArrowLeft,
  Table as TableIcon,
  Filter,
  ShoppingCart,
  Minus,
  Upload,
  QrCode,
  Menu,
  LogIn,
  LogOut,
  User as UserIcon,
  Layers,
  ShieldCheck,
  Package,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { onSnapshot, collection, doc, setDoc, updateDoc, deleteDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Category, Product, Characteristic } from './types';
import { initialCategories } from './initialData';
import { initialProducts } from './productsData';
import { db, auth, signInWithGoogle, logOut, handleFirestoreError, OperationType } from './firebase';

const STORAGE_KEY = 'catalog_categories';
const PRODUCTS_STORAGE_KEY = 'catalog_products_v2';
const ADMIN_EMAIL = 'monkedanik@gmail.com';

export const parseValueAndUnit = (val: string): { value: string, unit: string } => {
  if (!val) return { value: '', unit: '' };
  
  const units = [
    'pF', 'nF', 'uF', 'mF', 'F', 
    'R', 'k', 'M', 'Ohm', 'kOhm', 'MOhm',
    'V', 'kV', 'mV', 
    'A', 'mA', 'uA', 
    'W', 'mW', 'kW', 
    'Hz', 'kHz', 'MHz', 'GHz', 
    'uH', 'mH', 'H',
    'mm', 'cm', 'm',
    'g', 'kg', 'mg'
  ];
  
  units.sort((a, b) => b.length - a.length);

  let trimmed = val.trim();
  
  const shorthandRegex = /^(\d+)([kMRunpum])(\d+)$/i;
  const match = trimmed.match(shorthandRegex);
  if (match) {
    return { value: `${match[1]}.${match[3]}`, unit: match[2] };
  }

  for (const unit of units) {
    if (trimmed.endsWith(unit)) {
      const numPart = trimmed.slice(0, -unit.length).trim();
      if (/^-?\d+(?:[.,]\d+)?$/.test(numPart)) {
        return { value: numPart.replace(',', '.'), unit: unit };
      }
    }
  }

  return { value: val, unit: '' };
};

export const getAvailableQuantity = (product: Product): number => {
  const qtyChar = product.characteristics.find(c => c.name === 'Количество');
  if (!qtyChar) return 0;
  const num = parseFloat(qtyChar.value);
  return isNaN(num) ? 0 : num;
};

const ProductTable: React.FC<{ 
  category: Category; 
  products: Product[]; 
  cart: Record<string, number>;
  onAddToCart: (product: Product) => void;
  updateQuantity: (productId: string, delta: number) => void;
  setQuantity: (productId: string, qty: string | number) => void;
  removeFromCart: (productId: string) => void;
  onSelectCategory: (category: Category) => void;
  onBack: () => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onDeleteMultipleProducts: (ids: string[]) => void;
  onAddSubcategory: (name: string) => void;
  onViewProduct: (product: Product) => void;
  onImportProducts: (file: File) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onToggleSidebar?: () => void;
  canEdit?: boolean;
}> = ({ category, products, cart, onAddToCart, updateQuantity, setQuantity, removeFromCart, onSelectCategory, onBack, onAddProduct, onEditProduct, onDeleteProduct, onDeleteMultipleProducts, onAddSubcategory, onViewProduct, onImportProducts, onEditCategory, onDeleteCategory, onToggleSidebar, canEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [charFilters, setCharFilters] = useState<Record<string, { min?: string, max?: string, text?: string }>>({});
  const [charFilterTypes, setCharFilterTypes] = useState<Record<string, 'numeric' | 'text'>>(() => {
    try {
      const saved = localStorage.getItem('catalog_filter_types');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addAmounts, setAddAmounts] = useState<Record<string, string>>({});
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset delete mode when category changes
  useEffect(() => {
    setIsDeleteMode(false);
    setSelectedIds(new Set());
  }, [category.id]);
  
  let characteristicNames = Array.from(new Set(products.flatMap(p => p.characteristics.map(c => c.name))));
  if (characteristicNames.includes('Количество')) {
    characteristicNames = characteristicNames.filter(n => n !== 'Количество');
    characteristicNames.push('Количество');
  }

  const handleTypeChange = (charName: string, type: 'numeric' | 'text') => {
    setCharFilterTypes(prev => {
      const next = { ...prev, [charName]: type };
      localStorage.setItem('catalog_filter_types', JSON.stringify(next));
      return next;
    });
  };

  const parseNumber = (str: string) => {
    const match = str.replace(',', '.').match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : NaN;
  };

  const filteredProducts = products.filter(p => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    for (const [charName, filterObj] of Object.entries(charFilters)) {
      const filter = filterObj as { min?: string, max?: string, text?: string };
      const type = charFilterTypes[charName] || 'numeric';
      if (type === 'numeric' && !filter.min && !filter.max) continue;
      if (type === 'text' && !filter.text) continue;

      const char = p.characteristics.find(c => c.name === charName);
      if (!char) return false;

      if (type === 'text') {
        if (filter.text && !char.value.toLowerCase().includes(filter.text.toLowerCase())) {
          return false;
        }
      } else {
        if (filter.min || filter.max) {
          const val = parseNumber(char.value);
          if (isNaN(val)) return false;

          if (filter.min && val < parseFloat(filter.min)) return false;
          if (filter.max && val > parseFloat(filter.max)) return false;
        }
      }
    }

    return true;
  });

  const isRoot = !category.parentId;

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddSubcategory(newCategoryName.trim());
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 md:p-6 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button 
                onClick={onToggleSidebar}
                className="md:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Меню"
              >
                <Menu size={20} />
              </button>
            )}
            <button 
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Назад"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 truncate">{category.name}</h2>
                {canEdit && category.id !== 'search' && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button 
                      onClick={() => onEditCategory(category)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                      title="Редактировать категорию"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onDeleteCategory(category.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                      title="Удалить категорию"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs md:text-sm text-gray-500">Содержимое категории</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-4">
          {category.id !== 'search' && (
            <div className="relative flex-1 max-w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Поиск по названию товара..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
          {characteristicNames.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <Filter size={18} />
              <span className="text-sm font-medium">Фильтры</span>
              {Object.keys(charFilters).some(k => charFilters[k].min || charFilters[k].max || charFilters[k].text) && (
                <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-blue-600 rounded-full">
                  {Object.keys(charFilters).filter(k => charFilters[k].min || charFilters[k].max || charFilters[k].text).length}
                </span>
              )}
            </button>
          )}
        </div>

        {showFilters && characteristicNames.length > 0 && (
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Filter size={16} className="text-gray-500" />
                Фильтр по характеристикам:
              </div>
              <button 
                onClick={() => setCharFilters({})}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Сбросить все
              </button>
            </div>
            {characteristicNames.map(charName => {
              const filter = (charFilters[charName] || { min: '', max: '', text: '' }) as { min?: string, max?: string, text?: string };
              const type = charFilterTypes[charName] || 'numeric';
              return (
              <div key={charName} className="flex flex-col gap-1.5 bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-medium text-gray-600">{charName}</label>
                  <select 
                    value={type}
                    onChange={e => handleTypeChange(charName as string, e.target.value as any)}
                    className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1 py-0.5 text-gray-500 outline-none cursor-pointer"
                  >
                    <option value="numeric">Числа</option>
                    <option value="text">Текст</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  {type === 'text' ? (
                    <input 
                      type="text" 
                      placeholder="Поиск..." 
                      value={filter.text || ''}
                      onChange={e => setCharFilters(prev => ({ ...prev, [charName as string]: { ...(prev[charName as string] as any), text: e.target.value } }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <>
                      <input 
                        type="number" 
                        placeholder="От" 
                        value={filter.min || ''}
                        onChange={e => setCharFilters(prev => ({ ...prev, [charName as string]: { ...(prev[charName as string] as any), min: e.target.value } }))}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-gray-400">-</span>
                      <input 
                        type="number" 
                        placeholder="До" 
                        value={filter.max || ''}
                        onChange={e => setCharFilters(prev => ({ ...prev, [charName as string]: { ...(prev[charName as string] as any), max: e.target.value } }))}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800">Подкатегории</h3>
              {canEdit && (
                <button 
                  onClick={() => {
                    setIsAddingCategory(true);
                    setNewCategoryName('');
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <FolderPlus size={16} />
                  <span>Добавить категорию</span>
                </button>
              )}
            </div>
            {category.subcategories.length > 0 || isAddingCategory ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.subcategories.map(sub => (
                  <div 
                    key={sub.id}
                    onClick={() => onSelectCategory(sub)}
                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all flex items-center gap-3 group"
                  >
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Folder size={20} />
                    </div>
                    <span className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors">{sub.name}</span>
                  </div>
                ))}
                {isAddingCategory && (
                  <div className="bg-white p-4 rounded-xl border border-blue-300 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Folder size={20} />
                    </div>
                    <input 
                      autoFocus
                      type="text"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddCategory();
                        if (e.key === 'Escape') setIsAddingCategory(false);
                      }}
                      onBlur={() => {
                        if (!newCategoryName.trim()) setIsAddingCategory(false);
                      }}
                      placeholder="Название..."
                      className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-800"
                    />
                    <button onClick={handleAddCategory} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check size={16} /></button>
                    <button onClick={() => setIsAddingCategory(false)} className="text-gray-400 hover:bg-gray-50 p-1 rounded"><X size={16} /></button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 bg-white p-4 rounded-xl border border-gray-200 border-dashed text-center">
                В этой категории пока нет подкатегорий
              </div>
            )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800">Товары</h3>
            <div className="flex items-center gap-2">
              {canEdit && (
                <label className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                  <Upload size={16} />
                  <span className="hidden sm:inline">Загрузить CSV</span>
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        onImportProducts(e.target.files[0]);
                        e.target.value = '';
                      }
                    }} 
                  />
                </label>
              )}
              
              {canEdit && (isDeleteMode ? (
                <>
                  <button 
                    onClick={() => {
                      setIsDeleteMode(false);
                      setSelectedIds(new Set());
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
                  >
                    Отмена
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedIds.size > 0) {
                        onDeleteMultipleProducts(Array.from(selectedIds));
                        setIsDeleteMode(false);
                        setSelectedIds(new Set());
                      } else {
                        // If nothing selected, delete all filtered
                        onDeleteMultipleProducts(filteredProducts.map(p => p.id));
                        setIsDeleteMode(false);
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">
                      {selectedIds.size > 0 ? `Удалить (${selectedIds.size})` : 'Удалить все'}
                    </span>
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsDeleteMode(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                  title="Удалить товары"
                >
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Очистить</span>
                </button>
              ))}

              {canEdit && (
                <button 
                  onClick={onAddProduct}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus size={16} />
                  <span>Добавить товар</span>
                </button>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {isDeleteMode && (
                      <th className="px-4 py-3 w-12 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(new Set(filteredProducts.map(p => p.id)));
                            } else {
                              setSelectedIds(new Set());
                            }
                          }}
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/3">Название</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">Место</th>
                    {characteristicNames.map(name => (
                      <th key={name} className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider truncate" title={name}>{name}</th>
                    ))}
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right w-32">В корзину</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map(product => (
                    <tr 
                      key={product.id} 
                      onClick={(e) => {
                        if (isDeleteMode) {
                          e.stopPropagation();
                          const newSet = new Set(selectedIds);
                          if (newSet.has(product.id)) {
                            newSet.delete(product.id);
                          } else {
                            newSet.add(product.id);
                          }
                          setSelectedIds(newSet);
                        } else {
                          onViewProduct(product);
                        }
                      }}
                      className={`hover:bg-blue-50/50 transition-colors group cursor-pointer ${selectedIds.has(product.id) ? 'bg-blue-50' : ''}`}
                    >
                      {isDeleteMode && (
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            checked={selectedIds.has(product.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedIds);
                              if (e.target.checked) {
                                newSet.add(product.id);
                              } else {
                                newSet.delete(product.id);
                              }
                              setSelectedIds(newSet);
                            }}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium text-gray-900 truncate" title={product.name}>
                        <div className="flex items-center gap-3 truncate">
                          {product.imageUrl && (
                            <img src={product.imageUrl} alt={product.name} className="w-8 h-8 object-cover rounded border border-gray-200 flex-shrink-0" />
                          )}
                          <span className="truncate">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 truncate" title={product.location || '-'}>
                        {product.location || '-'}
                      </td>
                      {characteristicNames.map(name => {
                        const char = product.characteristics.find(c => c.name === name);
                        let displayValue = char ? `${char.value}${char.unit ? ' ' + char.unit : ''}` : '-';
                        
                        if (name === 'Количество' && char) {
                          const total = parseFloat(char.value) || 0;
                          const inCart = cart[product.id] || 0;
                          const remaining = Math.max(0, total - inCart);
                          displayValue = `${remaining}${char.unit ? ' ' + char.unit : ''}`;
                        }
                        
                        return (
                          <td key={name} className="px-4 py-3 text-sm text-gray-600 truncate" title={displayValue}>
                            {displayValue}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <input 
                            type="number"
                            min="1"
                            max={getAvailableQuantity(product)}
                            value={cart[product.id] > 0 ? (cart[product.id] || '') : (addAmounts[product.id] !== undefined ? addAmounts[product.id] : '1')}
                            onChange={(e) => {
                              if (cart[product.id] > 0) {
                                setQuantity(product.id, e.target.value);
                              } else {
                                setAddAmounts(prev => ({ ...prev, [product.id]: e.target.value }));
                              }
                            }}
                            onBlur={() => {
                              if (cart[product.id] === 0) removeFromCart(product.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 p-1 text-sm border border-gray-300 rounded-md outline-none focus:border-blue-500 text-center"
                          />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (cart[product.id] > 0) {
                                removeFromCart(product.id);
                              } else {
                                const qty = parseInt(addAmounts[product.id] !== undefined ? addAmounts[product.id] : '1') || 1;
                                const available = getAvailableQuantity(product);
                                const toAdd = Math.min(qty, available);
                                if (toAdd > 0) {
                                  updateQuantity(product.id, toAdd);
                                }
                              }
                            }}
                            disabled={getAvailableQuantity(product) <= 0 && !(cart[product.id] > 0)}
                            className={`p-1.5 text-white ${cart[product.id] > 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-blue-600`}
                            title={cart[product.id] > 0 ? "Удалить из корзины" : "Добавить в корзину"}
                          >
                            {cart[product.id] > 0 ? <Check size={16} /> : <ShoppingCart size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={characteristicNames.length + 2} className="px-4 py-8 text-center text-gray-500">
                        В этой категории пока нет товаров
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'>) => void;
  product?: Product | null;
  category?: Category | null;
  allCategories: Category[];
  templateCharacteristics?: string[];
  allCharacteristicNames?: string[];
}> = ({ isOpen, onClose, onSave, product, category, allCategories, templateCharacteristics, allCharacteristicNames = [] }) => {
  const [name, setName] = useState(product?.name || '');
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
  const [location, setLocation] = useState(product?.location || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(product?.categoryId || category?.id || '');
  const [characteristics, setCharacteristics] = useState<Characteristic[]>(
    product?.characteristics || []
  );

  const flatCategories = React.useMemo(() => {
    const flatten = (cats: Category[], level = 0): { id: string, name: string, level: number }[] => {
      let result: { id: string, name: string, level: number }[] = [];
      cats.forEach(cat => {
        result.push({ id: cat.id, name: cat.name, level });
        if (cat.subcategories && cat.subcategories.length > 0) {
          result = result.concat(flatten(cat.subcategories, level + 1));
        }
      });
      return result;
    };
    return flatten(allCategories);
  }, [allCategories]);

  useEffect(() => {
    if (isOpen) {
      setName(product?.name || '');
      setImageUrl(product?.imageUrl || '');
      setLocation(product?.location || '');
      setSelectedCategoryId(product?.categoryId || category?.id || '');
      
      let initialChars: Characteristic[] = [];
      if (product) {
        initialChars = [...product.characteristics];
      } else if (templateCharacteristics && templateCharacteristics.length > 0) {
        initialChars = templateCharacteristics.map(name => ({ name, value: '' }));
      }

      const existingNames = new Set(initialChars.map(c => c.name));
      
      if (product && templateCharacteristics) {
        templateCharacteristics.forEach(name => {
          if (!existingNames.has(name)) {
            initialChars.push({ name, value: '' });
            existingNames.add(name);
          }
        });
      }

      if (!existingNames.has('Количество')) {
        initialChars.push({ name: 'Количество', value: '0', unit: 'шт' });
      }

      initialChars.sort((a, b) => {
        if (a.name === 'Количество') return 1;
        if (b.name === 'Количество') return -1;
        return 0;
      });

      setCharacteristics(initialChars);
    }
  }, [isOpen, product, category, templateCharacteristics]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      alert('Пожалуйста, выберите категорию');
      return;
    }
    onSave({
      categoryId: selectedCategoryId,
      name,
      imageUrl,
      location,
      characteristics: characteristics.filter(c => c.name.trim() !== '')
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateCharacteristic = (index: number, field: 'name' | 'value' | 'unit', val: string) => {
    const newChars = [...characteristics];
    if (field === 'name' && newChars[index].name === 'Количество') return;
    newChars[index][field] = val;
    setCharacteristics(newChars);
  };

  const addCharacteristic = () => {
    const newChars = [...characteristics];
    const qtyIndex = newChars.findIndex(c => c.name === 'Количество');
    if (qtyIndex !== -1) {
      newChars.splice(qtyIndex, 0, { name: '', value: '' });
      setCharacteristics(newChars);
    } else {
      setCharacteristics([...characteristics, { name: '', value: '' }]);
    }
  };

  const removeCharacteristic = (index: number) => {
    if (characteristics[index].name === 'Количество') return;
    setCharacteristics(characteristics.filter((_, i) => i !== index));
  };

  const moveCharacteristic = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === characteristics.length - 1) return;

    const newChars = [...characteristics];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newChars[index].name === 'Количество' || newChars[swapIndex].name === 'Количество') return;

    [newChars[index], newChars[swapIndex]] = [newChars[swapIndex], newChars[index]];
    setCharacteristics(newChars);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <datalist id="units-list">
          {/* Общие */}
          <option value="шт" />
          <option value="упак" />
          <option value="компл" />
          {/* Масса */}
          <option value="кг" />
          <option value="г" />
          <option value="мг" />
          <option value="т" />
          {/* Длина, площадь, объем */}
          <option value="м" />
          <option value="см" />
          <option value="мм" />
          <option value="м²" />
          <option value="м³" />
          <option value="л" />
          <option value="мл" />
          {/* Электричество */}
          <option value="В" />
          <option value="мВ" />
          <option value="кВ" />
          <option value="А" />
          <option value="мА" />
          <option value="мкА" />
          <option value="мАч" />
          <option value="Ач" />
          <option value="Вт" />
          <option value="мВт" />
          <option value="кВт" />
          <option value="Ом" />
          <option value="кОм" />
          <option value="МОм" />
          <option value="Ф" />
          <option value="мкФ" />
          <option value="нФ" />
          <option value="пФ" />
          <option value="Гн" />
          <option value="мГн" />
          <option value="мкГн" />
          {/* Частота */}
          <option value="Гц" />
          <option value="кГц" />
          <option value="МГц" />
          <option value="ГГц" />
          {/* Акустика и сигнал */}
          <option value="дБ" />
          <option value="дБм" />
          <option value="дБА" />
          {/* Температура */}
          <option value="°C" />
          <option value="K" />
          <option value="°F" />
          {/* Время и скорость */}
          <option value="с" />
          <option value="мс" />
          <option value="мин" />
          <option value="ч" />
          <option value="м/с" />
          <option value="км/ч" />
          <option value="об/мин" />
          {/* Давление и сила */}
          <option value="Па" />
          <option value="кПа" />
          <option value="МПа" />
          <option value="бар" />
          <option value="атм" />
          <option value="Н" />
          {/* Энергия */}
          <option value="Дж" />
          <option value="кДж" />
          {/* Свет */}
          <option value="лм" />
          <option value="лк" />
          <option value="кд" />
          {/* Данные */}
          <option value="Б" />
          <option value="КБ" />
          <option value="МБ" />
          <option value="ГБ" />
          <option value="ТБ" />
          <option value="бит" />
          <option value="Кбит" />
          <option value="Мбит" />
          <option value="Гбит" />
          {/* Английские / Международные */}
          <option value="V" />
          <option value="kV" />
          <option value="mV" />
          <option value="A" />
          <option value="mA" />
          <option value="uA" />
          <option value="W" />
          <option value="mW" />
          <option value="kW" />
          <option value="R" />
          <option value="k" />
          <option value="M" />
          <option value="Ohm" />
          <option value="kOhm" />
          <option value="MOhm" />
          <option value="F" />
          <option value="mF" />
          <option value="uF" />
          <option value="nF" />
          <option value="pF" />
          <option value="H" />
          <option value="mH" />
          <option value="uH" />
          <option value="Hz" />
          <option value="kHz" />
          <option value="MHz" />
          <option value="GHz" />
        </datalist>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {product ? 'Редактировать товар' : 'Добавить товар'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
              <select 
                value={selectedCategoryId} 
                onChange={e => setSelectedCategoryId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                required
              >
                <option value="">Выберите категорию...</option>
                {flatCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {'\u00A0'.repeat(cat.level * 4)}{cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
              <input type="text" value={name} onChange={e => setName(e.target.value.toUpperCase())} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Местоположение</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Например: Стеллаж 1, Полка 2" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Изображение</label>
              <div className="flex items-center gap-4">
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                )}
                <div className="flex-1">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload} 
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">или укажите ссылку:</span>
                    <input 
                      type="url" 
                      value={imageUrl} 
                      onChange={e => setImageUrl(e.target.value)} 
                      placeholder="https://..." 
                      className="flex-1 p-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Характеристики</label>
                <button type="button" onClick={addCharacteristic} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <Plus size={16} /> Добавить
                </button>
              </div>
              <div className="space-y-2">
                {characteristics.map((char, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      placeholder="Название" 
                      value={char.name} 
                      readOnly={char.name === 'Количество'}
                      onChange={e => updateCharacteristic(index, 'name', e.target.value)} 
                      className={`flex-[2] p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${char.name === 'Количество' ? 'bg-gray-100 text-gray-600 font-medium' : ''}`} 
                      list="char-names-list"
                    />
                    <input 
                      type="text" 
                      placeholder="Значение" 
                      value={char.value} 
                      onChange={e => updateCharacteristic(index, 'value', e.target.value)} 
                      className="flex-[2] p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                    {char.name === 'Количество' ? (
                      <div className="flex-[1]"></div>
                    ) : (
                      <input 
                        type="text" 
                        placeholder="Ед. изм." 
                        value={char.unit || ''} 
                        onChange={e => updateCharacteristic(index, 'unit', e.target.value)} 
                        className="flex-[1] p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        list="units-list"
                      />
                    )}
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => moveCharacteristic(index, 'up')} 
                        disabled={index === 0}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                        title="Вверх"
                      >
                        <ChevronUp size={18} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => moveCharacteristic(index, 'down')} 
                        disabled={index === characteristics.length - 1}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                        title="Вниз"
                      >
                        <ChevronDown size={18} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => removeCharacteristic(index)} 
                        disabled={char.name === 'Количество'}
                        className={`p-1.5 rounded-lg transition-colors ${char.name === 'Количество' ? 'text-gray-300' : 'text-red-500 hover:bg-red-50'}`}
                        title="Удалить"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Отмена</button>
          <button type="submit" form="product-form" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Сохранить</button>
        </div>
      </div>
    </div>
  );
};

const ProductViewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  cart: Record<string, number>;
  onAddToCart: (product: Product) => void;
  updateQuantity: (productId: string, delta: number) => void;
  setQuantity: (productId: string, qty: string | number) => void;
  removeFromCart: (productId: string) => void;
  canEdit?: boolean;
}> = ({ isOpen, onClose, product, onEdit, onDelete, cart, onAddToCart, updateQuantity, setQuantity, removeFromCart, canEdit }) => {
  const [addAmount, setAddAmount] = useState<string>('1');

  if (!isOpen || !product) return null;

  const available = getAvailableQuantity(product);
  const inCart = cart[product.id] || 0;
  const remaining = Math.max(0, available - inCart);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 border-b border-gray-200 gap-4">
          <h3 className="text-xl font-semibold text-gray-900">Просмотр товара</h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 mr-0 md:mr-2">
              <input 
                type="number"
                min="1"
                max={available}
                value={inCart > 0 ? (inCart || '') : addAmount}
                onChange={(e) => {
                  if (inCart > 0) {
                    setQuantity(product.id, e.target.value);
                  } else {
                    setAddAmount(e.target.value);
                  }
                }}
                onBlur={() => {
                  if (inCart === 0) removeFromCart(product.id);
                }}
                className="w-16 p-1.5 text-sm border border-gray-300 rounded-md outline-none focus:border-blue-500 text-center"
              />
              <button 
                onClick={() => {
                  if (inCart > 0) {
                    removeFromCart(product.id);
                  } else {
                    const qty = parseInt(addAmount) || 1;
                    const toAdd = Math.min(qty, available);
                    if (toAdd > 0) {
                      updateQuantity(product.id, toAdd);
                    }
                  }
                }}
                disabled={available <= 0 && !(inCart > 0)}
                className={`px-3 py-1.5 text-sm font-medium text-white ${inCart > 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} disabled:bg-gray-300 disabled:text-gray-500 rounded-lg transition-colors flex items-center gap-1.5`}
                title={inCart > 0 ? "Удалить из корзины" : "Добавить в корзину"}
              >
                {inCart > 0 ? <Check size={16} /> : <ShoppingCart size={16} />}
                <span className="hidden sm:inline">{inCart > 0 ? 'В корзине' : 'В корзину'}</span>
              </button>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              {canEdit && (
                <>
                  <button 
                    onClick={() => { onClose(); onEdit(product); }} 
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Редактировать"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button 
                    onClick={() => { onClose(); onDelete(product.id); }} 
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <Trash2 size={20} />
                  </button>
                </>
              )}
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-col md:flex-row gap-6">
            {product.imageUrl && (
              <div className="w-full md:w-1/3 flex-shrink-0">
                <img src={product.imageUrl} alt={product.name} className="w-full h-auto object-contain rounded-lg border border-gray-200 shadow-sm" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{product.name}</h2>
              
              <div className="mb-6 flex items-start gap-6">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Местоположение</h4>
                  <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {product.location || 'Не указано'}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">QR-код</h4>
                  <div className="p-3 bg-white rounded-xl border-2 border-gray-100 shadow-sm">
                    <QRCodeSVG value={product.id} size={160} level="H" />
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">{product.id}</p>
                </div>
              </div>

              {product.characteristics.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Характеристики</h4>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <tbody className="divide-y divide-gray-200">
                        {product.characteristics.map((char, idx) => {
                          let displayValue = char.value;
                          if (char.name === 'Количество') {
                            const total = parseFloat(char.value) || 0;
                            const inCartQty = cart[product.id] || 0;
                            displayValue = Math.max(0, total - inCartQty).toString();
                          }
                          return (
                            <tr key={idx} className="hover:bg-gray-100/50 transition-colors">
                              <th className="px-4 py-3 font-medium text-gray-700 w-1/2">{char.name}</th>
                              <td className="px-4 py-3 text-gray-600">{displayValue}{char.unit ? ` ${char.unit}` : ''}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">Нет характеристик</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  cart: Record<string, number>;
  products: Product[];
  updateQuantity: (productId: string, delta: number) => void;
  setQuantity: (productId: string, qty: string | number) => void;
  removeFromCart: (productId: string) => void;
  onCheckout: () => void;
}> = ({ isOpen, onClose, cart, products, updateQuantity, setQuantity, removeFromCart, onCheckout }) => {
  if (!isOpen) return null;

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const product = products.find(p => p.id === id);
    const quantity = qty as number;
    return { product, qty: quantity };
  }).filter((item): item is { product: Product, qty: number } => !!item.product && item.qty > 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Корзина</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {cartItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Корзина пуста</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map(({ product, qty }) => (
                <div key={product!.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-4">
                    {product!.imageUrl ? (
                      <img src={product!.imageUrl} alt={product!.name} className="w-16 h-16 object-cover rounded-md border border-gray-200 flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 flex-shrink-0">
                        <LayoutGrid size={24} />
                      </div>
                    )}
                    <div className="flex-1 sm:hidden">
                      <h4 className="font-medium text-gray-900 line-clamp-2">{product!.name}</h4>
                      <p className="text-sm text-gray-500">В наличии: {getAvailableQuantity(product!)}</p>
                    </div>
                  </div>
                  <div className="hidden sm:block flex-1">
                    <h4 className="font-medium text-gray-900 line-clamp-2">{product!.name}</h4>
                    <p className="text-sm text-gray-500">В наличии: {getAvailableQuantity(product!)}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
                      <button onClick={() => updateQuantity(product!.id, -1)} className="p-2 hover:bg-gray-100 text-gray-600 transition-colors"><Minus size={16} /></button>
                      <input 
                        type="number"
                        value={qty || ''}
                        onChange={(e) => setQuantity(product!.id, e.target.value)}
                        onBlur={() => { if (qty === 0) removeFromCart(product!.id); }}
                        className="w-12 text-center font-medium text-gray-900 border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button onClick={() => updateQuantity(product!.id, 1)} disabled={qty >= getAvailableQuantity(product!)} className="p-2 hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:hover:bg-white transition-colors"><Plus size={16} /></button>
                    </div>
                    <button onClick={() => removeFromCart(product!.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Удалить"><Trash2 size={20} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Продолжить покупки</button>
            <button onClick={onCheckout} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Оформить заказ</button>
          </div>
        )}
      </div>
    </div>
  );
};

const QRScannerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}> = ({ isOpen, onClose, onScan }) => {
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!isOpen) return;

    const html5QrCode = new Html5Qrcode("qr-reader");
    let isComponentMounted = true;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (isComponentMounted) {
              isComponentMounted = false;
              
              // Visual feedback
              const reader = document.getElementById('qr-reader');
              if (reader) {
                reader.style.borderColor = '#10b981'; // Green
                reader.style.boxShadow = '0 0 20px #10b981';
              }

              onScanRef.current(decodedText);
            }
          },
          (errorMessage) => {
            // ignore errors
          }
        );
        
        // If the component unmounted while we were starting the scanner, stop it immediately
        if (!isComponentMounted) {
          html5QrCode.stop().catch(() => {});
        }
      } catch (err) {
        console.error("Error starting scanner", err);
      }
    };

    startScanner();

    return () => {
      isComponentMounted = false;
      try {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch(() => {});
      } catch (e) {}
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Сканировать QR-код</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 flex flex-col items-center bg-gray-100 relative">
          <div id="qr-reader" className="w-full max-w-[300px] rounded-lg overflow-hidden shadow-inner bg-black border-4 border-blue-500"></div>
          <p className="text-sm text-gray-600 mt-4 text-center font-medium">Наведите камеру на QR-код товара</p>
          <p className="text-xs text-gray-400 mt-1 text-center">Держите телефон параллельно экрану</p>
          
          <div className="mt-6 w-full border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 mb-2 text-center">Не удается отсканировать?</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Введите ID товара вручную" 
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onScan((e.target as HTMLInputElement).value);
                  }
                }}
              />
              <button 
                onClick={(e) => {
                  const input = (e.currentTarget.previousSibling as HTMLInputElement);
                  onScan(input.value);
                }}
                className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                ОК
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isComputer, setIsComputer] = useState(window.innerWidth >= 768);
  const [isGuest, setIsGuest] = useState(false);
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordMode, setPasswordMode] = useState<'verify' | 'setup'>('verify');
  const [passwordInput, setPasswordInput] = useState('');
  
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddingRoot, setIsAddingRoot] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [productsToDeleteBulk, setProductsToDeleteBulk] = useState<string[] | null>(null);
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [initialProductHandled, setInitialProductHandled] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const isSigningInRef = useRef(false);

  const isAdmin = user?.email === ADMIN_EMAIL;
  const isCollector = isGuest;
  const canEdit = isAdmin && isPasswordVerified;
  const isAuthenticated = !!user || isGuest;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsComputer(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        setIsGuest(false);
      } else {
        setIsPasswordVerified(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Admin Password
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'admin'), (docSnap) => {
      if (docSnap.exists()) {
        setAdminPassword(docSnap.data().password || null);
      } else {
        setAdminPassword(null);
      }
    });
    return () => unsub();
  }, []);

  // Trigger password modal when admin logs in
  useEffect(() => {
    if (isAdmin && !isPasswordVerified) {
      if (adminPassword === null) {
        setPasswordMode('setup');
        setIsPasswordModalOpen(true);
      } else {
        setPasswordMode('verify');
        setIsPasswordModalOpen(true);
      }
    }
  }, [isAdmin, isPasswordVerified, adminPassword]);

  // Firebase Real-time Sync
  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const cats: Category[] = [];
      snapshot.forEach((doc) => cats.push(doc.data() as Category));
      
      // Reconstruct tree structure and sort by order
      const buildTree = (list: Category[], parentId: string | null = null): Category[] => {
        return list
          .filter(c => (c.parentId || null) === parentId)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map(c => ({
            ...c,
            subcategories: buildTree(list, c.id)
          }));
      };
      
      const tree = buildTree(cats, null);
      if (tree.length > 0) {
        setCategories(tree);
      } else if (cats.length === 0) {
        setCategories([]);
      } else {
        // Fallback for flat list
        setCategories(cats.filter(c => !c.parentId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      }
    }, (error) => {
      console.error("Error syncing categories:", error);
    });

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((doc) => prods.push(doc.data() as Product));
      // Sort products by order
      setProducts(prods.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    }, (error) => {
      console.error("Error syncing products:", error);
    });

    return () => {
      unsubCats();
      unsubProducts();
    };
  }, []);

  // Seed initial data if DB is empty (only for admin)
  useEffect(() => {
    if (canEdit && categories.length === 0 && products.length === 0) {
      const seedData = async () => {
        try {
          const batch = writeBatch(db);
          
          const flattenCategories = (cats: Category[], parentId: string | null = null): any[] => {
            let flat: any[] = [];
            cats.forEach((c, index) => {
              flat.push({ id: c.id, name: c.name, parentId: parentId, order: index });
              if (c.subcategories && c.subcategories.length > 0) {
                flat = [...flat, ...flattenCategories(c.subcategories, c.id)];
              }
            });
            return flat;
          };

          const flatCats = flattenCategories(initialCategories);
          flatCats.forEach(c => {
            const ref = doc(db, 'categories', c.id);
            batch.set(ref, { ...c, subcategories: [] });
          });

          initialProducts.forEach((p, index) => {
            const ref = doc(db, 'products', p.id);
            batch.set(ref, { ...p, order: index });
          });

          await batch.commit();
          showToast('База данных инициализирована начальными данными', 'success');
        } catch (error) {
          console.error("Error seeding data:", error);
          handleFirestoreError(error, OperationType.WRITE, 'initial_seed');
        }
      };
      seedData();
    }
  }, [canEdit, categories.length, products.length]);

  const handleDeduplicateCategories = async () => {
    if (!canEdit) return;
    
    try {
      showToast('Поиск и удаление дубликатов...', 'success');
      
      // Get all categories from Firestore to be sure we have everything
      const snapshot = await getDocs(collection(db, 'categories'));
      const allCats: Category[] = [];
      snapshot.forEach(doc => allCats.push(doc.data() as Category));
      
      const groups: Record<string, Category[]> = {};
      allCats.forEach(cat => {
        const key = `${cat.parentId || 'root'}:${cat.name.trim().toLowerCase()}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(cat);
      });
      
      const toDelete: string[] = [];
      const productMoves: { from: string, to: string }[] = [];
      const categoryMoves: { from: string, to: string }[] = [];
      
      for (const key in groups) {
        const group = groups[key];
        if (group.length > 1) {
          // Keep the first one, merge others into it
          const keep = group[0];
          for (let i = 1; i < group.length; i++) {
            const duplicate = group[i];
            toDelete.push(duplicate.id);
            
            // Collect moves for products
            productMoves.push({ from: duplicate.id, to: keep.id });
            
            // Collect moves for subcategories
            allCats.forEach(c => {
              if (c.parentId === duplicate.id) {
                categoryMoves.push({ from: duplicate.id, to: keep.id });
              }
            });
          }
        }
      }
      
      if (toDelete.length === 0) {
        showToast('Дубликатов не обнаружено', 'success');
        return;
      }
      
      const batch = writeBatch(db);
      
      // Delete duplicates
      toDelete.forEach(id => {
        batch.delete(doc(db, 'categories', id));
      });
      
      // Move subcategories
      const subSnapshot = await getDocs(collection(db, 'categories'));
      subSnapshot.forEach(d => {
        const cat = d.data() as Category;
        const move = categoryMoves.find(m => m.from === cat.parentId);
        if (move) {
          batch.update(d.ref, { parentId: move.to });
        }
      });
      
      // Move products
      const prodSnapshot = await getDocs(collection(db, 'products'));
      prodSnapshot.forEach(d => {
        const prod = d.data() as Product;
        const move = productMoves.find(m => m.from === prod.categoryId);
        if (move) {
          batch.update(d.ref, { categoryId: move.to });
        }
      });
      
      await batch.commit();
      showToast(`Удалено дубликатов: ${toDelete.length}`, 'success');
    } catch (error) {
      console.error("Error deduplicating categories:", error);
      showToast('Ошибка при удалении дубликатов', 'error');
    }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordInput.trim()) return;

    if (passwordMode === 'setup') {
      try {
        await setDoc(doc(db, 'settings', 'admin'), { password: passwordInput });
        setIsPasswordVerified(true);
        setIsPasswordModalOpen(false);
        setPasswordInput('');
        showToast('Пароль администратора установлен', 'success');
      } catch (error) {
        showToast('Ошибка при сохранении пароля', 'error');
      }
    } else {
      if (passwordInput === adminPassword) {
        setIsPasswordVerified(true);
        setIsPasswordModalOpen(false);
        setPasswordInput('');
        showToast('Доступ разрешен', 'success');
      } else {
        showToast('Неверный пароль', 'error');
      }
    }
  };

  const handleResetDatabase = async () => {
    if (!canEdit) return;
    if (!window.confirm('Вы уверены, что хотите полностью сбросить базу данных к начальному состоянию? Все текущие изменения будут удалены.')) return;

    try {
      showToast('Сброс базы данных...', 'success');
      
      // Clear local state first to show immediate feedback
      setCategories([]);
      setProducts([]);
      setSelectedCategoryId(null);
      setGlobalSearchTerm('');

      // Delete all categories
      const catSnapshot = await getDocs(collection(db, 'categories'));
      const catBatch = writeBatch(db);
      catSnapshot.forEach(d => catBatch.delete(d.ref));
      await catBatch.commit();

      // Delete all products
      const prodSnapshot = await getDocs(collection(db, 'products'));
      const prodBatch = writeBatch(db);
      prodSnapshot.forEach(d => prodBatch.delete(d.ref));
      await prodBatch.commit();

      showToast('База данных успешно очищена. Инициализация...', 'success');
      // The seed useEffect will trigger because categories.length and products.length are now 0
    } catch (error) {
      console.error("Error resetting database:", error);
      showToast('Ошибка при сбросе базы данных', 'error');
    }
  };

  const handleSignIn = async () => {
    if (isSigningInRef.current) return;
    isSigningInRef.current = true;
    try {
      await signInWithGoogle();
      showToast('Вход выполнен успешно', 'success');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        showToast('Окно входа было закрыто. Пожалуйста, попробуйте еще раз и не закрывайте окно до завершения.', 'error');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignore this one as it usually means another popup was opened
      } else {
        showToast('Ошибка при входе через Google: ' + error.message, 'error');
      }
    } finally {
      isSigningInRef.current = false;
    }
  };

  const handleBOMImport = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as Record<string, string>[];
        if (data.length === 0) {
          showToast('Файл BOM пуст', 'error');
          return;
        }

        try {
          showToast('Импорт BOM...', 'success');
          const batch = writeBatch(db);
          
          // Get existing categories to map names to IDs
          const catSnapshot = await getDocs(collection(db, 'categories'));
          const currentCats = catSnapshot.docs.map(d => d.data() as Category);
          
          let importedCount = 0;
          const cleanKey = (k: string) => k.toLowerCase().trim().replace(/^\uFEFF/, '').replace(/^["']|["']$/g, '');

          for (const row of data) {
            const keys = Object.keys(row);
            
            // Try to find Name, Category, and other fields
            const nameKey = keys.find(k => ['название', 'name', 'item', 'компонент'].includes(cleanKey(k)));
            const catKey = keys.find(k => ['категория', 'category', 'group', 'группа'].includes(cleanKey(k)));
            
            const name = nameKey ? row[nameKey]?.trim() : undefined;
            const categoryName = catKey ? row[catKey]?.trim() : 'Без категории';
            
            if (!name) continue;

            // Find or create category
            let categoryId = 'uncategorized';
            const existingCat = currentCats.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
            
            if (existingCat) {
              categoryId = existingCat.id;
            } else {
              // Create new root category if not found
              categoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const newCat: Category = {
                id: categoryId,
                name: categoryName,
                subcategories: [],
                order: currentCats.length + importedCount
              };
              batch.set(doc(db, 'categories', categoryId), newCat);
              currentCats.push(newCat); // Add to local list for next rows
            }

            // Extract characteristics (all other fields)
            const characteristics: Characteristic[] = [];
            keys.forEach(k => {
              if (k !== nameKey && k !== catKey && row[k]?.trim()) {
                characteristics.push({
                  name: k,
                  value: row[k].trim()
                });
              }
            });

            const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newProduct: Product = {
              id: productId,
              categoryId,
              name,
              characteristics,
              order: Date.now() + importedCount
            };

            batch.set(doc(db, 'products', productId), newProduct);
            importedCount++;
          }

          await batch.commit();
          showToast(`Импортировано товаров из BOM: ${importedCount}`, 'success');
        } catch (error) {
          console.error("BOM Import Error:", error);
          showToast('Ошибка при импорте BOM', 'error');
        }
      }
    });
  };

  const handleLogOut = async () => {
    try {
      if (isGuest) {
        setIsGuest(false);
        showToast('Выход выполнен', 'success');
        return;
      }
      await logOut();
      setIsPasswordVerified(false);
      showToast('Выход выполнен', 'success');
    } catch (error: any) {
      showToast('Ошибка при выходе: ' + error.message, 'error');
    }
  };

  const switchToCollector = async () => {
    try {
      await logOut();
      setIsGuest(true);
      showToast('Переключено на режим сборщика', 'success');
    } catch (error: any) {
      showToast('Ошибка при переключении: ' + error.message, 'error');
    }
  };

  const switchToAdmin = async () => {
    try {
      await handleSignIn();
    } catch (error: any) {
      showToast('Ошибка при переключении: ' + error.message, 'error');
    }
  };

  useEffect(() => {
    if (!initialProductHandled && products.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const productId = params.get('product');
      if (productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
          setViewingProduct(product);
        } else {
          showToast('Товар по ссылке не найден в каталоге', 'error');
        }
      }
      setInitialProductHandled(true);
    }
  }, [products, initialProductHandled]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    // Auto-detect error type based on message content if not explicitly provided
    const isError = type === 'error' || message.toLowerCase().includes('ошибка') || message.toLowerCase().includes('не найден');
    setToastMessage({ text: message, type: isError ? 'error' : 'success' });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [cart, setCart] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('catalog_cart');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Update URL when viewing product
  useEffect(() => {
    if (viewingProduct) {
      const url = new URL(window.location.href);
      url.searchParams.set('product', viewingProduct.id);
      window.history.pushState({}, '', url.toString());
    } else if (initialProductHandled) {
      const url = new URL(window.location.href);
      url.searchParams.delete('product');
      window.history.pushState({}, '', url.toString());
    }
  }, [viewingProduct, initialProductHandled]);

  const handleScan = (decodedText: string) => {
    console.log("Scanned QR raw:", decodedText);
    
    // Provide haptic feedback if available
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }

    setIsScannerOpen(false);
    
    const cleanText = decodedText.trim();
    let productId = cleanText;
    
    // Advanced URL parsing with decoding
    try {
      if (cleanText.startsWith('http')) {
        const url = new URL(cleanText);
        const paramId = url.searchParams.get('product');
        if (paramId) {
          productId = decodeURIComponent(paramId).trim();
        } else {
          const pathParts = url.pathname.split('/');
          const lastPart = pathParts[pathParts.length - 1];
          if (lastPart && lastPart.length >= 5) {
            productId = decodeURIComponent(lastPart).trim();
          }
        }
      }
    } catch (e) {
      console.error("Error parsing scanned URL:", e);
    }

    // 1. Try exact ID match
    let product = products.find(p => p.id === productId);
    
    // 2. Try case-insensitive ID match
    if (!product) {
      product = products.find(p => p.id.toLowerCase() === productId.toLowerCase());
    }
    
    // 3. Try name match
    if (!product) {
      product = products.find(p => p.name.toLowerCase() === cleanText.toLowerCase());
    }

    // 4. Try partial match
    if (!product && productId.length >= 3) {
      product = products.find(p => 
        p.id.toLowerCase().includes(productId.toLowerCase()) || 
        productId.toLowerCase().includes(p.id.toLowerCase())
      );
    }

    // 5. Try partial name match
    if (!product && cleanText.length >= 3) {
      product = products.find(p => 
        p.name.toLowerCase().includes(cleanText.toLowerCase())
      );
    }
    
    if (product) {
      console.log("Product found:", product.name);
      showToast('Товар найден: ' + product.name, 'success');
      setIsScannerOpen(false);
      setViewingProduct(product);
    } else {
      console.warn("Product not found. Scanned:", cleanText, "Extracted ID:", productId);
      
      // Fallback: search for it
      setSelectedCategoryId(null);
      setGlobalSearchTerm(productId);
      setIsScannerOpen(false);
      
      showToast(`Товар "${productId}" не найден в текущей базе.`, 'error');
    }
  };

  useEffect(() => {
    localStorage.setItem('catalog_cart', JSON.stringify(cart));
  }, [cart]);

  const handleAddToCart = (product: Product) => {
    const available = getAvailableQuantity(product);
    const current = cart[product.id] || 0;
    if (current < available) {
      setCart(prev => ({ ...prev, [product.id]: current + 1 }));
    }
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const available = getAvailableQuantity(product);
    
    setCart(prev => {
      const current = prev[productId] || 0;
      const nextQty = current + delta;
      if (nextQty <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      if (nextQty <= available) {
        return { ...prev, [productId]: nextQty };
      }
      return prev;
    });
  };

  const handleSetCartQuantity = (productId: string, val: string | number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const available = getAvailableQuantity(product);
    
    setCart(prev => {
      if (val === '') {
        return { ...prev, [productId]: 0 };
      }
      const qty = typeof val === 'string' ? parseInt(val) : val;
      if (isNaN(qty) || qty < 0) {
        return prev;
      }
      return { ...prev, [productId]: Math.min(qty, available) };
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const handleBomUpload = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        let addedCount = 0;
        let notFoundCount = 0;
        
        setCart(prevCart => {
          const newCart = { ...prevCart };
          
          rows.forEach(row => {
            // Find quantity
            const qtyKey = Object.keys(row).find(k => k.toLowerCase().includes('qty') || k.toLowerCase().includes('quantity') || k.toLowerCase().includes('кол-во') || k.toLowerCase().includes('количество'));
            const qty = qtyKey ? parseInt(row[qtyKey], 10) : 1;
            if (isNaN(qty) || qty <= 0) return;

            // Find search term
            const nameKey = Object.keys(row).find(k => 
              k.toLowerCase().includes('name') || 
              k.toLowerCase().includes('part') || 
              k.toLowerCase().includes('value') || 
              k.toLowerCase().includes('comment') || 
              k.toLowerCase().includes('наименование') ||
              k.toLowerCase().includes('компонент')
            );
            
            const searchTerm = nameKey ? String(row[nameKey]).trim().toUpperCase() : '';
            if (!searchTerm) return;

            // Find product
            const product = products.find(p => {
              if (p.name.toUpperCase() === searchTerm) return true;
              if (p.name.toUpperCase().includes(searchTerm)) return true;
              // Check characteristics
              return p.characteristics.some(c => c.value.toUpperCase() === searchTerm || c.value.toUpperCase().includes(searchTerm));
            });

            if (product) {
              const available = getAvailableQuantity(product);
              const currentInCart = newCart[product.id] || 0;
              const toAdd = Math.min(qty, available - currentInCart);
              if (toAdd > 0) {
                newCart[product.id] = currentInCart + toAdd;
                addedCount++;
              }
            } else {
              notFoundCount++;
            }
          });
          
          showToast(`BOM обработан: добавлено ${addedCount} позиций. Не найдено: ${notFoundCount}`);
          return newCart;
        });
      }
    });
  };

  const handleCheckout = async () => {
    try {
      const batch = writeBatch(db);
      let updatedCount = 0;

      products.forEach(product => {
        const cartQty = cart[product.id];
        if (cartQty) {
          const newCharacteristics = product.characteristics.map(char => {
            if (char.name === 'Количество') {
              const currentQty = parseFloat(char.value) || 0;
              const newQty = Math.max(0, currentQty - cartQty);
              return { ...char, value: newQty.toString() };
            }
            return char;
          });
          
          const ref = doc(db, 'products', product.id);
          batch.update(ref, { characteristics: newCharacteristics });
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
      }
      
      showToast('Заказ успешно оформлен!', 'success');
      setCart({});
      setIsCartModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  const totalCartItems = Object.entries(cart).reduce((total, [id, qty]) => {
    const productExists = products.some(p => p.id === id);
    const quantity = qty as number;
    return (productExists && quantity > 0) ? total + quantity : total;
  }, 0);

  const findCategoryById = (cats: Category[], id: string | null): Category | null => {
    if (!id) return null;
    for (const cat of cats) {
      if (cat.id === id) return cat;
      const found = findCategoryById(cat.subcategories, id);
      if (found) return found;
    }
    return null;
  };

  const selectedCategory = findCategoryById(categories, selectedCategoryId);

  const allCharacteristicNames = Array.from(new Set(products.flatMap(p => p.characteristics.map(c => c.name))));

  // Migration from old key if new one is empty
  useEffect(() => {
    setIsAuthReady(true);
    
    // Check if we need to migrate or clear local storage to prefer Firebase
    // We keep cart in local storage as it's per-device
  }, []);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addCategory = async (parentId: string | null, nameOverride?: string) => {
    const nameToUse = nameOverride !== undefined ? nameOverride : newName;
    if (!nameToUse.trim()) return;

    const newCat: Category = {
      id: generateId(),
      name: nameToUse.trim(),
      subcategories: [],
      parentId: parentId || undefined,
      order: Date.now()
    };

    try {
      await setDoc(doc(db, 'categories', newCat.id), newCat);
      if (!parentId) {
        setIsAddingRoot(false);
      } else {
        setAddingSubTo(null);
      }
      if (nameOverride === undefined) {
        setNewName('');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    }
  };

  const updateCategory = async () => {
    if (!editingCategory || !newName.trim()) return;

    try {
      await updateDoc(doc(db, 'categories', editingCategory.id), {
        name: newName.trim()
      });
      setEditingCategory(null);
      setNewName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'categories');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!canEdit) {
      showToast('У вас нет прав для этого действия', 'error');
      return;
    }
    setCategoryToDelete(id);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const id = categoryToDelete;
    
    try {
      showToast('Удаление категории...', 'success');
      
      const getSubIds = (cats: Category[], targetId: string): string[] => {
        for (const cat of cats) {
          if (cat.id === targetId) {
            const ids = [cat.id];
            const collect = (c: Category) => {
              if (c.subcategories) {
                c.subcategories.forEach(s => {
                  ids.push(s.id);
                  collect(s);
                });
              }
            };
            collect(cat);
            return ids;
          }
          if (cat.subcategories) {
            const found = getSubIds(cat.subcategories, targetId);
            if (found.length > 0) return found;
          }
        }
        return [];
      };

      const idsToDelete = getSubIds(categories, id);
      
      const batch = writeBatch(db);
      if (idsToDelete.length === 0) {
        batch.delete(doc(db, 'categories', id));
      } else {
        idsToDelete.forEach(catId => {
          batch.delete(doc(db, 'categories', catId));
        });
      }
      await batch.commit();
      
      showToast('Категория удалена', 'success');
      if (selectedCategoryId === id) setSelectedCategoryId(null);
      setCategoryToDelete(null);
    } catch (error) {
      console.error("Error deleting category:", error);
      handleFirestoreError(error, OperationType.DELETE, 'categories');
    }
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      const id = editingProduct ? editingProduct.id : generateId();
      const order = editingProduct ? (editingProduct.order ?? Date.now()) : Date.now();
      const product = { ...productData, id, order };
      await setDoc(doc(db, 'products', id), product);
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
  };

  const handleDeleteMultipleProducts = (ids: string[]) => {
    setProductsToDeleteBulk(ids);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await deleteDoc(doc(db, 'products', productToDelete));
      setProductToDelete(null);
      showToast('Товар удален', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'products');
    }
  };

  const confirmDeleteMultipleProducts = async () => {
    if (!productsToDeleteBulk) return;
    try {
      const batch = writeBatch(db);
      productsToDeleteBulk.forEach(id => {
        batch.delete(doc(db, 'products', id));
      });
      await batch.commit();
      showToast(`Удалено товаров: ${productsToDeleteBulk.length}`, 'success');
      setProductsToDeleteBulk(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'products');
    }
  };

  const handleImportCategories = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as Record<string, string>[];
        if (data.length === 0) {
          showToast('Файл пуст или не удалось распознать данные', 'error');
          return;
        }
        
        try {
          const batch = writeBatch(db);
          let importedCount = 0;
          
          // We need current flat categories for reference
          const catSnapshot = await getDocs(collection(db, 'categories'));
          const currentCats = catSnapshot.docs.map(d => d.data() as Category);
          let tempCats = [...currentCats];

          const findCatByName = (list: Category[], name: string) => 
            list.find(c => c.name.toLowerCase() === name.toLowerCase());

          const cleanKey = (k: string) => k.toLowerCase().trim().replace(/^\uFEFF/, '').replace(/^["']|["']$/g, '');

          for (const row of data) {
            const keys = Object.keys(row);
            let nameKey = keys.find(k => ['название', 'name', 'категория', 'category', 'идентификатор', 'индетификатор', 'id'].includes(cleanKey(k)));
            if (!nameKey) nameKey = keys.find(k => {
              const c = cleanKey(k);
              return c.includes('название') || c.includes('name') || c.includes('категория') || c.includes('category') || c.includes('идентификатор') || c.includes('индетификатор');
            });
            if (!nameKey && keys.length > 0) nameKey = keys[0];

            let parentKey = keys.find(k => ['родительская категория', 'parent', 'родитель'].includes(cleanKey(k)));
            if (!parentKey) parentKey = keys.find(k => cleanKey(k).includes('родител') || cleanKey(k).includes('parent'));
            
            const name = nameKey ? row[nameKey]?.trim() : undefined;
            const parentName = parentKey ? row[parentKey]?.trim() : undefined;
            
            if (!name) continue;

            let parentId: string | undefined = undefined;
            if (parentName) {
              const parent = findCatByName(tempCats, parentName);
              if (parent) {
                parentId = parent.id;
              } else {
                const newParentId = generateId();
                const newParent: Category = { 
                  id: newParentId, 
                  name: parentName, 
                  subcategories: [], 
                  parentId: undefined,
                  order: Date.now() + importedCount
                };
                batch.set(doc(db, 'categories', newParentId), newParent);
                tempCats.push(newParent);
                parentId = newParentId;
                importedCount++;
              }
            }

            const existing = findCatByName(tempCats, name);
            if (!existing) {
              const newId = generateId();
              const newCat: Category = {
                id: newId,
                name: name,
                subcategories: [],
                parentId,
                order: Date.now() + importedCount
              };
              batch.set(doc(db, 'categories', newId), newCat);
              tempCats.push(newCat);
              importedCount++;
            }
          }
          
          await batch.commit();
          showToast(`Импортировано категорий: ${importedCount}`, 'success');
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'categories');
        }
      },
      error: (error) => {
        showToast(`Ошибка импорта: ${error.message}`, 'error');
      }
    });
  };

  const handleImportProducts = (file: File) => {
    if (!selectedCategory) {
      showToast('Сначала выберите категорию', 'error');
      return;
    }
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as Record<string, string>[];
          if (data.length === 0) {
            showToast('Файл пуст или не удалось распознать данные', 'error');
            return;
          }
          
          const batch = writeBatch(db);
          let importedCount = 0;
          let updatedCount = 0;
          
          const prodSnapshot = await getDocs(collection(db, 'products'));
          const currentProds = prodSnapshot.docs.map(d => d.data() as Product);

          const cleanKey = (k: string) => k ? k.toLowerCase().trim().replace(/^\uFEFF/, '').replace(/^["']|["']$/g, '') : '';

          data.forEach((row, index) => {
            if (!row || typeof row !== 'object') return;
            const keys = Object.keys(row);
            
            let nameKey = keys.find(k => ['значение', 'value', 'comment', 'description', 'название', 'name', 'наименование', 'товар', 'модель', 'артикул', 'обозначение', 'идентификатор', 'индетификатор', 'id', 'идентиф.', 'идентиф'].includes(cleanKey(k)));
            if (!nameKey) nameKey = keys.find(k => {
              const c = cleanKey(k);
              return c.includes('значение') || c.includes('value') || c.includes('comment') || c.includes('description') || c.includes('название') || c.includes('name') || c.includes('наименование') || c.includes('товар') || c.includes('модель') || c.includes('обозначение') || c.includes('идентификатор') || c.includes('индетификатор') || c.includes('артикул') || c.includes('идентиф');
            });
            if (!nameKey && keys.length > 0) nameKey = keys[0];

            const imageKey = keys.find(k => ['изображение', 'imageurl', 'image', 'фото', 'картинка'].includes(cleanKey(k)));
            const locationKey = keys.find(k => ['местоположение', 'location', 'место', 'полка', 'стеллаж'].includes(cleanKey(k)));
            
            const name = nameKey ? row[nameKey]?.trim() : undefined;
            if (!name) return;
            
            const imageUrl = imageKey ? row[imageKey]?.trim() : '';
            const location = locationKey ? row[locationKey]?.trim() : '';
            
            const characteristics: Characteristic[] = [];
            keys.forEach(key => {
              if (key !== nameKey && key !== imageKey && key !== locationKey) {
                if (row[key] && typeof row[key] === 'string' && row[key].trim() !== '') {
                  const val = row[key].trim();
                  const parsed = parseValueAndUnit(val);
                  
                  let charName = key.trim().replace(/^\uFEFF/, '');
                  const cleanCharName = cleanKey(charName);
                  
                  if (['quantity', 'qty', 'кол-во', 'количество'].includes(cleanCharName)) {
                    charName = 'Количество';
                  } else if (['reference', 'designator', 'обозначение', 'позиция'].includes(cleanCharName)) {
                    charName = 'Обозначение';
                  } else if (['footprint', 'package', 'посад. место', 'посадочное место', 'корпус'].includes(cleanCharName)) {
                    charName = 'Посадочное место';
                  } else if (['supplier and ref', 'supplier', 'поставщик', 'поставщик и справка'].includes(cleanCharName)) {
                    charName = 'Поставщик';
                  } else if (['datasheet', 'документация'].includes(cleanCharName)) {
                    charName = 'Datasheet';
                  }

                  characteristics.push({ 
                    name: charName, 
                    value: parsed.value,
                    unit: parsed.unit
                  });
                }
              }
            });

            const existing = currentProds.find(p => p.name.toLowerCase() === name.toLowerCase() && p.categoryId === selectedCategory.id);
            
            if (existing) {
              const updatedProduct = {
                ...existing,
                imageUrl: imageUrl || existing.imageUrl,
                location: location || existing.location,
                characteristics: [...existing.characteristics]
              };
              
              characteristics.forEach(newC => {
                const idx = updatedProduct.characteristics.findIndex(c => c.name.toLowerCase() === newC.name.toLowerCase());
                if (idx >= 0) {
                  updatedProduct.characteristics[idx] = newC;
                } else {
                  updatedProduct.characteristics.push(newC);
                }
              });
              
              batch.set(doc(db, 'products', existing.id), updatedProduct);
              updatedCount++;
            } else {
              const newId = generateId();
              const newProduct: Product = {
                id: newId,
                categoryId: selectedCategory.id,
                name,
                imageUrl,
                location,
                characteristics,
                order: Date.now() + index
              };
              batch.set(doc(db, 'products', newId), newProduct);
              importedCount++;
            }
          });
          
          await batch.commit();
          showToast(`Добавлено: ${importedCount}, Обновлено: ${updatedCount}`, 'success');
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'products');
        }
      },
      error: (error) => {
        showToast(`Ошибка импорта: ${error.message}`, 'error');
      }
    });
  };

  const categoryProducts = selectedCategory 
    ? products.filter(p => p.categoryId === selectedCategory.id)
    : [];

  const globalSearchResults = globalSearchTerm.trim() 
    ? products.filter(p => 
        p.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
        p.characteristics.some(c => c.value.toLowerCase().includes(globalSearchTerm.toLowerCase()))
      )
    : (globalSearchTerm === ' ' ? products : []);

  if (!isAuthReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LayoutGrid size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Каталог комплектующих</h1>
          <p className="text-gray-500 mb-8">Пожалуйста, авторизуйтесь для доступа к системе</p>
          
          <div className="space-y-4">
            <button 
              onClick={handleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all group"
            >
              <ShieldCheck className="text-blue-600 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-sm font-bold text-gray-900">Администратор</div>
                <div className="text-xs text-gray-500 font-normal">Полный доступ и управление</div>
              </div>
            </button>

            <button 
              onClick={() => {
                setIsGuest(true);
                showToast('Вход выполнен как сборщик', 'success');
              }}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 hover:border-amber-500 hover:bg-amber-50 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all group"
            >
              <Package className="text-amber-600 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-sm font-bold text-gray-900">Сборщик</div>
                <div className="text-xs text-gray-500 font-normal">Только просмотр и поиск</div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white text-[#1A1A1A] font-sans overflow-hidden">
      {/* Password Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {passwordMode === 'setup' ? 'Установка пароля' : 'Проверка пароля'}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  {passwordMode === 'setup' 
                    ? 'Придумайте пароль для дополнительной защиты прав администратора' 
                    : 'Введите пароль администратора для доступа к функциям управления'}
                </p>
                
                <div className="space-y-4">
                  <input 
                    autoFocus
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    placeholder="Введите пароль..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center text-lg tracking-widest"
                  />
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={async () => {
                        await logOut();
                        setIsPasswordModalOpen(false);
                        setPasswordInput('');
                      }}
                      className="flex-1 px-4 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Отмена
                    </button>
                    <button 
                      onClick={handlePasswordSubmit}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                    >
                      {passwordMode === 'setup' ? 'Сохранить' : 'Войти'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-80 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col h-full z-30 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-gray-200 flex flex-col gap-3 bg-white">
          <div className="flex items-center justify-between gap-2">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors flex-1 min-w-0"
              onClick={() => {
                setSelectedCategoryId(null);
                setIsSidebarOpen(false);
              }}
              title="На главную каталога"
            >
              <LayoutGrid size={20} className="text-blue-600 flex-shrink-0" />
              <h1 className="font-semibold text-gray-900 text-lg tracking-tight truncate">Каталог</h1>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {isAdmin && (
                <button 
                  onClick={switchToCollector}
                  className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider mr-1 hover:bg-blue-700 transition-all shadow-sm shadow-blue-100 border border-blue-500"
                  title="Переключиться на режим сборщика"
                >
                  Admin
                </button>
              )}
              {isCollector && (
                <button 
                  onClick={switchToAdmin}
                  className="px-3 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider mr-1 hover:bg-amber-600 transition-all shadow-sm shadow-amber-100 border border-amber-400"
                  title="Переключиться на режим администратора"
                >
                  Сборщик
                </button>
              )}
              <button 
                onClick={handleLogOut} 
                className="p-1.5 rounded-md transition-colors text-gray-500 hover:text-red-600 hover:bg-red-50"
                title="Выйти из системы"
              >
                <LogOut size={20} />
              </button>
              <button onClick={() => setIsScannerOpen(true)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Сканировать QR-код">
                <QrCode size={20} />
              </button>
              <button onClick={() => setIsCartModalOpen(true)} className="relative p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Корзина">
                <ShoppingCart size={20} />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {totalCartItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Admin Tools removed as per request */}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <AnimatePresence>
            {isAddingRoot && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-2 mb-2 rounded-lg shadow-sm border border-blue-200 flex items-center gap-2"
              >
                <input 
                  autoFocus
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory(null)}
                  placeholder="Новая категория..."
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                />
                <button onClick={() => addCategory(null)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
                <button onClick={() => setIsAddingRoot(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-0.5">
            {categories.length === 0 ? (
              <div className="text-center p-4 text-sm text-gray-400">Нет категорий</div>
            ) : (
              categories.map(cat => (
                <CategoryItem 
                  key={cat.id} 
                  category={cat} 
                  onDelete={deleteCategory}
                  onEdit={(c) => { setEditingCategory(c); setNewName(c.name); }}
                  onAddSub={(id) => { setAddingSubTo(id); setNewName(''); }}
                  editingCategory={editingCategory}
                  addingSubTo={addingSubTo}
                  newName={newName}
                  setNewName={setNewName}
                  updateCategory={updateCategory}
                  addCategory={addCategory}
                  setEditingCategory={setEditingCategory}
                  setAddingSubTo={setAddingSubTo}
                  onSelect={(cat) => setSelectedCategoryId(cat.id)}
                  selectedCategoryId={selectedCategoryId || undefined}
                  canEdit={canEdit}
                />
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
        {selectedCategory ? (
          <ProductTable 
            category={selectedCategory} 
            products={categoryProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            updateQuantity={handleUpdateCartQuantity}
            setQuantity={handleSetCartQuantity}
            removeFromCart={handleRemoveFromCart}
            onSelectCategory={(cat) => setSelectedCategoryId(cat.id)}
            onBack={() => setSelectedCategoryId(selectedCategory.parentId || null)}
            onAddProduct={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            onEditProduct={(product) => {
              setEditingProduct(product);
              setIsProductModalOpen(true);
            }}
            onDeleteProduct={handleDeleteProduct}
            onDeleteMultipleProducts={handleDeleteMultipleProducts}
            onAddSubcategory={(name) => {
              addCategory(selectedCategory.id, name);
            }}
            onViewProduct={(product) => setViewingProduct(product)}
            onImportProducts={handleImportProducts}
            onEditCategory={(c) => { setEditingCategory(c); setNewName(c.name); }}
            onDeleteCategory={deleteCategory}
            onToggleSidebar={() => setIsSidebarOpen(true)}
            canEdit={canEdit}
          />
        ) : globalSearchTerm.trim() ? (
          <ProductTable 
            category={{ id: 'search', name: `Результаты поиска: "${globalSearchTerm}"`, subcategories: [] }} 
            products={globalSearchResults}
            cart={cart}
            onAddToCart={handleAddToCart}
            updateQuantity={handleUpdateCartQuantity}
            setQuantity={handleSetCartQuantity}
            removeFromCart={handleRemoveFromCart}
            onSelectCategory={(cat) => setSelectedCategoryId(cat.id)}
            onBack={() => setGlobalSearchTerm('')}
            onAddProduct={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            onEditProduct={(product) => {
              setEditingProduct(product);
              setIsProductModalOpen(true);
            }}
            onDeleteProduct={handleDeleteProduct}
            onDeleteMultipleProducts={handleDeleteMultipleProducts}
            onAddSubcategory={() => {}}
            onViewProduct={(product) => setViewingProduct(product)}
            onImportProducts={() => {}}
            onEditCategory={() => {}}
            onDeleteCategory={() => {}}
            onToggleSidebar={() => setIsSidebarOpen(true)}
            canEdit={canEdit}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 p-4 md:p-8">
            <div className="max-w-md w-full bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 text-center relative">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>
              <Folder size={48} className="mx-auto mb-4 text-blue-500" />
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">Каталог компонентов</h2>
              <p className="text-sm md:text-base text-gray-500 mb-6">
                Найдите нужный товар или выберите категорию в меню слева.
              </p>

              <div className="relative mb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text"
                  placeholder="Поиск по всему каталогу..."
                  value={globalSearchTerm}
                  onChange={(e) => setGlobalSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900"
                />
                {globalSearchTerm && (
                  <button 
                    onClick={() => setGlobalSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              
              <div className="relative">
                <input 
                  type="file" 
                  accept=".csv" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBomUpload(file);
                    e.target.value = '';
                  }}
                />
                <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-medium transition-colors">
                  <Upload size={20} />
                  Собрать заказ по BOM
                </button>
              </div>

              {isAdmin && (
                <div className="grid grid-cols-1 gap-3 mt-4 w-full">
                  <button 
                    onClick={() => {
                      if (!isPasswordVerified) {
                        setPasswordMode('verify');
                        setIsPasswordModalOpen(true);
                        return;
                      }
                      setEditingProduct(null);
                      setIsProductModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-medium transition-colors shadow-lg shadow-green-100"
                  >
                    <Plus size={20} />
                    Добавить товар
                  </button>
                  
                  <button 
                    onClick={() => {
                      if (!isPasswordVerified) {
                        setPasswordMode('verify');
                        setIsPasswordModalOpen(true);
                        return;
                      }
                      setIsAddingRoot(true);
                      setNewName('');
                      setIsSidebarOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 py-3 px-6 rounded-xl font-medium transition-colors"
                  >
                    <FolderPlus size={20} />
                    Создать категорию
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-3">Поддерживается формат CSV</p>

              {/* Mobile Categories Grid */}
              <div className="mt-10 pt-8 border-t border-gray-100 md:hidden">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Категории</h3>
                <div className="grid grid-cols-2 gap-3">
                  {categories.filter(c => !c.parentId).map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all"
                    >
                      <Folder className="text-blue-500" size={24} />
                      <span className="text-xs font-medium text-gray-700 truncate w-full">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedCategory && (
        <ProductModal 
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          product={editingProduct}
          category={selectedCategory}
          allCategories={categories}
          templateCharacteristics={selectedCategory ? Array.from(new Set(products.filter(p => p.categoryId === selectedCategory.id).flatMap(p => p.characteristics.map(c => c.name)))) : []}
          allCharacteristicNames={allCharacteristicNames}
        />
      )}

      <ProductViewModal 
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        product={viewingProduct}
        onEdit={(product) => {
          setViewingProduct(null);
          setEditingProduct(product);
          setIsProductModalOpen(true);
        }}
        onDelete={(id) => {
          setViewingProduct(null);
          handleDeleteProduct(id);
        }}
        cart={cart}
        onAddToCart={handleAddToCart}
        updateQuantity={handleUpdateCartQuantity}
        setQuantity={handleSetCartQuantity}
        removeFromCart={handleRemoveFromCart}
        canEdit={canEdit}
      />

      <CartModal 
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        cart={cart}
        products={products}
        updateQuantity={handleUpdateCartQuantity}
        setQuantity={handleSetCartQuantity}
        removeFromCart={handleRemoveFromCart}
        onCheckout={handleCheckout}
      />

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />

      {/* Category Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удаление категории</h3>
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите удалить эту категорию и все её подкатегории? 
              Товары будут сохранены, но потеряют привязку к этой категории.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={confirmDeleteCategory}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удаление товара</h3>
            <p className="text-gray-600 mb-6">Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={confirmDeleteProduct}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {productsToDeleteBulk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удаление товаров</h3>
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите удалить <strong>{productsToDeleteBulk.length}</strong> {productsToDeleteBulk.length === 1 ? 'товар' : 'товаров'}? Это действие нельзя отменить.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setProductsToDeleteBulk(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={confirmDeleteMultipleProducts}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 text-white px-4 py-3 rounded-lg shadow-xl z-[60] flex items-center gap-2 ${toastMessage.type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`}
          >
            {toastMessage.type === 'error' ? (
              <X size={18} className="text-white" />
            ) : (
              <Check size={18} className="text-green-400" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CategoryItemProps {
  category: Category;
  onDelete: (id: string) => void;
  onEdit: (c: Category) => void;
  onAddSub: (id: string) => void;
  editingCategory: Category | null;
  addingSubTo: string | null;
  newName: string;
  setNewName: (s: string) => void;
  updateCategory: () => void;
  addCategory: (id: string | null) => void;
  setEditingCategory: (c: Category | null) => void;
  setAddingSubTo: (s: string | null) => void;
  onSelect: (c: Category) => void;
  selectedCategoryId?: string;
  depth?: number;
  canEdit?: boolean;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ 
  category, 
  onDelete, 
  onEdit, 
  onAddSub,
  editingCategory,
  addingSubTo,
  newName,
  setNewName,
  updateCategory,
  addCategory,
  setEditingCategory,
  setAddingSubTo,
  onSelect,
  selectedCategoryId,
  depth = 0,
  canEdit
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isEditing = editingCategory?.id === category.id;
  const isAddingSub = addingSubTo === category.id;
  const isSelected = selectedCategoryId === category.id;

  // Auto-expand when adding a subcategory
  useEffect(() => {
    if (isAddingSub) setIsOpen(true);
  }, [isAddingSub]);

  return (
    <div className="w-full select-none">
      <div 
        className={`group flex items-center gap-1.5 py-2 px-2 md:py-1.5 rounded-lg transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-100'} ${depth > 0 ? 'ml-4' : ''}`}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={`p-1 md:p-0.5 rounded hover:bg-gray-200 transition-colors ${category.subcategories.length === 0 && !isAddingSub ? 'invisible' : ''} ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <div 
          className="flex-1 flex items-center gap-2 cursor-pointer overflow-hidden"
          onClick={() => onSelect(category)}
        >
          <Folder size={16} className={`flex-shrink-0 ${isSelected ? "text-blue-500" : (depth === 0 ? "text-gray-400" : "text-gray-300")}`} />
          
          {isEditing ? (
            <div className="flex-1 flex items-center gap-1">
              <input 
                autoFocus
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && updateCategory()}
                className="flex-1 bg-white border border-gray-300 px-1.5 py-0.5 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
              />
              <button onClick={updateCategory} className="text-green-600 hover:bg-green-100 p-1 rounded flex-shrink-0"><Check size={12} /></button>
              <button onClick={() => setEditingCategory(null)} className="text-red-600 hover:bg-red-100 p-1 rounded flex-shrink-0"><X size={12} /></button>
            </div>
          ) : (
            <span className={`text-sm truncate ${isSelected ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
              {category.name}
            </span>
          )}
        </div>

        {!isEditing && canEdit && (
          <div className="flex items-center flex-shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); onAddSub(category.id); }}
              title="Добавить подкатегорию"
              className="p-1.5 md:p-1 text-gray-400 hover:text-green-600 rounded transition-colors"
            >
              <Plus size={14} className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(category); }}
              title="Редактировать"
              className="p-1.5 md:p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}
              title="Удалить"
              className="p-1.5 md:p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col mt-0.5">
              {category.subcategories.map(sub => (
                <CategoryItem 
                  key={sub.id} 
                  category={sub} 
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onAddSub={onAddSub}
                  editingCategory={editingCategory}
                  addingSubTo={addingSubTo}
                  newName={newName}
                  setNewName={setNewName}
                  updateCategory={updateCategory}
                  addCategory={addCategory}
                  setEditingCategory={setEditingCategory}
                  setAddingSubTo={setAddingSubTo}
                  onSelect={onSelect}
                  selectedCategoryId={selectedCategoryId}
                  depth={depth + 1}
                  canEdit={canEdit}
                />
              ))}

              {isAddingSub && (
                <div className={`flex items-center gap-2 p-1.5 ml-8 mr-2 my-1 bg-white rounded-lg border border-blue-200 shadow-sm`}>
                  <input 
                    autoFocus
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCategory(category.id)}
                    placeholder="Название..."
                    className="flex-1 bg-transparent border-none outline-none text-sm min-w-0"
                  />
                  <div className="flex items-center flex-shrink-0">
                    <button onClick={() => addCategory(category.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
                    <button onClick={() => setAddingSubTo(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
