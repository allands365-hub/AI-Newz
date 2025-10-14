'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  DocumentTextIcon, 
  ClockIcon,
  TagIcon,
  ArrowPathIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';
import NewsletterEditor from './NewsletterEditor';

interface NewsletterGeneratorProps {
  onNewsletterGenerated?: (newsletter: any) => void;
}

export default function NewsletterGenerator({ onNewsletterGenerated }: NewsletterGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    style: 'professional',
    length: 'medium',
    includeTrends: true,
    includeSummaries: true,
    saveNewsletter: false,
    useRss: true,
    sinceDays: 3,
    rssLimit: 6,
    minQuality: 0.5
  });
  const [generatedNewsletter, setGeneratedNewsletter] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [saveDraftSuccess, setSaveDraftSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const styles = [
    { value: 'professional', label: 'Professional', description: 'Formal, business-appropriate tone' },
    { value: 'casual', label: 'Casual', description: 'Friendly, conversational tone' },
    { value: 'technical', label: 'Technical', description: 'Technical language and detailed explanations' },
    { value: 'creative', label: 'Creative', description: 'Engaging, creative language with storytelling' }
  ];

  const lengths = [
    { value: 'short', label: 'Short', description: '300-500 words', time: '2-3 min read' },
    { value: 'medium', label: 'Medium', description: '500-800 words', time: '4-6 min read' },
    { value: 'long', label: 'Long', description: '800-1200 words', time: '7-10 min read' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleGenerate = async () => {
    if (!formData.topic.trim() && !formData.useRss) {
      setError('Please enter a topic for your newsletter or enable RSS feeds');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Check if we're in test mode (no authentication required)
      const isTestMode = process.env.NODE_ENV === 'development' && window.location.search.includes('test=true');
      
      let response;
      if (isTestMode) {
        console.log('🧪 Test mode: Using test endpoint without authentication');
        response = await fetch(API_ENDPOINTS.NEWSLETTERS.TEST_GENERATE_CUSTOM, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });
      } else {
        const headers = await getAuthHeaders();
        console.log('API URL:', API_ENDPOINTS.NEWSLETTERS.GENERATE);
        console.log('Headers:', headers);
        // Map frontend field names to backend field names
        const requestData = {
          topic: formData.topic,
          style: formData.style,
          length: formData.length,
          include_trends: formData.includeTrends,
          include_summaries: formData.includeSummaries,
          save_newsletter: formData.saveNewsletter,
          use_rss: formData.useRss,
          since_days: formData.sinceDays,
          rss_limit: formData.rssLimit,
          min_quality: formData.minQuality
        };
        
        response = await fetch(API_ENDPOINTS.NEWSLETTERS.GENERATE, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestData)
        });
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please refresh the page and try again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your permissions.');
        } else {
          throw new Error(`Failed to generate newsletter (${response.status})`);
        }
      }

      const result = await response.json();
      setGeneratedNewsletter(result);
      
      if (onNewsletterGenerated) {
        onNewsletterGenerated(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedNewsletter?.newsletter_id) {
      setError('Newsletter must be saved before publishing');
      return;
    }

    setIsPublishing(true);
    setError(null);
    setPublishSuccess(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(API_ENDPOINTS.NEWSLETTERS.PUBLISH(generatedNewsletter.newsletter_id), {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to publish newsletter');
      }

      const result = await response.json();
      setPublishSuccess('Newsletter published successfully!');
      
      // Update the generated newsletter with published status
      setGeneratedNewsletter((prev: any) => ({
        ...prev,
        newsletter: {
          ...prev.newsletter,
          status: 'published',
          published_at: new Date().toISOString()
        }
      }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish newsletter');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!generatedNewsletter) {
      setError('No newsletter to save');
      return;
    }

    setIsSavingDraft(true);
    setError(null);
    setSaveDraftSuccess(null);

    try {
      const headers = await getAuthHeaders();
      
      // If newsletter already has an ID, update it; otherwise create new
      const url = generatedNewsletter.newsletter_id 
        ? API_ENDPOINTS.NEWSLETTERS.UPDATE(generatedNewsletter.newsletter_id)
        : API_ENDPOINTS.NEWSLETTERS.LIST;
      
      const method = generatedNewsletter.newsletter_id ? 'PUT' : 'POST';
      
      const newsletterData = {
        title: "Test Newsletter",
        subject: "Test Subject",
        content: '{"subject": "Test Newsletter", "opening": "This is a test", "sections": [], "call_to_action": "Test", "estimated_read_time": "5 minutes", "tags": []}',
        status: 'draft',
        tags: [],
        subscribers_count: 0,
        views_count: 0,
        open_rate: 0.0,
        click_rate: 0.0
      };

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(newsletterData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Save draft error:', errorData);
        throw new Error(errorData.detail || 'Failed to save newsletter draft');
      }

      const result = await response.json();
      setSaveDraftSuccess('Newsletter saved to drafts successfully!');
      
      // Update the generated newsletter with the saved ID
      if (!generatedNewsletter.newsletter_id && result.id) {
        setGeneratedNewsletter((prev: any) => ({
          ...prev,
          newsletter_id: result.id
        }));
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save newsletter draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleEditNewsletter = () => {
    if (!generatedNewsletter) {
      setError('No newsletter to edit');
      return;
    }

    // First save the newsletter if it hasn't been saved yet
    if (!generatedNewsletter.newsletter_id) {
      setError('Please save the newsletter to drafts first before editing');
      return;
    }

    setIsEditing(true);
  };

  const handleEditorSave = (updatedNewsletter: any) => {
    console.log('Editor save callback received:', updatedNewsletter);
    
    // Parse the content if it's a JSON string
    let updatedContent = updatedNewsletter.content;
    if (typeof updatedContent === 'string') {
      try {
        updatedContent = JSON.parse(updatedContent);
      } catch (e) {
        console.error('Failed to parse updated content:', e);
      }
    }
    
    setGeneratedNewsletter((prev: any) => ({
      ...prev,
      newsletter: updatedContent,
      newsletter_id: updatedNewsletter.id
    }));
    setIsEditing(false);
    setSaveDraftSuccess('Newsletter updated successfully!');
  };

  const handleEditorCancel = () => {
    setIsEditing(false);
  };

  // Helper function to clean and parse content
  const cleanContent = (content: string): string => {
    if (!content) return '';
    
    // Remove JSON code blocks if present
    let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to parse as JSON if it looks like JSON
    if (cleaned.trim().startsWith('{') && cleaned.trim().endsWith('}')) {
      try {
        const parsed = JSON.parse(cleaned);
        return parsed.content || parsed.opening || parsed;
      } catch (e) {
        // If JSON parsing fails, return the cleaned content
        return cleaned;
      }
    }
    
    return cleaned;
  };

  // If editing mode, show the editor
  if (isEditing && generatedNewsletter) {
    const newsletterForEditor = {
      id: generatedNewsletter.newsletter_id,
      title: generatedNewsletter.newsletter.subject,
      topic: formData.topic,
      content: generatedNewsletter.newsletter,
      status: 'draft',
      is_published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      read_time_minutes: generatedNewsletter.newsletter.estimated_read_time,
      tags: generatedNewsletter.newsletter.tags || []
    };

    console.log('Newsletter data for editor:', newsletterForEditor);

    return (
      <NewsletterEditor
        newsletter={newsletterForEditor}
        onSave={handleEditorSave}
        onCancel={handleEditorCancel}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-primary-200"
      >
        <div className="p-6">
          {!generatedNewsletter ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Newsletter</h2>
                <p className="text-gray-600">Generate AI-powered newsletters with RSS feeds</p>
              </div>

              {/* Topic Input */}
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                  Newsletter Topic {!formData.useRss ? '*' : '(Optional - AI will generate based on RSS articles)'}
                </label>
                <input
                  type="text"
                  id="topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder={formData.useRss ? "e.g., AI Trends (optional - AI will create a better topic from RSS articles)" : "e.g., AI Trends, Tech News, Startup Updates..."}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
                {formData.useRss && (
                  <p className="mt-1 text-sm text-blue-600">
                    ✨ When RSS is enabled, AI will analyze the articles and generate a more specific, engaging topic
                  </p>
                )}
              </div>

              {/* RSS Toggle */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="useRss"
                  name="useRss"
                  checked={formData.useRss}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="useRss" className="text-sm font-medium text-gray-700">
                  Use RSS feeds for content
                </label>
              </div>

              {/* Style Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Writing Style</label>
                <div className="grid grid-cols-2 gap-3">
                  {styles.map((style) => (
                    <label key={style.value} className="relative">
                      <input
                        type="radio"
                        name="style"
                        value={style.value}
                        checked={formData.style === style.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.style === style.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        <div className="font-medium text-sm">{style.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{style.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Length Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Newsletter Length</label>
                <div className="grid grid-cols-3 gap-3">
                  {lengths.map((length) => (
                    <label key={length.value} className="relative">
                      <input
                        type="radio"
                        name="length"
                        value={length.value}
                        checked={formData.length === length.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.length === length.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        <div className="font-medium text-sm">{length.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{length.description}</div>
                        <div className="text-xs text-primary-600 mt-1">{length.time}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="includeTrends"
                    name="includeTrends"
                    checked={formData.includeTrends}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeTrends" className="text-sm font-medium text-gray-700">
                    Include trending topics
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="includeSummaries"
                    name="includeSummaries"
                    checked={formData.includeSummaries}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeSummaries" className="text-sm font-medium text-gray-700">
                    Include article summaries
                  </label>
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={isGenerating || (!formData.topic.trim() && !formData.useRss)}
                className="w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white py-3 px-6 rounded-lg font-medium hover:from-primary-700 hover:to-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating Newsletter...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Generate Newsletter
                  </>
                )}
              </motion.button>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Newsletter Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Generated Newsletter</h3>
                  {generatedNewsletter.newsletter.topic && generatedNewsletter.newsletter.topic !== formData.topic && (
                    <p className="text-sm text-blue-600 mt-1">
                      ✨ AI-generated topic: <span className="font-medium">{generatedNewsletter.newsletter.topic}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>{generatedNewsletter.newsletter.estimated_read_time}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TagIcon className="h-4 w-4" />
                    <span>{generatedNewsletter.newsletter.tags?.length || 0} tags</span>
                  </div>
                </div>
              </div>

              {/* Newsletter Preview */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                <div className="max-w-2xl mx-auto">
                  {/* Email Header */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">A</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">AI-Newz Newsletter</h4>
                        <p className="text-sm text-gray-500">ai-newz@example.com</p>
                      </div>
                    </div>
                    
                    {/* Subject Line */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Subject: {generatedNewsletter.newsletter.subject}</h3>
                      {generatedNewsletter.newsletter.topic && generatedNewsletter.newsletter.topic !== formData.topic && (
                        <p className="text-sm text-blue-600">
                          📝 Topic: {generatedNewsletter.newsletter.topic}
                        </p>
                      )}
                    </div>

                    {/* Newsletter Content Preview */}
                    <div className="space-y-4">
                      {/* Opening */}
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 leading-relaxed">
                          {cleanContent(generatedNewsletter.newsletter.opening)}
                        </p>
                      </div>

                      {/* All Sections - Full Content */}
                      {generatedNewsletter.newsletter.sections?.map((section: any, index: number) => (
                        <div key={index} className="border-l-4 border-primary-200 pl-4">
                          <h4 className="font-semibold text-gray-900 mb-2">{section.title}</h4>
                          <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none">
                            <p>{cleanContent(section.content)}</p>
                          </div>
                          <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {section.type}
                          </span>
                        </div>
                      ))}

                      {/* Call to Action */}
                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                        <h4 className="font-semibold text-primary-900 mb-2">Call to Action</h4>
                        <p className="text-primary-700 text-sm">
                          {cleanContent(generatedNewsletter.newsletter.call_to_action)}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="border-t border-gray-200 pt-4 text-center">
                        <p className="text-xs text-gray-500">
                          Estimated read time: {generatedNewsletter.newsletter.estimated_read_time} • 
                          Tags: {generatedNewsletter.newsletter.tags?.join(', ') || 'None'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sources Used Section */}
              <div className="space-y-4">
                {Array.isArray(generatedNewsletter.included_articles) && generatedNewsletter.included_articles.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Sources used ({generatedNewsletter.included_articles.length})</h4>
                    <div className="space-y-2">
                      {generatedNewsletter.included_articles.map((a: any, i: number) => {
                        const host = (() => { try { return a.url ? new URL(a.url).hostname.replace('www.','') : ''; } catch { return ''; } })();
                        const source = a.rss_source_name || host;
                        return (
                          <div key={i} className="flex items-start justify-between gap-3 border border-gray-100 rounded-md p-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{source || 'Source'}</div>
                              <a href={a.url} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline truncate block">
                                {a.title || a.url}
                              </a>
                              {Array.isArray(a.tags) && a.tags.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {a.tags.slice(0,3).map((t: string, idx: number) => (
                                    <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 shrink-0">link</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setGeneratedNewsletter(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Generate Another
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isSavingDraft ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving to Draft...
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Save to Draft
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePublish}
                  disabled={isPublishing || !generatedNewsletter?.newsletter_id}
                  className="flex-1 bg-accent-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isPublishing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Publish
                    </>
                  )}
                </motion.button>
              </div>

              {/* Success Messages */}
              {publishSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">{publishSuccess}</p>
                </div>
              )}

              {saveDraftSuccess && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">{saveDraftSuccess}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}