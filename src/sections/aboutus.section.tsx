/* eslint-disable react/no-unescaped-entities */
"use client"
import React from 'react';
import { PlusCircleIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';

export default function AboutUsSection() {
    return (
    <section className="bg-[var(--background)] border-2 border-[var(--card-border)] py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="about-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span id="about-heading" className="inline-flex items-center px-4 py-2 bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-[family-name:var(--font-quicksand)] font-medium rounded-full mb-6">
            About us
          </span>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:items-center mb-20">
          <div className="order-1">
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-6 font-[family-name:var(--font-quicksand)]">Our mission</h2>
            <p className="text-lg text-[var(--muted)] leading-relaxed mb-6 font-[family-name:var(--font-quicksand)] font-medium">
              At Ziva landscaping Co. We're dedicated to crafting vibrant,eco-friendly outdoor spaces that promote well-being and delight the senses .We achieve this by: </p>
              <ul role="list" className="mt-8 mb-8 space-y-8 text-[var(--muted)] font-[family-name:var(--font-quicksand)]">
                <li className="flex gap-x-3">
                  <PlusCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-[var(--accent)]" />
                  <span>
                    Designing with drought resistant plants edible Landscape & Organic Practices.
                  </span>
                </li>
                <li className="flex gap-x-3">
                  <PlusCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-[var(--accent)]" />
                  <span>
                    Using Organic practices and innovative solutions.
                  </span>
                </li>
                <li className="flex gap-x-3">
                  <PlusCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-[var(--accent)]" />
                  <span>
                    Listening to our customers passion and dreams and bringing them to life with exceptional services and attention to detail.
                  </span>
                </li>
                <li className="flex gap-x-3">
                  <PlusCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-[var(--accent)]" />
                  <span>
                    Water conservation:Implementing rain water harvesting systems, drip irrigation and drought resistant plants to minimize water waste.
                  </span>
                </li>
                <li className="flex gap-x-3">
                  <PlusCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-[var(--accent)]" />
                  <span>
                    Recycled material:Incorporating recycled material such us reclaimed wood or repurposed stones, can reduce waste & add unique character to your landscape.
                   </span>
                </li>
                <li className="flex gap-x-3">
                  <PlusCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-[var(--accent)]" />
                  <span>
                    Wildlife-friendly: Creating habitats for local wildlife, like bees butterflies & birds can enhance biodiversity and ecosystem health.e.g. adding Orchards in your landscape.
                  </span>
                </li>
                <li className="flex gap-x-3">
                  <PlusCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-[var(--accent)]" />
                  <span>
                    Minimizing chemical use and opting for natural pest control by planting herbs around your landscape and gardens.
                    </span>
                </li>
                <li className="flex gap-x-3">
                  <PlusCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-[var(--accent)]" />
                  <span>
                    Creating sustainable home by designing your landscape with a garden/orchard, conserving water for irrigation, installation of solar panels. With innovative ideas by listening to our customers wants and needs.
                  </span>
                </li>
              </ul>
            <p className="text-lg text-[var(--muted)] leading-relaxed font-[family-name:var(--font-quicksand)] font-medium">
              Our goal is to exceed expectations, inspire creativity and make a positive impact on our community and the environment.
            </p>
          </div>
          
          {/* Image Grid */}
          <div className="grid grid-cols-2 gap-4 order-2">
            <div className="space-y-4">
              <div className="rounded-2xl h-48 flex items-center justify-center shadow-lg">
                {/* <div className="text-center text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3"> */}
                    <Image
                      src='/image-4.jpg'
                      alt="No description"
                      className="rounded-2xl w-full h-full object-cover"
                      width={800}
                      height={400}
                    />
                  {/* </div>
                  <p className="font-medium">Team Collaboration</p>
                </div> */}
              </div>
              <div className="rounded-2xl h-80 flex items-center justify-center shadow-lg">
                {/* <div className="text-center text-white">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2"> */}
                    <Image
                      src='/image-1.jpg'
                      alt="No description"
                      className="rounded-2xl w-full h-full object-cover"
                      width={400}
                      height={400}
                    />
                  {/* </div>
                  <p className="text-sm font-medium">Task Management</p>
                </div> */}
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="rounded-2xl h-80 flex items-center justify-center shadow-lg">
                {/* <div className="text-center text-white">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2"> */}
                    <Image
                      src='/image-2.jpg'
                      alt="No description"
                      className="rounded-2xl w-full h-full object-cover"
                      width={400}
                      height={600}
                    />
                  {/* </div> */}
                  {/* <p className="text-sm font-medium">Video Meetings</p>
                </div> */}
              </div>
              <div className="rounded-full h-48 flex items-center justify-center shadow-lg">
                {/* <div className="text-center text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3"> */}
                    <Image
                      src='/image-3.jpg'
                      alt="No description"
                      className=" rounded-2xl w-full h-full object-cover"
                      width={400}
                      height={400}
                    />
                  {/* </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}