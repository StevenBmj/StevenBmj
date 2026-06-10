/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
  id?: string;
}

export default function Logo({ className = '', size = 120, animated = false, id }: LogoProps) {
  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
  };

  const drawCircle = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.5, ease: "easeInOut" }
    }
  };

  const drawLetter = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { delay: 0.5, duration: 1.2, ease: "easeOut" }
    }
  };

  const svgContent = (
    <svg
      viewBox="0 0 500 500"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Shiny Premium Luxury Gold Linear Gradients */}
        <linearGradient id="gold-metal-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FAF1C5" />
          <stop offset="25%" stopColor="#DFBA6B" />
          <stop offset="50%" stopColor="#C29D45" />
          <stop offset="75%" stopColor="#EAD293" />
          <stop offset="100%" stopColor="#8A641A" />
        </linearGradient>

        <linearGradient id="gold-stroke" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9E7C2A" />
          <stop offset="30%" stopColor="#F9E8AA" />
          <stop offset="50%" stopColor="#B69137" />
          <stop offset="70%" stopColor="#FFF1BE" />
          <stop offset="100%" stopColor="#7E5F1E" />
        </linearGradient>

        <radialGradient id="gold-radial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FCF7DB" />
          <stop offset="40%" stopColor="#E5C77F" />
          <stop offset="75%" stopColor="#B08B3A" />
          <stop offset="100%" stopColor="#6E5018" />
        </radialGradient>

        <filter id="gold-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Glow Ring (Subtle) */}
      <circle
        cx="250"
        cy="250"
        r="234"
        stroke="url(#gold-stroke)"
        strokeWidth="3"
        opacity="0.3"
        filter="url(#gold-glow)"
      />

      {/* Main Double Concentric Gold Rings */}
      <circle
        cx="250"
        cy="250"
        r="228"
        stroke="url(#gold-stroke)"
        strokeWidth="6"
      />
      
      <circle
        cx="250"
        cy="250"
        r="215"
        stroke="url(#gold-stroke)"
        strokeWidth="2"
        opacity="0.8"
      />

      {/* Nestled S and J Monogram Symbol */}
      <g filter="url(#gold-glow)">
        {/* The elegant 'S' Letter */}
        <path
          d="M 315 150 
             C 315 110, 240 100, 210 135 
             C 180 170, 200 215, 255 235 
             C 310 255, 335 300, 305 345 
             C 275 390, 195 385, 190 330
             L 205 330
             C 210 370, 270 375, 290 340
             C 310 305, 290 270, 240 250
             C 190 230, 165 185, 195 140
             C 225 95, 300 100, 310 148
             Z"
          fill="url(#gold-metal-primary)"
        />

        {/* The elegant 'J' Letter passing through the S core */}
        <path
          d="M 230 140
             L 290 140
             L 290 152
             L 266 152
             L 266 330
             C 266 375, 210 370, 210 338
             L 223 338
             C 223 358, 253 358, 253 330
             L 253 152
             L 230 152
             Z"
          fill="url(#gold-metal-primary)"
        />

        {/* Serif detail for the J curlicue top left and bottom */}
        {/* Bottom curve dot style */}
        <circle cx="216.5" cy="338" r="7" fill="url(#gold-metal-primary)" />
      </g>
    </svg>
  );

  if (animated) {
    return (
      <motion.div
        className={`flex items-center justify-center ${className}`}
        style={containerStyle}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="w-full h-full"
          variants={drawLetter}
        >
          {svgContent}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`} style={containerStyle}>
      {svgContent}
    </div>
  );
}
