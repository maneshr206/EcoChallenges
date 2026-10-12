import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { createPost, getUploadUrl } from '../api/client';
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function SubmitProof() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent]   = useState('');
  const [file,    setFile]      = useState(null);
  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [status,  setStatus]    = useState(null); // null | 'moderating' | 'approved' | 'flagged'

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 5_000_000, // 5 MB
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) { toast.error('Please describe your action'); return; }
    setLoading(true);
    setStatus('moderating');

    try {
      let imageUrl = null;

      // 1. If image attached, upload via presigned URL
      if (file) {
        const { data } = await getUploadUrl(file.name, file.type);
        await axios.put(data.uploadUrl, file, { headers: { 'Content-Type': file.type } });
        imageUrl = data.fileUrl;
      }

      // 2. Create post (backend handles Comprehend + Rekognition moderation)
      const { data } = await createPost({
        challengeId: id,
        content,
        imageUrl,
      });

      if (data.moderationStatus === 'flagged') {
        setStatus('flagged');
        toast.error('Your post was flagged by our moderation system.');
      } else {
        setStatus('approved');
        toast.success('Post submitted and approved! 🌿');
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
      <p className="text-gray-500 text-sm mb-6">
        Describe what you did and optionally upload a photo. Our AI moderation
        (AWS Comprehend + Rekognition) will review it instantly.
      </p>

      {status === 'approved' && (
        <div className="card bg-eco-50 border-eco-200 text-eco-800 flex items-center gap-3 mb-6">
          <CheckCircle className="text-eco-600" size={24} />
          <div>
            <p className="font-semibold">Post approved!</p>
            <p className="text-sm">Redirecting back to the challenge…</p>
          </div>
        </div>
      )}

      {status === 'flagged' && (
        <div className="card bg-red-50 border-red-200 text-red-800 flex items-center gap-3 mb-6">
          <AlertTriangle className="text-red-500" size={24} />
          <div>
            <p className="font-semibold">Post flagged</p>
            <p className="text-sm">Your content was removed by our moderation system. Please review our community guidelines.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card flex flex-col gap-5">
        {/* Text proof */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Describe your action *
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

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photo proof (optional)
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-eco-400 bg-eco-50' : 'border-gray-300 hover:border-eco-300'
            }`}
          >
            <input {...getInputProps()} />
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Upload size={28} />
                <p className="text-sm">Drag & drop or click to upload</p>
                <p className="text-xs">JPG, PNG, WebP up to 5 MB</p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || status === 'approved'}
          className="btn-primary w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {status === 'moderating' ? 'AI is reviewing…' : 'Submitting…'}
            </span>
          ) : 'Submit Proof'}
        </button>
      </form>
    </div>
  );
}
