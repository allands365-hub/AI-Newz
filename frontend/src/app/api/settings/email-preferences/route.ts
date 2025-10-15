import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/api-config';

export async function GET() {
  try {
    // For now, return default preferences
    // In a real app, you'd fetch from your backend
    const defaultPreferences = {
      daily_digest: true,
      newsletter_notifications: true,
      marketing_emails: false,
      delivery_time: '08:00',
      frequency: 'daily'
    };

    return NextResponse.json(defaultPreferences);
  } catch (error) {
    console.error('Error fetching email preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const preferences = await request.json();
    
    // In a real app, you'd save to your backend
    console.log('Saving email preferences:', preferences);
    
    // For now, just return success
    return NextResponse.json({ 
      success: true, 
      message: 'Email preferences saved successfully' 
    });
  } catch (error) {
    console.error('Error saving email preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save email preferences' },
      { status: 500 }
    );
  }
}
