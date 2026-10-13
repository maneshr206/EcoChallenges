import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { createPost, getUploadUrl } from '../api/client';
import { Upload, CheckCircle, AlertTriangle, Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function SubmitProof() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [content,  setContent]  = useState('');
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState(null); // null | 'moderating' | 'approved' | 'flagged'
  const [photoErr, setPhotoErr] = useState(false); // show red border if no photo on submit

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPhotoErr(false);
  }, []);

  const removePhoto = () => {
    setFile(null);
    setPreview(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 5_000_000, // 5 MB
    onDropRejected: (rejected) => {
      const err = rejected[0]?.errors[0];
      if (err?.code === 'file-too-large') toast.error('Image must be under 5 MB');
      else toast.error('Only JPG, PNG or WebP images allowed');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── Validation ────────────────────────────────────────────────────────────
    if (!content.trim()) {
      toast.error('Please describe your action');
      return;
    }
    if (!file) {
      setPhotoErr(true);
      toast.error('A photo proof is required to complete the challenge');
      return;
    }

    setLoading(true);
    setStatus('moderating');

    try {
      // 1. Upload image to S3 via presigned URL
      let imageUrl = null;
      try {
        const { data: urlData } = await getUploadUrl(file.name, file.type);
        await axios.put(urlData.uploadUrl, file, {
          headers: { 'Content-Type': file.type },
        });
        imageUrl = urlData.fileUrl;
      } catch (uploadErr) {
        // In local dev the mock upload URL (httpbin) may fail — still submit the post
        // In production a real S3 failure should block submission
        const isLocal = !import.meta.env.VITE_COGNITO_USER_POOL_ID ||
          import.meta.env.VITE_COGNITO_USER_POOL_ID === 'us-east-1_PLACEHOLDER';
        if (!isLocal) {
          setStatus(null);
          toast.error('Image upload failed — please try again');
          return;
        }
        // Local: use the mock fileUrl anyway
        try {
          const { data: urlData } = await getUploadUrl(file.name, file.type);
          imageUrl = urlData.fileUrl;
        } catch { imageUrl = null; }
      }

      // 2. Create post — backend runs Comprehend + Rekognition
      const { data } = await createPost({ challengeId: id, content, imageUrl });

      if (data.moderationStatus === 'flagged') {
        setStatus('flagged');
        toast.error('Your post was flagged by our moderation system.');
      } else {
        setStatus('approved');
        toast.success('Proof submitted and approved! 🌿');
        setTimeout(() => navigate(`/challenges/${id}`), 1800);
      }
    } catch (err) {
      setStatus(null);
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Submit Your Proof 📸</h1>
      <p className="text-gray-500 text-sm mb-2">
        Show what you did — a photo is <strong>required</strong> to verify your completion.
        Our AI (AWS Comprehend + Rekognition) reviews every submission instantly.
      </p>

      {/* Required photo notice */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-6 text-sm text-amber-700">
        <Camera size={16} className="mt-0.5 flex-shrink-0" />
        <span>Photo proof is <strong>required</strong> — text only submissions are not accepted.</span>
      </div>

      {/* Status banners */}
      {status === 'approved' && (
        <div className="card bg-eco-50 border-eco-200 text-eco-800 flex items-center gap-3 mb-6">
          <CheckCircle className="text-eco-600 flex-shrink-0" size={24} />
          <div>
            <p className="font-semibold">Proof approved!</p>
            <p className="text-sm">Redirecting back to the challenge…</p>
          </div>
        </div>
      )}
      {status === 'flagged' && (
        <div className="card bg-red-50 border-red-200 text-red-800 flex items-center gap-3 mb-6">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
          <div>
            <p className="font-semibold">Post flagged</p>
            <p className="text-sm">Your content was removed by our moderation system. Please review our community guidelines.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card flex flex-col gap-5">

        {/* ── Photo upload (REQUIRED) ──────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photo proof <span className="text-red-500">*</span>
          </label>

          {preview ? (
            /* Preview with remove button */
            <div className="relative rounded-xl overflow-hidden border border-eco-300">
              <img src={preview} alt="Preview" className="w-full max-h-56 object-cover" />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                title="Remove photo"
              >
                <X size={16} />
              </button>
              <span className="absolute bottom-2 left-2 bg-eco-700/80 text-white text-xs px-2 py-0.5 rounded-full">
                ✓ Photo added
              </span>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-eco-400 bg-eco-50'
                  : photoErr
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 hover:border-eco-400 hover:bg-eco-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${photoErr ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <Upload size={22} className={photoErr ? 'text-red-400' : 'text-gray-400'} />
                </div>
                <p className={`text-sm font-medium ${photoErr ? 'text-red-600' : 'text-gray-600'}`}>
                  {photoErr ? 'Photo is required — please add one' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-gray-400">JPG, PNG, WebP · max 5 MB</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Description (REQUIRED) ─────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Describe your action <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="e.g. I walked to work today instead of driving — saved about 2kg of CO₂!"
            className="input resize-none"
            required
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{content.length}/500</p>
        </div>

        {/* ── Submit ─────────────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={loading || status === 'approved'}
          className="btn-primary w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {status === 'moderating' ? 'AI is reviewing your proof…' : 'Submitting…'}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Camera size={16} /> Submit Proof
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
