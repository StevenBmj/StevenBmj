/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { memo } from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
  id?: string;
}

const LOGO_SRC = '/stevenbmj-logo.svg';

function Logo({ className = '', size = 120, animated = false, id }: LogoProps) {
  const style = {
    width: `${size}px`,
    height: `${size}px`,
  };

  const image = (
    <img
      id={id}
      src={LOGO_SRC}
      alt="StevenBmj"
      width={size}
      height={size}
      decoding="async"
      draggable={false}
      className="block h-full w-full rounded-full object-contain select-none"
    />
  );

  if (animated) {
    return (
      <motion.div
        className={`flex items-center justify-center ${className}`}
        style={style}
        initial={{ opacity: 0, scale: 0.82, rotate: -4 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="h-full w-full rounded-full shadow-[0_0_45px_rgba(245,158,11,0.28)]"
          animate={{ filter: ['brightness(1)', 'brightness(1.12)', 'brightness(1)'] }}
          transition={{ repeat: Infinity, duration: 3.6, ease: 'easeInOut' }}
        >
          {image}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`} style={style}>
      {image}
    </div>
  );
}

export default memo(Logo);
