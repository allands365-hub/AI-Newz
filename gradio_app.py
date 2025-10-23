"""
Gradio interface for AI-Newz on Hugging Face Spaces
This provides a simple web interface for the newsletter generation API
"""

import gradio as gr
import requests
import json
import os
from typing import Optional

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:7860")
API_KEY = os.getenv("API_KEY", "")

def generate_newsletter(
    title: str,
    subject: str,
    style: str,
    length: str,
    rss_sources: str,
    user_preferences: str
) -> str:
    """Generate a newsletter using the AI-Newz API"""
    
    try:
        # Prepare the request data
        data = {
            "title": title,
            "subject": subject,
            "style": style,
            "length": length,
            "rss_sources": rss_sources.split(",") if rss_sources else [],
            "user_preferences": user_preferences,
            "ai_model_used": "llama-3.1-70b-versatile"
        }
        
        # Make API request
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}" if API_KEY else ""
        }
        
        response = requests.post(
            f"{API_BASE_URL}/api/v1/newsletters/generate",
            json=data,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return f"✅ Newsletter generated successfully!\n\nTitle: {result.get('title', 'N/A')}\n\nContent:\n{result.get('content', 'No content generated')}"
        else:
            return f"❌ Error: {response.status_code} - {response.text}"
            
    except requests.exceptions.RequestException as e:
        return f"❌ Connection error: {str(e)}"
    except Exception as e:
        return f"❌ Error: {str(e)}"

def get_health_status() -> str:
    """Check API health status"""
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            return "✅ API is healthy and running"
        else:
            return f"⚠️ API returned status {response.status_code}"
    except Exception as e:
        return f"❌ API is not accessible: {str(e)}"

def get_rss_sources() -> str:
    """Get available RSS sources"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/v1/rss/sources", timeout=10)
        if response.status_code == 200:
            sources = response.json()
            return f"📰 Available RSS Sources:\n\n" + "\n".join([f"• {source.get('name', 'Unknown')}" for source in sources])
        else:
            return f"❌ Error fetching RSS sources: {response.status_code}"
    except Exception as e:
        return f"❌ Error: {str(e)}"

# Create Gradio interface
with gr.Blocks(
    title="AI-Newz: AI-Powered Newsletter Generator",
    theme=gr.themes.Soft(),
    css="""
    .gradio-container {
        max-width: 1200px !important;
        margin: auto !important;
    }
    .header {
        text-align: center;
        margin-bottom: 2rem;
    }
    .status-box {
        background: #f0f8ff;
        border: 1px solid #4a90e2;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    """
) as demo:
    
    # Header
    gr.HTML("""
    <div class="header">
        <h1>🤖 AI-Newz: AI-Powered Newsletter Generator</h1>
        <p>Create engaging newsletters using AI and RSS feeds</p>
    </div>
    """)
    
    # Status section
    with gr.Row():
        with gr.Column():
            status_btn = gr.Button("🔍 Check API Status", variant="secondary")
            status_output = gr.Textbox(
                label="API Status",
                interactive=False,
                value="Click 'Check API Status' to verify API connection"
            )
    
    # Main interface
    with gr.Row():
        with gr.Column(scale=2):
            gr.Markdown("## 📝 Newsletter Configuration")
            
            title_input = gr.Textbox(
                label="Newsletter Title",
                placeholder="e.g., Weekly Tech Digest",
                value="AI News Weekly"
            )
            
            subject_input = gr.Textbox(
                label="Email Subject",
                placeholder="e.g., This Week in AI",
                value="This Week in AI"
            )
            
            style_dropdown = gr.Dropdown(
                choices=["professional", "casual", "technical", "creative"],
                label="Writing Style",
                value="professional"
            )
            
            length_dropdown = gr.Dropdown(
                choices=["short", "medium", "long"],
                label="Newsletter Length",
                value="medium"
            )
            
            rss_sources_input = gr.Textbox(
                label="RSS Sources (comma-separated URLs)",
                placeholder="https://feeds.feedburner.com/techcrunch/startups,https://rss.cnn.com/rss/edition.rss",
                value=""
            )
            
            user_preferences_input = gr.Textbox(
                label="User Preferences",
                placeholder="e.g., Focus on AI, machine learning, and tech startups",
                value="Focus on AI, machine learning, and technology news"
            )
            
            generate_btn = gr.Button("🚀 Generate Newsletter", variant="primary", size="lg")
        
        with gr.Column(scale=1):
            gr.Markdown("## 📊 Quick Actions")
            
            rss_btn = gr.Button("📰 View RSS Sources", variant="secondary")
            rss_output = gr.Textbox(
                label="RSS Sources",
                interactive=False,
                lines=10
            )
    
    # Output section
    gr.Markdown("## 📄 Generated Newsletter")
    output_text = gr.Textbox(
        label="Newsletter Content",
        interactive=False,
        lines=20,
        placeholder="Generated newsletter content will appear here..."
    )
    
    # Event handlers
    status_btn.click(
        fn=get_health_status,
        outputs=status_output
    )
    
    rss_btn.click(
        fn=get_rss_sources,
        outputs=rss_output
    )
    
    generate_btn.click(
        fn=generate_newsletter,
        inputs=[
            title_input,
            subject_input,
            style_dropdown,
            length_dropdown,
            rss_sources_input,
            user_preferences_input
        ],
        outputs=output_text
    )
    
    # Footer
    gr.HTML("""
    <div style="text-align: center; margin-top: 2rem; color: #666;">
        <p>Built with ❤️ using FastAPI, Gradio, and AI</p>
        <p>Powered by Grok AI and RSS feeds</p>
    </div>
    """)

# Launch the app
if __name__ == "__main__":
    demo.launch(
        server_name="0.0.0.0",
        server_port=int(os.getenv("PORT", 7860)),
        share=False
    )
