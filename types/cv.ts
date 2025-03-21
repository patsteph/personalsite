export type CVData = {
    about: string;
    experience: Experience[];
    skills: string[];
    education: Education[];
    Training?: Certification[];
    publications?: Publication[];
    languages?: Language[];
  }
  
  export type Experience = {
    title: string;
    company: string;
    location: string;
    period: string;
    description: string;
  }
  
  export type Education = {
    school: string;
    location?: string;
    year?: string;
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
  }