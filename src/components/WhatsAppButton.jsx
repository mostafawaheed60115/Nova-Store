import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

export default function WhatsAppButton() {
  const { lang, isRtl } = useLanguage();
  const phoneNumber = "201509999283";

  const message = isRtl
    ? "مرحباً نوفا ستور، أود الاستفسار عن المنتجات والطلبات."
    : "Hello Nova Store, I would like to inquire about products and orders.";

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float-btn"
      aria-label={isRtl ? "تواصل معنا عبر واتساب" : "Contact us on WhatsApp"}
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -6, 0],
      }}
      transition={{
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
        y: {
          repeat: Infinity,
          duration: 3,
          ease: "easeInOut",
        },
      }}
      whileHover={{
        scale: 1.08,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.92 }}
    >
      {/* Online indicator dot */}
      <span className="whatsapp-online-dot" />

      {/* Official WhatsApp SVG Icon */}
      <svg
        className="whatsapp-icon"
        viewBox="0 0 32 32"
        width="28"
        height="28"
        fill="currentColor"
      >
        <path d="M16 0.5C7.44 0.5 0.5 7.44 0.5 16C0.5 18.73 1.21 21.37 2.56 23.7L0.8 30.2L7.49 28.46C9.74 29.69 12.28 30.34 14.9 30.34H14.91C23.47 30.34 30.41 23.4 30.41 14.84C30.41 10.73 28.81 6.87 25.9 3.96C22.99 1.05 19.13 0.5 16 0.5ZM16 27.84C13.67 27.84 11.4 27.21 9.42 26.04L8.95 25.76L4.99 26.8L6.05 22.94L5.74 22.45C4.45 20.4 3.77 18.01 3.77 15.54C3.77 8.79 9.25 3.31 16 3.31C19.27 3.31 22.33 4.59 24.64 6.9C26.95 9.21 28.23 12.27 28.23 15.54C28.23 22.29 22.75 27.84 16 27.84ZM22.7 18.82C22.33 18.64 20.53 17.75 20.2 17.63C19.86 17.51 19.62 17.45 19.38 17.81C19.13 18.18 18.43 19.04 18.22 19.29C18 19.53 17.78 19.56 17.41 19.38C17.04 19.19 15.86 18.81 14.45 17.56C13.36 16.59 12.62 15.39 12.41 15.02C12.19 14.65 12.38 14.45 12.57 14.27C12.74 14.1 12.94 13.84 13.13 13.62C13.31 13.4 13.37 13.25 13.5 13C13.62 12.75 13.56 12.54 13.47 12.35C13.38 12.17 12.64 10.36 12.33 9.62C12.03 8.91 11.73 9 11.51 9C11.3 9 11.06 8.99 10.81 8.99C10.57 8.99 10.17 9.08 9.83 9.45C9.5 9.82 8.54 10.72 8.54 12.54C8.54 14.36 9.86 16.12 10.05 16.36C10.23 16.61 12.65 20.33 16.35 21.93C17.23 22.31 17.92 22.54 18.46 22.71C19.34 22.99 20.15 22.95 20.78 22.86C21.49 22.75 22.95 21.97 23.26 21.11C23.56 20.25 23.56 19.52 23.47 19.37C23.38 19.21 23.07 19.01 22.7 18.82Z" />
      </svg>

      {/* Floating text badge */}
      <span className="whatsapp-label">
        {isRtl ? "تواصل معنا" : "WhatsApp"}
      </span>
    </motion.a>
  );
}
