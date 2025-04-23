import { CVData, Skill, Experience, Education } from '@/types/cv';

/**
 * Get enhanced CV data with additional details for interactive elements
 */
export function getInteractiveCVData(): CVData {
  return {
    about: "I'm a passionate full-stack developer with expertise in building modern web applications. My focus is on creating clean, maintainable, and high-performance code that delivers exceptional user experiences.",
    
    // Enhanced experience data with achievements and technologies
    experience: [
      {
        title: "Senior Full-Stack Developer",
        company: "TechInnovate Inc.",
        location: "San Francisco, CA",
        period: "2020 - Present",
        description: "Leading development of cloud-native applications and mentoring junior developers.",
        achievements: [
          "Reduced application load time by 45% through performance optimization",
          "Led migration from monolithic architecture to microservices",
          "Implemented CI/CD pipeline reducing deployment time by 70%"
        ],
        technologies: ["React", "Node.js", "TypeScript", "AWS", "Docker"]
      },
      {
        title: "Front-End Developer",
        company: "WebSolutions LLC",
        location: "Austin, TX",
        period: "2018 - 2020",
        description: "Developed responsive web applications using modern JavaScript frameworks.",
        achievements: [
          "Built reusable component library used across multiple projects",
          "Reduced bundle size by 30% through code splitting and lazy loading",
          "Implemented automated testing increasing code coverage to 85%"
        ],
        technologies: ["React", "Redux", "JavaScript", "CSS", "Jest"]
      },
      {
        title: "Web Developer",
        company: "Digital Creations",
        location: "Chicago, IL",
        period: "2016 - 2018",
        description: "Created custom websites and web applications for clients across various industries.",
        achievements: [
          "Delivered 15+ client projects on time and within budget",
          "Improved SEO rankings for client websites by 40% on average",
          "Implemented responsive designs reducing bounce rate by 25%"
        ],
        technologies: ["JavaScript", "PHP", "WordPress", "HTML/CSS"]
      },
      {
        title: "Junior Developer",
        company: "StartupHub",
        location: "Seattle, WA",
        period: "2014 - 2016",
        description: "Assisted in development of web applications for early-stage startups.",
        achievements: [
          "Contributed to 5 successful product launches",
          "Developed custom CMS solution for content management",
          "Created data visualization dashboards using D3.js"
        ],
        technologies: ["JavaScript", "Ruby on Rails", "PostgreSQL", "D3.js"]
      }
    ],
    
    // Categorized skills with proficiency levels
    skills: [
      { name: "JavaScript", category: "Programming Languages", proficiency: 5, years: 7 },
      { name: "TypeScript", category: "Programming Languages", proficiency: 4, years: 5 },
      { name: "Python", category: "Programming Languages", proficiency: 3, years: 3 },
      { name: "HTML5", category: "Frontend", proficiency: 5, years: 7 },
      { name: "CSS3", category: "Frontend", proficiency: 5, years: 7 },
      { name: "React", category: "Frameworks", proficiency: 5, years: 6 },
      { name: "Vue.js", category: "Frameworks", proficiency: 3, years: 2 },
      { name: "Angular", category: "Frameworks", proficiency: 3, years: 3 },
      { name: "Node.js", category: "Frameworks", proficiency: 4, years: 5 },
      { name: "Express", category: "Frameworks", proficiency: 4, years: 5 },
      { name: "Next.js", category: "Frameworks", proficiency: 4, years: 3 },
      { name: "GraphQL", category: "APIs", proficiency: 4, years: 3 },
      { name: "REST API", category: "APIs", proficiency: 5, years: 7 },
      { name: "MongoDB", category: "Databases", proficiency: 4, years: 4 },
      { name: "PostgreSQL", category: "Databases", proficiency: 3, years: 3 },
      { name: "MySQL", category: "Databases", proficiency: 3, years: 4 },
      { name: "Firebase", category: "Databases", proficiency: 4, years: 3 },
      { name: "AWS", category: "DevOps", proficiency: 3, years: 3 },
      { name: "Docker", category: "DevOps", proficiency: 3, years: 3 },
      { name: "Git", category: "Tools & Technologies", proficiency: 5, years: 7 },
      { name: "Webpack", category: "Tools & Technologies", proficiency: 4, years: 5 },
      { name: "Jest", category: "Testing", proficiency: 4, years: 4 },
      { name: "Cypress", category: "Testing", proficiency: 3, years: 2 },
      { name: "Tailwind CSS", category: "Frontend", proficiency: 4, years: 3 },
      { name: "Redux", category: "Frontend", proficiency: 4, years: 5 },
      { name: "UI/UX Design", category: "Design", proficiency: 3, years: 4 },
      { name: "Figma", category: "Design", proficiency: 3, years: 3 },
      { name: "Agile/Scrum", category: "Soft Skills", proficiency: 4, years: 5 },
      { name: "Team Leadership", category: "Soft Skills", proficiency: 4, years: 4 },
      { name: "Problem Solving", category: "Soft Skills", proficiency: 5, years: 7 }
    ],
    
    // Enhanced education data
    education: [
      {
        institution: "University of Washington",
        degree: "M.S. in Computer Science",
        location: "Seattle, WA",
        year: "2012 - 2014",
        description: "Focused on advanced web technologies and distributed systems.",
        achievements: [
          "Graduated with honors",
          "Published research paper on scalable web architectures",
          "Led student development team for university portal redesign"
        ],
        gpa: "3.9/4.0"
      },
      {
        institution: "Stanford University",
        degree: "B.S. in Computer Science",
        location: "Stanford, CA",
        year: "2008 - 2012",
        description: "Foundational studies in computer science with web development specialization.",
        achievements: [
          "Dean's List for 6 consecutive semesters",
          "Developed multiple open-source projects",
          "Teaching assistant for Web Development courses"
        ],
        gpa: "3.8/4.0"
      }
    ],
    
    // Certifications and training
    Training: [
      { name: "AWS Certified Solutions Architect", year: "2021" },
      { name: "Google Cloud Professional Developer", year: "2020" },
      { name: "Certified Scrum Master", year: "2019" },
      { name: "MongoDB Certified Developer", year: "2018" }
    ],
    
    // Languages
    languages: [
      { name: "English", proficiency: "Native" },
      { name: "Spanish", proficiency: "Professional" },
      { name: "French", proficiency: "Conversational" }
    ],
    
    // Notable projects
    projects: [
      {
        name: "E-commerce Platform",
        description: "Full-stack e-commerce platform with payment processing and inventory management",
        technologies: ["React", "Node.js", "MongoDB", "Stripe API", "AWS"],
        period: "2020 - 2021",
        role: "Lead Developer",
        achievements: [
          "Processed $2M+ in transactions",
          "Implemented real-time inventory tracking",
          "Optimized for mobile with 99% lighthouse score"
        ]
      },
      {
        name: "Health Tracking App",
        description: "Mobile-first web application for tracking health metrics and fitness goals",
        technologies: ["React Native", "Firebase", "Chart.js", "Google Fit API"],
        period: "2019",
        role: "Full-stack Developer",
        achievements: [
          "10,000+ active users",
          "Featured in health & fitness blogs",
          "Implemented machine learning for personalized recommendations"
        ]
      },
      {
        name: "Content Management System",
        description: "Custom CMS built for digital publishing companies",
        technologies: ["Next.js", "GraphQL", "PostgreSQL", "AWS S3"],
        period: "2018",
        role: "Backend Developer",
        achievements: [
          "Reduced content publishing time by 60%",
          "Built extensible plugin architecture",
          "Implemented version control for content"
        ]
      }
    ],
    
    // Testimonials from colleagues or clients
    testimonials: [
      {
        name: "Sarah Johnson",
        role: "CTO",
        company: "TechInnovate Inc.",
        content: "An exceptional developer who consistently delivers high-quality code. Their technical expertise and problem-solving abilities have been invaluable to our team."
      },
      {
        name: "Michael Chen",
        role: "Product Manager",
        company: "WebSolutions LLC",
        content: "Working with this developer was a pleasure. They have a keen eye for detail and always prioritize the user experience in their work."
      },
      {
        name: "Jessica Williams",
        role: "Client",
        company: "FitLife Health",
        content: "The health tracking app exceeded our expectations. This developer understood our vision and transformed it into a polished, user-friendly product."
      }
    ]
  };
}
