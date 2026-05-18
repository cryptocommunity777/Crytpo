import React, { useState, useEffect } from "react";
import { PlayCircle, ChevronLeft, ChevronRight, Share2, Check, Copy } from "lucide-react";
import api from "../../api/axios";

const PromoVideoBox = () => {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await api.get("/video/all");
        if (res.data && res.data.videos && res.data.videos.length > 0) {
          setVideos(res.data.videos);
          // HAR BAAR RANDOM VIDEO SE START HOGA
          const randomIndex = Math.floor(Math.random() * res.data.videos.length);
          setCurrentIndex(randomIndex);
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  // 🔥 COPY FUNCTION
  const handleCopy = () => {
    if (videos.length === 0) return;
    navigator.clipboard.writeText(videos[currentIndex].youtubeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 🔥 SHARE FUNCTION
  const handleShare = async () => {
    if (videos.length === 0) return;
    const videoUrl = videos[currentIndex].youtubeUrl;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this Promo Video!',
          text: 'Watch this awesome video here: ',
          url: videoUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Agar pc hai to copy kar dega
      handleCopy();
    }
  };

  if (loading) {
    return <div className="w-full bg-white p-3 rounded-2xl border border-slate-200 animate-pulse h-32"></div>;
  }

  if (videos.length === 0) return null;

  const currentVideo = videos[currentIndex];
  const embedUrl = getEmbedUrl(currentVideo.youtubeUrl);

  return (
    // 🔥 PADDING AUR KAM KI (p-2.5 sm:p-3) TAAKI BOX CHHOTA LAGE
    <div className="relative overflow-hidden bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-sm group w-full">
      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-green-100 blur-[40px] rounded-full pointer-events-none"></div>

      <div className="relative z-10">
        
        {/* HEADER - 🔥 HEADING AUR CHHOTI KAR DI */}
        <div className="mb-2">
          <h3 className="text-black text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
            <div className="bg-green-50 p-1 rounded border border-green-100">
              <PlayCircle size={12} className="text-green-600" />
            </div>
            Videos
          </h3>
        </div>

        {/* YOUTUBE IFRAME - 🔥 MARGIN KAM KIYA */}
        <div className="w-full relative rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-900 aspect-video mb-2">
          {embedUrl ? (
            <iframe
              className="w-full h-full"
              src={embedUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">Invalid URL</div>
          )}
        </div>

        {/* BOTTOM CONTROLS: PREV/NEXT (Left) + SHARE & COPY (Right) */}
        <div className="flex items-center justify-between">
          
          {/* SLIDER CONTROLS */}
          {videos.length > 1 ? (
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
              <button 
                onClick={handlePrev} 
                className="flex items-center justify-center w-5 h-5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition-all active:scale-95"
              >
                <ChevronLeft size={12} />
              </button>

              <span className="text-[9px] font-black text-slate-500 tracking-widest px-1">
                {currentIndex + 1} <span className="text-slate-300">/</span> {videos.length}
              </span>

              <button 
                onClick={handleNext} 
                className="flex items-center justify-center w-5 h-5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition-all active:scale-95"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          ) : (
            <div></div> // Empty div taaki right side wale buttons wahi rahein
          )}

          {/* 🔥 SHARE & COPY BUTTONS YAHAN HAIN */}
          <div className="flex items-center gap-1.5">
            {/* COPY BUTTON */}
            <button 
              onClick={handleCopy}
              className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1.5 rounded-lg transition-colors active:scale-95 border border-slate-200"
            >
              {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
              {copied ? "COPIED" : "COPY"}
            </button>

            {/* SHARE BUTTON */}
            <button 
              onClick={handleShare}
              className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-white bg-green-600 hover:bg-green-700 px-2 py-1.5 rounded-lg transition-colors active:scale-95 shadow-sm"
            >
              <Share2 size={12} />
              SHARE
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PromoVideoBox;