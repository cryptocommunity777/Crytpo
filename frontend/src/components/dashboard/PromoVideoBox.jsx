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
    return <div className="w-full bg-white p-3 rounded-2xl border border-slate-200 animate-pulse h-36"></div>;
  }

  if (videos.length === 0) return null;

  const currentVideo = videos[currentIndex];
  const embedUrl = getEmbedUrl(currentVideo.youtubeUrl);

  return (
    <div className="relative overflow-hidden bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm group w-full">
      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-green-100 blur-[40px] rounded-full pointer-events-none"></div>

      <div className="relative z-10">
        
        {/* HEADER */}
        <div className="mb-2.5">
          <h3 className="text-black text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
            <div className="bg-green-50 p-1.5 rounded border border-green-100">
              <PlayCircle size={14} className="text-green-600" />
            </div>
            Videos
          </h3>
        </div>

        {/* YOUTUBE IFRAME */}
        <div className="w-full relative rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-900 aspect-video mb-3">
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
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Invalid URL</div>
          )}
        </div>

        {/* BOTTOM CONTROLS: PREV/NEXT (Left) + SHARE & COPY (Right) */}
        {/* 🔥 YAHAN CHANGE KIYA HAI: flex-nowrap lagaya aur gap kam kiya taaki ek hi line me aayein */}
        <div className="flex flex-nowrap items-center justify-between gap-1 sm:gap-3 mt-2 w-full overflow-x-auto no-scrollbar">
          
          {/* SLIDER CONTROLS */}
          {videos.length > 1 ? (
            <div className="flex items-center gap-1 bg-slate-50 p-1 sm:p-1.5 rounded-xl border border-slate-100 shrink-0">
              <button 
                onClick={handlePrev} 
                className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] sm:text-xs font-bold text-slate-700 transition-all active:scale-95 shadow-sm"
              >
                <ChevronLeft size={14} /> <span className="hidden min-[360px]:inline">Prev</span>
              </button>

              <span className="text-[10px] sm:text-xs font-black text-slate-500 tracking-widest px-1.5 sm:px-2">
                {currentIndex + 1} <span className="text-slate-300">/</span> {videos.length}
              </span>

              <button 
                onClick={handleNext} 
                className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] sm:text-xs font-bold text-slate-700 transition-all active:scale-95 shadow-sm"
              >
                <span className="hidden min-[360px]:inline">Next</span> <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div className="w-full sm:w-auto"></div> 
          )}

          {/* SHARE & COPY BUTTONS */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* COPY BUTTON */}
            <button 
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 sm:px-3 py-2 text-[10px] sm:text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors active:scale-95 border border-slate-200 shadow-sm"
            >
              {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              <span className="hidden min-[360px]:inline">{copied ? "COPIED" : "COPY"}</span>
            </button>

            {/* SHARE BUTTON */}
            <button 
              onClick={handleShare}
              className="flex items-center gap-1 px-2 sm:px-3 py-2 text-[10px] sm:text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors active:scale-95 shadow-sm"
            >
              <Share2 size={14} />
              <span className="hidden min-[360px]:inline">SHARE</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PromoVideoBox;