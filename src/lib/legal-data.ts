export interface LegalSection {
    id: string;
    title: string;
    iconName?: string;
    summary?: string;
    paragraphs: string[];
    subsections?: {
        id: string;
        title: string;
        content: string[];
    }[];
}

export interface LegalDocument {
    title: string;
    subtitle: string;
    lastUpdated: string;
    effectiveDate: string;
    version: string;
    readTime: string;
    tldrSummaries: {
        title: string;
        description: string;
        icon: string;
    }[];
    sections: LegalSection[];
}

export const TERMS_OF_SERVICE: LegalDocument = {
    title: "Internal System Terms & Acceptable Use Policy",
    subtitle: "Notice: Proprietary internal enterprise software. Access is strictly limited to authorized company personnel, sales reps, and fitters.",
    lastUpdated: "August 1, 2026",
    effectiveDate: "August 1, 2026",
    version: "v2.4 (Internal)",
    readTime: "6 min read",
    tldrSummaries: [
        {
            title: "Authorized Personnel Only",
            description: "Strictly for company staff, field technicians, sales representatives, and approved trade contractors.",
            icon: "Lock"
        },
        {
            title: "Strict Confidentiality",
            description: "All client files, pricing catalogs, fabric margins, and installation schedules are company trade secrets.",
            icon: "ShieldCheck"
        },
        {
            title: "Fitter Sign-Off Protocol",
            description: "Field staff are required to physically verify laser measurement readings prior to issuing client quotes.",
            icon: "Ruler"
        },
        {
            title: "Device & Asset Security",
            description: "Company credentials and offline sync tablets must be secured; report lost hardware immediately.",
            icon: "Zap"
        }
    ],
    sections: [
        {
            id: "authorization-notice",
            title: "1. Authorized Access & System Scope",
            summary: "MeasurePro is an internal company operating system reserved exclusively for staff.",
            paragraphs: [
                "This internal application ('MeasurePro System') is owned, operated, and maintained by the Company for internal business operations, customer order management, field measurements, and quote generation.",
                "Access to the MeasurePro System is restricted strictly to authorized employees, sales representatives, field fitters, installation technicians, and designated third-party contractors ('Authorized Users').",
                "Unauthorized access, attempted credential sharing, or unauthorized use by external third parties is strictly prohibited and may result in revocation of access, disciplinary action, and legal remedies under internal corporate policies."
            ]
        },
        {
            id: "confidentiality-ip",
            title: "2. Company Data Ownership & Trade Confidentiality",
            summary: "All data entered into MeasurePro remains exclusive company intellectual property.",
            paragraphs: [
                "Proprietary Business Data: All customer records, window measurement specifications, fabric pricing structures, supplier margins, floor plans, and installation notes stored in MeasurePro are confidential company assets.",
                "Intellectual Property: The software architecture, measurement calculation formulas, curtain drop deduction algorithms, and interface tools are proprietary company intellectual property.",
                "Non-Disclosure: Authorized Users agree not to export, copy, transmit, screenshot, or disclose any customer details, pricing matrices, or internal operational metrics to unauthorized outside parties."
            ]
        },
        {
            id: "acceptable-use",
            title: "3. Acceptable Use & Account Governance",
            summary: "Guidelines governing user accounts, permission tiers, and mobile access.",
            paragraphs: [
                "Authorized Users must adhere to the following standards of system use:",
                "• Maintain account security and unique passwords; sharing login credentials between staff members is prohibited.",
                "• Respect role-based authorization tiers (Sales Representative, Fitter, Admin) and do not attempt to bypass access controls.",
                "• Lock or log out of mobile measurement tablets when leaving job sites or unattended field vehicles.",
                "• Immediately notify internal IT Support (it-support@company.internal) if a company-issued device containing MeasurePro data is lost, stolen, or compromised."
            ]
        },
        {
            id: "fitter-verification-protocol",
            title: "4. Measurement Accuracy & Field Verification Protocol",
            summary: "Standards for digital rangefinder sync and mandatory technician physical checks.",
            paragraphs: [
                "MeasurePro provides digital calculation automation to streamline field operations. However:",
                "• Laser Measure Sync: Bluetooth laser distance meters connected to MeasurePro must be calibrated regularly according to company equipment maintenance guidelines.",
                "• Mandatory Verification: Lead fitters and sales reps remain responsible for double-checking header drops, obstruction clearances, and fabric pattern repeats before finalizing order sign-offs.",
                "• Cost Responsibility: Unverified manual entry errors or failure to follow company measurement check sheets that lead to fabric re-orders may be reviewed under standard company quality control protocols."
            ]
        },
        {
            id: "audit-logging",
            title: "5. System Audit Logging & Monitoring",
            summary: "Notice regarding activity logging for operational security and quality control.",
            paragraphs: [
                "For system integrity, data security, and audit compliance, the Company monitors and logs activity within the MeasurePro System.",
                "Logged information includes user login timestamps, IP addresses, GPS check-in locations during customer appointments, quote edits, and data export events.",
                "System logs are reviewed periodically by internal IT and management to ensure compliance with company operational standards."
            ]
        },
        {
            id: "offboarding-revocation",
            title: "6. Departure & Access Revocation",
            summary: "Procedures upon termination of employment or contractor agreements.",
            paragraphs: [
                "Upon conclusion of employment or contract expiration, user access to MeasurePro will be terminated immediately.",
                "Former employees and contractors must return all company-owned tablets, laser distance meters, and offline storage devices containing MeasurePro data.",
                "Post-employment confidentiality obligations regarding company client databases and fabric pricing remain in full effect."
            ]
        },
        {
            id: "support-contact",
            title: "7. Internal Support & Policy Inquiries",
            summary: "Internal channels for reporting system bugs, feature requests, or policy updates.",
            paragraphs: [
                "For technical support, account permission changes, or questions regarding internal company policies, contact:",
                "Internal IT Helpdesk: support@company.internal | Ext: 4401",
                "Operations Management: ops@company.internal"
            ]
        }
    ]
};

export const PRIVACY_POLICY: LegalDocument = {
    title: "Internal Data Privacy & Protection Policy",
    subtitle: "Governing how staff activity logs, client job-site details, and field photos are processed within our internal systems.",
    lastUpdated: "August 1, 2026",
    effectiveDate: "August 1, 2026",
    version: "v2.4 (Internal)",
    readTime: "5 min read",
    tldrSummaries: [
        {
            title: "Client Privacy Protection",
            description: "Customer home addresses and room photos are encrypted and used solely for fulfilling orders.",
            icon: "Lock"
        },
        {
            title: "Field GPS & Log Privacy",
            description: "Job-site check-in location data is used strictly for technician dispatch and safety compliance.",
            icon: "ShieldAlert"
        },
        {
            title: "Role-Based Access",
            description: "Staff view only the customer records necessary for their assigned fittings and appointments.",
            icon: "UserCheck"
        },
        {
            title: "Encrypted Storage",
            description: "All internal database backups and job site photos are secured with AES-256 company encryption.",
            icon: "Cookie"
        }
    ],
    sections: [
        {
            id: "internal-data-scope",
            title: "1. Scope of Internal Data Processing",
            summary: "Overview of information processed through our internal company management software.",
            paragraphs: [
                "This Internal Privacy Policy outlines how our company collects, stores, and protects data captured by staff using the MeasurePro internal software platform.",
                "Data categories processed within the system include:",
                "• Staff & Contractor Data: Employee ID, work email, assigned role, appointment schedules, and device login activity.",
                "• Field & Location Data: Job-site arrival check-ins, route optimization timestamps, and Bluetooth laser pairing telemetry.",
                "• Client & Order Data: Customer names, delivery addresses, window dimensions, room photos, fabric choices, and invoice records."
            ]
        },
        {
            id: "client-data-handling",
            title: "2. Customer & Job Site Data Protection",
            summary: "Strict company standards for protecting client home details and photos.",
            paragraphs: [
                "Customer privacy is paramount. Staff must observe strict guidelines when recording client details:",
                "• Job Site Photographs: Photos taken of windows or rooms must focus exclusively on fitting areas. Staff must refrain from capturing personal family photos, financial documents, or sensitive home items.",
                "• Client Contact Confidentiality: Customer phone numbers and addresses stored in MeasurePro are strictly for scheduling fittings and deliveries; personnel are prohibited from contacting clients outside official company business.",
                "• Storage Encryption: All client records and attached room photos are stored on company-encrypted servers with AES-256 security."
            ]
        },
        {
            id: "staff-telemetry-gps",
            title: "3. Staff Telemetry & Field Safety Logging",
            summary: "Usage specifications for field GPS check-ins and appointment logging.",
            paragraphs: [
                "MeasurePro utilizes localized GPS check-ins on field tablets to facilitate dispatch, verify installer arrival at client locations, and support worker safety.",
                "Location tracking is active only when checking in for assigned appointments or during working hours. The company does not track staff personal movements outside scheduled work hours."
            ]
        },
        {
            id: "access-control-security",
            title: "4. Access Control & System Safeguards",
            summary: "Technical security measures restricting internal data access.",
            paragraphs: [
                "To protect company and client assets, MeasurePro enforces robust technical security measures:",
                "• Role-Based Permissions: Sales reps, fitters, warehouse staff, and managers only have access to data required for their specific work responsibilities.",
                "• Network Security: Access to internal admin features requires connection via company VPN or verified internal IP ranges.",
                "• Automatic Timeout: Session lockouts trigger automatically after 15 minutes of inactivity on mobile devices to prevent unauthorized viewing."
            ]
        },
        {
            id: "data-retention-archiving",
            title: "5. Data Retention & Record Archiving",
            summary: "Policies on storing active jobs, completed orders, and audit history.",
            paragraphs: [
                "Completed job records, window measurements, and invoice archives are retained in the system database for 7 years to support warranty service, repeat customer orders, and tax compliance.",
                "Field measurement photos older than 3 years are automatically archived to cold storage."
            ]
        },
        {
            id: "compliance-support",
            title: "6. Internal Compliance Contacts",
            summary: "Reporting channels for privacy concerns or security issues.",
            paragraphs: [
                "If staff observe any potential data privacy violation, unauthorized access attempt, or security issue within MeasurePro, report it immediately to:",
                "Data Security & IT: security@company.internal",
                "Internal Privacy Compliance: privacy@company.internal"
            ]
        }
    ]
};
