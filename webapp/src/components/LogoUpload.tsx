"use client";

import { useRef, useState } from "react";
import type { LogoGalleryItem } from "@/lib/types";

interface Props {
  logoUrl: string | null;
  size?: number;
  onFile: (file: File) => void;
  gallery?: LogoGalleryItem[];
  onPickGallery?: (url: string) => void;
  onRemoveGallery?: (id: string) => void;
}

export default function LogoUpload({
  logoUrl,
  size = 56,
  onFile,
  gallery,
  onPickGallery,
  onRemoveGallery,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (f) onFile(f);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, width: size }}>
      <label
        className="dropzone"
        style={{
          width: size,
          height: size,
          borderColor: dragOver ? "#2C3E66" : undefined,
          background: dragOver ? "#EEF1F7" : undefined,
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <span style={{ fontSize: 8, color: "#9CA3AF", textAlign: "center", lineHeight: 1.3 }}>
            Arraste ou
            <br />
            envie logo
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
      {gallery ? (
        <button
          onClick={() => setGalleryOpen((v) => !v)}
          style={{
            fontSize: 10,
            color: "#2C3E66",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            fontWeight: 600,
            textAlign: "left",
          }}
        >
          Galeria
        </button>
      ) : null}

      {galleryOpen && gallery ? (
        <div
          className="ds-card"
          style={{ position: "absolute", marginTop: size + 20, padding: "14px 16px", zIndex: 20, maxWidth: 260 }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 10 }}>
            Escolher logo salva
          </div>
          {gallery.length === 0 ? (
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>
              Nenhuma logo salva ainda — envie uma para começar sua galeria.
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {gallery.map((g) => (
                <div key={g.id} style={{ position: "relative", width: 64, cursor: "pointer", textAlign: "center" }}>
                  <div
                    onClick={() => {
                      onPickGallery?.(g.url);
                      setGalleryOpen(false);
                    }}
                    style={{
                      width: 64,
                      height: 64,
                      border: "1px solid #E5E7EB",
                      borderRadius: 10,
                      overflow: "hidden",
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.url} alt={g.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#6B7280",
                      marginTop: 4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {g.name}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveGallery?.(g.id);
                    }}
                    title="Remover da galeria"
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#fff",
                      border: "1px solid #E5E7EB",
                      color: "#6B7280",
                      fontSize: 10,
                      cursor: "pointer",
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
