"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "hi" | "mr";

export interface Translations {
  // Top bar & Header
  govtOfMah: string;
  deptName: string;
  portalSubtitle: string;
  helplineTitle: string;
  home: string;
  fileComplaint: string;
  trackComplaint: string;
  fdaContact: string;
  officerLogin: string;
  logout: string;
  signedInAs: string;


  // Home Hero
  grievanceRedressal: string;
  heroTitle: string;
  heroSubtitle: string;
  heroFileBtn: string;
  heroTrackBtn: string;
  verificationNotice: string;
  activeCases247: string;
  activeCasesLabel: string;
  responseTime: string;
  responseLabel: string;
  verifiedOfficers: string;
  officersLabel: string;

  // Services section
  servicesHeading: string;
  servicesSubtitle: string;
  service1Title: string;
  service1Desc: string;
  service1Cta: string;
  service2Title: string;
  service2Desc: string;
  service2Cta: string;
  service3Title: string;
  service3Desc: string;
  service3Cta: string;
  service4Title: string;
  service4Desc: string;
  service4Cta: string;
  service5Title: string;
  service5Desc: string;
  service5Cta: string;
  importantNoticeTitle: string;
  importantNoticeDesc: string;

  // Process / How it works
  processEyebrow: string;
  processTitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  step4Title: string;
  step4Desc: string;

  // CTA
  ctaTitle: string;
  ctaSubtitle: string;
  ctaBtn: string;

  // Complaint Form
  formTitle: string;
  formSubtitle: string;
  formSection1: string;
  complaintTypeLabel: string;
  selectComplaintType: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  formSection2: string;
  uploadClickText: string;
  formSection3: string;
  locationLabel: string;
  locationPlaceholder: string;
  getMyLocationBtn: string;
  locationSuccess: string;
  locationError: string;
  viewOnGmaps: string;
  formSection4: string;
  nameLabel: string;
  mobileLabel: string;
  emailLabel: string;
  declarationText: string;
  submitComplaintBtn: string;
  cancelBtn: string;

  // Tracking
  trackingTitle: string;
  trackingSubtitle: string;
  complaintIdLabel: string;
  trackBtn: string;
  progressTitle: string;
  currentStage: string;
  stageSubmitted: string;
  stageReview: string;
  stageAction: string;
  stageResolved: string;

  // Footer & Disclaimer
  footerAbout: string;
  quickLinksTitle: string;
  officialContactTitle: string;
  disclaimerTitle: string;
  disclaimerText: string;
  copyright: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    govtOfMah: "Government of Maharashtra",
    deptName: "Food and Drug Administration, Maharashtra",
    portalSubtitle: "Citizen Grievance Portal · नागरिक तक्रार पोर्टल",
    helplineTitle: "Official Helpline",
    home: "Home",
    fileComplaint: "File Complaint",
    trackComplaint: "Track Complaint",
    fdaContact: "FDA Contact",
    officerLogin: "Officer Login",
    logout: "Logout",
    signedInAs: "Signed in as",


    grievanceRedressal: "Citizen Grievance Redressal",
    heroTitle: "Help Us Keep Maharashtra Safe",
    heroSubtitle:
      "Report suspected food, drug and other FDA-related violations. Your complaint will be reviewed by authorized officers and acted upon as per applicable law.",
    heroFileBtn: "File a Complaint",
    heroTrackBtn: "Track Complaint",
    verificationNotice:
      "All complaints are subject to official verification. Any preliminary AI-generated priority score is only a recommendation and does not replace official investigation.",
    activeCases247: "24×7",
    activeCasesLabel: "Active Monitoring",
    responseTime: "48 hrs",
    responseLabel: "Target Response",
    verifiedOfficers: "Verified",
    officersLabel: "FDA Inspectors",

    servicesHeading: "Citizen Services",
    servicesSubtitle: "Everything you need to report a violation and follow its progress.",
    service1Title: "File New Complaint",
    service1Desc: "Report suspected food, drug and other FDA-related violations with full details.",
    service1Cta: "File Now",
    service2Title: "Upload Evidence",
    service2Desc: "Attach a photo (JPG / PNG / WEBP, up to 5 MB) to strengthen your complaint.",
    service2Cta: "Attach Photo",
    service3Title: "Geo-tag Location",
    service3Desc: "Share your precise location (only with your permission) to aid field officers.",
    service3Cta: "Use GPS",
    service4Title: "Track Complaint",
    service4Desc: "Check the live status of your complaint using your unique Complaint ID.",
    service4Cta: "Track Status",
    service5Title: "FDA Contact",
    service5Desc: "Official contact information of the Food & Drug Administration, Maharashtra.",
    service5Cta: "View Details",
    importantNoticeTitle: "Important Notice",
    importantNoticeDesc:
      "Submitted complaints are subject to official verification. Any automated priority score is only a preliminary recommendation.",

    processEyebrow: "Process",
    processTitle: "How It Works",
    step1Title: "Submit Complaint",
    step1Desc: "Provide details, evidence and location.",
    step2Title: "Receive Acknowledgement",
    step2Desc: "Get a unique Complaint ID.",
    step3Title: "Official Verification",
    step3Desc: "Authorized officers review and investigate.",
    step4Title: "Status Tracking",
    step4Desc: "Follow progress from Pending to Resolved.",

    ctaTitle: "Notice something unsafe?",
    ctaSubtitle:
      "Help keep Maharashtra safe — file a complaint today. Your details are visible only to authorized FDA officers.",
    ctaBtn: "File a Complaint Now",

    formTitle: "File a Complaint",
    formSubtitle:
      "Provide accurate details about the suspected violation. Your complaint will receive a unique Complaint ID and a preliminary automated priority assessment for the attention of authorized FDA officers.",
    formSection1: "1. Complaint Details",
    complaintTypeLabel: "Complaint Type",
    selectComplaintType: "Select complaint type…",
    descriptionLabel: "Complaint Description",
    descriptionPlaceholder:
      "Describe the issue in detail — what happened, where, when, and who is involved…",
    formSection2: "2. Upload Evidence (Optional)",
    uploadClickText: "Click to choose a photo (JPG, JPEG, PNG, WEBP — max 5 MB)",
    formSection3: "3. Complaint Location",
    locationLabel: "Location",
    locationPlaceholder: "e.g. Shivaji Nagar Market, Pune",
    getMyLocationBtn: "📍 Get My Location",
    locationSuccess: "Location detected successfully.",
    locationError:
      "Unable to detect location. Please allow location permission or enter the location manually.",
    viewOnGmaps: "View on Google Maps ↗",
    formSection4: "4. Your Details",
    nameLabel: "Full Name",
    mobileLabel: "Mobile Number",
    emailLabel: "Email",
    declarationText:
      "Declaration: I hereby declare that the information provided above is truthful and accurate to the best of my knowledge. This complaint is subject to official verification.",
    submitComplaintBtn: "Submit Complaint",
    cancelBtn: "Cancel",

    trackingTitle: "Track Complaint",
    trackingSubtitle:
      "Enter the Complaint ID you received (e.g. FDA-A1B2C3D4) to view its current status.",
    complaintIdLabel: "Complaint ID",
    trackBtn: "Track Complaint",
    progressTitle: "Progress",
    currentStage: "Current stage",
    stageSubmitted: "Complaint Submitted",
    stageReview: "Under Review",
    stageAction: "Action Taken",
    stageResolved: "Resolved",

    footerAbout:
      "The FDA Maharashtra regulates food safety, drug quality, cosmetics and medical devices across the state to protect public health.",
    quickLinksTitle: "Quick Links",
    officialContactTitle: "Official Contact",
    disclaimerTitle: "Prototype disclaimer:",
    disclaimerText:
      "This is a student / academic prototype and is not the official Maharashtra Government or FDA website. Any AI-assisted priority score is a preliminary recommendation only and does not replace official investigation or decisions by authorized FDA officers.",
    copyright: "© 2026 Food and Drug Administration, Maharashtra (Prototype)",
  },

  hi: {
    govtOfMah: "महाराष्ट्र शासन",
    deptName: "अन्न व औषध प्रशासन, महाराष्ट्र राज्य",
    portalSubtitle: "नागरिक तक्रार एवं निवारण पोर्टल",
    helplineTitle: "आधिकारिक हेल्पलाइन",
    home: "मुख्य पृष्ठ",
    fileComplaint: "तक्रार दर्ज करें",
    trackComplaint: "तक्रार की स्थिति",
    fdaContact: "एफडीए संपर्क",
    officerLogin: "अधिकारी लॉगिन",
    logout: "लॉगआउट",
    signedInAs: "लॉगिन उपयोगकर्ता",


    grievanceRedressal: "नागरिक शिकायत निवारण",
    heroTitle: "महाराष्ट्र को सुरक्षित रखने में हमारा सहयोग करें",
    heroSubtitle:
      "संदिग्ध खाद्य, औषधि और अन्य एफडीए उल्लंघन की रिपोर्ट करें। आपकी शिकायत की जांच अधिकृत अधिकारियों द्वारा कानून अनुसार की जाएगी।",
    heroFileBtn: "शिकायत दर्ज करें",
    heroTrackBtn: "शिकायत ट्रैक करें",
    verificationNotice:
      "सभी शिकायतें आधिकारिक सत्यापन के अधीन हैं। कोई भी प्रारंभिक एआई प्राथमिकता स्कोर केवल एक अनुशंसा है और आधिकारिक जांच का स्थान नहीं लेता है।",
    activeCases247: "24×7",
    activeCasesLabel: "सक्रिय निगरानी",
    responseTime: "48 घंटे",
    responseLabel: "लक्षित प्रतिक्रिया",
    verifiedOfficers: "सत्यापित",
    officersLabel: "एफडीए निरीक्षक",

    servicesHeading: "नागरिक सेवाएं",
    servicesSubtitle: "शिकायत दर्ज करने और उसकी प्रगति जानने के लिए सभी आवश्यक सेवाएं।",
    service1Title: "नई शिकायत दर्ज करें",
    service1Desc: "संदिग्ध खाद्य या औषधि उल्लंघन की पूरी जानकारी के साथ रिपोर्ट करें।",
    service1Cta: "अभी दर्ज करें",
    service2Title: "प्रमाण / फोटो अपलोड करें",
    service2Desc: "शिकायत के समर्थन में फोटो (JPG / PNG / WEBP, अधिकतम 5 MB) संलग्न करें।",
    service2Cta: "फोटो जोड़ें",
    service3Title: "स्थान जियो-टैग करें",
    service3Desc: "फील्ड अधिकारियों की सहायता के लिए अपनी अनुमति से सटीक स्थान साझा करें।",
    service3Cta: "जीपीएस उपयोग करें",
    service4Title: "शिकायत ट्रैक करें",
    service4Desc: "अपने विशिष्ट शिकायत आईडी का उपयोग करके लाइव स्थिति देखें।",
    service4Cta: "स्थिति देखें",
    service5Title: "एफडीए संपर्क",
    service5Desc: "अन्न व औषध प्रशासन, महाराष्ट्र की आधिकारिक संपर्क जानकारी।",
    service5Cta: "विवरण देखें",
    importantNoticeTitle: "महत्वपूर्ण सूचना",
    importantNoticeDesc:
      "दर्ज की गई शिकायतें आधिकारिक सत्यापन के अधीन हैं। कोई भी स्वचालित स्कोर केवल प्रारंभिक मार्गदर्शन के लिए है।",

    processEyebrow: "प्रक्रिया",
    processTitle: "यह कैसे काम करता है",
    step1Title: "शिकायत जमा करें",
    step1Desc: "विवरण, प्रमाण और स्थान प्रदान करें।",
    step2Title: "पावती प्राप्त करें",
    step2Desc: "एक अद्वितीय शिकायत आईडी प्राप्त करें।",
    step3Title: "आधिकारिक सत्यापन",
    step3Desc: "अधिकृत अधिकारी समीक्षा और जांच करते हैं।",
    step4Title: "स्थिति ट्रैकिंग",
    step4Desc: "लंबित से लेकर निस्तारण तक प्रगति का पालन करें।",

    ctaTitle: "क्या कुछ असुरक्षित पाया?",
    ctaSubtitle:
      "महाराष्ट्र को सुरक्षित रखने में मदद करें — आज ही शिकायत दर्ज करें। आपका विवरण केवल अधिकृत एफडीए अधिकारियों को दिखाई देता है।",
    ctaBtn: "अभी शिकायत दर्ज करें",

    formTitle: "शिकायत दर्ज करें",
    formSubtitle:
      "संदिग्ध उल्लंघन के बारे में सटीक विवरण प्रदान करें। आपकी शिकायत को एक विशिष्ट आईडी और अधिकृत अधिकारियों के लिए प्रारंभिक प्राथमिकता दी जाएगी।",
    formSection1: "1. शिकायत का विवरण",
    complaintTypeLabel: "शिकायत का प्रकार",
    selectComplaintType: "शिकायत प्रकार चुनें…",
    descriptionLabel: "शिकायत का विस्तृत विवरण",
    descriptionPlaceholder:
      "मुद्दे का विस्तार से वर्णन करें — क्या हुआ, कहाँ, कब, और कौन इसमें शामिल है…",
    formSection2: "2. साक्ष्य / फोटो अपलोड करें (वैकल्पिक)",
    uploadClickText: "फोटो चुनने के लिए क्लिक करें (JPG, JPEG, PNG, WEBP — अधिकतम 5 MB)",
    formSection3: "3. शिकायत का स्थान",
    locationLabel: "स्थान का पता",
    locationPlaceholder: "उदा. शिवाजी नगर मार्केट, पुणे",
    getMyLocationBtn: "📍 मेरा स्थान प्राप्त करें",
    locationSuccess: "स्थान सफलतापूर्वक प्राप्त हुआ।",
    locationError:
      "स्थान का पता नहीं लगा सके। कृपया अनुमति दें या स्थान मैन्युअल रूप से दर्ज करें।",
    viewOnGmaps: "गूगल मैप पर देखें ↗",
    formSection4: "4. आपका व्यक्तिगत विवरण",
    nameLabel: "पूरा नाम",
    mobileLabel: "मोबाइल नंबर",
    emailLabel: "ईमेल",
    declarationText:
      "घोषणा: मैं प्रमाणित करता हूँ कि उपरोक्त जानकारी मेरी जानकारी के अनुसार सत्य और सटीक है। यह शिकायत आधिकारिक सत्यापन के अधीन है।",
    submitComplaintBtn: "शिकायत जमा करें",
    cancelBtn: "रद्द करें",

    trackingTitle: "शिकायत की स्थिति जांचें",
    trackingSubtitle:
      "अपनी शिकायत की वर्तमान स्थिति देखने के लिए शिकायत आईडी दर्ज करें (उदा. FDA-A1B2C3D4)।",
    complaintIdLabel: "शिकायत आईडी (Complaint ID)",
    trackBtn: "स्थिति खोजें",
    progressTitle: "प्रगति स्थिति",
    currentStage: "वर्तमान चरण",
    stageSubmitted: "शिकायत दर्ज",
    stageReview: "समीक्षाधीन",
    stageAction: "कार्रवाई शुरू",
    stageResolved: "निस्तारित",

    footerAbout:
      "एफडीए महाराष्ट्र सार्वजनिक स्वास्थ्य की रक्षा के लिए पूरे राज्य में खाद्य सुरक्षा, दवाओं की गुणवत्ता और सौंदर्य प्रसाधनों को नियंत्रित करता है।",
    quickLinksTitle: "त्वरित लिंक",
    officialContactTitle: "आधिकारिक संपर्क",
    disclaimerTitle: "प्रोटोटाइप अस्वीकरण:",
    disclaimerText:
      "यह एक छात्र/शैक्षणिक प्रोटोटाइप है और यह आधिकारिक महाराष्ट्र सरकार या एफडीए वेबसाइट नहीं है। कोई भी प्राथमिकता स्कोर केवल प्रारंभिक अनुशंसा है।",
    copyright: "© 2026 अन्न व औषध प्रशासन, महाराष्ट्र (प्रोटोटाइप)",
  },

  mr: {
    govtOfMah: "महाराष्ट्र शासन",
    deptName: "अन्न व औषध प्रशासन, महाराष्ट्र राज्य",
    portalSubtitle: "नागरिक तक्रार निवारण पोर्टल",
    helplineTitle: "अधिकृत हेल्पलाइन",
    home: "मुख्य पृष्ठ",
    fileComplaint: "तक्रार नोंदवा",
    trackComplaint: "तक्रार स्थिती",
    fdaContact: "एफडीए संपर्क",
    officerLogin: "अधिकारी लॉगिन",
    logout: "लॉगआउट",
    signedInAs: "लॉगिन वापरकर्ता",


    grievanceRedressal: "नागरिक तक्रार निवारण कक्ष",
    heroTitle: "महाराष्ट्र सुरक्षित ठेवण्यासाठी आम्हाला सहकार्य करा",
    heroSubtitle:
      "संशयास्पद अन्न, औषधे आणि इतर एफडीए उल्लंघनांची तक्रार नोंदवा. आपल्या तक्रारीची अधिकृत अधिकाऱ्यांमार्फत कायद्यानुसार चौकशी केली जाईल.",
    heroFileBtn: "तक्रार नोंदवा",
    heroTrackBtn: "तक्रार स्थिती पाहा",
    verificationNotice:
      "सर्व तक्रारी अधिकृत पडताळणीच्या अधीन आहेत. कोणताही स्वयंचलित प्राधान्य स्कोअर केवळ शिफारस असून तो अधिकृत तपासणीचा पर्याय नाही.",
    activeCases247: "२४×७",
    activeCasesLabel: "सक्रिय देखरेख",
    responseTime: "४८ तास",
    responseLabel: "नियोजित प्रतिसाद",
    verifiedOfficers: "अधिकृत",
    officersLabel: "एफडीए निरीक्षक",

    servicesHeading: "नागरिक सेवा",
    servicesSubtitle: "तक्रार दाखल करण्यासाठी आणि तिचा पाठपुरावा करण्यासाठी आवश्यक सर्व सेवा.",
    service1Title: "नवीन तक्रार नोंदवा",
    service1Desc: "संशयास्पद अन्न, भेसळयुक्त औषधे व उल्लंघनांची संपूर्ण माहितीसह तक्रार करा.",
    service1Cta: "नोंदवा",
    service2Title: "पुरावा / फोटो अपलोड",
    service2Desc: "तक्रारीच्या पुष्ट्यर्थ फोटो (JPG / PNG / WEBP, कमाल ५ MB) जोडा.",
    service2Cta: "फोटो जोडा",
    service3Title: "भौगोलिक स्थान (GPS)",
    service3Desc: "क्षेत्रीय अधिकाऱ्यांच्या मदतीसाठी अचूक स्थान सामायिक करा.",
    service3Cta: "GPS वापरा",
    service4Title: "तक्रार पाठपुरावा",
    service4Desc: "आपल्या युनिक तक्रार क्रमांकावरून सद्यस्थिती त्वरित तपासा.",
    service4Cta: "स्थिती पाहा",
    service5Title: "एफडीए संपर्क",
    service5Desc: "अन्न व औषध प्रशासन, महाराष्ट्र कार्यालयाचा अधिकृत पत्ता व संपर्क.",
    service5Cta: "माहिती पाहा",
    importantNoticeTitle: "महत्त्वाची सूचना",
    importantNoticeDesc:
      "दाखल केलेल्या तक्रारी अधिकृत पडताळणीच्या अधीन आहेत. स्वयंचलित प्राधान्यक्रम केवळ प्राथमिक शिफारसीसाठी आहे.",

    processEyebrow: "प्रक्रिया",
    processTitle: "कार्यपद्धती कशी चालते?",
    step1Title: "तक्रार नोंदवा",
    step1Desc: "तपशील, फोटो पुरावा आणि घटनास्थळ प्रविष्ट करा.",
    step2Title: "पोचपावती मिळवा",
    step2Desc: "युनिक तक्रार क्रमांक (ID) प्राप्त करा.",
    step3Title: "अधिकृत पडताळणी",
    step3Desc: "अधिकृत एफडीए अधिकारी तपासणी करतात.",
    step4Title: "निवारण पाठपुरावा",
    step4Desc: "प्रलंबित ते निवारणापर्यंत प्रत्येक टप्पा तपासा.",

    ctaTitle: "काही भेसळ किंवा गैरप्रकार आढळला?",
    ctaSubtitle:
      "महाराष्ट्राला सुरक्षित ठेवण्यासाठी पुढाकार घ्या — आजच तक्रार नोंदवा. आपली माहिती केवळ अधिकृत अधिकाऱ्यांना उपलब्ध असेल.",
    ctaBtn: "आता तक्रार नोंदवा",

    formTitle: "नागरिक तक्रार अर्ज",
    formSubtitle:
      "संशयास्पद गैरप्रकाराबद्दल अचूक माहिती भरा. आपल्या अर्जास एक तक्रार क्रमांक दिला जाईल आणि अधिकाऱ्यांमार्फत प्राथमिक तपासणी केली जाईल.",
    formSection1: "१. तक्रारीचे स्वरूप व माहिती",
    complaintTypeLabel: "तक्रारीचा प्रकार",
    selectComplaintType: "तक्रार प्रकार निवडा…",
    descriptionLabel: "तक्रारीचा तपशील",
    descriptionPlaceholder:
      "नेमकी काय घटना घडली, कोठे, केव्हा आणि कोण सहभागी आहे याचे सविस्तर वर्णन करा…",
    formSection2: "२. पुरावा / फोटो (ऐच्छिक)",
    uploadClickText: "फोटो निवडण्यासाठी येथे क्लिक करा (JPG, JPEG, PNG, WEBP — कमाल ५ MB)",
    formSection3: "३. घटनास्थळ / पत्ता",
    locationLabel: "घटनास्थळाचा पत्ता",
    locationPlaceholder: "उदा. शिवाजी नगर मार्केट, पुणे",
    getMyLocationBtn: "📍 माझे सद्य स्थान मिळवा",
    locationSuccess: "स्थान यशस्वीरीत्या नोंदवले गेले.",
    locationError:
      "स्थान शोधता आले नाही. कृपया GPS परवानगी द्या किंवा पत्ता टाईप करा.",
    viewOnGmaps: "Google Maps वर पाहा ↗",
    formSection4: "४. तक्रारदाराची वैयक्तिक माहिती",
    nameLabel: "पूर्ण नाव",
    mobileLabel: "मोबाईल क्रमांक",
    emailLabel: "ईमेल पत्ता",
    declarationText:
      "स्वयंघोषणा: मी याद्वारे घोषित करतो/करते की वर दिलेली माहिती माझ्या माहितीनुसार खरी व बिनचूक आहे. ही तक्रार अधिकृत पडताळणीस पात्र आहे.",
    submitComplaintBtn: "तक्रार दाखल करा",
    cancelBtn: "रद्द करा",

    trackingTitle: "तक्रार सद्यस्थिती",
    trackingSubtitle:
      "आपल्या तक्रारीची सद्यस्थिती तपासण्यासाठी तक्रार क्रमांक प्रविष्ट करा (उदा. FDA-A1B2C3D4).",
    complaintIdLabel: "तक्रार क्रमांक (Complaint ID)",
    trackBtn: "स्थिती शोधा",
    progressTitle: "प्रगती टप्पे",
    currentStage: "सद्य टप्पा",
    stageSubmitted: "तक्रार दाखल",
    stageReview: "चौकशी सुरू",
    stageAction: "कारवाई सुरू",
    stageResolved: "निवारण पूर्ण",

    footerAbout:
      "अन्न व औषध प्रशासन, महाराष्ट्र राज्य जनतेच्या आरोग्याच्या रक्षणासाठी संपूर्ण राज्यात अन्न सुरक्षा, औषधांचा दर्जा आणि दर्जा नियंत्रण करते.",
    quickLinksTitle: "महत्त्वाचे दुवे",
    officialContactTitle: "अधिकृत संपर्क",
    disclaimerTitle: "प्रोटोटाइप सूचना:",
    disclaimerText:
      "हे एक शैक्षणिक प्रोटोटाइप असून ही अधिकृत शासकीय संकेतस्थळ नाही. एआय-आधारित स्कोअर केवळ प्राथमिक मार्गदर्शन असून अधिकृत तपासणी आवश्यक आहे.",
    copyright: "© २०२६ अन्न व औषध प्रशासन, महाराष्ट्र राज्य (प्रोटोटाइप)",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: translations.en,
});

const STORAGE_KEY = "mahafda_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && (saved === "en" || saved === "hi" || saved === "mr")) {
        setLanguageState(saved);
        document.documentElement.setAttribute("lang", saved);
      }
    } catch {
      // localStorage unavailable in private mode
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.setAttribute("lang", lang);
    } catch {
      // ignore
    }
  };

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
