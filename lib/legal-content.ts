// lib/legal-content.ts
//
// Canonical source content for all published legal policies. This is the
// SINGLE SOURCE OF TRUTH — Admin-Grownest, the Flutter app, and the landing
// page all link out to the pages rendered from this file rather than keeping
// their own copies.
//
// IMPORTANT: the `version` string for each policy must match the
// corresponding entry in BE/GrowNest.Africa/src/constants/policyVersions.ts.
// Bump both together whenever a policy's substantive content changes.

export interface LegalSection {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
}

export interface LegalDoc {
  slug: string;
  title: string;
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  intro?: string[];
  sections: LegalSection[];
}

const COMPANY = 'Jurvclaq Global Concept Ltd';
const PLATFORM = 'GrowNest.africa';

export const legalDocs: Record<string, LegalDoc> = {
  // ─────────────────────────────────────────────────────────────────────────
  terms: {
    slug: 'terms',
    title: 'Terms & Conditions',
    version: '1.0',
    effectiveDate: '06-JUNE-2026',
    lastUpdated: '06-JUNE-2026',
    intro: [
      `Welcome to ${PLATFORM} ("GrowNest", "we", "our", or "us"), a digital platform owned and operated by ${COMPANY}. These Terms & Conditions ("Terms") govern your access to and use of the GrowNest website, mobile applications, APIs, and related services (collectively, the "Platform").`,
      'By creating an account, accessing the Platform, or using any GrowNest service, you acknowledge that you have read, understood, and agreed to be bound by these Terms, our Privacy Policy, Cookie Policy, and any product-specific terms incorporated by reference. If you do not agree, you must not use the Platform.',
    ],
    sections: [
      {
        heading: '1. Eligibility',
        paragraphs: [
          'Access to GrowNest is available only to persons who are legally capable of entering into binding agreements under applicable law. By registering for or using any GrowNest service, you represent and warrant that you have the legal capacity to enter into these Terms, that all information you provide is true, accurate, complete, and up to date, and that your use of the Platform complies with applicable law.',
          'Where an account is opened on behalf of a company, cooperative, association, or other organisation, the person creating or operating the account represents that they have authority to bind that organisation to these Terms.',
        ],
      },
      {
        heading: '2. Account Registration',
        paragraphs: [
          'Certain GrowNest services require account registration. You must provide accurate and complete information during registration and keep it updated. GrowNest may reject any registration that contains false or misleading information, creates unacceptable legal or operational risk, or violates applicable law or these Terms.',
          'Unless expressly authorised by GrowNest in writing, each individual may maintain only one primary personal account. Multiple accounts created to obtain duplicate benefits, referral rewards, or other unauthorised advantages are prohibited.',
        ],
      },
      {
        heading: '3. Identity Verification (KYC)',
        paragraphs: [
          'GrowNest may require identity verification before permitting access to certain services, including Wallet services, savings products, affiliate commission withdrawals, and other regulated or higher-risk activities. Verification may include government-issued identification, BVN, NIN, biometric verification where legally permitted, and other lawful methods.',
          'Failure to complete required verification may result in restricted access to some or all services.',
        ],
      },
      {
        heading: '4. Account Security',
        paragraphs: [
          'You are solely responsible for maintaining the confidentiality of your password, PIN, one-time passwords (OTPs), and other authentication credentials, for protecting your registered devices, and for promptly reporting any suspected unauthorised access.',
          'GrowNest shall not be responsible for losses resulting from your failure to safeguard your account credentials, except where such liability cannot lawfully be excluded.',
        ],
      },
      {
        heading: '5. Acceptable Use',
        paragraphs: ['You agree to use GrowNest lawfully, honestly, and responsibly. You shall not:'],
        list: [
          'Provide false information or impersonate another person;',
          'Use automated systems, bots, or scripts without authorisation;',
          'Interfere with Platform security or attempt to bypass technical controls;',
          'Upload malicious software;',
          'Engage in money laundering, fraud, or deceptive conduct;',
          'Circumvent payment systems;',
          'Manipulate affiliate or referral programmes;',
          'Reverse engineer Platform software except where permitted by law.',
        ],
      },
      {
        heading: '6. Prohibited Activities',
        paragraphs: [
          'Without limitation, the following are strictly prohibited: identity fraud, payment fraud, marketplace fraud, savings fraud, commission fraud, referral fraud; multiple fraudulent accounts, shared or purchased credentials; bots, scripts, automated registrations, device emulators, or unauthorised security testing; fake referrals, self-referrals, artificial transactions, or incentive abuse; and counterfeit products, false listings, or fake reviews.',
          'GrowNest reserves the right to investigate suspected violations and take appropriate action, including suspension, termination, reversal of benefits, recovery of improperly obtained funds, or referral to competent authorities where required.',
        ],
      },
      {
        heading: '7. Platform Availability & Modifications',
        paragraphs: [
          'GrowNest aims to provide reliable and continuous access to its services, but uninterrupted availability cannot be guaranteed. Services may be temporarily unavailable due to scheduled or emergency maintenance, security incidents, third-party infrastructure failures, or force majeure events.',
          'GrowNest may introduce, remove, or modify products, features, or services at any time. Material changes affecting your rights or obligations will be communicated through reasonable means where practicable, and continued use of the Platform after such changes constitutes acceptance of the revised Terms.',
        ],
      },
      {
        heading: '8. Electronic Communications',
        paragraphs: [
          'You consent to receive communications electronically, including account notifications, security alerts, transaction confirmations, policy updates, and legal notices. Electronic communications satisfy any legal requirement that communications be in writing, to the extent permitted by applicable law.',
        ],
      },
      {
        heading: '9. Service Disclaimers',
        paragraphs: [
          'GrowNest provides its services on an "AS IS" and "AS AVAILABLE" basis. To the maximum extent permitted by applicable law, GrowNest does not guarantee uninterrupted access, error-free operation, or suitability for every individual purpose. Nothing in this section limits any rights that cannot lawfully be excluded under applicable law.',
        ],
      },
      {
        heading: '10. General User Responsibilities',
        paragraphs: [
          'You are responsible for maintaining accurate account information, protecting your login credentials, complying with these Terms, using the Platform lawfully, reviewing updates to these Terms, and promptly reporting suspected fraud, security incidents, or unauthorised activity. Failure to comply may result in suspension, restriction, or termination of Platform access.',
        ],
      },
      {
        heading: '11. GrowNest Wallet',
        paragraphs: [
          'The GrowNest Wallet is a digital payment feature that enables eligible users to make payments and receive credits within the Platform. The Wallet is not a bank account, deposit account, investment account, or regulated financial institution account. It is a payment functionality provided as part of the GrowNest Platform and may be supported by licensed third-party payment service providers.',
          'Wallet balances do not earn interest unless GrowNest expressly introduces such a feature under separate terms. GrowNest may impose transaction limits, verification requirements, or operational restrictions to comply with applicable law, security standards, and regulatory obligations.',
        ],
      },
      {
        heading: '12. Digital Savings Services',
        paragraphs: [
          'GrowNest offers digital savings management features designed to help users plan and manage their savings goals, including Flexible Savings, Fixed Savings, Target Savings, Locked Savings, Group Savings, Nest Egg Campaigns, and other savings products introduced from time to time.',
          'These services are intended to assist users in managing their own funds. They do not constitute investment products, securities, collective investment schemes, or banking products unless expressly stated and authorised under applicable law. Specific rules, withdrawal conditions, maturity periods, fees, and eligibility requirements applicable to each savings product are published separately and form part of these Terms.',
        ],
      },
      {
        heading: '13. Food Subscription Plans',
        paragraphs: [
          'GrowNest offers food subscription plans that enable eligible users to pay for selected food packages over time and receive products in accordance with the chosen plan. Subscription details, including payment schedules, delivery arrangements, eligible products, duration, cancellation rules, and pricing, will be displayed before a subscription is confirmed.',
          'Failure to make required payments may affect delivery schedules, subscription benefits, or continued participation in the selected plan.',
        ],
      },
      {
        heading: '14. Marketplace',
        paragraphs: [
          'The GrowNest Marketplace enables buyers and vendors to transact through the Platform. Unless expressly stated otherwise, vendors remain responsible for the products they list, buyers are responsible for reviewing product information before purchase, and GrowNest facilitates the Platform but is not the manufacturer of listed products.',
          'GrowNest may remove products, suspend vendors, or restrict listings that violate these Terms or applicable law.',
        ],
      },
      {
        heading: '15. Payments',
        paragraphs: [
          'Payments may be processed through approved payment service providers integrated into the Platform. You authorise GrowNest and its authorised payment partners to process payment instructions submitted through your account, subject to successful authorisation, fraud screening, verification procedures, payment provider requirements, and applicable law.',
          'GrowNest may refuse or delay transactions where necessary for security, fraud prevention, compliance, or operational reasons.',
        ],
      },
      {
        heading: '16. Fees',
        paragraphs: [
          'Certain Platform services may attract subscription fees, marketplace charges, convenience fees, service fees, delivery charges, withdrawal fees, or other disclosed charges. Applicable fees will be communicated before the relevant transaction is completed, except where a fee cannot reasonably be calculated in advance.',
          'GrowNest reserves the right to revise fees from time to time. Material fee changes will be communicated where required by law.',
        ],
      },
      {
        heading: '17. Taxes',
        paragraphs: [
          'You are responsible for any taxes, duties, levies, or other governmental charges applicable to your use of the Platform, except where GrowNest is legally required to collect or remit such amounts. Where required by law, GrowNest may deduct or withhold applicable taxes from payments or commissions.',
        ],
      },
      {
        heading: '18. Fraud Prevention',
        paragraphs: [
          'GrowNest employs risk-based fraud prevention measures, including transaction monitoring, identity verification, and security controls. You must not engage in fraudulent transactions, identity theft, payment abuse, referral or affiliate fraud, account manipulation, money laundering, or other unlawful activities.',
          'Where fraud is reasonably suspected, GrowNest may suspend transactions or accounts, withhold payouts where permitted by law, investigate the activity, and cooperate with competent authorities.',
        ],
      },
      {
        heading: '19. Cooperative Services',
        paragraphs: [
          'GrowNest may provide access to digital cooperative services through its approved cooperative structure. Participation is subject to the applicable Cooperative Constitution and By-laws, membership eligibility requirements, applicable cooperative legislation, and additional operational rules published by GrowNest. Where there is any conflict between these Terms and the Cooperative Constitution in relation to cooperative governance, the Cooperative Constitution shall prevail for cooperative matters.',
        ],
      },
      {
        heading: '20. Affiliate Marketing Programme',
        paragraphs: [
          'Eligible users may participate in the GrowNest Affiliate Programme upon acceptance of the Affiliate Programme Terms. Affiliates may earn commissions only on qualified transactions that satisfy GrowNest\'s published eligibility requirements. Participation in the Affiliate Programme does not create an employment, partnership, agency, or joint venture relationship with GrowNest.',
        ],
      },
      {
        heading: '21. Referral Programme',
        paragraphs: [
          'GrowNest may operate a user referral programme under which eligible users can invite new users to join the Platform. Referral rewards are subject to successful registration by the referred user, completion of required verification, fulfilment of published qualifying conditions, and compliance with these Terms. GrowNest reserves the right to amend, suspend, or discontinue the Referral Programme at any time, subject to applicable law.',
        ],
      },
      {
        heading: '22. Vendors & Merchants',
        paragraphs: [
          'Marketplace vendors and merchants must provide accurate product descriptions, honour accepted orders, comply with applicable laws and regulations, maintain appropriate quality standards, and cooperate with customer service and dispute resolution processes. GrowNest may suspend, restrict, or remove vendors who fail to meet required standards or who breach these Terms.',
        ],
      },
      {
        heading: '23. Refunds & Cancellations',
        paragraphs: [
          'Refunds and cancellations are governed by GrowNest\'s Refund & Cancellation Policy. Eligibility depends on factors such as the type of product or service, order status, delivery status, verification of the claim, and applicable law. Not all transactions are refundable.',
        ],
      },
      {
        heading: '24. Intellectual Property',
        paragraphs: [
          'All intellectual property relating to the GrowNest Platform, including trademarks, logos, software, text, graphics, designs, databases, and other proprietary content, is owned by or licensed to ' +
            COMPANY +
            '. You receive only a limited, revocable licence to use the Platform in accordance with these Terms. No ownership rights are transferred to you.',
        ],
      },
      {
        heading: '25. Disclaimers',
        paragraphs: [
          'GrowNest provides the Platform using reasonable care and skill. However, except where prohibited by law, services are provided on an "AS IS" and "AS AVAILABLE" basis, and GrowNest does not guarantee uninterrupted availability or that all services will always be error-free or suitable for every individual purpose. Nothing in these Terms excludes any legal rights that cannot be excluded under applicable law.',
        ],
      },
      {
        heading: '26. Limitation of Liability',
        paragraphs: [
          'To the fullest extent permitted by law, GrowNest shall not be liable for indirect, incidental, consequential, or punitive losses arising from the use of the Platform. This limitation does not apply to liability that cannot lawfully be excluded under applicable law.',
        ],
      },
      {
        heading: '27. Termination',
        paragraphs: [
          'GrowNest may suspend or terminate your access to the Platform where you breach these Terms, engage in fraud or unlawful conduct, compromise Platform security, provide false information, or abuse GrowNest services. You may close your account in accordance with GrowNest\'s published procedures, subject to the settlement of outstanding obligations and applicable legal or regulatory requirements.',
        ],
      },
      {
        heading: '28. Governing Law & Dispute Resolution',
        paragraphs: [
          'These Terms are governed by the laws of the Federal Republic of Nigeria. You are encouraged to first resolve disputes through GrowNest\'s internal complaints process. Where a dispute cannot be resolved internally, the parties may explore alternative dispute resolution or pursue remedies before a court of competent jurisdiction, subject to any valid arbitration agreement and applicable law.',
        ],
      },
      {
        heading: '29. Changes to These Terms',
        paragraphs: [
          'GrowNest may amend these Terms from time to time to reflect changes in applicable law, technology, Platform features, business operations, or security practices. Where material changes are made, GrowNest will provide notice where required by law and, in appropriate cases, require you to re-accept these Terms before continuing to use the Platform. Continued use of the Platform after the effective date of revised Terms constitutes acceptance of the updated Terms.',
        ],
      },
      {
        heading: '30. Contact Information',
        paragraphs: [`Questions about these Terms may be directed to GrowNest through the official contact details published on the Platform: support@grownest.africa / +234 705 329 0027.`],
      },
      {
        heading: '31. Entire Agreement',
        paragraphs: [
          'These Terms, together with the Privacy Policy, Cookie Policy, and any applicable product-specific terms, policies, or programme rules, constitute the agreement between GrowNest and you regarding use of the Platform. If any provision is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    version: '1.0',
    effectiveDate: '06-JUNE-2026',
    lastUpdated: '06-JUNE-2026',
    intro: [
      `Welcome to ${PLATFORM} ("GrowNest", "we", "our", or "us"), a digital platform owned and operated by ${COMPANY}. GrowNest provides digital services including food subscriptions, marketplace services, digital savings management tools, cooperative services, affiliate programmes, referral programmes, wallet functionality, and other related services.`,
      'This Privacy Policy explains how we collect, use, disclose, store, protect, and otherwise process your personal information when you use the GrowNest website, mobile applications, APIs, customer support channels, and related services (collectively, the "Platform"). By accessing or using the Platform, you acknowledge that your personal information will be processed in accordance with this Privacy Policy and applicable law.',
    ],
    sections: [
      {
        heading: '1. Our Privacy Commitment',
        paragraphs: [
          'GrowNest is committed to respecting your privacy; processing personal information fairly, lawfully, and transparently; implementing reasonable technical and organisational safeguards; collecting only information reasonably necessary for our services; protecting your information against unauthorised access, alteration, disclosure, or destruction; and complying with the Nigeria Data Protection Act 2023 (NDPA) and other applicable data protection laws.',
        ],
      },
      {
        heading: '2. Information We Collect',
        paragraphs: [
          'Personal Information: full name, date of birth (where required), gender (optional where permitted), email address, mobile phone number, residential or business address, profile photograph, government-issued identification for verification, BVN, NIN, or other legally recognised identifiers where applicable and permitted by law.',
          'Account Information: username, password (stored securely in encrypted or hashed form), security questions or authentication settings, account preferences.',
          'Financial Information: payment transaction records, Wallet transaction history, savings activity, subscription payments, marketplace purchases, bank account details for settlements or withdrawals, payment references. GrowNest does not store full payment card details unless required and permitted under applicable standards.',
          'Information Collected Automatically: device information, IP address, browser type, operating system, mobile device identifiers, app version, login history, usage statistics, crash reports, security logs, and location information where enabled by you or required for a service.',
        ],
      },
      {
        heading: '3. How We Use Your Information',
        paragraphs: ['We may use your information to:'],
        list: [
          'Create and manage your account;',
          'Provide Platform services;',
          'Process payments and authorised transactions;',
          'Manage food subscriptions and facilitate marketplace transactions;',
          'Administer savings and cooperative services;',
          'Administer affiliate and referral programmes;',
          'Verify identity and detect and prevent fraud;',
          'Improve our services and provide customer support;',
          'Communicate important service updates;',
          'Comply with legal obligations;',
          'Protect the rights, safety, and security of GrowNest, our users, and third parties.',
        ],
      },
      {
        heading: '4. Legal Bases for Processing Personal Information',
        paragraphs: [
          'GrowNest processes personal information only where there is a lawful basis to do so under the Nigeria Data Protection Act 2023 (NDPA). Depending on the circumstances, we may process your information because: you have provided your consent; processing is necessary to provide the services you requested; processing is necessary to comply with legal or regulatory obligations (including obligations to the Nigeria Data Protection Commission ("NDPC")); processing is necessary to protect your vital interests or those of another person; or processing is necessary for our legitimate business interests, provided those interests do not override your rights and freedoms.',
          'Where consent is the legal basis, you may withdraw your consent at any time. Withdrawal of consent will not affect the lawfulness of processing carried out before the withdrawal.',
        ],
      },
      {
        heading: '5. Cookies & Similar Technologies',
        paragraphs: [
          'GrowNest may use cookies, local storage, software development kits (SDKs), pixels, and similar technologies to keep you signed in, remember your preferences, improve Platform performance, measure usage and analytics, enhance security, detect fraud, and personalise your experience. A separate Cookie Policy provides additional information.',
        ],
      },
      {
        heading: '6. How We Share Your Information',
        paragraphs: [
          'GrowNest does not sell your personal information. We may share personal information only where reasonably necessary with: payment service providers; identity verification providers; logistics and delivery partners; cloud hosting and infrastructure providers; customer support and analytics providers; professional advisers; the Nigeria Data Protection Commission (NDPC) and other government authorities or regulators where required by law; and courts or law enforcement agencies pursuant to lawful requests.',
          'All third parties engaged by GrowNest are expected to process personal information only for authorised purposes and to implement appropriate security measures.',
        ],
      },
      {
        heading: '7. International Data Transfers',
        paragraphs: [
          'Where GrowNest or its service providers process personal information outside Nigeria, we will take reasonable steps to ensure that such transfers are conducted in accordance with the NDPA and other applicable data protection laws and appropriate safeguards.',
        ],
      },
      {
        heading: '8. Data Retention',
        paragraphs: [
          'GrowNest retains personal information only for as long as reasonably necessary to provide our services, maintain user accounts, complete transactions, resolve disputes, prevent fraud, meet legal, regulatory, accounting, or audit requirements, and enforce our agreements. When information is no longer required, we will securely delete, anonymise, or otherwise dispose of it in accordance with applicable law.',
        ],
      },
      {
        heading: '9. Information Security',
        paragraphs: [
          'GrowNest implements reasonable administrative, technical, and organisational measures to protect personal information, including encryption of data in transit, access controls, authentication mechanisms, security monitoring, audit logging, secure software development practices, and periodic security reviews.',
          'While we take reasonable steps to protect information, no method of electronic transmission or storage can be guaranteed to be completely secure. You also play an important role in safeguarding your account credentials and devices.',
        ],
      },
      {
        heading: '10. Your Privacy Rights',
        paragraphs: [
          'Subject to the NDPA and other applicable law, you may have the right to: request access to your personal information; request correction of inaccurate or incomplete information; request deletion of information in certain circumstances; object to or restrict certain processing activities; withdraw consent where processing is based on consent; request a copy of certain personal information in a portable format where applicable; and lodge a complaint with the Nigeria Data Protection Commission (NDPC).',
          'GrowNest may request reasonable verification of identity before responding to privacy-related requests.',
        ],
      },
      {
        heading: "11. Children's Privacy",
        paragraphs: [
          'GrowNest is not intended for use by children below the minimum age permitted under applicable law to independently use our services. Where parental or guardian consent is legally required, such consent must be obtained before the child uses the relevant services. If GrowNest becomes aware that personal information has been collected from a child in violation of applicable law, reasonable steps will be taken to delete the information or otherwise comply with legal requirements.',
        ],
      },
      {
        heading: '12. Changes to This Privacy Policy',
        paragraphs: [
          'GrowNest may update this Privacy Policy from time to time to reflect changes in applicable law, technology, Platform features, security practices, or business operations. Where material changes are made, we will provide notice through appropriate channels where required by law and, in appropriate cases, require you to re-accept this Policy before continuing to use the Platform.',
        ],
      },
      {
        heading: '13. Contact Us',
        paragraphs: [`If you have questions, concerns, or requests regarding this Privacy Policy or our processing of your personal information, you may contact GrowNest at: support@grownest.africa / +234 705 329 0027 / Km 13 DSC Express-Way, Opete Junction, Otokutu, Deleta State.`],
      },
      {
        heading: '14. Governing Law',
        paragraphs: ['This Privacy Policy is governed by the laws of the Federal Republic of Nigeria, including the Nigeria Data Protection Act 2023, without prejudice to any mandatory data protection rights available to you under applicable law.'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  cookies: {
    slug: 'cookies',
    title: 'Cookie Policy',
    version: '1.0',
    effectiveDate: '06-JUNE-2026',
    lastUpdated: '06-JUNE-2026',
    intro: [
      `This Cookie Policy explains how ${PLATFORM} ("GrowNest", "we", "our", or "us"), operated by ${COMPANY}, uses cookies and similar technologies when you visit or use our website, mobile applications, and related digital services (collectively, the "Platform"). This Policy should be read together with our Privacy Policy and Terms & Conditions.`,
    ],
    sections: [
      {
        heading: '1. What Are Cookies?',
        paragraphs: [
          'Cookies are small text files placed on your browser or device when you visit a website or use certain digital services. GrowNest may also use similar technologies, including Local Storage, Session Storage, Software Development Kits (SDKs), Pixel Tags, Web Beacons, Device Identifiers, and Application Tokens.',
        ],
      },
      {
        heading: '2. Types of Cookies We Use',
        paragraphs: [
          'Essential Cookies enable core functions such as user authentication, secure login sessions, fraud prevention, navigation, payment processing support, and security monitoring. Without these, certain services may not function correctly.',
          'Functional Cookies remember your preferences and settings, including preferred language, login preferences, and display settings.',
          'Performance & Analytics Cookies help us understand how users interact with the Platform, such as pages visited, session duration, device type, application performance, and feature usage. Analytics information is generally used in aggregated or de-identified form where practicable.',
          'Security Cookies help detect suspicious activity, prevent fraud, protect user accounts, and identify abnormal login attempts.',
        ],
      },
      {
        heading: '3. Third-Party Cookies',
        paragraphs: [
          'Certain trusted third-party service providers engaged by GrowNest may place cookies or similar technologies on the Platform to provide services such as payment processing, identity verification, analytics, cloud hosting, customer support, and security monitoring. These providers are expected to process information only for authorised purposes and in accordance with applicable contractual and legal obligations.',
        ],
      },
      {
        heading: '4. Managing Cookies',
        paragraphs: [
          'You may manage or disable certain cookies through your browser or device settings. Disabling essential cookies may limit or prevent access to some Platform features or services. Where required by applicable law, GrowNest will provide appropriate mechanisms for managing cookie preferences.',
        ],
      },
      {
        heading: '5. Data Protection',
        paragraphs: ['Information collected through cookies may constitute personal information under the Nigeria Data Protection Act 2023 and other applicable data protection laws. Where this is the case, GrowNest processes such information in accordance with its Privacy Policy and applicable legal requirements.'],
      },
      {
        heading: '6. Changes to This Cookie Policy',
        paragraphs: ['GrowNest may update this Cookie Policy from time to time to reflect changes in technology, business operations, legal requirements, or Platform functionality. Material updates will be communicated where required by applicable law.'],
      },
      {
        heading: '7. Contact Us',
        paragraphs: [`If you have questions about this Cookie Policy, please contact GrowNest at: support@grownest.africa.`],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  'refund-policy': {
    slug: 'refund-policy',
    title: 'Refund & Cancellation Policy',
    version: '1.0',
    effectiveDate: '06-JUNE-2026',
    lastUpdated: '06-JUNE-2026',
    intro: [
      `This Refund & Cancellation Policy ("Policy") explains the circumstances under which ${PLATFORM} ("GrowNest", "we", "our", or "us"), operated by ${COMPANY}, may approve cancellations, refunds, replacements, credits, or other remedies for products and services available through the GrowNest Platform. This Policy should be read together with our Terms & Conditions, Privacy Policy, and any product-specific conditions applicable to your transaction.`,
    ],
    sections: [
      {
        heading: '1. General Refund Principles',
        paragraphs: [
          'Refund eligibility depends on factors including the type of product or service, payment status, order status, delivery status, the cause of the issue, vendor obligations, and applicable law. Approval of one refund request does not create an obligation to approve future requests.',
        ],
      },
      {
        heading: '2. When Refunds May Be Approved',
        paragraphs: ['Subject to verification, GrowNest may approve a refund where:'],
        list: [
          'Payment was successfully received but the order could not be fulfilled;',
          'Duplicate payments were made;',
          'An incorrect product was delivered;',
          'A product arrived materially damaged due to the seller or delivery process;',
          'An order was cancelled before fulfilment in accordance with this Policy;',
          'A vendor failed to perform its obligations;',
          'A technical error resulted in an incorrect charge;',
          'GrowNest determines that a refund is appropriate in the interests of fairness, customer protection, or legal compliance.',
        ],
      },
      {
        heading: '3. Non-Refundable Transactions',
        paragraphs: ['Unless required by applicable law, refunds will generally not be granted where the customer changes their mind after successful fulfilment; products have been consumed, used, altered, or damaged after delivery; false or misleading information is provided; fraudulent conduct is suspected; promotional rewards have already been fully used; or the refund request is submitted outside the applicable claim period. Nothing in this section limits any statutory rights that cannot lawfully be excluded.'],
      },
      {
        heading: '4. Food Subscriptions',
        paragraphs: ['Food subscription plans may be cancelled before the commencement of the relevant fulfilment cycle, subject to the rules of the selected plan. Where products have already been purchased, packed, dispatched, or delivered for a subscription cycle, cancellation or refund may not be available except where required by law or where GrowNest determines that exceptional circumstances exist.'],
      },
      {
        heading: '5. Marketplace Orders',
        paragraphs: ['Marketplace buyers should inspect products promptly upon delivery. If a product is defective, materially damaged, or significantly different from its description, the buyer should notify GrowNest within the applicable reporting period and provide reasonable supporting evidence, such as photographs or other documentation. GrowNest may facilitate communication between the buyer and the vendor to assist in resolving the matter.'],
      },
      {
        heading: '6. Digital Wallet & Savings',
        paragraphs: [
          'Wallet funding transactions and savings deposits are generally intended to be final once successfully processed. Refunds or reversals may be considered only where a verified processing error occurred, duplicate transactions were processed, applicable law requires reversal, or GrowNest determines that exceptional circumstances justify corrective action. This Policy does not affect your right to withdraw eligible savings in accordance with the applicable savings product rules.',
        ],
      },
      {
        heading: '7. Affiliate & Referral Rewards',
        paragraphs: ['Affiliate commissions and referral rewards may be withheld, adjusted, cancelled, or recovered where qualifying conditions were not satisfied, fraud or abuse is detected, duplicate or invalid accounts are used, transactions are reversed or cancelled, or applicable programme rules permit adjustment.'],
      },
      {
        heading: '8. Chargebacks',
        paragraphs: ['You are encouraged to contact GrowNest before initiating a chargeback through your payment provider. Where a chargeback is initiated, GrowNest may investigate the transaction, temporarily restrict related accounts or transactions, provide evidence to the payment provider, and recover funds where legally entitled to do so. Fraudulent chargebacks may result in suspension or termination of Platform access.'],
      },
      {
        heading: '9. How to Request a Refund',
        paragraphs: ['To request a refund, contact GrowNest through the official support channels, provide your order or transaction reference, explain the reason for the request, and submit any supporting information reasonably requested. GrowNest may request additional information before making a decision.'],
      },
      {
        heading: '10. Refund Methods',
        paragraphs: ['Where a refund is approved, it may be issued through the original payment method (where practicable), a GrowNest Wallet credit, or another lawful payment method determined by GrowNest. Processing times may vary depending on payment providers, banks, fraud reviews, or operational requirements.'],
      },
      {
        heading: '11. Limitation',
        paragraphs: ['Nothing in this Policy requires GrowNest to provide refunds where the claim is fraudulent, you materially breached the Terms & Conditions, legal restrictions prevent the requested remedy, or the claimed loss primarily results from circumstances outside GrowNest\'s reasonable control.'],
      },
      {
        heading: '12. Policy Changes',
        paragraphs: ['GrowNest may amend this Policy from time to time to reflect changes in law, operations, products, or consumer protection practices. Material changes will be communicated where required by law.'],
      },
      {
        heading: '13. Contact Us',
        paragraphs: [`Questions regarding this Policy may be submitted through GrowNest's official customer support channels: support@grownest.africa.`],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  'affiliate-terms': {
    slug: 'affiliate-terms',
    title: 'Affiliate Programme Terms & Conditions',
    version: '1.0',
    effectiveDate: '06-JUNE-2026',
    lastUpdated: '06-JUNE-2026',
    intro: [
      `These Affiliate Programme Terms & Conditions ("Affiliate Terms") govern participation in the GrowNest Affiliate Programme operated by ${COMPANY} through the ${PLATFORM} Platform. These Affiliate Terms form part of the GrowNest Terms & Conditions. By applying for or participating in the Affiliate Programme, you agree to be bound by these Affiliate Terms, the GrowNest Terms & Conditions, Privacy Policy, Refund & Cancellation Policy, and any additional programme rules published by GrowNest.`,
    ],
    sections: [
      {
        heading: '1. Purpose of the Programme',
        paragraphs: ['The GrowNest Affiliate Programme enables approved individuals and organisations to promote GrowNest\'s products and services and earn commissions on Qualified Referrals that meet GrowNest\'s eligibility requirements. The programme is designed to reward genuine customer acquisition while maintaining fairness, transparency, and compliance with applicable laws. Participation in the Programme is a privilege and not a right.'],
      },
      {
        heading: '2. Eligibility',
        paragraphs: ['To participate, an applicant must meet GrowNest\'s eligibility requirements, provide accurate registration information, complete any required identity verification, maintain an active GrowNest account, and accept these Affiliate Terms. GrowNest reserves the right to approve or reject any application at its sole discretion, subject to applicable law.'],
      },
      {
        heading: '3. Qualified Referrals',
        paragraphs: [
          'A referral qualifies for commission only when all published programme requirements have been satisfied. Unless otherwise announced by GrowNest, a Qualified Referral generally requires that the referred user is new to GrowNest, completes any required verification, and completes an eligible qualifying transaction specifically identified by GrowNest, which is successfully completed and not reversed, refunded, or fraudulent.',
          'GrowNest may publish additional qualifying criteria, including minimum deposit thresholds, for specific campaigns or promotions.',
        ],
      },
      {
        heading: '4. Commission',
        paragraphs: ['Affiliate commission rates, payment schedules, minimum payout thresholds, and eligible products will be published separately by GrowNest. Commissions are earned only on Qualified Referrals. GrowNest may adjust commission structures prospectively upon reasonable notice. No commission is earned until the qualifying conditions have been satisfied.'],
      },
      {
        heading: '5. Payment of Commissions',
        paragraphs: [
          'Approved commissions may be paid through GrowNest Wallet, bank transfer, or another approved payment method. GrowNest may delay payouts for fraud reviews, withhold commissions where programme violations are suspected, and deduct amounts required by law, including applicable taxes or regulatory deductions.',
        ],
      },
      {
        heading: '6. Prohibited Activities',
        paragraphs: ['Affiliates must not create fake accounts; refer themselves using multiple accounts; use stolen or false identities; generate artificial traffic, click fraud, or automated referrals; make misleading or false advertising claims; engage in spam; use GrowNest trademarks without authorisation; offer unauthorised discounts or incentives; or participate in fraudulent or unlawful activities. Any attempt to manipulate the programme may result in immediate suspension or termination.'],
      },
      {
        heading: '7. Marketing Standards',
        paragraphs: ['Affiliates shall represent GrowNest honestly and accurately, comply with advertising and consumer protection laws, avoid misleading income claims, respect intellectual property rights, and protect the reputation of GrowNest. Affiliates are solely responsible for the content of their independent marketing activities and shall not suggest that participation in GrowNest guarantees wealth, employment, investment returns, or financial success.'],
      },
      {
        heading: '8. Intellectual Property',
        paragraphs: ['GrowNest grants approved affiliates a limited, non-exclusive, revocable licence to use authorised marketing materials solely for participation in the Affiliate Programme. Affiliates may not modify GrowNest\'s trademarks, logos, or branding without prior written approval. All intellectual property rights remain vested in ' + COMPANY + '.'],
      },
      {
        heading: '9. Monitoring & Compliance',
        paragraphs: ['GrowNest may monitor affiliate activity to verify compliance, detect fraud, investigate complaints, and protect the integrity of the programme. Affiliates agree to cooperate with reasonable compliance reviews.'],
      },
      {
        heading: '10. Reversal of Commissions',
        paragraphs: ['GrowNest reserves the right to reduce, cancel, or recover commissions where they arise from fraudulent activity, chargebacks, refunded transactions, cancelled qualifying purchases, identity fraud, policy violations, or administrative errors. Affiliates shall promptly repay any amounts paid in error upon request.'],
      },
      {
        heading: '11. Suspension & Termination',
        paragraphs: ['GrowNest may suspend or terminate an affiliate\'s participation where the affiliate breaches these Affiliate Terms, commits fraud, damages GrowNest\'s reputation, violates applicable law, or engages in unethical marketing practices. Termination does not affect GrowNest\'s right to recover improperly earned commissions or pursue other lawful remedies.'],
      },
      {
        heading: '12. No Employment Relationship',
        paragraphs: ['Participation in the Affiliate Programme does not create an employment, agency, partnership, franchise, or joint venture relationship between GrowNest and the affiliate. Affiliates act as independent contractors and are responsible for their own business decisions, taxes, and legal obligations.'],
      },
      {
        heading: '13. Limitation of Liability',
        paragraphs: ['To the fullest extent permitted by law, GrowNest shall not be liable for indirect, incidental, consequential, or punitive losses arising from participation in the Affiliate Programme. Nothing in these Affiliate Terms excludes liability that cannot lawfully be excluded.'],
      },
      {
        heading: '14. Changes to the Programme',
        paragraphs: ['GrowNest may amend, suspend, or discontinue the Affiliate Programme or these Affiliate Terms to reflect operational, legal, commercial, or security requirements. Where material changes are made, GrowNest will provide notice where required by applicable law.'],
      },
      {
        heading: '15. Governing Law',
        paragraphs: ['These Affiliate Terms are governed by the laws of the Federal Republic of Nigeria. Disputes should first be referred to GrowNest\'s internal complaints process before other dispute resolution mechanisms are pursued.'],
      },
      {
        heading: '16. Contact Us',
        paragraphs: [`Questions regarding the Affiliate Programme may be directed to GrowNest at: support@grownest.africa.`],
      },
      {
        heading: '17. Affiliate Disclaimer',
        paragraphs: [
          'Participation in the Affiliate Programme does not guarantee any minimum income, commission, or financial benefit. Affiliate earnings depend on genuine Qualified Referrals, compliance with these Affiliate Terms, and the successful completion of qualifying transactions.',
          'GrowNest reserves the right to investigate suspected fraud, reverse improperly earned commissions, and take appropriate action to protect the integrity of the programme. Nothing in these Affiliate Terms excludes or limits any rights that cannot lawfully be excluded under applicable law.',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  'vendor-agreement': {
    slug: 'vendor-agreement',
    title: 'Vendor & Merchant Agreement',
    version: '1.0',
    effectiveDate: '06-JUNE-2026',
    lastUpdated: '06-JUNE-2026',
    intro: [
      `This Vendor & Merchant Agreement ("Agreement") governs the relationship between ${COMPANY}, operating through the ${PLATFORM} Platform, and all approved Vendors and Merchants ("Vendor", "you") who list, sell, or fulfil products or services through the GrowNest Marketplace. By applying for or maintaining Vendor status, you agree to be bound by this Agreement, the GrowNest Terms & Conditions, Privacy Policy, and Refund & Cancellation Policy.`,
    ],
    sections: [
      {
        heading: '1. Purpose of the Agreement',
        paragraphs: ['This Agreement defines the legal, commercial, and operational terms under which Vendors may list products, sell goods or services, and receive payments through the GrowNest Marketplace.'],
      },
      {
        heading: '2. Eligibility & Onboarding',
        paragraphs: [
          'To become a Vendor, you must satisfy GrowNest\'s onboarding requirements, which may include identity verification, business registration verification, and any other checks reasonably required for security, consumer protection, or legal compliance. GrowNest reserves the right to approve, reject, suspend, or revoke Vendor status where necessary to protect users, maintain platform integrity, or comply with applicable law.',
          'You shall provide accurate and complete information, including business name, contact information, business registration details, tax information where required, bank or settlement information, product categories, and delivery capability, and shall promptly notify GrowNest of any material changes.',
        ],
      },
      {
        heading: '3. Vendor Account Responsibility',
        paragraphs: ['You are responsible for maintaining the security of your Vendor account and for all activities conducted under it, including protecting login credentials and promptly reporting suspected unauthorised access. GrowNest is not liable for losses arising from your failure to safeguard your account, except where such liability cannot lawfully be excluded.'],
      },
      {
        heading: '4. Product Listing Rules',
        paragraphs: [
          'You are responsible for ensuring that all listings are accurate, current, and complete. Each listing should clearly describe the product name, specifications, quantity or weight (where applicable), price, availability, delivery limitations, and any material conditions affecting purchase. All product information must be truthful, not misleading, and reflect real stock availability.',
          'GrowNest may edit, suspend, or remove listings that violate this Agreement or applicable law.',
        ],
      },
      {
        heading: '5. Prohibited Products',
        paragraphs: ['You shall not list or sell illegal goods, counterfeit or stolen items, expired or unsafe products, weapons, restricted substances, or any other product prohibited by applicable law or GrowNest policy. Listing prohibited products may result in immediate suspension and, where required, referral to competent authorities.'],
      },
      {
        heading: '6. Orders & Fulfilment',
        paragraphs: [
          'Once an order has been accepted, you shall use reasonable efforts to prepare and fulfil the order within the stated timeframe, including packaging, delivery coordination, and timely order fulfilment. If fulfilment becomes impossible due to stock shortages or unforeseen circumstances, you shall promptly notify GrowNest so that appropriate customer communication and available remedies may be arranged.',
          'Repeated failure to fulfil accepted orders may result in warnings, temporary suspension, or termination of Marketplace privileges.',
        ],
      },
      {
        heading: '7. Pricing Policy',
        paragraphs: ['Prices must be transparent, final, and free of hidden charges at the point of listing. Any applicable delivery fees, taxes, or other charges must be clearly disclosed before checkout. You shall not engage in price manipulation, bait-and-switch pricing, or misrepresentation of discounts.'],
      },
      {
        heading: '8. Commissions & Platform Fees',
        paragraphs: ['GrowNest charges a commission per sale as published per product category, together with any applicable service or convenience fees. Applicable commission and fee rates will be communicated to Vendors before listing and may be updated by GrowNest from time to time, with reasonable notice of material changes.'],
      },
      {
        heading: '9. Payments & Settlement',
        paragraphs: [
          'Where GrowNest facilitates payments for Marketplace transactions, settlement to Vendors shall occur in accordance with GrowNest\'s settlement schedule and operational procedures, following order confirmation and subject to any applicable holding periods. GrowNest may retain funds temporarily where necessary to investigate disputes, suspected fraud, chargebacks, or other legitimate concerns.',
          'Applicable service fees, commissions, taxes, or other authorised deductions may be applied before settlement. GrowNest shall maintain transaction records to support reconciliation and audit requirements.',
        ],
      },
      {
        heading: '10. Returns, Refunds & Disputes',
        paragraphs: [
          'You agree to cooperate fully with GrowNest in addressing genuine customer complaints relating to product quality, delivery, quantity, or compliance with the order. GrowNest may request evidence from you, including photographs, delivery records, or invoices. Refund amounts approved under GrowNest\'s Refund & Cancellation Policy may be deducted from your settlement or future earnings where applicable.',
          'Failure to respond to a complaint within a reasonable period may result in GrowNest resolving the complaint based on the available information, without prejudice to any rights under applicable law.',
        ],
      },
      {
        heading: '11. Customer Service Responsibility',
        paragraphs: ['You must maintain courteous and professional communication with customers and respond promptly to customer enquiries, complaints, and dispute resolution requests coordinated through the Platform.'],
      },
      {
        heading: '12. Performance & Rating System',
        paragraphs: ['GrowNest may monitor Vendor performance using objective indicators, including order fulfilment rate, delivery performance, customer satisfaction, complaint frequency, refund frequency, and compliance history. Where performance falls below acceptable standards, GrowNest may require corrective action, provide guidance, suspend listings, or terminate Marketplace participation.'],
      },
      {
        heading: '13. Intellectual Property',
        paragraphs: ['You retain ownership of your brand names, logos, and product content, but by listing products on the Platform you grant GrowNest a non-exclusive, royalty-free licence to display, reproduce, and use such content for the operation, promotion, and administration of the Marketplace. You represent that you have the legal authority to sell the listed products and that your listings do not infringe any third party\'s intellectual property rights.'],
      },
      {
        heading: '14. Fraud, Abuse & Risk Control',
        paragraphs: ['GrowNest may monitor Vendor transactions and activity to detect fraud, abuse, or policy violations. Fraudulent activity, including manipulated reviews, fake listings, or circumvention of the GrowNest payment process, may lead to suspension, withholding of funds, recovery of losses, or referral to competent authorities where required by law.'],
      },
      {
        heading: '15. Data Protection & Privacy',
        paragraphs: ['You must comply with the Nigeria Data Protection Act 2023 and handle any customer data made available to you through the Platform (such as delivery information) solely for the purpose of fulfilling orders, and in accordance with GrowNest\'s Privacy Policy. You must not retain, share, or use customer data for any purpose beyond legitimate order fulfilment without the customer\'s consent.'],
      },
      {
        heading: '16. Platform Role',
        paragraphs: ['GrowNest provides the Marketplace as a technology platform connecting buyers and approved Vendors. Except where GrowNest is expressly identified as the seller of a product, you remain primarily responsible for the quality, legality, safety, and accuracy of the products and services you supply. GrowNest\'s role in facilitating transactions does not transfer your legal responsibilities to GrowNest, except to the extent required by applicable law.'],
      },
      {
        heading: '17. Suspension & Termination',
        paragraphs: ['GrowNest may suspend or terminate your Marketplace access where this Agreement is materially breached, fraud or deceptive conduct is identified, required verification is not completed or maintained, continued participation presents unacceptable legal, operational, or reputational risk, or applicable law requires suspension or termination. Termination shall not affect any accrued rights or obligations existing before the effective date of termination.'],
      },
      {
        heading: '18. Limitation of Liability',
        paragraphs: ['To the fullest extent permitted by law, GrowNest shall not be liable for indirect, incidental, consequential, or punitive losses arising from your participation as a Vendor. Nothing in this Agreement excludes liability that cannot lawfully be excluded under applicable law.'],
      },
      {
        heading: '19. Indemnity',
        paragraphs: ['You agree to indemnify and hold harmless GrowNest, ' + COMPANY + ', and their directors, officers, employees, and representatives from claims, losses, liabilities, damages, costs, or expenses arising directly from your breach of this Agreement, fraudulent or unlawful conduct, infringement of another person\'s rights, or products or services you supply through the Platform. This indemnity does not apply to losses caused by GrowNest\'s own negligence or wilful misconduct.'],
      },
      {
        heading: '20. Force Majeure',
        paragraphs: ['GrowNest shall not be responsible for delays or interruptions caused by events beyond its reasonable control, including natural disasters, internet or telecommunications failures, government actions, or other force majeure events.'],
      },
      {
        heading: '21. Amendments',
        paragraphs: ['GrowNest may amend this Agreement from time to time to reflect changes in law, technology, or business operations. Continued use of your Vendor account after the effective date of revised terms constitutes acceptance of the updated Agreement, subject to applicable law.'],
      },
      {
        heading: '22. Governing Law',
        paragraphs: ['This Agreement is governed by the laws of the Federal Republic of Nigeria.'],
      },
      {
        heading: '23. Dispute Resolution',
        paragraphs: ['Disputes shall first be referred to GrowNest\'s internal complaints process. Where a dispute cannot be resolved internally, the parties may pursue alternative dispute resolution, including arbitration where mutually agreed, or remedies before a court of competent jurisdiction.'],
      },
      {
        heading: '24. Entire Agreement',
        paragraphs: ['This Agreement, together with the GrowNest Terms & Conditions, Privacy Policy, and any published fee schedules or category-specific rules, constitutes the entire agreement between GrowNest and the Vendor regarding participation in the Marketplace.'],
      },
      {
        heading: '25. Contact Information',
        paragraphs: [`All Vendor support requests should be directed through official GrowNest channels: support@grownest.africa.`],
      },
    ],
  },
};

export const legalDocSlugs = Object.keys(legalDocs);
