/**
 * Mock candidate data — single source of truth for candidate ranking views.
 * Each job maps to 10-15 candidates with AI match scores and skill tags.
 * Replace with API calls when backend is integrated.
 */

export interface SubScores {
  technicalFit: number;
  cultureFit: number;
  experienceDepth: number;
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
}

export interface DimensionScore {
  dimension: string;
  score: number;
  reasoning: string;
}

export interface AIEvaluation {
  overallReasoning: string;
  dimensionScores: DimensionScore[];
  skillGaps: string[];
  strengths: string[];
}

export type PipelineStatus = "New" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected" | "Archived";

export interface Candidate {
  id: string;
  name: string;
  matchScore: number;
  skills: string[];
  subScores: SubScores;
  pipelineStatus?: PipelineStatus;
  experience?: Experience[];
  education?: Education[];
  certifications?: string[];
  aiEvaluation?: AIEvaluation;
  /** Fields populated by Apollo/external API data (FLOW-2/3) */
  headline?: string;
  currentCompany?: string;
  currentTitle?: string;
  location?: string;
  linkedinUrl?: string;
}

/**
 * Map of jobId -> candidate array.
 * Candidates are stored unsorted; the UI sorts by matchScore descending.
 */
export const MOCK_CANDIDATES: Record<string, Candidate[]> = {
  // Job 1: Senior Backend Engineer
  "1": [
    {
      id: "c1-01", name: "Liam Chen", matchScore: 96, skills: ["Go", "Kubernetes", "gRPC", "PostgreSQL", "Distributed Systems"], subScores: { technicalFit: 98, cultureFit: 90, experienceDepth: 95 }, pipelineStatus: "Interview",
      experience: [
        { company: "Stripe", role: "Staff Backend Engineer", period: "2021 — Present", description: "Architected payment processing microservices handling 50M+ daily transactions using Go and gRPC. Led migration from monolith to distributed service mesh on Kubernetes." },
        { company: "Cloudflare", role: "Senior Software Engineer", period: "2018 — 2021", description: "Built edge computing platform components in Go. Designed PostgreSQL sharding strategy supporting 10TB+ datasets with sub-50ms query latency." },
        { company: "Palantir", role: "Software Engineer", period: "2015 — 2018", description: "Developed distributed data pipeline infrastructure processing petabyte-scale datasets. Implemented service discovery and load balancing with gRPC." },
      ],
      education: [
        { institution: "Carnegie Mellon University", degree: "M.S. Computer Science", year: "2015" },
        { institution: "UC Berkeley", degree: "B.S. Electrical Engineering & Computer Science", year: "2013" },
      ],
      certifications: ["Certified Kubernetes Administrator (CKA)", "AWS Solutions Architect — Professional"],
    },
    {
      id: "c1-02", name: "Ava Petrov", matchScore: 93, skills: ["Go", "Kubernetes", "PostgreSQL", "Terraform", "Docker"], subScores: { technicalFit: 95, cultureFit: 88, experienceDepth: 92 }, pipelineStatus: "Interview",
      experience: [
        { company: "Datadog", role: "Senior Backend Engineer", period: "2020 — Present", description: "Designed and maintained high-throughput metrics ingestion pipeline in Go, processing 2M+ data points per second. Managed Kubernetes clusters across 3 cloud regions." },
        { company: "HashiCorp", role: "Software Engineer II", period: "2017 — 2020", description: "Contributed to Terraform provider ecosystem and Consul service mesh. Built internal tooling in Go for infrastructure automation." },
        { company: "DigitalOcean", role: "Junior Software Engineer", period: "2015 — 2017", description: "Developed Docker-based deployment tooling and PostgreSQL backup automation systems." },
      ],
      education: [
        { institution: "MIT", degree: "B.S. Computer Science", year: "2015" },
      ],
      certifications: ["HashiCorp Certified: Terraform Associate", "CKA"],
    },
    {
      id: "c1-03", name: "Marcus Webb", matchScore: 89, skills: ["Go", "Distributed Systems", "gRPC", "Rust"], subScores: { technicalFit: 92, cultureFit: 82, experienceDepth: 88 }, pipelineStatus: "Screening",
      experience: [
        { company: "Figma", role: "Senior Platform Engineer", period: "2021 — Present", description: "Built real-time collaboration backend in Rust and Go. Designed conflict resolution protocols for concurrent document editing across distributed nodes." },
        { company: "Uber", role: "Software Engineer II", period: "2018 — 2021", description: "Worked on ride-matching microservices using Go and gRPC. Optimized geospatial indexing reducing match latency by 40%." },
        { company: "IBM Research", role: "Research Engineer", period: "2016 — 2018", description: "Prototyped distributed consensus algorithms and contributed to open-source blockchain frameworks." },
      ],
      education: [
        { institution: "Stanford University", degree: "M.S. Computer Science (Distributed Systems)", year: "2016" },
        { institution: "University of Michigan", degree: "B.S. Computer Science", year: "2014" },
      ],
    },
    {
      id: "c1-04", name: "Yuki Tanaka", matchScore: 87, skills: ["Go", "Kubernetes", "PostgreSQL", "CI/CD"], subScores: { technicalFit: 90, cultureFit: 85, experienceDepth: 82 }, pipelineStatus: "New",
      experience: [
        { company: "Mercari", role: "Lead Backend Engineer", period: "2020 — Present", description: "Led team of 6 engineers building marketplace transaction services in Go. Implemented CI/CD pipelines reducing deploy time from 45min to 8min." },
        { company: "LINE Corporation", role: "Backend Engineer", period: "2017 — 2020", description: "Built messaging infrastructure handling 200K+ concurrent connections. Managed PostgreSQL replication and failover systems." },
      ],
      education: [
        { institution: "University of Tokyo", degree: "M.Eng. Information Science", year: "2017" },
        { institution: "Kyoto University", degree: "B.Eng. Computer Science", year: "2015" },
      ],
      certifications: ["Google Cloud Professional Cloud Architect"],
    },
    {
      id: "c1-05", name: "Priya Sharma", matchScore: 84, skills: ["Kubernetes", "gRPC", "PostgreSQL", "Python"], subScores: { technicalFit: 86, cultureFit: 84, experienceDepth: 80 }, pipelineStatus: "Screening",
      experience: [
        { company: "Flipkart", role: "Senior Software Engineer", period: "2019 — Present", description: "Designed inventory management microservices using gRPC and PostgreSQL. Orchestrated Kubernetes deployments serving 100M+ users during sale events." },
        { company: "Thoughtworks", role: "Software Consultant", period: "2016 — 2019", description: "Delivered backend solutions for enterprise clients using Python and PostgreSQL. Introduced Kubernetes-based deployment workflows." },
      ],
      education: [
        { institution: "IIT Bombay", degree: "B.Tech Computer Science", year: "2016" },
      ],
    },
    {
      id: "c1-06", name: "Jordan Blake", matchScore: 81, skills: ["Go", "Docker", "PostgreSQL", "GraphQL"], subScores: { technicalFit: 83, cultureFit: 80, experienceDepth: 78 }, pipelineStatus: "New",
      experience: [
        { company: "Shopify", role: "Backend Developer", period: "2020 — Present", description: "Built GraphQL APIs in Go for merchant analytics platform. Containerized services with Docker, reducing environment drift issues by 90%." },
        { company: "Wealthsimple", role: "Software Engineer", period: "2018 — 2020", description: "Developed financial data pipelines using Go and PostgreSQL. Built transaction reconciliation engine processing $2B+ annually." },
      ],
      education: [
        { institution: "University of Waterloo", degree: "B.CS. Computer Science (Co-op)", year: "2018" },
      ],
    },
    {
      id: "c1-07", name: "Elena Vasquez", matchScore: 77, skills: ["Go", "Kubernetes", "Terraform"], subScores: { technicalFit: 80, cultureFit: 72, experienceDepth: 75 }, pipelineStatus: "New",
      experience: [
        { company: "Globant", role: "Senior DevOps Engineer", period: "2020 — Present", description: "Managed Kubernetes infrastructure for Fortune 500 clients. Built Go-based CLI tools for Terraform workflow automation." },
        { company: "MercadoLibre", role: "Backend Engineer", period: "2017 — 2020", description: "Developed payment processing services in Go. Implemented infrastructure-as-code using Terraform for multi-region deployments." },
      ],
      education: [
        { institution: "Universidad de Buenos Aires", degree: "Lic. Computer Science", year: "2017" },
      ],
    },
    {
      id: "c1-08", name: "Samuel Osei", matchScore: 72, skills: ["Distributed Systems", "PostgreSQL", "Java"], subScores: { technicalFit: 74, cultureFit: 70, experienceDepth: 71 }, pipelineStatus: "New",
      experience: [
        { company: "Andela", role: "Senior Software Engineer", period: "2019 — Present", description: "Built distributed event-sourcing platform for fintech clients using Java and PostgreSQL. Designed CQRS patterns for high-throughput transaction processing." },
        { company: "Interswitch", role: "Software Engineer", period: "2016 — 2019", description: "Developed payment gateway systems processing $4B+ annually. Managed PostgreSQL clusters with 99.99% uptime." },
      ],
      education: [
        { institution: "University of Ghana", degree: "B.Sc. Computer Science", year: "2016" },
      ],
    },
    {
      id: "c1-09", name: "Nina Kowalski", matchScore: 65, skills: ["Go", "Docker", "Redis"], subScores: { technicalFit: 68, cultureFit: 65, experienceDepth: 60 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Allegro", role: "Backend Developer", period: "2020 — Present", description: "Built caching layer with Redis for product search, improving response times by 60%. Developed Go microservices for order management." },
        { company: "Comarch", role: "Junior Developer", period: "2018 — 2020", description: "Developed ERP modules in Java. Migrated legacy services to Docker containers." },
      ],
      education: [
        { institution: "AGH University of Science and Technology", degree: "M.Sc. Computer Science", year: "2018" },
      ],
    },
    {
      id: "c1-10", name: "Ryan Mitchell", matchScore: 58, skills: ["PostgreSQL", "Python", "REST APIs"], subScores: { technicalFit: 55, cultureFit: 62, experienceDepth: 58 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Accenture", role: "Software Developer", period: "2019 — Present", description: "Built REST APIs in Python/Flask for healthcare clients. Managed PostgreSQL databases with complex reporting queries." },
        { company: "Deloitte Digital", role: "Associate Developer", period: "2017 — 2019", description: "Developed backend services for insurance platforms. Built data migration scripts in Python." },
      ],
      education: [
        { institution: "University of Texas at Austin", degree: "B.S. Computer Science", year: "2017" },
      ],
    },
    {
      id: "c1-11", name: "Fatima Al-Rashid", matchScore: 51, skills: ["Java", "Kubernetes", "Microservices"], subScores: { technicalFit: 50, cultureFit: 55, experienceDepth: 48 }, pipelineStatus: "New",
      experience: [
        { company: "Careem", role: "Software Engineer", period: "2020 — Present", description: "Developed microservices in Java/Spring Boot for ride-hailing platform. Deployed and monitored services on Kubernetes." },
        { company: "SAP", role: "Junior Developer", period: "2018 — 2020", description: "Built enterprise middleware components in Java. Participated in cloud migration initiatives." },
      ],
      education: [
        { institution: "American University of Beirut", degree: "B.E. Computer & Communications Engineering", year: "2018" },
      ],
    },
    {
      id: "c1-12", name: "Derek Chung", matchScore: 44, skills: ["Node.js", "PostgreSQL", "Docker"], subScores: { technicalFit: 42, cultureFit: 48, experienceDepth: 44 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Freelance", role: "Full Stack Developer", period: "2020 — Present", description: "Built web applications using Node.js and PostgreSQL for small business clients. Containerized projects with Docker." },
        { company: "Startup (Stealth)", role: "Backend Developer", period: "2019 — 2020", description: "Solo backend developer building REST APIs in Express.js with PostgreSQL." },
      ],
      education: [
        { institution: "San Jose State University", degree: "B.S. Software Engineering", year: "2019" },
      ],
    },
  ],

  // Job 2: Product Designer
  "2": [
    {
      id: "c2-01", name: "Sofia Lindberg", matchScore: 94, skills: ["Figma", "Design Systems", "User Research", "Prototyping"], subScores: { technicalFit: 96, cultureFit: 92, experienceDepth: 90 }, pipelineStatus: "Interview",
      experience: [
        { company: "Spotify", role: "Senior Product Designer", period: "2021 — Present", description: "Led design system evolution for Spotify for Artists platform. Conducted user research with 200+ artists to inform playlist analytics redesign." },
        { company: "Klarna", role: "Product Designer", period: "2018 — 2021", description: "Designed end-to-end checkout experiences for 150M+ users. Built and maintained component library in Figma with 400+ components." },
        { company: "King (Activision Blizzard)", role: "UX Designer", period: "2016 — 2018", description: "Designed in-game UI for casual games. Created prototyping frameworks for rapid user testing." },
      ],
      education: [
        { institution: "Konstfack (University of Arts)", degree: "MFA Interaction Design", year: "2016" },
        { institution: "KTH Royal Institute of Technology", degree: "B.Sc. Media Technology", year: "2014" },
      ],
    },
    {
      id: "c2-02", name: "Kai Nakamura", matchScore: 91, skills: ["Figma", "Design Systems", "Data Visualization", "Motion Design"], subScores: { technicalFit: 93, cultureFit: 88, experienceDepth: 89 }, pipelineStatus: "Screening",
      experience: [
        { company: "Notion", role: "Staff Designer", period: "2022 — Present", description: "Designed data visualization components for Notion databases. Created motion design language for micro-interactions and page transitions." },
        { company: "Airbnb", role: "Product Designer", period: "2019 — 2022", description: "Contributed to DLS (Design Language System). Led host dashboard redesign increasing engagement metrics by 25%." },
      ],
      education: [
        { institution: "Tama Art University", degree: "BFA Graphic Design", year: "2017" },
      ],
    },
    {
      id: "c2-03", name: "Olivia James", matchScore: 88, skills: ["Figma", "User Research", "Prototyping", "Front-end CSS"], subScores: { technicalFit: 90, cultureFit: 85, experienceDepth: 86 }, pipelineStatus: "New",
      experience: [
        { company: "Intercom", role: "Senior Product Designer", period: "2020 — Present", description: "Led redesign of messenger widget used by 25K+ businesses. Built interactive Figma prototypes for usability testing with enterprise customers." },
        { company: "Pivotal Labs", role: "Product Designer", period: "2017 — 2020", description: "Embedded designer on agile engineering teams. Shipped 12+ products across fintech and healthcare verticals." },
      ],
      education: [
        { institution: "RISD", degree: "BFA Industrial Design", year: "2017" },
      ],
      certifications: ["Nielsen Norman Group UX Certificate"],
    },
    {
      id: "c2-04", name: "Thomas Müller", matchScore: 85, skills: ["Figma", "Design Systems", "Prototyping"], subScores: { technicalFit: 87, cultureFit: 82, experienceDepth: 83 }, pipelineStatus: "New",
      experience: [
        { company: "SAP", role: "Design System Lead", period: "2019 — Present", description: "Maintained Fiori design system with 600+ components. Coordinated design consistency across 20+ product teams." },
        { company: "Siemens", role: "UX Designer", period: "2016 — 2019", description: "Designed industrial IoT dashboard interfaces. Created Figma prototyping workflows adopted company-wide." },
      ],
      education: [
        { institution: "HfG Schwäbisch Gmünd", degree: "B.A. Interaction Design", year: "2016" },
      ],
    },
    {
      id: "c2-05", name: "Aria Patel", matchScore: 82, skills: ["Figma", "User Research", "Motion Design"], subScores: { technicalFit: 84, cultureFit: 80, experienceDepth: 79 }, pipelineStatus: "New",
      experience: [
        { company: "Razorpay", role: "Product Designer", period: "2020 — Present", description: "Designed payment dashboard for 8M+ merchants. Led user research initiative establishing quarterly usability testing cadence." },
        { company: "Freshworks", role: "UI Designer", period: "2018 — 2020", description: "Created motion design specs for CRM product animations. Built Figma component libraries for 3 product lines." },
      ],
      education: [
        { institution: "NID Ahmedabad", degree: "B.Des. New Media Design", year: "2018" },
      ],
    },
    {
      id: "c2-06", name: "Lucas Ferreira", matchScore: 76, skills: ["Figma", "Prototyping", "Illustration"], subScores: { technicalFit: 78, cultureFit: 75, experienceDepth: 72 }, pipelineStatus: "New",
      experience: [
        { company: "Nubank", role: "Product Designer", period: "2020 — Present", description: "Designed onboarding flows for credit card products. Created illustration system for empty states and error screens." },
        { company: "Vtex", role: "Junior Designer", period: "2018 — 2020", description: "Prototyped e-commerce checkout experiences. Built icon library with 200+ custom illustrations." },
      ],
      education: [
        { institution: "Universidade de São Paulo", degree: "B.A. Visual Design", year: "2018" },
      ],
    },
    {
      id: "c2-07", name: "Zara Ahmed", matchScore: 70, skills: ["Sketch", "Design Systems", "User Research"], subScores: { technicalFit: 72, cultureFit: 68, experienceDepth: 67 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Careem", role: "UX Designer", period: "2019 — Present", description: "Conducted user research across MENA markets. Built design system in Sketch for ride-hailing super app." },
        { company: "Mentor Graphics", role: "Junior UX Designer", period: "2017 — 2019", description: "Designed EDA software interfaces for engineering workflows." },
      ],
      education: [
        { institution: "American University of Sharjah", degree: "B.Sc. Multimedia Design", year: "2017" },
      ],
    },
    {
      id: "c2-08", name: "Ethan Park", matchScore: 63, skills: ["Figma", "Front-end CSS", "Accessibility"], subScores: { technicalFit: 65, cultureFit: 60, experienceDepth: 62 }, pipelineStatus: "New",
      experience: [
        { company: "Deque Systems", role: "Accessible Design Specialist", period: "2020 — Present", description: "Audited and redesigned UI components for WCAG 2.1 compliance. Built accessible Figma component library." },
        { company: "Freelance", role: "Web Designer", period: "2018 — 2020", description: "Designed and coded responsive websites with semantic HTML and CSS for small businesses." },
      ],
      education: [
        { institution: "Seoul National University", degree: "B.A. Visual Communication", year: "2018" },
      ],
      certifications: ["IAAP Certified Professional in Accessibility Core Competencies"],
    },
    {
      id: "c2-09", name: "Isabella Costa", matchScore: 55, skills: ["Adobe XD", "Prototyping", "Branding"], subScores: { technicalFit: 52, cultureFit: 58, experienceDepth: 55 }, pipelineStatus: "Rejected",
      experience: [
        { company: "WPP", role: "Brand Designer", period: "2019 — Present", description: "Created brand identity systems for consumer product launches. Prototyped digital experiences in Adobe XD." },
      ],
      education: [
        { institution: "Istituto Europeo di Design", degree: "B.A. Brand Communication", year: "2019" },
      ],
    },
    {
      id: "c2-10", name: "Noah Williams", matchScore: 48, skills: ["Canva", "UI Design", "Typography"], subScores: { technicalFit: 45, cultureFit: 50, experienceDepth: 48 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Local Agency", role: "Graphic Designer", period: "2020 — Present", description: "Created social media graphics and marketing materials using Canva and Illustrator." },
      ],
      education: [
        { institution: "Community College of Denver", degree: "A.A. Graphic Design", year: "2020" },
      ],
    },
  ],

  // Job 3: DevOps Lead
  "3": [
    {
      id: "c3-01", name: "Viktor Kozlov", matchScore: 92, skills: ["AWS", "Terraform", "Kubernetes", "Docker", "CI/CD"], subScores: { technicalFit: 95, cultureFit: 88, experienceDepth: 91 }, pipelineStatus: "Interview",
      experience: [
        { company: "Yandex Cloud", role: "Principal DevOps Engineer", period: "2020 — Present", description: "Led infrastructure platform team managing 5,000+ Kubernetes pods. Designed multi-region Terraform modules reducing provisioning time by 70%." },
        { company: "Kaspersky", role: "Senior DevOps Engineer", period: "2016 — 2020", description: "Built CI/CD pipelines for security product releases. Managed AWS infrastructure supporting 400M+ endpoint agents." },
        { company: "Mail.ru Group", role: "Systems Engineer", period: "2013 — 2016", description: "Administered Docker-based microservice deployments. Built monitoring dashboards with Grafana and Prometheus." },
      ],
      education: [
        { institution: "Moscow State University", degree: "M.Sc. Applied Mathematics & Computer Science", year: "2013" },
      ],
      certifications: ["AWS Solutions Architect — Professional", "CKA", "HashiCorp Certified: Terraform Associate"],
    },
    {
      id: "c3-02", name: "Hannah Nguyen", matchScore: 88, skills: ["AWS", "Terraform", "Docker", "Monitoring (Datadog/Grafana)"], subScores: { technicalFit: 90, cultureFit: 86, experienceDepth: 85 }, pipelineStatus: "Screening",
      experience: [
        { company: "Canva", role: "Senior Platform Engineer", period: "2021 — Present", description: "Managed AWS infrastructure for design platform serving 130M+ monthly users. Built Datadog observability stack with 500+ monitors." },
        { company: "Atlassian", role: "DevOps Engineer", period: "2018 — 2021", description: "Automated Terraform deployments for Jira Cloud. Designed Docker build optimization reducing image sizes by 60%." },
      ],
      education: [
        { institution: "University of Melbourne", degree: "B.Eng. Software Engineering (Hons)", year: "2018" },
      ],
      certifications: ["AWS DevOps Engineer — Professional"],
    },
    {
      id: "c3-03", name: "Oscar Martínez", matchScore: 85, skills: ["AWS", "Kubernetes", "CI/CD", "GCP", "Pulumi"], subScores: { technicalFit: 88, cultureFit: 82, experienceDepth: 83 }, pipelineStatus: "New",
      experience: [
        { company: "Rappi", role: "DevOps Lead", period: "2020 — Present", description: "Led multi-cloud (AWS + GCP) infrastructure for delivery platform. Implemented Pulumi IaC replacing legacy CloudFormation templates." },
        { company: "MercadoLibre", role: "SRE", period: "2017 — 2020", description: "Built CI/CD pipelines handling 2,000+ daily deployments. Managed Kubernetes clusters across Latin American regions." },
      ],
      education: [
        { institution: "ITESM Monterrey", degree: "B.Sc. Computer Systems Engineering", year: "2017" },
      ],
    },
    {
      id: "c3-04", name: "Ingrid Svensson", matchScore: 80, skills: ["Terraform", "Docker", "Kubernetes", "AWS"], subScores: { technicalFit: 82, cultureFit: 78, experienceDepth: 78 }, pipelineStatus: "New",
      experience: [
        { company: "Ericsson", role: "Cloud Infrastructure Engineer", period: "2019 — Present", description: "Managed Kubernetes-based 5G network infrastructure on AWS. Built Terraform modules for telecom-grade service deployments." },
        { company: "Volvo Cars", role: "DevOps Engineer", period: "2017 — 2019", description: "Containerized automotive software build systems with Docker. Implemented GitOps workflows for embedded systems CI/CD." },
      ],
      education: [
        { institution: "Chalmers University of Technology", degree: "M.Sc. Computer Science", year: "2017" },
      ],
    },
    {
      id: "c3-05", name: "David Kim", matchScore: 75, skills: ["AWS", "Docker", "CI/CD", "Jenkins"], subScores: { technicalFit: 78, cultureFit: 72, experienceDepth: 73 }, pipelineStatus: "New",
      experience: [
        { company: "Samsung SDS", role: "DevOps Engineer", period: "2019 — Present", description: "Built Jenkins-based CI/CD pipelines for enterprise clients. Managed Docker container orchestration on AWS ECS." },
        { company: "NHN", role: "Systems Administrator", period: "2017 — 2019", description: "Administered AWS infrastructure for gaming platforms. Automated server provisioning with Ansible and Docker." },
      ],
      education: [
        { institution: "KAIST", degree: "B.Sc. Computer Science", year: "2017" },
      ],
    },
    {
      id: "c3-06", name: "Maya Johnson", matchScore: 69, skills: ["Terraform", "AWS", "Monitoring (Datadog/Grafana)"], subScores: { technicalFit: 72, cultureFit: 66, experienceDepth: 67 }, pipelineStatus: "New",
      experience: [
        { company: "PagerDuty", role: "Infrastructure Engineer", period: "2020 — Present", description: "Built Terraform modules for SaaS infrastructure. Designed Datadog monitoring dashboards for incident management platform." },
        { company: "Heroku", role: "Junior Platform Engineer", period: "2018 — 2020", description: "Maintained AWS-based PaaS infrastructure. Built Grafana dashboards for platform health monitoring." },
      ],
      education: [
        { institution: "Georgia Tech", degree: "B.S. Computer Science", year: "2018" },
      ],
    },
    {
      id: "c3-07", name: "Ali Hassan", matchScore: 62, skills: ["Docker", "Kubernetes", "Linux"], subScores: { technicalFit: 64, cultureFit: 60, experienceDepth: 60 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Bykea", role: "DevOps Engineer", period: "2020 — Present", description: "Managed Kubernetes clusters for ride-hailing services. Built Docker-based development environments for engineering team." },
      ],
      education: [
        { institution: "NUST Islamabad", degree: "B.E. Software Engineering", year: "2020" },
      ],
    },
    {
      id: "c3-08", name: "Clara Dubois", matchScore: 54, skills: ["AWS", "Ansible", "Bash"], subScores: { technicalFit: 56, cultureFit: 52, experienceDepth: 53 }, pipelineStatus: "Rejected",
      experience: [
        { company: "OVHcloud", role: "Systems Engineer", period: "2019 — Present", description: "Managed AWS and bare-metal infrastructure. Automated server configuration with Ansible playbooks." },
      ],
      education: [
        { institution: "EPITA Paris", degree: "Diplome d'Ingenieur Informatique", year: "2019" },
      ],
    },
    {
      id: "c3-09", name: "James O'Brien", matchScore: 47, skills: ["GCP", "Docker", "Python"], subScores: { technicalFit: 48, cultureFit: 46, experienceDepth: 45 }, pipelineStatus: "New",
      experience: [
        { company: "Workday", role: "Cloud Engineer", period: "2020 — Present", description: "Managed GCP infrastructure for HR SaaS platform. Built Python scripts for deployment automation and Docker image management." },
      ],
      education: [
        { institution: "Trinity College Dublin", degree: "B.A. Computer Science", year: "2020" },
      ],
    },
    {
      id: "c3-10", name: "Mei Lin", matchScore: 40, skills: ["Linux", "Bash", "Networking"], subScores: { technicalFit: 38, cultureFit: 42, experienceDepth: 40 }, pipelineStatus: "Rejected",
      experience: [
        { company: "China Telecom", role: "Network Administrator", period: "2019 — Present", description: "Managed Linux servers and network infrastructure. Wrote Bash scripts for system monitoring and log analysis." },
      ],
      education: [
        { institution: "Zhejiang University", degree: "B.Eng. Network Engineering", year: "2019" },
      ],
    },
  ],

  // Job 4: Frontend Engineer
  "4": [
    {
      id: "c4-01", name: "Emma Thompson", matchScore: 95, skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Accessibility (WCAG)"], subScores: { technicalFit: 97, cultureFit: 92, experienceDepth: 93 }, pipelineStatus: "Offer",
      experience: [
        { company: "Vercel", role: "Senior Frontend Engineer", period: "2021 — Present", description: "Built Next.js dashboard components for deployment analytics. Led accessibility audit achieving WCAG 2.1 AA across all products. Authored Tailwind CSS patterns for design system." },
        { company: "GitHub", role: "Frontend Engineer", period: "2018 — 2021", description: "Developed React/TypeScript components for code review UI. Built accessible keyboard navigation system for pull request interface." },
        { company: "Thoughtbot", role: "Developer", period: "2016 — 2018", description: "Delivered client projects in React and Ember.js. Established testing culture with 90%+ coverage targets." },
      ],
      education: [
        { institution: "University of Edinburgh", degree: "M.Sc. Human-Computer Interaction", year: "2016" },
        { institution: "University of Bristol", degree: "B.Sc. Computer Science", year: "2014" },
      ],
      certifications: ["IAAP Web Accessibility Specialist (WAS)", "Google UX Design Certificate"],
    },
    {
      id: "c4-02", name: "Alex Rivera", matchScore: 90, skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Framer Motion"], subScores: { technicalFit: 93, cultureFit: 87, experienceDepth: 88 }, pipelineStatus: "Interview",
      experience: [
        { company: "Linear", role: "Frontend Engineer", period: "2022 — Present", description: "Built animation-rich UI components with Framer Motion for project management tool. Implemented performant list virtualization for 100K+ issues." },
        { company: "Retool", role: "Frontend Developer", period: "2019 — 2022", description: "Developed drag-and-drop app builder in React/TypeScript. Created Tailwind-based theming system supporting white-labeling." },
      ],
      education: [
        { institution: "UCLA", degree: "B.S. Computer Science", year: "2019" },
      ],
    },
    {
      id: "c4-03", name: "Suki Watanabe", matchScore: 86, skills: ["React", "TypeScript", "Tailwind CSS", "Three.js"], subScores: { technicalFit: 88, cultureFit: 84, experienceDepth: 84 }, pipelineStatus: "Screening",
      experience: [
        { company: "teamLab", role: "Creative Frontend Engineer", period: "2021 — Present", description: "Built WebGL-powered interactive art installations using Three.js and React. Developed custom shader effects and physics simulations." },
        { company: "SmartNews", role: "Frontend Developer", period: "2019 — 2021", description: "Built news feed UI in React/TypeScript with infinite scroll and real-time updates. Implemented Tailwind CSS migration from styled-components." },
      ],
      education: [
        { institution: "Waseda University", degree: "B.Eng. Information & Communication Engineering", year: "2019" },
      ],
    },
    {
      id: "c4-04", name: "Ben Carter", matchScore: 83, skills: ["React", "TypeScript", "Next.js", "CSS-in-JS"], subScores: { technicalFit: 85, cultureFit: 80, experienceDepth: 82 }, pipelineStatus: "New",
      experience: [
        { company: "Loom", role: "Frontend Engineer", period: "2021 — Present", description: "Built video player UI and recording interface in React/Next.js. Implemented CSS-in-JS theming system with runtime theme switching." },
        { company: "Segment", role: "Junior Frontend Developer", period: "2019 — 2021", description: "Developed analytics dashboard components in React/TypeScript. Built charting components with D3.js integration." },
      ],
      education: [
        { institution: "Georgia Tech", degree: "B.S. Computational Media", year: "2019" },
      ],
    },
    {
      id: "c4-05", name: "Leila Hosseini", matchScore: 79, skills: ["React", "TypeScript", "Accessibility (WCAG)", "Storybook"], subScores: { technicalFit: 82, cultureFit: 76, experienceDepth: 77 }, pipelineStatus: "New",
      experience: [
        { company: "Shopify", role: "Frontend Developer (Polaris)", period: "2020 — Present", description: "Contributed to Polaris design system. Built accessible React components documented in Storybook. Led WCAG compliance initiatives." },
        { company: "Hootsuite", role: "UI Developer", period: "2018 — 2020", description: "Built social media management dashboard components in React/TypeScript." },
      ],
      education: [
        { institution: "University of British Columbia", degree: "B.Sc. Computer Science", year: "2018" },
      ],
    },
    {
      id: "c4-06", name: "Carlos Mendez", matchScore: 74, skills: ["React", "Next.js", "Tailwind CSS"], subScores: { technicalFit: 76, cultureFit: 72, experienceDepth: 72 }, pipelineStatus: "New",
      experience: [
        { company: "Platzi", role: "Frontend Instructor & Developer", period: "2020 — Present", description: "Built course platform UI in Next.js with Tailwind CSS. Created educational content for React development courses." },
      ],
      education: [
        { institution: "Universidad de los Andes", degree: "B.Eng. Systems Engineering", year: "2020" },
      ],
    },
    {
      id: "c4-07", name: "Diana Popescu", matchScore: 68, skills: ["Vue.js", "TypeScript", "CSS"], subScores: { technicalFit: 70, cultureFit: 66, experienceDepth: 66 }, pipelineStatus: "New",
      experience: [
        { company: "UiPath", role: "Frontend Developer", period: "2020 — Present", description: "Built automation workflow designer in Vue.js/TypeScript. Implemented CSS architecture for complex nested component layouts." },
      ],
      education: [
        { institution: "Politehnica University of Bucharest", degree: "B.Sc. Computer Science", year: "2020" },
      ],
    },
    {
      id: "c4-08", name: "Nathan Brooks", matchScore: 61, skills: ["React", "JavaScript", "SASS"], subScores: { technicalFit: 63, cultureFit: 60, experienceDepth: 58 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Agency (Various)", role: "Frontend Developer", period: "2019 — Present", description: "Built marketing sites and landing pages in React. Styled with SASS/SCSS preprocessors." },
      ],
      education: [
        { institution: "General Assembly", degree: "Web Development Immersive", year: "2019" },
      ],
    },
    {
      id: "c4-09", name: "Aisha Mohammed", matchScore: 53, skills: ["Angular", "TypeScript", "RxJS"], subScores: { technicalFit: 50, cultureFit: 56, experienceDepth: 52 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Andela", role: "Frontend Developer", period: "2020 — Present", description: "Built enterprise dashboard applications in Angular/TypeScript. Implemented reactive data flows with RxJS observables." },
      ],
      education: [
        { institution: "University of Lagos", degree: "B.Sc. Computer Science", year: "2020" },
      ],
    },
    {
      id: "c4-10", name: "Greg Sullivan", matchScore: 45, skills: ["jQuery", "HTML", "CSS"], subScores: { technicalFit: 40, cultureFit: 50, experienceDepth: 45 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Local Web Shop", role: "Web Developer", period: "2018 — Present", description: "Built and maintained WordPress sites with jQuery plugins and custom CSS themes." },
      ],
      education: [
        { institution: "Oregon State University", degree: "B.S. Computer Science (Online)", year: "2018" },
      ],
    },
    {
      id: "c4-11", name: "Rosa Valentini", matchScore: 38, skills: ["WordPress", "PHP", "CSS"], subScores: { technicalFit: 32, cultureFit: 44, experienceDepth: 38 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Freelance", role: "WordPress Developer", period: "2019 — Present", description: "Built custom WordPress themes and plugins for local businesses. Styled with CSS and PHP template customization." },
      ],
      education: [
        { institution: "Universita di Roma Tre", degree: "B.A. Communication Sciences", year: "2019" },
      ],
    },
  ],

  // Job 5: Data Scientist
  "5": [
    {
      id: "c5-01", name: "Dr. Wei Zhang", matchScore: 97, skills: ["Python", "PyTorch", "NLP / LLMs", "Embeddings & Vector Search", "SQL"], subScores: { technicalFit: 99, cultureFit: 93, experienceDepth: 96 }, pipelineStatus: "Interview",
      experience: [
        { company: "OpenAI", role: "Research Scientist", period: "2022 — Present", description: "Developed fine-tuning pipelines for large language models. Built embedding-based semantic search systems serving 100M+ queries/month. Published 3 papers on retrieval-augmented generation." },
        { company: "Google DeepMind", role: "Senior Research Engineer", period: "2018 — 2022", description: "Led NLP team building multilingual transformer models. Designed vector search infrastructure using FAISS and Pinecone for knowledge retrieval." },
        { company: "Tsinghua University", role: "Postdoctoral Researcher", period: "2016 — 2018", description: "Published 8 papers on neural machine translation and attention mechanisms. Developed PyTorch-based research frameworks for NLP experimentation." },
      ],
      education: [
        { institution: "Tsinghua University", degree: "Ph.D. Computer Science (NLP)", year: "2016" },
        { institution: "Peking University", degree: "B.Sc. Mathematics", year: "2011" },
      ],
      certifications: ["DeepLearning.AI NLP Specialization"],
    },
    {
      id: "c5-02", name: "Sarah O'Connor", matchScore: 94, skills: ["Python", "PyTorch", "NLP / LLMs", "RAG Pipelines", "SQL"], subScores: { technicalFit: 96, cultureFit: 90, experienceDepth: 93 }, pipelineStatus: "Interview",
      experience: [
        { company: "Anthropic", role: "ML Engineer", period: "2023 — Present", description: "Built RAG pipelines for enterprise retrieval systems. Developed evaluation frameworks for LLM response quality and factual accuracy." },
        { company: "Hugging Face", role: "NLP Engineer", period: "2020 — 2023", description: "Contributed to Transformers library. Built model fine-tuning pipelines used by 50K+ developers. Developed dataset processing tools in Python." },
        { company: "Microsoft Research", role: "Research Intern → FTE", period: "2018 — 2020", description: "Worked on Bing search ranking with neural language models. Built SQL-based analytics pipelines for search quality metrics." },
      ],
      education: [
        { institution: "University of Washington", degree: "M.S. Computer Science (ML)", year: "2018" },
        { institution: "Trinity College Dublin", degree: "B.A. Computer Science", year: "2016" },
      ],
    },
    {
      id: "c5-03", name: "Raj Gupta", matchScore: 91, skills: ["Python", "PyTorch", "Embeddings & Vector Search", "MLOps (MLflow/Kubeflow)"], subScores: { technicalFit: 93, cultureFit: 88, experienceDepth: 90 }, pipelineStatus: "Screening",
      experience: [
        { company: "Pinecone", role: "Senior ML Engineer", period: "2021 — Present", description: "Built embedding generation pipelines for vector database customers. Deployed PyTorch models via Kubeflow serving 1B+ vectors." },
        { company: "Myntra (Flipkart)", role: "Data Scientist", period: "2018 — 2021", description: "Built recommendation engine using embeddings and collaborative filtering. Managed MLflow experiment tracking for 20+ models in production." },
      ],
      education: [
        { institution: "IISc Bangalore", degree: "M.Tech Machine Learning", year: "2018" },
        { institution: "IIT Delhi", degree: "B.Tech Electrical Engineering", year: "2016" },
      ],
    },
    {
      id: "c5-04", name: "Maria Fernandez", matchScore: 87, skills: ["Python", "NLP / LLMs", "SQL", "Spark", "TensorFlow"], subScores: { technicalFit: 89, cultureFit: 85, experienceDepth: 85 }, pipelineStatus: "New",
      experience: [
        { company: "Telefonica", role: "Lead Data Scientist", period: "2020 — Present", description: "Built NLP models for customer intent classification in Spanish and Portuguese. Processed 500M+ records with Spark for telecom analytics." },
        { company: "BBVA", role: "Data Scientist", period: "2017 — 2020", description: "Developed TensorFlow fraud detection models. Built SQL-based feature engineering pipelines on BigQuery." },
      ],
      education: [
        { institution: "Universidad Politecnica de Madrid", degree: "M.S. Data Science", year: "2017" },
        { institution: "Universidad de Barcelona", degree: "B.Sc. Statistics", year: "2015" },
      ],
    },
    {
      id: "c5-05", name: "Andrei Volkov", matchScore: 84, skills: ["Python", "PyTorch", "SQL", "Data Engineering"], subScores: { technicalFit: 86, cultureFit: 82, experienceDepth: 82 }, pipelineStatus: "New",
      experience: [
        { company: "Yandex", role: "ML Engineer", period: "2020 — Present", description: "Built PyTorch-based search ranking models. Designed SQL data pipelines for feature stores serving 100+ ML models." },
        { company: "Sberbank AI", role: "Junior Data Scientist", period: "2018 — 2020", description: "Developed credit scoring models using Python and scikit-learn. Built data engineering pipelines with Apache Airflow." },
      ],
      education: [
        { institution: "HSE University Moscow", degree: "M.Sc. Applied Mathematics", year: "2018" },
      ],
    },
    {
      id: "c5-06", name: "Jenny Li", matchScore: 80, skills: ["Python", "NLP / LLMs", "Embeddings & Vector Search"], subScores: { technicalFit: 82, cultureFit: 78, experienceDepth: 78 }, pipelineStatus: "New",
      experience: [
        { company: "Cohere", role: "Applied Scientist", period: "2022 — Present", description: "Built embedding models for enterprise search use cases. Developed Python SDK for vector search integration." },
        { company: "Baidu", role: "NLP Engineer", period: "2019 — 2022", description: "Worked on ERNIE language model training and deployment. Built Chinese NLP preprocessing pipelines." },
      ],
      education: [
        { institution: "University of Toronto", degree: "M.Sc. Computer Science", year: "2019" },
      ],
    },
    {
      id: "c5-07", name: "Patrick Brennan", matchScore: 76, skills: ["Python", "SQL", "Spark", "Statistics"], subScores: { technicalFit: 78, cultureFit: 74, experienceDepth: 74 }, pipelineStatus: "New",
      experience: [
        { company: "Stripe", role: "Data Scientist", period: "2021 — Present", description: "Built statistical models for payment fraud detection. Processed transaction data with Spark and SQL on petabyte-scale datasets." },
        { company: "McKinsey & Company", role: "Data Analyst", period: "2019 — 2021", description: "Delivered analytics engagements for Fortune 500 clients using Python and SQL." },
      ],
      education: [
        { institution: "University College Dublin", degree: "M.Sc. Statistics", year: "2019" },
      ],
    },
    {
      id: "c5-08", name: "Hana Yoshida", matchScore: 71, skills: ["Python", "PyTorch", "Computer Vision"], subScores: { technicalFit: 73, cultureFit: 70, experienceDepth: 68 }, pipelineStatus: "New",
      experience: [
        { company: "Sony AI", role: "Computer Vision Researcher", period: "2021 — Present", description: "Developed PyTorch-based object detection models for gaming applications. Built image segmentation pipelines for real-time rendering." },
      ],
      education: [
        { institution: "University of Tokyo", degree: "M.Eng. Information Science", year: "2021" },
      ],
    },
    {
      id: "c5-09", name: "Michael Adeyemi", matchScore: 65, skills: ["Python", "SQL", "Pandas", "Scikit-learn"], subScores: { technicalFit: 62, cultureFit: 68, experienceDepth: 64 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Flutterwave", role: "Data Analyst", period: "2021 — Present", description: "Built analytics dashboards and predictive models using Python/Pandas and scikit-learn. Wrote SQL queries for transaction reporting." },
      ],
      education: [
        { institution: "University of Ibadan", degree: "B.Sc. Statistics", year: "2021" },
      ],
    },
    {
      id: "c5-10", name: "Lisa Johansson", matchScore: 58, skills: ["R", "SQL", "Statistics", "Tableau"], subScores: { technicalFit: 55, cultureFit: 62, experienceDepth: 56 }, pipelineStatus: "Rejected",
      experience: [
        { company: "H&M Group", role: "Business Analyst", period: "2020 — Present", description: "Built statistical models in R for demand forecasting. Created Tableau dashboards for supply chain analytics." },
      ],
      education: [
        { institution: "Stockholm University", degree: "M.Sc. Statistics", year: "2020" },
      ],
    },
    {
      id: "c5-11", name: "Tom Reeves", matchScore: 50, skills: ["Python", "Excel", "Power BI"], subScores: { technicalFit: 48, cultureFit: 52, experienceDepth: 50 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Deloitte", role: "Analytics Consultant", period: "2020 — Present", description: "Built Power BI dashboards for enterprise clients. Automated Excel reporting workflows with Python scripts." },
      ],
      education: [
        { institution: "University of Leeds", degree: "B.Sc. Business Analytics", year: "2020" },
      ],
    },
    {
      id: "c5-12", name: "Carmen Ruiz", matchScore: 43, skills: ["MATLAB", "Statistics", "Signal Processing"], subScores: { technicalFit: 40, cultureFit: 46, experienceDepth: 42 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Airbus", role: "Data Engineer", period: "2019 — Present", description: "Processed telemetry data using MATLAB for aircraft sensor analytics. Built statistical models for predictive maintenance." },
      ],
      education: [
        { institution: "Universidad de Sevilla", degree: "M.Sc. Telecommunications Engineering", year: "2019" },
      ],
    },
    {
      id: "c5-13", name: "Ivan Petrov", matchScore: 35, skills: ["Excel", "SQL", "Data Entry"], subScores: { technicalFit: 30, cultureFit: 40, experienceDepth: 35 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Regional Bank", role: "Data Entry Specialist", period: "2020 — Present", description: "Managed customer data in SQL databases. Created Excel reports for branch-level KPI tracking." },
      ],
      education: [
        { institution: "Novosibirsk State University", degree: "B.Sc. Economics", year: "2020" },
      ],
    },
  ],

  // Job 6: Technical Writer
  "6": [
    {
      id: "c6-01", name: "Claire Whitfield", matchScore: 92, skills: ["Technical Writing", "API Documentation", "Markdown / MDX", "Git"], subScores: { technicalFit: 94, cultureFit: 90, experienceDepth: 90 }, pipelineStatus: "Interview",
      experience: [
        { company: "Stripe", role: "Senior Technical Writer", period: "2021 — Present", description: "Authored API reference documentation for payments platform. Built docs-as-code pipeline with Markdown/MDX and Git-based review workflows." },
        { company: "Twilio", role: "Technical Writer", period: "2018 — 2021", description: "Wrote quickstart guides and API tutorials for messaging APIs. Contributed to open-source documentation tooling." },
        { company: "Red Hat", role: "Documentation Specialist", period: "2016 — 2018", description: "Maintained OpenShift documentation. Built Git-based contribution workflows for community documentation." },
      ],
      education: [
        { institution: "University of Oxford", degree: "M.A. English Language & Literature", year: "2016" },
        { institution: "University of Manchester", degree: "B.A. English Literature", year: "2014" },
      ],
      certifications: ["Society for Technical Communication (STC) Certified Professional Technical Communicator"],
    },
    {
      id: "c6-02", name: "Daniel Hoffman", matchScore: 88, skills: ["Technical Writing", "API Documentation", "Git", "Developer Experience"], subScores: { technicalFit: 90, cultureFit: 86, experienceDepth: 86 }, pipelineStatus: "Screening",
      experience: [
        { company: "Vercel", role: "Developer Experience Writer", period: "2022 — Present", description: "Wrote Next.js documentation and migration guides. Designed developer onboarding flows achieving 40% faster time-to-first-deploy." },
        { company: "DigitalOcean", role: "Technical Writer", period: "2019 — 2022", description: "Authored 100+ community tutorials for cloud infrastructure. Built API documentation with OpenAPI/Swagger specifications." },
      ],
      education: [
        { institution: "University of Michigan", degree: "B.A. Technical Communication", year: "2019" },
      ],
    },
    {
      id: "c6-03", name: "Nadia Khoury", matchScore: 83, skills: ["Technical Writing", "Markdown / MDX", "Git", "Video Tutorials"], subScores: { technicalFit: 85, cultureFit: 82, experienceDepth: 80 }, pipelineStatus: "New",
      experience: [
        { company: "MongoDB", role: "Technical Content Creator", period: "2021 — Present", description: "Created written and video documentation for database products. Built MDX-based documentation site with interactive code examples." },
        { company: "Auth0", role: "Technical Writer", period: "2019 — 2021", description: "Wrote authentication integration guides for 15+ frameworks. Created video tutorial series with 500K+ views." },
      ],
      education: [
        { institution: "American University of Beirut", degree: "B.A. Communication Arts", year: "2019" },
      ],
    },
    {
      id: "c6-04", name: "Robert Chen", matchScore: 78, skills: ["Technical Writing", "API Documentation", "Markdown / MDX"], subScores: { technicalFit: 80, cultureFit: 76, experienceDepth: 76 }, pipelineStatus: "New",
      experience: [
        { company: "Postman", role: "Technical Writer", period: "2021 — Present", description: "Documented API testing workflows and collection features. Wrote Markdown-based API documentation templates." },
        { company: "IBM", role: "Information Developer", period: "2019 — 2021", description: "Maintained Watson API documentation. Created MDX-based interactive documentation components." },
      ],
      education: [
        { institution: "University of Washington", degree: "B.Sc. Technical Communication", year: "2019" },
      ],
    },
    {
      id: "c6-05", name: "Eva Nilsson", matchScore: 72, skills: ["Technical Writing", "Git", "Confluence"], subScores: { technicalFit: 74, cultureFit: 70, experienceDepth: 70 }, pipelineStatus: "New",
      experience: [
        { company: "Spotify", role: "Technical Writer", period: "2021 — Present", description: "Documented internal platform tools and APIs using Confluence and Git-based docs. Wrote runbooks for on-call engineering teams." },
      ],
      education: [
        { institution: "Uppsala University", degree: "B.A. Rhetoric & Writing", year: "2021" },
      ],
    },
    {
      id: "c6-06", name: "Jake Morrison", matchScore: 66, skills: ["Copywriting", "Markdown / MDX", "Git"], subScores: { technicalFit: 68, cultureFit: 64, experienceDepth: 64 }, pipelineStatus: "New",
      experience: [
        { company: "Netlify", role: "Content Writer", period: "2021 — Present", description: "Wrote blog posts and product marketing copy. Contributed to Markdown/MDX documentation using Git workflows." },
      ],
      education: [
        { institution: "NYU", degree: "B.A. Journalism", year: "2021" },
      ],
    },
    {
      id: "c6-07", name: "Amara Okafor", matchScore: 59, skills: ["Technical Writing", "JIRA", "Agile"], subScores: { technicalFit: 60, cultureFit: 58, experienceDepth: 57 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Andela", role: "Technical Writer", period: "2021 — Present", description: "Wrote process documentation and user guides. Managed documentation tasks in JIRA following Agile sprints." },
      ],
      education: [
        { institution: "University of Nigeria", degree: "B.A. Mass Communication", year: "2021" },
      ],
    },
    {
      id: "c6-08", name: "Peter Lang", matchScore: 52, skills: ["Blogging", "SEO Writing", "WordPress"], subScores: { technicalFit: 50, cultureFit: 54, experienceDepth: 52 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Freelance", role: "Content Writer", period: "2020 — Present", description: "Wrote SEO-optimized blog posts for tech companies. Managed WordPress content sites." },
      ],
      education: [
        { institution: "Freie Universitat Berlin", degree: "B.A. Communication Studies", year: "2020" },
      ],
    },
    {
      id: "c6-09", name: "Simone Bianchi", matchScore: 45, skills: ["Content Strategy", "Editing", "Google Docs"], subScores: { technicalFit: 42, cultureFit: 48, experienceDepth: 44 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Publishing House", role: "Editor", period: "2019 — Present", description: "Edited non-fiction manuscripts and created content strategy documents. Managed collaborative editing in Google Docs." },
      ],
      education: [
        { institution: "Universita di Bologna", degree: "B.A. Literature", year: "2019" },
      ],
    },
    {
      id: "c6-10", name: "Kevin Tran", matchScore: 37, skills: ["Journalism", "Proofreading", "AP Style"], subScores: { technicalFit: 34, cultureFit: 40, experienceDepth: 36 }, pipelineStatus: "Rejected",
      experience: [
        { company: "Local Newspaper", role: "Staff Reporter", period: "2020 — Present", description: "Wrote news articles following AP Style guidelines. Proofread daily edition content for accuracy and clarity." },
      ],
      education: [
        { institution: "San Jose State University", degree: "B.A. Journalism", year: "2020" },
      ],
    },
  ],
};

// ── AI Evaluation Data Generator ───────────────────────────────────────────
// Deterministically generates plausible AI evaluation data from existing
// candidate fields. In production this would come from the scoring pipeline.

/** Skill gap pools per job category (keyed by first candidate id prefix). */
const SKILL_GAP_POOLS: Record<string, string[]> = {
  c1: ["System Design at Scale", "Event-Driven Architecture", "Observability (OpenTelemetry)", "Chaos Engineering", "eBPF", "Service Mesh (Istio)", "Load Testing (k6)", "Database Sharding"],
  c2: ["Design Ops Workflow", "Quantitative UX Metrics", "Cross-Platform Design (iOS/Android)", "Design Token Automation", "Advanced Animation Principles", "Inclusive Design Certification", "Component Versioning Strategy"],
  c3: ["Incident Response Runbooks", "FinOps / Cost Optimization", "Zero-Trust Networking", "GitOps (ArgoCD/Flux)", "SLO/SLI Definition", "Disaster Recovery Planning", "Multi-Cloud Strategy"],
  c4: ["Server Components Architecture", "Micro-Frontend Patterns", "Web Vitals Optimization", "WebGL / Canvas Rendering", "PWA Implementation", "Internationalization (i18n)", "Design System Governance"],
  c5: ["Model Evaluation Frameworks", "Prompt Engineering Best Practices", "Multi-Modal AI Architectures", "RLHF / Alignment Techniques", "Edge Inference Optimization", "Data Governance & Lineage", "Experiment Tracking at Scale"],
  c6: ["Docs-as-Code CI Pipeline", "Information Architecture Strategy", "SDK Code Samples (Multi-language)", "Interactive API Playground Design", "Localization Workflow", "Accessibility (WCAG) for Docs", "Versioned Documentation Strategy"],
};

const STRENGTH_POOLS: Record<string, string[]> = {
  c1: ["Deep systems-level expertise", "Proven track record at high-scale companies", "Strong open-source contributions", "Excellent distributed systems intuition", "Production Kubernetes experience", "Database performance optimization", "API design clarity"],
  c2: ["Exceptional visual design sense", "Strong design systems thinking", "User research methodology expertise", "Cross-functional collaboration skills", "Prototyping speed and fidelity", "Pixel-perfect attention to detail", "Design critique leadership"],
  c3: ["Infrastructure automation mastery", "Multi-cloud deployment experience", "Strong monitoring and alerting instincts", "Cost-conscious architecture decisions", "Incident management composure", "Terraform module reusability", "Security-first infrastructure mindset"],
  c4: ["Modern React architecture expertise", "Performance optimization instincts", "Accessibility-first development", "Component API design elegance", "CSS mastery across paradigms", "TypeScript type-safety discipline", "Developer experience focus"],
  c5: ["Deep mathematical foundations", "Research-to-production pipeline experience", "Novel model architecture intuition", "Data quality obsession", "Experiment design rigor", "Cross-functional ML communication", "MLOps pipeline maturity"],
  c6: ["Technical accuracy and clarity", "Developer empathy in writing", "API documentation expertise", "Docs toolchain proficiency", "Content strategy vision", "Community engagement skills", "Complex concept simplification"],
};

/** Reasoning templates for each dimension. */
function getTechnicalFitReasoning(score: number, skills: string[]): string {
  const topSkills = skills.slice(0, 3).join(", ");
  if (score >= 90) return `Exceptional technical alignment. Core competencies in ${topSkills} directly match the role requirements. Demonstrated advanced-level proficiency across the primary tech stack.`;
  if (score >= 80) return `Strong technical fit with solid skills in ${topSkills}. Meets most core requirements with room for growth in adjacent technologies.`;
  if (score >= 65) return `Moderate technical alignment. Proficiency in ${topSkills} covers some requirements, but notable gaps exist in key areas of the job specification.`;
  if (score >= 50) return `Partial technical match. Some relevant skills in ${topSkills}, but significant upskilling would be required for core role responsibilities.`;
  return `Limited technical overlap with role requirements. Background in ${topSkills} does not strongly align with the primary technology stack needed.`;
}

function getCultureFitReasoning(score: number, name: string): string {
  if (score >= 90) return `${name} demonstrates strong alignment with team values: collaborative communication style, evidence of mentoring, and a growth mindset visible across career progression.`;
  if (score >= 80) return `Good cultural indicators. ${name} shows a collaborative approach and adaptability across different team environments and company stages.`;
  if (score >= 65) return `Reasonable cultural alignment. ${name} has worked in similar environments but limited signals on team dynamics and communication preferences.`;
  if (score >= 50) return `Mixed cultural signals. ${name} may need onboarding support to align with the team's working style and collaboration norms.`;
  return `Uncertain cultural fit. Limited evidence of alignment with the team's communication patterns, pace, and collaboration expectations.`;
}

function getExperienceDepthReasoning(score: number, yearsEstimate: number): string {
  if (score >= 90) return `Deep experience profile spanning ${yearsEstimate}+ years in directly relevant roles. Career trajectory shows consistent progression and increasing scope of responsibility.`;
  if (score >= 80) return `Solid experience base with approximately ${yearsEstimate} years in related domains. Shows meaningful career growth and hands-on project leadership.`;
  if (score >= 65) return `Adequate experience at ${yearsEstimate} years but with some gaps in seniority-level exposure. Could benefit from mentorship in the first quarter.`;
  if (score >= 50) return `Developing experience profile at roughly ${yearsEstimate} years. Prior roles have some relevance but lack the depth expected for this seniority level.`;
  return `Limited relevant experience. Approximately ${yearsEstimate} years in adjacent fields but minimal direct exposure to the core responsibilities of this role.`;
}

function getLeadershipPotentialReasoning(score: number): string {
  if (score >= 85) return "Strong leadership indicators: history of leading teams, driving technical decisions, and mentoring junior engineers. Ready for senior-level ownership.";
  if (score >= 70) return "Emerging leadership traits. Has contributed to team direction and shown initiative in project scoping. Potential for growth into a lead role.";
  if (score >= 50) return "Some leadership signals through project ownership, but limited evidence of team management or strategic influence at the organization level.";
  return "Individual contributor profile. No strong signals of leadership experience or ambition toward management, which may be acceptable for IC-focused roles.";
}

function getOverallReasoning(score: number, name: string, topSkills: string[]): string {
  const top = topSkills.slice(0, 2).join(" and ");
  if (score >= 90) return `${name} is a top-tier candidate with exceptional alignment across technical skills, experience depth, and cultural fit. Their expertise in ${top} positions them as an immediate value contributor with minimal ramp-up time.`;
  if (score >= 80) return `${name} presents a strong overall profile. Solid technical grounding in ${top} combined with relevant industry experience makes them a competitive candidate. Minor gaps are addressable through onboarding.`;
  if (score >= 65) return `${name} is a viable candidate with meaningful strengths in ${top}, though some dimensions fall below the ideal threshold. Consider for the next round with targeted interview questions on weaker areas.`;
  if (score >= 50) return `${name} shows partial alignment with the role requirements. While ${top} skills are present, the overall profile suggests a gap between current capabilities and role expectations.`;
  return `${name} does not strongly match the current role requirements. The skill set in ${top} has limited overlap with the job specification. Recommend passing unless the role scope is adjusted.`;
}

function generateAIEvaluation(candidate: Candidate): AIEvaluation {
  const { matchScore, subScores, skills, name } = candidate;

  // Estimate years of experience from experience array length
  const yearsEstimate = candidate.experience
    ? Math.max(candidate.experience.length * 3, 2)
    : 2;

  // Derive leadership potential from a blend of culture fit and experience depth
  const leadershipScore = Math.round(
    subScores.cultureFit * 0.4 + subScores.experienceDepth * 0.6
  );

  const dimensionScores: DimensionScore[] = [
    {
      dimension: "Technical Fit",
      score: subScores.technicalFit,
      reasoning: getTechnicalFitReasoning(subScores.technicalFit, skills),
    },
    {
      dimension: "Culture Fit",
      score: subScores.cultureFit,
      reasoning: getCultureFitReasoning(subScores.cultureFit, name),
    },
    {
      dimension: "Experience Depth",
      score: subScores.experienceDepth,
      reasoning: getExperienceDepthReasoning(subScores.experienceDepth, yearsEstimate),
    },
    {
      dimension: "Leadership Potential",
      score: leadershipScore,
      reasoning: getLeadershipPotentialReasoning(leadershipScore),
    },
  ];

  // Determine job category from candidate id prefix
  const prefix = candidate.id.split("-")[0]; // e.g. "c1"
  const gapPool = SKILL_GAP_POOLS[prefix] || SKILL_GAP_POOLS.c1;
  const strengthPool = STRENGTH_POOLS[prefix] || STRENGTH_POOLS.c1;

  // Pick skill gaps inversely proportional to score (lower score = more gaps)
  const gapCount = matchScore >= 85 ? 2 : matchScore >= 65 ? 3 : matchScore >= 50 ? 4 : 5;
  // Use a deterministic "hash" from the matchScore + id length to pick different items
  const seed = matchScore + candidate.id.length + candidate.name.length;
  const skillGaps = gapPool
    .slice(0)
    .sort((a, b) => ((a.length * seed) % 97) - ((b.length * seed) % 97))
    .slice(0, gapCount);

  // Pick strengths proportional to score (higher score = more strengths)
  const strengthCount = matchScore >= 85 ? 4 : matchScore >= 65 ? 3 : matchScore >= 50 ? 2 : 1;
  const strengths = strengthPool
    .slice(0)
    .sort((a, b) => ((b.length * seed) % 89) - ((a.length * seed) % 89))
    .slice(0, strengthCount);

  return {
    overallReasoning: getOverallReasoning(matchScore, name, skills),
    dimensionScores,
    skillGaps,
    strengths,
  };
}

// ── Hydrate all candidates with AI evaluation data ────────────────────────
for (const jobId of Object.keys(MOCK_CANDIDATES)) {
  for (const candidate of MOCK_CANDIDATES[jobId]) {
    candidate.aiEvaluation = generateAIEvaluation(candidate);
  }
}

/**
 * Get candidates for a job, sorted by matchScore descending.
 */
export function getCandidatesForJob(jobId: string): Candidate[] {
  const candidates = MOCK_CANDIDATES[jobId] || [];
  return [...candidates].sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get a single candidate by jobId and candidateId.
 */
export function getCandidateById(jobId: string, candidateId: string): Candidate | undefined {
  const candidates = MOCK_CANDIDATES[jobId] || [];
  return candidates.find((c) => c.id === candidateId);
}
