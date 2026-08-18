import React from "react";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { navigateTo } = useStore();
  const { t } = useLanguage();

  const departments = [
    { label: t("footer.linkLaptops"), category: "laptops" },
    { label: t("footer.linkMonitors"), category: "monitors" },
    { label: t("footer.linkPc"), category: "pc-bundles" },
    { label: t("footer.linkGear"), category: "accessories" },
  ];

  const supportLinks = [
    t("footer.linkContact"),
    t("footer.linkWarranty"),
    t("footer.linkReturns"),
    t("footer.linkShipping"),
  ];

  const companyLinks = [
    t("footer.linkAbout"),
    t("footer.linkPress"),
    t("footer.linkCareers"),
    t("footer.linkPrivacy"),
  ];

  return (
    <footer className="site-footer">
      {/* ─── Main Footer Links ─── */}
      <div className="footer-container">
        {/* Brand Column */}
        <div className="footer-brand-col">
          <button onClick={() => navigateTo("home")} className="footer-logo-btn">
            <img
              src="/Assets/no bg logo.webp"
              alt="Nova Store"
              className="footer-logo-img"
              width={145}
              height={145}
              loading="lazy"
              decoding="async"
            />
          </button>
          <p className="footer-brand-desc">{t("footer.brandDesc")}</p>
        </div>

        {/* Links Column 1 */}
        <div className="footer-col">
          <h4 className="footer-col-title">{t("footer.colDepartments")}</h4>
          <ul className="footer-links">
            {departments.map((d) => (
              <li key={d.category}>
                <button onClick={() => navigateTo("catalog", { category: d.category })}>
                  {d.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Links Column 2 */}
        <div className="footer-col">
          <h4 className="footer-col-title">{t("footer.colCare")}</h4>
          <ul className="footer-links">
            {supportLinks.map((link, i) => (
              <li key={i}>
                <a href="#support" onClick={(e) => e.preventDefault()}>{link}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Links Column 3 */}
        <div className="footer-col">
          <h4 className="footer-col-title">{t("footer.colCompany")}</h4>
          <ul className="footer-links">
            {companyLinks.map((link, i) => (
              <li key={i}>
                <a href="#about" onClick={(e) => e.preventDefault()}>{link}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ─── Bottom Copyright Bar ─── */}
      <div className="footer-bottom-bar">
        <div className="footer-bottom-container">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <div className="footer-bottom-links">
            <a href="#privacy" onClick={(e) => e.preventDefault()}>{t("footer.footerPrivacy")}</a>
            <span>&bull;</span>
            <a href="#terms" onClick={(e) => e.preventDefault()}>{t("footer.footerTerms")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}