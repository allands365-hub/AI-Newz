'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon as SaveIcon, 
  EyeIcon,
  ArrowLeftIcon,
  TagIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';

interface NewsletterContent {
  subject: string;
  opening: string;
  sections: Array<{
    title: string;
    content: string;
    type: string;
  }>;
  call_to_action: string;
  estimated_read_time: string;
  tags: string[];
}

interface Newsletter {
  id: string;
  title: string;
  topic: string;
  content: NewsletterContent;
  status: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  read_time_minutes?: string;
  tags?: string[];
}

interface NewsletterEditorProps {
  newsletter: Newsletter;
  onSave?: (newsletter: Newsletter) => void;
  onCancel?: () => void;
  onPreview?: (newsletter: Newsletter) => void;
}

export default function NewsletterEditor({ 
  newsletter, 
  onSave, 
  onCancel, 
  onPreview 
}: NewsletterEditorProps) {
  const [editedContent, setEditedContent] = useState<NewsletterContent>(newsletter.content);
  const [editedTitle, setEditedTitle] = useState(newsletter.title);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const headers = await getAuthHeaders();
      
      // Prepare the update data
      const updateData = {
        title: editedTitle,
        subject: editedContent.subject,
        content: JSON.stringify(editedContent) // Convert content to JSON string
      };
      
      console.log('Sending update data:', updateData);
      
      const response = await fetch(API_ENDPOINTS.NEWSLETTERS.UPDATE(newsletter.id), {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save newsletter');
      }

      const updatedNewsletter = await response.json();
      console.log('Newsletter updated successfully:', updatedNewsletter);
      
      setSuccess('Newsletter updated successfully!');
      
      if (onSave) {
        onSave(updatedNewsletter);
      }
    } catch (err) {
      console.error('Error saving newsletter:', err);
      setError(err instanceof Error ? err.message : 'Failed to save newsletter');
    } finally {
      setSaving(false);
    }
  };

  const handleSectionChange = (index: number, field: string, value: string) => {
    setEditedContent(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };

  const addSection = () => {
    setEditedContent(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          title: '',
          content: '',
          type: 'main'
        }
      ]
    }));
  };

  const removeSection = (index: number) => {
    setEditedContent(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview({
        ...newsletter,
        title: editedTitle,
        content: editedContent
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onCancel}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Back to list"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <DocumentTextIcon className="h-6 w-6 text-primary-600" />
              <h1 className="text-xl font-semibold text-gray-900">Edit Newsletter</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {onPreview && (
                <button
                  onClick={handlePreview}
                  className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Preview
                </button>
              )}
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <SaveIcon className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Newsletter Title
            </label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter newsletter title"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Line
            </label>
            <input
              type="text"
              value={editedContent.subject}
              onChange={(e) => setEditedContent(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter email subject line"
            />
          </div>

          {/* Opening */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opening Paragraph
            </label>
            <textarea
              value={editedContent.opening}
              onChange={(e) => setEditedContent(prev => ({ ...prev, opening: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter opening paragraph"
            />
          </div>

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Content Sections
              </label>
              <button
                onClick={addSection}
                className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Add Section
              </button>
            </div>
            
            <div className="space-y-4">
              {editedContent.sections.map((section, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Section {index + 1}</span>
                    <button
                      onClick={() => removeSection(index)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Section title"
                    />
                    
                    <select
                      value={section.type}
                      onChange={(e) => handleSectionChange(index, 'type', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="main">Main Content</option>
                      <option value="trend">Trending</option>
                      <option value="summary">Summary</option>
                    </select>
                    
                    <textarea
                      value={section.content}
                      onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Section content"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call to Action
            </label>
            <textarea
              value={editedContent.call_to_action}
              onChange={(e) => setEditedContent(prev => ({ ...prev, call_to_action: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter call to action text"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={editedContent.tags.join(', ')}
              onChange={(e) => setEditedContent(prev => ({ 
                ...prev, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter tags separated by commas"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
