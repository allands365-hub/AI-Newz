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
    minQuality: 0.1,
    // Additional RSS fields
    requireImage: false,
    minWordCount: 10,
    dedupeTitleSimilarity: 0.85,
    perSourceCap: 3,
    includeFields: ['title', 'summary', 'url', 'tags']
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
          min_quality: formData.minQuality,
          // Additional RSS fields
          require_image: formData.requireImage,
          min_word_count: formData.minWordCount,
          dedupe_title_similarity: formData.dedupeTitleSimilarity,
          per_source_cap: formData.perSourceCap,
          include_fields: formData.includeFields,
          sort_by: 'recency_then_quality'
        };
        console.log('Request body:', JSON.stringify(requestData, null, 2));
        
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
      
      // Debug: Log the full response
      console.log('Newsletter generation response:', result);
      console.log('Included articles:', result.included_articles);
      console.log('Articles count:', result.included_articles?.length || 0);
      console.log('Raw content (first 500 chars):', result.raw_content?.substring(0, 500));
      
      // Parse the newsletter content if it's a JSON string
      if (result.newsletter && typeof result.newsletter === 'string') {
        try {
          result.newsletter = JSON.parse(result.newsletter);
        } catch (e) {
          console.error('Failed to parse newsletter content:', e);
        }
      }
      
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
    if (!generatedNewsletter) {
      setError('No newsletter to publish');
      return;
    }

    setIsPublishing(true);
    setError(null);
    setPublishSuccess(null);

    try {
      const headers = await getAuthHeaders();
      
      // Prepare newsletter data for direct publishing
      const newsletterContent = {
        ...generatedNewsletter.newsletter,
        // Include articles if available
        articles: generatedNewsletter.included_articles || []
      };
      
      const newsletterData = {
        title: generatedNewsletter.newsletter?.subject || "Generated Newsletter",
        subject: generatedNewsletter.newsletter?.subject || "Generated Newsletter",
        content: JSON.stringify(newsletterContent),
        status: 'published',
        tags: generatedNewsletter.newsletter?.tags || [],
        subscribers_count: 0,
        views_count: 0,
        open_rate: 0.0,
        click_rate: 0.0,
        estimated_read_time: generatedNewsletter.newsletter?.estimated_read_time || "5 minutes"
      };

      const response = await fetch(API_ENDPOINTS.NEWSLETTERS.PUBLISH_DIRECT, {
        method: 'POST',
        headers,
        body: JSON.stringify(newsletterData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to publish newsletter');
      }

      const result = await response.json();
      
      // Show success message with email status
      const emailStatus = result.email_sent ? ' and sent to allands365@gmail.com' : ' (email sending failed)';
      setPublishSuccess(`Newsletter published successfully${emailStatus}! Also saved as draft.`);
      
      // Update the generated newsletter with published status and IDs
      setGeneratedNewsletter((prev: any) => ({
        ...prev,
        newsletter_id: result.newsletter_id,
        draft_id: result.draft_id,
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
      
      const newsletterContent = {
        ...generatedNewsletter.newsletter,
        // Include articles if available
        articles: generatedNewsletter.included_articles || []
      };
      
      const newsletterData = {
        title: generatedNewsletter.newsletter?.subject || "Generated Newsletter",
        subject: generatedNewsletter.newsletter?.subject || "Generated Newsletter",
        content: JSON.stringify(newsletterContent),
        status: 'draft',
        tags: generatedNewsletter.newsletter?.tags || [],
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
  const cleanContent = (content: any): string => {
    if (!content) return '';
    
    // If content is already a string and doesn't look like JSON, return as is
    if (typeof content === 'string' && !content.trim().startsWith('{')) {
      return content;
    }
    
    // If content is an object, return as is (it's already parsed)
    if (typeof content === 'object' && content !== null) {
      return content;
    }
    
    // Remove JSON code blocks if present
    let cleaned = content.toString().replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to parse as JSON if it looks like JSON
    if (cleaned.trim().startsWith('{') && cleaned.trim().endsWith('}')) {
      try {
        const parsed = JSON.parse(cleaned);
        // If it's a newsletter object, return the opening or content
        if (parsed.opening) {
          return parsed.opening;
        } else if (parsed.content) {
          return parsed.content;
        } else if (typeof parsed === 'string') {
          return parsed;
        } else {
          // If it's a complex object, return a string representation
          return JSON.stringify(parsed, null, 2);
        }
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

              {/* Articles Used Section - Enhanced */}
              {Array.isArray(generatedNewsletter.included_articles) && generatedNewsletter.included_articles.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        Articles Used in Generation
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {generatedNewsletter.included_articles.length} articles from RSS feeds were analyzed to create this newsletter
                      </p>
                    </div>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {generatedNewsletter.included_articles.length} sources
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    {generatedNewsletter.included_articles.map((article: any, index: number) => {
                      const host = (() => { 
                        try { 
                          return article.url ? new URL(article.url).hostname.replace('www.','') : ''; 
                        } catch { 
                          return ''; 
                        } 
                      })();
                      const source = article.rss_source_name || host;
                      const hasImage = article.image_url && article.image_url !== 'no-image';
                      
                      return (
                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                          <div className="flex gap-4">
                            {/* Article Image */}
                            {hasImage && (
                              <div className="flex-shrink-0">
                                <img 
                                  src={article.image_url} 
                                  alt={article.title}
                                  className="w-20 h-20 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Article Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h5 className="font-semibold text-gray-900 line-clamp-2 leading-tight">
                                  {article.title || 'Untitled Article'}
                                </h5>
                                <a 
                                  href={article.url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Open article"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                              
                              {/* Source */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-blue-600">{source || 'Unknown Source'}</span>
                                {article.published_at && (
                                  <span className="text-xs text-gray-500">
                                    • {new Date(article.published_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              
                              {/* Summary */}
                              {article.summary && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                  {article.summary}
                                </p>
                              )}
                              
                              {/* Tags */}
                              {Array.isArray(article.tags) && article.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {article.tags.slice(0, 4).map((tag: string, tagIndex: number) => (
                                    <span 
                                      key={tagIndex} 
                                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {article.tags.length > 4 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                      +{article.tags.length - 4} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <span>📊 {generatedNewsletter.included_articles.length} articles analyzed</span>
                        <span>🎯 AI-generated topic: <span className="font-medium text-gray-900">{generatedNewsletter.newsletter.topic}</span></span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Generated with {generatedNewsletter.model_used}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                  disabled={isPublishing || !generatedNewsletter}
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