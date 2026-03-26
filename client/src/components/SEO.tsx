import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
}

export default function SEO({ 
  title, 
  description,
  keywords
}: SEOProps) {
  const { t, i18n } = useTranslation();

  const seoTitle = title || t("seo.default_title");
  const seoDesc = description || t("seo.default_desc");
  const seoKeywords = keywords || t("seo.default_keywords");

  useEffect(() => {
    document.title = seoTitle;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', seoDesc);

    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', seoKeywords);
  }, [seoTitle, seoDesc, seoKeywords, i18n.language]);

  return null;
}
