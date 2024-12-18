import { useState } from 'react';
import { nanoid } from 'nanoid';
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import { InventoryForm } from '@/components/InventoryForm';
import { InventoryTable } from '@/components/InventoryTable';
import { ReportGenerator } from './ReportGenerator';
import type { InventoryItem } from '@/types/inventory';

interface InventoryManagerProps {
  bolNumber: string;
}

export const InventoryManager = ({ bolNumber }: InventoryManagerProps) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const isDuplicate = (newItem: Omit<InventoryItem, 'id' | 'timestamp' | 'bolNumber'>) => {
    return items.some(item => 
      item.sapNumber === newItem.sapNumber && 
      item.barcode === newItem.barcode
    );
  };

  const handleAddItem = async (newItem: Omit<InventoryItem, 'id' | 'timestamp' | 'bolNumber'>) => {
    if (!bolNumber) {
      toast.error("Please enter a BOL number first");
      return;
    }

    if (!editingItem && isDuplicate(newItem)) {
      toast.warning("Warning: This item appears to be a duplicate based on SAP number and barcode");
      return;
    }

    let shortenedPhotoUrl = '';
    if (newItem.photoUrl) {
      const shortId = nanoid(8);
      shortenedPhotoUrl = `${window.location.origin}/photos/${shortId}`;
      
      const { error } = await supabase
        .from('photo_mappings')
        .insert({
          short_id: shortId,
          original_url: newItem.photoUrl
        });

      if (error) {
        console.error('Error storing photo mapping:', error);
        toast.error("Failed to create shortened URL");
        return;
      }
    }

    if (editingItem) {
      const updatedItems = items.map(item => 
        item.id === editingItem.id 
          ? { 
              ...item, 
              ...newItem,
              photoUrl: shortenedPhotoUrl || newItem.photoUrl,
              bolNumber 
            }
          : item
      );
      setItems(updatedItems);
      setEditingItem(null);
      toast.success(`Updated ${newItem.quantity} units of ${newItem.sapNumber}`);
    } else {
      const item: InventoryItem = {
        ...newItem,
        photoUrl: shortenedPhotoUrl || newItem.photoUrl,
        bolNumber,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };
      setItems(prev => [item, ...prev]);
      toast.success(`Added ${newItem.quantity} units of ${newItem.sapNumber}`);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearEntries = () => {
    setItems([]);
    toast.success("All entries have been cleared");
  };

  return (
    <div className="grid gap-6">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-md">
          <InventoryForm 
            onSubmit={handleAddItem} 
            initialValues={editingItem || undefined}
          />
        </div>
      </div>
      
      <div className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 order-1 sm:order-none">
            Recent Entries
          </h2>
          <ReportGenerator 
            items={items} 
            disabled={items.length === 0} 
            onClear={handleClearEntries}
          />
        </div>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-full inline-block align-middle">
              <InventoryTable 
                items={items} 
                onEdit={handleEdit}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};