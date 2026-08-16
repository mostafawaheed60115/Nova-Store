import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../context/StoreContext";
import { convertToWebP, uploadImageToSupabase } from "../utils/imageConverter";
import {
  X,
  UploadCloud,
  FileImage,
  CheckCircle2,
  Copy,
  ArrowRight,
  LogOut,
  Check,
  ShieldCheck,
  Building,
} from "lucide-react";

export default function AdminModal({ isOpen, onClose }) {
  const { navigateTo, addToast } = useStore();

  // WebP Uploader State
  const [selectedFile, setSelectedFile] = useState(null);
  const [convertedWebP, setConvertedWebP] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploadFolder, setUploadFolder] = useState("products");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadedUrl("");
    setConvertedWebP(null);

    try {
      const res = await convertToWebP(file, { quality: 0.88 });
      setConvertedWebP(res);
      addToast("Image converted to WebP format!", "success");
    } catch (err) {
      addToast(`Conversion failed: ${err.message}`, "error");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const result = await uploadImageToSupabase(selectedFile, uploadFolder);
      setUploadedUrl(result.url);
      addToast(
        `Uploaded to Storage! (${result.compressionRatio}% size reduction)`,
        "success"
      );
    } catch (err) {
      addToast(`Upload failed: ${err.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyLink = () => {
    if (!uploadedUrl) return;
    navigator.clipboard?.writeText(uploadedUrl);
    setCopiedUrl(true);
    addToast("Image CDN URL copied to clipboard!", "success");
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="admin-modal-overlay" onClick={onClose}>
        <motion.div
          className="admin-modal-container"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="admin-modal-header">
            <div className="admin-modal-title">
              <div className="admin-icon-box">
                <UploadCloud size={20} color="var(--powder-blue)" />
              </div>
              <div>
                <h3>Nova Media Studio & Dashboard Shortcuts</h3>
                <p>Fast WebP conversion and operations links</p>
              </div>
            </div>
            <button className="admin-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="admin-modal-body">
            {/* Quick Links to Full Operations Consoles */}
            <div className="quick-nav-boxes">
              <button
                className="portal-link-card"
                onClick={() => {
                  onClose();
                  navigateTo("admin-dashboard");
                }}
              >
                <ShieldCheck size={20} color="var(--blue-bell)" />
                <div>
                  <strong>Open Master Admin Console</strong>
                  <p>Full catalog CRUD, orders, offers, coupons & CMS</p>
                </div>
                <ArrowRight size={16} />
              </button>

              <button
                className="portal-link-card supplier"
                onClick={() => {
                  onClose();
                  navigateTo("supplier-dashboard");
                }}
              >
                <Building size={20} color="#7C3AED" />
                <div>
                  <strong>Open Supplier Fulfillment Portal</strong>
                  <p>Order dispatch, shipping policies & inventory</p>
                </div>
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="admin-divider" style={{ margin: "1.25rem 0" }} />

            {/* WebP Studio */}
            <h4 style={{ fontSize: "0.95rem", marginBottom: "0.75rem", color: "var(--prussian-blue)" }}>
              Instant WebP Image Converter & Uploader
            </h4>

            <div
              className="webp-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleFileSelect}
              />
              <FileImage size={36} color="var(--blue-bell)" />
              <h4>Select or Drag Any Image Here</h4>
              <p>Automatic Client-Side HTML5 Canvas WebP Conversion</p>
            </div>

            <div className="folder-select-row" style={{ marginTop: "1rem" }}>
              <label>Target Folder:</label>
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                className="folder-select"
              >
                <option value="products">products/</option>
                <option value="hero">hero/</option>
                <option value="ads">ads/</option>
                <option value="categories">categories/</option>
              </select>
            </div>

            {convertedWebP && (
              <motion.div
                className="webp-preview-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: "1rem" }}
              >
                <img src={convertedWebP.dataUrl} alt="WebP" className="webp-preview-img" />
                <div className="preview-info-col">
                  <div className="conversion-badge">
                    <CheckCircle2 size={16} color="#10B981" />
                    <span>Converted ({convertedWebP.width}×{convertedWebP.height}px)</span>
                  </div>

                  <div className="metrics-grid">
                    <div className="metric-box">
                      <span className="metric-label">Original</span>
                      <span className="metric-val">{(convertedWebP.originalSize / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="metric-box highlight">
                      <span className="metric-label">WebP</span>
                      <span className="metric-val">{(convertedWebP.webpSize / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="metric-box success">
                      <span className="metric-label">Saved</span>
                      <span className="metric-val">-{convertedWebP.compressionRatio}%</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleUpload}
                    disabled={isUploading}
                  >
                    <UploadCloud size={16} />
                    {isUploading ? "Uploading..." : "Upload WebP to Supabase Storage"}
                  </button>
                </div>
              </motion.div>
            )}

            {uploadedUrl && (
              <motion.div
                className="uploaded-url-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: "1rem" }}
              >
                <div className="url-header">
                  <CheckCircle2 size={16} color="#10B981" />
                  <span>Public CDN URL Ready:</span>
                </div>
                <div className="url-copy-box">
                  <input type="text" readOnly value={uploadedUrl} className="url-input" />
                  <button className="copy-btn" onClick={handleCopyLink}>
                    {copiedUrl ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedUrl ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
