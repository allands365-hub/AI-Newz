'use client';

import { motion } from 'framer-motion';
import { 
  DocumentTextIcon, 
  ArrowLeftIcon,
  ClockIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

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

interface NewsletterPreviewProps {
  newsletter: Newsletter;
  onBack?: () => void;
  onEdit?: () => void;
  onPublish?: () => void;
}

export default function NewsletterPreview({ 
  newsletter, 
  onBack, 
  onEdit, 
  onPublish 
}: NewsletterPreviewProps) {
  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return '📈';
      case 'summary':
        return '📝';
      default:
        return '📄';
    }
  };

  const getSectionColor = (type: string) => {
    switch (type) {
      case 'trend':
        return 'bg-blue-50 border-blue-200';
      case 'summary':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
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
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Back to editor"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <DocumentTextIcon className="h-6 w-6 text-primary-600" />
              <h1 className="text-xl font-semibold text-gray-900">Newsletter Preview</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Edit
                </button>
              )}
              
              {!newsletter.is_published && onPublish && (
                <button
                  onClick={onPublish}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Publish
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Newsletter Content */}
        <div className="p-6">
          {/* Email Header */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{newsletter.title}</h2>
              <div className="flex items-center space-x-2">
                {newsletter.is_published ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <XCircleIcon className="h-3 w-3 mr-1" />
                    Draft
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-lg font-semibold text-gray-800 mb-2">
              Subject: {newsletter.content.subject}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                {newsletter.content.estimated_read_time}
              </div>
              {newsletter.content.tags && newsletter.content.tags.length > 0 && (
                <div className="flex items-center">
                  <TagIcon className="h-4 w-4 mr-1" />
                  {newsletter.content.tags.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Opening */}
          <div className="mb-8">
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed">
                {newsletter.content.opening}
              </p>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {newsletter.content.sections.map((section, index) => (
              <div key={index} className={`rounded-lg border p-6 ${getSectionColor(section.type)}`}>
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">{getSectionIcon(section.type)}</span>
                  <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
                  <span className="ml-auto text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {section.type}
                  </span>
                </div>
                
                <div className="prose max-w-none">
                  <div 
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ 
                      __html: section.content.replace(/\n/g, '<br>') 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          {newsletter.content.call_to_action && (
            <div className="mt-8 p-6 bg-primary-50 border border-primary-200 rounded-lg">
              <h3 className="text-lg font-semibold text-primary-900 mb-3">Call to Action</h3>
              <p className="text-primary-800 leading-relaxed">
                {newsletter.content.call_to_action}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-500">
              <p>This newsletter was generated by AI-Newz</p>
              <p className="mt-1">
                Created on {new Date(newsletter.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
