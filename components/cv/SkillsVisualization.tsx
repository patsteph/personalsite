import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Skill } from '@/types/cv';

type SkillsVisualizationProps = {
  skills: Skill[];
};

type SkillWithPosition = Skill & {
  x: number;
  y: number;
  size: number;
};

export default function SkillsVisualization({ skills }: SkillsVisualizationProps) {
  const [visibleSkills, setVisibleSkills] = useState<SkillWithPosition[]>([]);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Group skills by category
  const skillsByCategory: Record<string, Skill[]> = {};
  skills.forEach(skill => {
    if (!skillsByCategory[skill.category]) {
      skillsByCategory[skill.category] = [];
    }
    skillsByCategory[skill.category].push(skill);
  });
  
  // Color mapping for categories
  const categoryColors: Record<string, string> = {
    'Programming Languages': 'bg-blue-500 text-white',
    'Frameworks': 'bg-purple-500 text-white',
    'Tools & Technologies': 'bg-green-500 text-white',
    'Databases': 'bg-yellow-500 text-gray-800',
    'Design': 'bg-red-500 text-white',
    'Soft Skills': 'bg-indigo-500 text-white',
    'Other': 'bg-gray-500 text-white'
  };
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (containerRef.current) {
      const updateSize = () => {
        if (containerRef.current) {
          setContainerSize({
            width: containerRef.current.offsetWidth,
            height: 400, // Fixed height for visualization
          });
        }
      };
      
      updateSize();
      window.addEventListener('resize', updateSize);
      
      return () => {
        window.removeEventListener('resize', updateSize);
      };
    }
    return undefined; // Return a value when containerRef.current is falsy
  }, []);
  
  useEffect(() => {
    if (containerSize.width === 0 || !isVisible) return;
    
    // Position skills - using a force-directed approach
    const positionSkills = () => {
      const positionedSkills: SkillWithPosition[] = [];
      
      skills.forEach(skill => {
        // Base size on proficiency (assuming proficiency is 1-5)
        const proficiency = parseInt(skill.proficiency.toString(), 10) || 3;
        const size = Math.max(60, proficiency * 15); // Scale size based on proficiency
        
        // Random initial position
        const x = Math.random() * (containerSize.width - size);
        const y = Math.random() * (containerSize.height - size);
        
        positionedSkills.push({
          ...skill,
          x,
          y,
          size
        });
      });
      
      // Simple force-directed positioning to avoid overlap
      for (let i = 0; i < 100; i++) { // 100 iterations for positioning
        for (let a = 0; a < positionedSkills.length; a++) {
          for (let b = a + 1; b < positionedSkills.length; b++) {
            const skillA = positionedSkills[a];
            const skillB = positionedSkills[b];
            
            // Calculate distance between centers
            const dx = skillA.x + skillA.size/2 - (skillB.x + skillB.size/2);
            const dy = skillA.y + skillA.size/2 - (skillB.y + skillB.size/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Minimum distance to avoid overlap
            const minDist = (skillA.size + skillB.size) / 2;
            
            if (distance < minDist) {
              // Calculate repulsion force
              const force = (minDist - distance) / distance * 0.05;
              
              // Apply force (move both skills away from each other)
              positionedSkills[a].x += dx * force;
              positionedSkills[a].y += dy * force;
              positionedSkills[b].x -= dx * force;
              positionedSkills[b].y -= dy * force;
              
              // Keep within bounds
              positionedSkills[a].x = Math.max(0, Math.min(containerSize.width - skillA.size, positionedSkills[a].x));
              positionedSkills[a].y = Math.max(0, Math.min(containerSize.height - skillA.size, positionedSkills[a].y));
              positionedSkills[b].x = Math.max(0, Math.min(containerSize.width - skillB.size, positionedSkills[b].x));
              positionedSkills[b].y = Math.max(0, Math.min(containerSize.height - skillB.size, positionedSkills[b].y));
            }
          }
        }
      }
      
      setVisibleSkills(positionedSkills);
    };
    
    positionSkills();
  }, [containerSize, skills, isVisible]);
  
  // Filter active skills and handle skill clicking
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const filteredSkills = activeCategory 
    ? visibleSkills.filter(skill => skill.category === activeCategory)
    : visibleSkills;
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-8" ref={containerRef}>
      <h3 className="text-xl font-bold text-center mb-4 text-steel-blue">Skills Visualization</h3>
      
      {/* Category filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {Object.keys(skillsByCategory).map(category => (
          <button
            key={category}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              activeCategory === category
                ? categoryColors[category] || 'bg-accent text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveCategory(activeCategory === category ? null : category)}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* Skills visualization */}
      <div 
        className="relative"
        style={{ height: `${containerSize.height}px` }}
      >
        {filteredSkills.map((skill, index) => (
          <motion.div
            key={skill.name}
            className={`absolute rounded-full flex items-center justify-center cursor-pointer ${
              hoveredSkill === skill.name
                ? 'z-10 border-2 border-accent'
                : 'z-0 border border-gray-200'
            } ${categoryColors[skill.category] || 'bg-gray-500 text-white'}`}
            style={{
              left: skill.x,
              top: skill.y,
              width: skill.size,
              height: skill.size,
              fontSize: `${Math.max(10, skill.size * 0.3)}px`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={isVisible ? { 
              scale: 1, 
              opacity: 1,
              x: hoveredSkill === skill.name ? -5 : 0,
              y: hoveredSkill === skill.name ? -5 : 0,
            } : { scale: 0, opacity: 0 }}
            transition={{ 
              delay: index * 0.05,
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            onMouseEnter={() => setHoveredSkill(skill.name)}
            onMouseLeave={() => setHoveredSkill(null)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-center px-2 leading-tight">{skill.name}</span>
          </motion.div>
        ))}
      </div>
      
      {/* Skill details */}
      {hoveredSkill && (
        <motion.div 
          className="absolute bg-white shadow-lg rounded-lg p-3 z-20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '10px',
            maxWidth: '90%'
          }}
        >
          {visibleSkills.filter(s => s.name === hoveredSkill).map(skill => (
            <div key={skill.name}>
              <h4 className="font-bold">{skill.name}</h4>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-600 mr-2">Proficiency:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div 
                      key={i}
                      className={`w-4 h-4 rounded-full mx-0.5 ${
                        i <= parseInt(skill.proficiency.toString(), 10)
                          ? 'bg-accent'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {skill.description && (
                <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
