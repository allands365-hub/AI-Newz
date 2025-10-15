import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // For now, return default preferences
    const defaultPreferences = {
      default_style: 'professional',
      default_length: 'medium',
      include_trends: true,
      include_summaries: true,
      auto_save_drafts: true,
      ai_model: 'llama-3.1-70b-versatile'
    };

    return NextResponse.json(defaultPreferences);
  } catch (error) {
    console.error('Error fetching newsletter preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletter preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const preferences = await request.json();
    
    // In a real app, you'd save to your backend
    console.log('Saving newsletter preferences:', preferences);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Newsletter preferences saved successfully' 
    });
  } catch (error) {
    console.error('Error saving newsletter preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save newsletter preferences' },
      { status: 500 }
    );
  }
}
