import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // For now, return default settings
    const defaultSettings = {
      email_notifications: true,
      push_notifications: false,
      newsletter_alerts: true,
      system_updates: true
    };

    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settings = await request.json();
    
    // In a real app, you'd save to your backend
    console.log('Saving notification settings:', settings);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notification settings saved successfully' 
    });
  } catch (error) {
    console.error('Error saving notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to save notification settings' },
      { status: 500 }
    );
  }
}
