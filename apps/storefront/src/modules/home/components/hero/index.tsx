import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <section className="relative h-[560px] sm:h-[620px] lg:h-[700px] xl:h-[780px] 2xl:h-[860px] overflow-hidden bg-[#4a0e1f]">
      {/* Editorial hero imagery */}
      <Image
        src="/media/hero/hero-home.webp"
        alt="Two women in deep burgundy silk and lace lingerie"
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover object-[66%_center] xl:object-[80%_center]"
      />
      {/* Left-to-right scrim so the copy stays legible over the imagery */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(42,4,15,0.92)_0%,rgba(42,4,15,0.62)_32%,rgba(42,4,15,0.18)_54%,transparent_72%)]" />

      <div className="content-container relative h-full flex flex-col justify-center">
        <div className="max-w-[620px]">
          <div className="text-xs tracking-[0.34em] uppercase text-gold-light mb-6 lg:mb-[26px]">
            The Summer Edit · New In
          </div>
          <h1 className="font-display font-medium text-[52px] sm:text-[64px] lg:text-[78px] leading-[1.02] tracking-[-0.01em] text-white m-0 mb-6">
            Made for every
            <br />
            <span className="italic text-gold-pale">curve, mood</span> &amp; moment.
          </h1>
          <p className="text-base leading-[1.7] text-white/80 max-w-[460px] mb-9 font-light">
            Bold, freeing and unapologetically feminine lingerie — designed in
            Pakistan, made to be lived in.
          </p>
          <div className="flex flex-wrap gap-4">
            <LocalizedClientLink
              href="/shop/"
              className="bg-[#fffdf9] text-accent text-[12.5px] font-semibold tracking-[0.16em] uppercase px-8 py-[17px] hover:bg-gold-light transition-colors"
            >
              Shop the Edit
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/collections/bridal/"
              className="border border-white/60 text-white text-[12.5px] font-medium tracking-[0.16em] uppercase px-8 py-[17px] hover:bg-white/10 transition-colors"
            >
              The Bridal Room
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
