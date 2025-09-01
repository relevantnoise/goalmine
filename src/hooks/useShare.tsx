import { useState } from "react";
import { toast } from "sonner";

interface ShareData {
  title: string;
  text: string;
  url?: string;
}

export const useShare = () => {
  const [isSharing, setIsSharing] = useState(false);

  const shareGoal = async (goalTitle: string, goalDescription?: string, streakCount?: number) => {
    setIsSharing(true);
    
    const shareText = `🎯 I'm working on my goal: "${goalTitle}"${goalDescription ? ` - ${goalDescription}` : ''}${streakCount ? ` Currently on a ${streakCount} day streak! 🔥` : ''}

Join me in achieving your goals with GoalMine.ai!`;

    const shareUrl = window.location.origin;
    const shareData: ShareData = {
      title: `My Goal: ${goalTitle}`,
      text: shareText,
      url: shareUrl
    };

    try {
      // Always use custom sharing modal for consistent experience
      openSharingOptions(shareData);
    } catch (error) {
      console.error('Sharing error:', error);
      toast.error("Unable to share goal. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const openSharingOptions = (shareData: ShareData) => {
    const encodedText = encodeURIComponent(shareData.text);
    const encodedUrl = encodeURIComponent(shareData.url || "");
    const encodedTitle = encodeURIComponent(shareData.title);
    
    // Create sharing URLs
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}`
    };

    // Create a simple sharing popup
    const popup = document.createElement('div');
    popup.id = 'share-popup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      z-index: 1000;
      max-width: 300px;
      width: 90%;
    `;

    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'share-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 999;
    `;

    // Close handlers
    const closePopup = () => {
      const existingPopup = document.getElementById('share-popup');
      const existingBackdrop = document.getElementById('share-backdrop');
      if (existingPopup && existingPopup.parentNode) {
        existingPopup.parentNode.removeChild(existingPopup);
      }
      if (existingBackdrop && existingBackdrop.parentNode) {
        existingBackdrop.parentNode.removeChild(existingBackdrop);
      }
    };

    const openUrl = (url: string) => {
      window.open(url, '_blank', 'noopener,noreferrer');
      closePopup();
    };

    popup.innerHTML = `
      <div style="margin-bottom: 15px; font-weight: 600; text-align: center;">Share Your Goal</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
        <button data-share="twitter" style="padding: 8px 12px; border: 1px solid #1da1f2; background: #1da1f2; color: white; border-radius: 4px; cursor: pointer; font-size: 12px;">X</button>
        <button data-share="facebook" style="padding: 8px 12px; border: 1px solid #4267B2; background: #4267B2; color: white; border-radius: 4px; cursor: pointer; font-size: 12px;">Facebook</button>
        <button data-share="linkedin" style="padding: 8px 12px; border: 1px solid #0077b5; background: #0077b5; color: white; border-radius: 4px; cursor: pointer; font-size: 12px;">LinkedIn</button>
      </div>
      <div style="margin-top: 15px; text-align: center;">
        <button id="closeShare" style="padding: 6px 16px; border: 1px solid #d1d5db; background: #f9fafb; color: #374151; border-radius: 4px; cursor: pointer; font-size: 12px;">Close</button>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(popup);

    // Add event listeners for share buttons
    popup.querySelectorAll('[data-share]').forEach(button => {
      button.addEventListener('click', (e) => {
        const platform = (e.target as HTMLElement).getAttribute('data-share');
        if (platform && shareUrls[platform as keyof typeof shareUrls]) {
          openUrl(shareUrls[platform as keyof typeof shareUrls]);
        }
      });
    });

    popup.querySelector('#closeShare')?.addEventListener('click', closePopup);
    backdrop.addEventListener('click', closePopup);

    // Auto-close after 30 seconds
    setTimeout(closePopup, 30000);
  };

  return {
    shareGoal,
    isSharing
  };
};