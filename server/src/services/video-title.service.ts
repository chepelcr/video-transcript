export interface IVideoTitleService {
  extractTitle(videoUrl: string): Promise<string>;
}

export class VideoTitleService implements IVideoTitleService {
  async extractTitle(videoUrl: string): Promise<string> {
    console.log(`🎥 Extracting video title from: ${videoUrl}`);
    
    try {
      // YouTube URL
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        return this.extractYouTubeTitle(videoUrl);
      }
      
      // Vimeo URL
      if (videoUrl.includes('vimeo.com')) {
        return this.extractVimeoTitle(videoUrl);
      }
      
      // Generic URL - try to get page title
      return this.extractGenericTitle(videoUrl);
      
    } catch (error) {
      console.log(`⚠️ Failed to extract video title: ${error.message}`);
      return 'Unknown Video';
    }
  }

  private async extractYouTubeTitle(videoUrl: string): Promise<string> {
    // Extract video ID
    const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Use oEmbed API to get video title
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    try {
      const response = await fetch(oembedUrl);
      if (!response.ok) {
        throw new Error(`oEmbed API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.title) {
        console.log(`✅ Extracted YouTube title: "${data.title}"`);
        return data.title;
      }
      
      throw new Error('No title in oEmbed response');
    } catch (error) {
      console.log(`⚠️ oEmbed API failed: ${error.message}`);
      // Fallback to generic extraction
      return this.extractGenericTitle(videoUrl);
    }
  }

  private async extractVimeoTitle(videoUrl: string): Promise<string> {
    // Extract video ID
    const videoId = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
    if (!videoId) {
      throw new Error('Invalid Vimeo URL');
    }

    // Use oEmbed API to get video title
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`;
    
    try {
      const response = await fetch(oembedUrl);
      if (!response.ok) {
        throw new Error(`Vimeo oEmbed API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.title) {
        console.log(`✅ Extracted Vimeo title: "${data.title}"`);
        return data.title;
      }
      
      throw new Error('No title in Vimeo oEmbed response');
    } catch (error) {
      console.log(`⚠️ Vimeo oEmbed API failed: ${error.message}`);
      // Fallback to generic extraction
      return this.extractGenericTitle(videoUrl);
    }
  }

  private async extractGenericTitle(videoUrl: string): Promise<string> {
    console.log(`🔍 Attempting generic title extraction from: ${videoUrl}`);
    
    try {
      const response = await fetch(videoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VideoTranscript/1.0)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      
      // Try to extract title from various meta tags and title tag
      const titleMatches = [
        html.match(/<title[^>]*>([^<]+)<\/title>/i),
        html.match(/<meta[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']+)["\'][^>]*>/i),
        html.match(/<meta[^>]*name=["\']twitter:title["\'][^>]*content=["\']([^"\']+)["\'][^>]*>/i),
        html.match(/<meta[^>]*name=["\']title["\'][^>]*content=["\']([^"\']+)["\'][^>]*>/i)
      ];
      
      for (const match of titleMatches) {
        if (match && match[1]) {
          const title = match[1].trim();
          if (title) {
            console.log(`✅ Extracted generic title: "${title}"`);
            return title;
          }
        }
      }
      
      // Fallback to URL-based name
      const urlParts = new URL(videoUrl);
      const pathname = urlParts.pathname;
      const filename = pathname.split('/').pop() || 'video';
      const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      
      console.log(`⚠️ Using URL-based fallback title: "${cleanName}"`);
      return cleanName || 'Unknown Video';
      
    } catch (error) {
      console.log(`❌ Generic title extraction failed: ${error.message}`);
      return 'Unknown Video';
    }
  }
}