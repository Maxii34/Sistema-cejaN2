"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Aparece con subida suave una sola vez al entrar en pantalla */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 14,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-32px" }}
      transition={{ duration: 0.45, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Contenedor que escalona la entrada de sus hijos Item */
export function Stagger({
  children,
  className,
  delay = 0,
  paso = 0.06,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  paso?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="oculto"
      whileInView="visible"
      viewport={{ once: true, margin: "-32px" }}
      variants={{
        oculto: {},
        visible: { transition: { staggerChildren: paso, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

const itemVariants: Variants = {
  oculto: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE },
  },
};

/** Hijo animado dentro de un Stagger */
export function Item({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

/** Lista (ul) que escalona sus ItemLi */
export function Lista({
  children,
  className,
  delay = 0,
  paso = 0.05,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  paso?: number;
}) {
  return (
    <motion.ul
      className={className}
      initial="oculto"
      whileInView="visible"
      viewport={{ once: true, margin: "-32px" }}
      variants={{
        oculto: {},
        visible: { transition: { staggerChildren: paso, delayChildren: delay } },
      }}
    >
      {children}
    </motion.ul>
  );
}

/** Fila (li) animada dentro de una Lista */
export function ItemLi({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.li className={className} variants={itemVariants}>
      {children}
    </motion.li>
  );
}
