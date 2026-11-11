/* ==========================================================================
   DIGITAL MARKETING PRO — SITE SETTINGS  (the ONLY file you need to edit)
   --------------------------------------------------------------------------
   Anything left as "" is treated as "not added yet" and is hidden on the
   whole website automatically (buttons, footer, contact page, floating icons).
   No rebuild needed — just save this file and upload it.
   ========================================================================== */
window.MAXSYS_CONFIG = {

  /* ── Contact details ─────────────────────────────────────────────────── */
  contact: {
    phone: "+966547727535", // e.g. "+966500000000"
    whatsapp: "966547727535", // e.g. "966500000000"  (country code + number, no "+" or spaces)
    email: "info@digital-marketing-proo.com", // e.g. "info@yourdomain.com"
    address: { ar: "الرياض، المملكة العربية السعودية", en: "Riyadh, Saudi Arabia" },
    hours:   { ar: "", en: "" },   // e.g. { ar: "الأحد – الخميس: 9 ص – 6 م", en: "Sun – Thu: 9 AM – 6 PM" }
    /* Text pre-filled when the visitor opens WhatsApp */
    whatsappMessage: {
      ar: "مرحبًا، أريد الاستفسار عن خدمات ديجتال ماركتنج برو.",
      en: "Hello, I would like to inquire about Digital Marketing Pro services."
    }
  },

  /* ── Social media: paste the full profile link. Empty = hidden. ───────── */
  social: {
    facebook: "",       // e.g. "https://www.facebook.com/yourpage"
    instagram: "",
    youtube: "",        // e.g. "https://www.youtube.com/@yourchannel"
    linkedin: "",
    tiktok: "",
    snapchat: ""        // e.g. "https://www.snapchat.com/add/yourname"
  },

  /* ── Analytics (loaded ONLY after the visitor accepts cookies) ────────── */
  analytics: {
    ga4: "",            // e.g. "G-XXXXXXXXXX"
    gtm: "",            // e.g. "GTM-XXXXXXX"
    metaPixel: ""       // e.g. "123456789012345"
  },

  /* ── Contact form ─────────────────────────────────────────────────────── */
  form: {
    /* Where the form is sent. Default = the PHP file included in /api.
       You can also point it to any endpoint that accepts JSON (Make/Zapier/n8n …). */
    endpoint: "",       // "" = use the bundled api/contact.php
    minFillSeconds: 3,  // anti-bot: faster submissions are rejected
    turnstileSiteKey: ""// optional Cloudflare Turnstile site key (and set the secret in api/config.php)
  },

  /* ── Content switches ─────────────────────────────────────────────────── */
  content: {
    showDemoProjects: true,            // set false to hide the labelled demo projects
    showTestimonialPlaceholders: true, // set false until you have real testimonials
    /* Real, verified numbers ONLY. Leave [] to hide the stats strip.
       e.g. [{ value: 25, suffix: "+", label: { ar: "مشروع منجز", en: "Projects delivered" } }] */
    stats: [
      { value: 340, suffix: "+", label: { ar: "عميل سعيد", en: "Happy clients" } },
      { value: 9, suffix: "", live: true, label: { ar: "مشاريع تحت التنفيذ حاليًا", en: "Projects in progress now" } },
      { value: 2, suffix: "", label: { ar: "سوقان: السعودية ومصر", en: "Two markets: Saudi Arabia & Egypt" } },
      { value: 24, suffix: "", label: { ar: "ساعة — أقصى مدة للرد", en: "Hours — max. reply time" } }
    ]
  }
};
