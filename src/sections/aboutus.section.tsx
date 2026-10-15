"use client"
import React from 'react';
import { PlusCircleIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';

type About = { badge: string; heading: string; intro: string; points: string[]; closing: string };

export default function AboutUsSection({ about }: { about: About }) {
  return (
    <section className="relative z-10 bg-white/82 dark:bg-slate-900/82 backdrop-blur-md border-2 border-[var(--card-border)]/80 py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="about-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span id="about-heading" className="inline-flex items-center px-4 py-2 bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-[family-name:var(--font-quicksand)] font-medium rounded-full mb-6">
            {about.badge || "About us"}
          </span>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-16 lg:items-start mb-20">
          <div className="order-1 min-w-0 w-full">
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-6 font-[family-name:var(--font-quicksand)]">{about.heading}</h2>
            {about.intro && (
              <p className="text-lg text-[var(--muted)] leading-relaxed mb-6 font-[family-name:var(--font-quicksand)] font-medium">
                {about.intro}
              </p>
            )}
            {about.points.length > 0 && (
              <ul role="list" className="mt-8 mb-8 space-y-8 text-[var(--muted)] font-[family-name:var(--font-quicksand)]">
                {about.points.map((point, i) => (
                  <li key={i} className="flex gap-x-3">
                    <PlusCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-[var(--accent)]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
            {about.closing && (
              <p className="text-lg text-[var(--muted)] leading-relaxed font-[family-name:var(--font-quicksand)] font-medium">
                {about.closing}
              </p>
            )}
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 gap-4 order-2 w-full min-w-0">
            <div className="space-y-4 min-w-0">
              <div className="rounded-2xl h-48 flex items-center justify-center shadow-lg overflow-hidden">
                {/* <div className="text-center text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3"> */}
                <Image
                  src='/image-4.jpg'
                  alt="Landscaping and sustainable outdoor space"
                  className="rounded-2xl w-full h-full object-cover"
                  width={800}
                  height={400}
                />
              </div>
              <div className="rounded-2xl h-80 flex items-center justify-center shadow-lg overflow-hidden">
                {/* <div className="text-center text-white">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2"> */}
                <Image
                  src='/image-1.jpg'
                  alt="Eco-friendly outdoor design"
                  className="rounded-2xl w-full h-full object-cover"
                  width={400}
                  height={400}
                />
              </div>
            </div>
            <div className="space-y-4 pt-8 min-w-0">
              <div className="rounded-2xl h-80 flex items-center justify-center shadow-lg overflow-hidden">
                {/* <div className="text-center text-white">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2"> */}
                <Image
                  src='/image-2.jpg'
                  alt="Sustainable landscaping"
                  className="rounded-2xl w-full h-full object-cover"
                  width={400}
                  height={600}
                />
              </div>
              <div className="rounded-2xl h-48 flex items-center justify-center shadow-lg overflow-hidden">
                {/* <div className="text-center text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3"> */}
                <Image
                  src='/image-3.jpg'
                  alt="Garden and outdoor living"
                  className="rounded-2xl w-full h-full object-cover"
                  width={400}
                  height={400}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}