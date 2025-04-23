export type CVData = {
    about: string;
    experience: Experience[];
    skills: Skill[];
    education: Education[];
    Training?: Certification[];
    publications?: Publication[];
    languages?: Language[];
    projects?: Project[];
    testimonials?: Testimonial[];
  }
  
  export type Experience = {
    title: string;
    company: string;
    location: string;
    period: string;
    description: string;
    achievements?: string[];
    technologies?: string[];
    logo?: string;
    companyUrl?: string;
    projects?: string[];
  }
  
  export type Education = {
    institution: string;
    degree: string;
    location?: string;
    year: string;
    description?: string;
    achievements?: string[];
    gpa?: string;
    logo?: string;
  }
  
  export type Certification = {
    name: string;
    year: string;
  }
  
  export type Publication = {
    title: string;
    publisher: string;
    year: string;
  }
  
  export type Language = {
    name: string;
    proficiency: string;
    flag?: string;
  }
  
  export type Skill = {
    name: string;
    category: string;
    proficiency: number | string;
    description?: string;
    icon?: string;
    years?: number;
  }
  
  export type Project = {
    name: string;
    description: string;
    url?: string;
    image?: string;
    technologies: string[];
    period: string;
    role?: string;
    achievements?: string[];
  }
  
  export type Testimonial = {
    name: string;
    role: string;
    company: string;
    content: string;
    image?: string;
  }